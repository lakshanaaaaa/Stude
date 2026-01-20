import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import passport from "passport";
import type { UserRole, User } from "@shared/schema";
import { scrapeStudentData, scrapePlatformAccounts, mergeScrapeResults } from "./scrapers/index";
import { 
  scrapeAllStudentsForPlatform, 
  createWeeklySnapshot, 
  generatePlatformReport, 
  generateFullReport,
  getScrapeProgress 
} from "./services/reportService";
import { adminStorage } from "./storage/adminMongodb";
import {
  getOverallLeaderboard,
  getPlatformLeaderboard,
  computeAndStoreLeaderboards,
} from "./services/leaderboardService";
import {
  getCachedTopper,
  getCachedLeaderboard,
  clearTopperCache,
} from "./services/topperService";
import { createDailySnapshot } from "./services/snapshotService";
import { WeeklySnapshotModel } from "./models/WeeklySnapshot";
import { clearImprovementCache } from "./services/improvementAnalyticsService";
import { clearFacultyAnalyticsCache } from "./services/facultyAnalyticsService";
import { RoleRequestModel } from "./models/RoleRequest";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

interface JWTPayload {
  id: string;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: UserRole;
    }
    interface Request {
      user?: User;
    }
  }
}

function authMiddleware(allowedRoles?: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      };
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as User;
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Redirect to frontend with token
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          username: user.username,
          role: user.role,
          isOnboarded: user.isOnboarded,
        }))}`;
        
        res.redirect(redirectUrl);
      } catch (error) {
        console.error("Google callback error:", error);
        res.redirect("/login?error=auth_failed");
      }
    }
  );

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    return res.status(410).json({ error: "Traditional signup is disabled. Please sign in with Google." });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    return res.status(410).json({ error: "Traditional login is disabled. Please sign in with Google." });
  });

  app.get("/api/auth/me", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        isOnboarded: user.isOnboarded,
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/students", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const [students, users] = await Promise.all([
        storage.getAllStudents(),
        storage.getAllUsers(),
      ]);

      // Only include students that still have a corresponding user account
      const validUsernames = new Set(users.map((u) => u.username));
      const filteredStudents = students.filter((s) => validUsernames.has(s.username));

      return res.json(filteredStudents);
    } catch (error) {
      console.error("Get students error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/student/:username", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const student = await storage.getStudentByUsername(username);

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json(student);
    } catch (error) {
      console.error("Get student error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/student/:username", authMiddleware(["student", "admin"]), async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      // Allow admins to edit any profile, students can only edit their own
      if (req.user!.role !== "admin" && req.user!.username !== username) {
        // Also check by user ID in case username changed after token was issued
        const currentUser = await storage.getUser(req.user!.id);
        if (!currentUser || currentUser.username !== username) {
          return res.status(403).json({ error: "You can only edit your own profile" });
        }
      }

      const student = await storage.getStudentByUsername(username);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const allowedFields = ["email", "dept", "linkedin", "github", "resumeLink", "mainAccounts", "subAccounts"];
      const updateData: Record<string, unknown> = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (updateData.subAccounts && Array.isArray(updateData.subAccounts)) {
        if (updateData.subAccounts.length > 5) {
          return res.status(400).json({ error: "Maximum 5 sub accounts allowed" });
        }
      }

      const updatedStudent = await storage.updateStudent(username, updateData);

      if (!updatedStudent) {
        return res.status(404).json({ error: "Student not found" });
      }

      return res.json(updatedStudent);
    } catch (error) {
      console.error("Update student error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/student/:username/scrape", authMiddleware(), async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
      const student = await storage.getStudentByUsername(username);

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      console.log(`Student found. Main accounts:`, student.mainAccounts);
      console.log(`Sub accounts:`, student.subAccounts);

      // Collect all usernames for each platform (main + sub-accounts)
      const leetcodeUsernames = [
        ...(student.mainAccounts?.filter(acc => acc.platform === "LeetCode").map(acc => acc.username) || []),
        ...(student.subAccounts?.filter(acc => acc.platform === "LeetCode").map(acc => acc.username) || [])
      ];
      const codechefUsernames = [
        ...(student.mainAccounts?.filter(acc => acc.platform === "CodeChef").map(acc => acc.username) || []),
        ...(student.subAccounts?.filter(acc => acc.platform === "CodeChef").map(acc => acc.username) || [])
      ];
      const codeforcesUsernames = [
        ...(student.mainAccounts?.filter(acc => acc.platform === "CodeForces").map(acc => acc.username) || []),
        ...(student.subAccounts?.filter(acc => acc.platform === "CodeForces").map(acc => acc.username) || [])
      ];
      const gfgAccount = student.mainAccounts?.find(acc => acc.platform === "GeeksforGeeks") || student.subAccounts?.find(acc => acc.platform === "GeeksforGeeks");
      const hrAccount = student.mainAccounts?.find(acc => acc.platform === "HackerRank") || student.subAccounts?.find(acc => acc.platform === "HackerRank");

      console.log(`Platform usernames:`);
      console.log(`  LeetCode: ${leetcodeUsernames.length > 0 ? leetcodeUsernames.join(', ') : 'Not set'}`);
      console.log(`  CodeChef: ${codechefUsernames.length > 0 ? codechefUsernames.join(', ') : 'Not set'}`);
      console.log(`  CodeForces: ${codeforcesUsernames.length > 0 ? codeforcesUsernames.join(', ') : 'Not set'}`);
      console.log(`  GeeksforGeeks: ${gfgAccount?.username || 'Not set'}`);
      console.log(`  HackerRank: ${hrAccount?.username || 'Not set'}`);

      if (leetcodeUsernames.length === 0 && codechefUsernames.length === 0 && codeforcesUsernames.length === 0 && !gfgAccount && !hrAccount) {
        console.error(`No platform accounts configured for ${username}`);
        return res.status(400).json({ error: "No platform accounts configured. Please add your platform usernames in Edit Profile." });
      }

      console.log(`Starting scraping process...`);
      
      // Aggregate contest data from all accounts for each platform
      const results: Array<{ platform: string; data: { problemStats: any; contestStats: any; badges: any[] } }> = [];
      
      // Scrape LeetCode (all accounts - main + sub-accounts)
      if (leetcodeUsernames.length > 0) {
        const leetcodeData = await scrapePlatformAccounts("LeetCode", leetcodeUsernames);
        results.push({ platform: "LeetCode", data: leetcodeData });
      }
      
      // Scrape CodeChef (all accounts - main + sub-accounts)
      if (codechefUsernames.length > 0) {
        const codechefData = await scrapePlatformAccounts("CodeChef", codechefUsernames);
        results.push({ platform: "CodeChef", data: codechefData });
      }
      
      // Scrape CodeForces (all accounts - main + sub-accounts)
      if (codeforcesUsernames.length > 0) {
        const codeforcesData = await scrapePlatformAccounts("CodeForces", codeforcesUsernames);
        results.push({ platform: "CodeForces", data: codeforcesData });
      }
      
      // For GeeksforGeeks and HackerRank, use single account (they don't support multi-account aggregation yet)
      // Scrape GeeksforGeeks (single account)
      if (gfgAccount) {
        const gfgData = await scrapeStudentData(undefined, undefined, undefined, gfgAccount.username, undefined);
        // Create result structure
        const gfgResult = {
          problemStats: gfgData.problemStats,
          contestStats: gfgData.contestStats,
          badges: gfgData.badges,
        };
        results.push({ platform: "GeeksforGeeks", data: gfgResult });
      }
      
      // Scrape HackerRank (single account)
      if (hrAccount) {
        const hrData = await scrapeStudentData(undefined, undefined, undefined, undefined, hrAccount.username);
        const hrResult = {
          problemStats: hrData.problemStats,
          contestStats: hrData.contestStats,
          badges: hrData.badges,
        };
        results.push({ platform: "HackerRank", data: hrResult });
      }
      
      // Merge all results
      const scrapedData = mergeScrapeResults(results);

      // Update student with scraped data
      const updatedStudent = await storage.updateStudentAnalytics(username, scrapedData);

      if (!updatedStudent) {
        return res.status(500).json({ error: "Failed to update student data" });
      }

      console.log(`[Scrape] ${username} done: ${scrapedData.problemStats.total} problems`);

      // Refresh leaderboard in background after scraping
      computeAndStoreLeaderboards().catch(err => {
        console.error("[Scrape] Failed to refresh leaderboard:", err);
      });

      return res.json({
        success: true,
        student: updatedStudent,
        message: "Profile data scraped and updated successfully"
      });
    } catch (error: any) {
      console.error(`[Scrape] ${username} failed:`, error.message);
      return res.status(500).json({ error: error.message || "Failed to scrape student data" });
    }
  });

  // Leaderboard APIs
  app.get(
    "/api/leaderboard/overall",
    authMiddleware(),
    async (_req: Request, res: Response) => {
      try {
        const data = await getOverallLeaderboard(50);
        if (!data) {
          return res.json({ generatedAt: null, entries: [] });
        }
        return res.json(data);
      } catch (err: any) {
        console.error("[Leaderboard] Failed to fetch overall leaderboard:", err);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
      }
    }
  );

  app.get(
    "/api/leaderboard/platform/:platform",
    authMiddleware(),
    async (req: Request, res: Response) => {
      try {
        const rawPlatform = req.params.platform;
        const normalized =
          rawPlatform === "leetcode"
            ? "LeetCode"
            : rawPlatform === "codechef"
            ? "CodeChef"
            : rawPlatform === "codeforces"
            ? "CodeForces"
            : rawPlatform;

        if (!["LeetCode", "CodeChef", "CodeForces"].includes(normalized)) {
          return res.status(400).json({ error: "Invalid platform" });
        }

        // Type assertion is safe due to the check above
        const data = await getPlatformLeaderboard(
          normalized as "LeetCode" | "CodeChef" | "CodeForces",
          50
        );
        if (!data) {
          return res.json({ generatedAt: null, entries: [] });
        }
        return res.json(data);
      } catch (err: any) {
        console.error("[Leaderboard] Failed to fetch platform leaderboard:", err);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
      }
    }
  );

  // Manually refresh leaderboard (admin only)
  app.post(
    "/api/admin/leaderboard/refresh",
    authMiddleware(["admin"]),
    async (_req: Request, res: Response) => {
      try {
        await computeAndStoreLeaderboards();
        return res.json({ message: "Leaderboard refreshed successfully" });
      } catch (err: any) {
        console.error("[Leaderboard] Failed to refresh:", err);
        return res.status(500).json({ error: "Failed to refresh leaderboard" });
      }
    }
  );

  // Improvement Analytics API
  app.get(
    "/api/analytics/improvement",
    authMiddleware(),
    async (_req: Request, res: Response) => {
      try {
        const { getCachedImprovementAnalytics } = await import("./services/improvementAnalyticsService");
        const analytics = await getCachedImprovementAnalytics();
        return res.json(analytics);
      } catch (err: any) {
        console.error("[Analytics] Failed to fetch improvement analytics:", err);
        return res.status(500).json({ error: "Failed to fetch improvement analytics" });
      }
    }
  );

  // Admin routes
  app.post("/api/auth/check-username", async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username || username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }

      const existingUser = await storage.getUserByUsername(username);
      
      return res.json({ 
        available: !existingUser,
        username 
      });
    } catch (error) {
      console.error("Check username error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/onboard", authMiddleware(["student"]), async (req: Request, res: Response) => {
    try {
      const { username, department, leetcode, codeforces, codechef } = req.body;
      const currentUsername = req.user!.username;
      const userId = req.user!.id;

      // Use user ID instead of username for lookup to avoid issues with temporary usernames
      const user = await storage.getUser(userId);
      if (!user) {
        console.error("User not found with ID:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is already onboarded
      if (user.isOnboarded) {
        const existingStudent = await storage.getStudentByUsername(user.username);
        return res.json({ 
          success: true, 
          student: existingStudent,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            isOnboarded: user.isOnboarded,
          }
        });
      }

      // Validate required fields
      if (!username || !department) {
        console.error("Missing required fields:", { username, department });
        return res.status(400).json({ error: "Username and department are required" });
      }

      if (!leetcode && !codeforces && !codechef) {
        console.error("No coding platform accounts provided");
        return res.status(400).json({ error: "At least one coding platform account is required" });
      }

      // Check if new username is available (if different from current)
      if (username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          console.error("Username already taken:", username);
          return res.status(400).json({ error: "Username is already taken" });
        }
      }

      // Check if student already exists with the current username or new username
      let existingStudent = await storage.getStudentByUsername(user.username);
      if (!existingStudent && username !== user.username) {
        existingStudent = await storage.getStudentByUsername(username);
      }
      
      if (existingStudent) {
        console.log("Student already exists, updating user:", user.id);
        
        // If the existing student has a different username than what we want, we have a conflict
        if (existingStudent.username !== username) {
          console.error("Student username conflict:", { existing: existingStudent.username, requested: username });
          return res.status(400).json({ error: "A student profile already exists with a different username" });
        }
        
        const updatedUser = await storage.updateUser(user.id, { 
          isOnboarded: true,
          username: username 
        });

        if (!updatedUser) {
          console.error("Failed to update user:", user.id);
          return res.status(500).json({ error: "Failed to update user" });
        }

        // Generate new token with updated username
        const newToken = jwt.sign(
          { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({ 
          success: true, 
          student: existingStudent,
          token: newToken,
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            role: updatedUser.role,
            isOnboarded: updatedUser.isOnboarded,
          }
        });
      }

      const mainAccounts = [];
      if (leetcode) mainAccounts.push({ platform: "LeetCode" as const, username: leetcode });
      if (codeforces) mainAccounts.push({ platform: "CodeForces" as const, username: codeforces });
      if (codechef) mainAccounts.push({ platform: "CodeChef" as const, username: codechef });

      console.log("Creating new student:", { username, department, mainAccounts });
      
      let student;
      try {
        student = await storage.createStudent({
          name: user.name || username,
          username: username,
          dept: department,
          regNo: "Not Set",
          email: user.email || `${username}@college.edu`,
          mainAccounts,
          subAccounts: [],
        });
        console.log("Student created successfully:", student.id);
      } catch (createError) {
        console.error("Failed to create student:", createError);
        console.error("Student creation error details:", {
          username,
          department,
          email: user.email,
          error: createError instanceof Error ? createError.message : String(createError)
        });
        return res.status(500).json({ error: "Failed to create student profile" });
      }

      console.log("Updating user after student creation:", user.id);
      const updatedUser = await storage.updateUser(user.id, { 
        isOnboarded: true,
        username: username 
      });

      if (!updatedUser) {
        console.error("Failed to update user after student creation:", user.id);
        return res.status(500).json({ error: "Failed to update user" });
      }

      // Generate new token with updated username
      const newToken = jwt.sign(
        { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log("Onboarding successful for user:", updatedUser.username);
      return res.json({ 
        success: true, 
        student,
        token: newToken,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          isOnboarded: updatedUser.isOnboarded,
        }
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:id", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role, username } = req.body;

      const updateData: Record<string, unknown> = {};
      if (role !== undefined) {
        if (!["admin", "faculty", "student"].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        updateData.role = role;
        
        // Faculty and admin don't need onboarding (no platform IDs required)
        // Automatically mark them as onboarded
        if (role === "faculty" || role === "admin") {
          updateData.isOnboarded = true;
        }
      }
      if (username !== undefined) {
        updateData.username = username;
      }

      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        isOnboarded: updatedUser.isOnboarded,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (req.user!.id === id) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      // Get user to find associated student record
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete associated student record if exists
      if (user.role === "student" && user.username) {
        await storage.deleteStudent(user.username);
        
        // Delete all weekly snapshots for this student
        await WeeklySnapshotModel.deleteMany({ studentId: id });
        console.log(`[Delete] Removed weekly snapshots for student ${user.username}`);
      }

      // Delete any role requests from this user
      await RoleRequestModel.deleteMany({ userId: id });
      console.log(`[Delete] Removed role requests for user ${user.username || user.email}`);

      // Delete user
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      // Clear all caches to ensure deleted user doesn't appear anywhere
      clearTopperCache();
      clearImprovementCache();
      clearFacultyAnalyticsCache();
      
      // Recompute leaderboards to remove deleted user
      await computeAndStoreLeaderboards();
      
      console.log(`[Delete] Successfully deleted user ${user.username || user.email} and cleared all caches`);

      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:id/reset-onboarding", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete associated student record if exists
      if (user.username) {
        await storage.deleteStudent(user.username);
      }

      // Generate a temporary username based on email or googleId
      const tempUsername = user.email ? user.email.split('@')[0] : user.googleId || `user_${Date.now()}`;

      // Reset onboarding status and username
      const updatedUser = await storage.updateUser(id, { 
        isOnboarded: false,
        username: tempUsername
      });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to reset onboarding" });
      }

      return res.json({ 
        message: "Onboarding reset successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role,
          isOnboarded: updatedUser.isOnboarded,
        }
      });
    } catch (error) {
      console.error("Reset onboarding error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/users/incomplete-onboarding", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      const incompleteUsers = allUsers.filter(u => u.role === "student" && !u.isOnboarded);
      
      return res.json(incompleteUsers);
    } catch (error) {
      console.error("Get incomplete onboarding error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ROLE REQUEST ROUTES ============

  // Submit a role request (for users who want to be faculty/admin)
  app.post("/api/role-request", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const { requestedRole, department, reason } = req.body;
      const userId = req.user!.id;

      // Validate requested role
      if (!["faculty", "admin"].includes(requestedRole)) {
        return res.status(400).json({ error: "Invalid role. Must be 'faculty' or 'admin'" });
      }

      // Faculty must provide department
      if (requestedRole === "faculty" && !department) {
        return res.status(400).json({ error: "Department is required for faculty role" });
      }

      // Check if user already has a pending request
      const existingRequest = await RoleRequestModel.findOne({ 
        userId, 
        status: "pending" 
      });
      
      if (existingRequest) {
        return res.status(400).json({ error: "You already have a pending role request" });
      }

      // Get user details
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create role request
      const requestId = randomUUID();
      const roleRequest = new RoleRequestModel({
        _id: requestId,
        id: requestId,
        userId,
        username: user.username,
        email: user.email,
        name: user.name,
        requestedRole,
        department: requestedRole === "faculty" ? department : undefined,
        reason,
        status: "pending",
      });

      await roleRequest.save();

      console.log(`[RoleRequest] New request from ${user.username} for ${requestedRole} role`);

      return res.json({ 
        message: "Role request submitted successfully. An admin will review your request.",
        request: roleRequest.toObject()
      });
    } catch (error) {
      console.error("Role request error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user's role request status
  app.get("/api/role-request/status", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const request = await RoleRequestModel.findOne({ userId }).sort({ createdAt: -1 }).lean();
      
      return res.json({ request: request || null });
    } catch (error) {
      console.error("Get role request status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all pending role requests (admin only)
  app.get("/api/admin/role-requests", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string || "pending";
      
      const requests = await RoleRequestModel.find({ status })
        .sort({ createdAt: -1 })
        .lean();
      
      return res.json(requests);
    } catch (error) {
      console.error("Get role requests error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve or reject a role request (admin only)
  app.patch("/api/admin/role-requests/:id", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action } = req.body; // "approve" or "reject"

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      const roleRequest = await RoleRequestModel.findOne({ id });
      if (!roleRequest) {
        return res.status(404).json({ error: "Role request not found" });
      }

      if (roleRequest.status !== "pending") {
        return res.status(400).json({ error: "This request has already been processed" });
      }

      // Update request status
      roleRequest.status = action === "approve" ? "approved" : "rejected";
      roleRequest.reviewedBy = req.user!.id;
      roleRequest.reviewedAt = new Date();
      await roleRequest.save();

      // If approved, update user role
      if (action === "approve") {
        const updateData: Record<string, unknown> = {
          role: roleRequest.requestedRole,
          isOnboarded: true, // Faculty/admin don't need onboarding
        };

        // Add department for faculty
        if (roleRequest.requestedRole === "faculty" && roleRequest.department) {
          updateData.department = roleRequest.department;
        }

        await storage.updateUser(roleRequest.userId, updateData);
        
        console.log(`[RoleRequest] Approved ${roleRequest.username} as ${roleRequest.requestedRole}`);
      } else {
        console.log(`[RoleRequest] Rejected ${roleRequest.username}'s request for ${roleRequest.requestedRole}`);
      }

      return res.json({ 
        message: `Role request ${action}d successfully`,
        request: roleRequest.toObject()
      });
    } catch (error) {
      console.error("Process role request error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Faculty routes
  app.get("/api/faculty/department-stats", authMiddleware(["faculty", "admin"]), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get department from user or query param (admin can view any department)
      const department = req.user!.role === "admin" 
        ? (req.query.department as string || user.department)
        : user.department;

      if (!department) {
        return res.status(400).json({ error: "No department assigned to faculty" });
      }

      // Get all students from the department
      const allStudents = await storage.getAllStudents();
      const deptStudents = allStudents.filter(s => s.dept === department);

      // Calculate department statistics
      const totalProblems = deptStudents.reduce((sum, s) => sum + (s.problemStats?.total || 0), 0);
      const avgProblems = deptStudents.length ? Math.round(totalProblems / deptStudents.length) : 0;
      
      const totalContests = deptStudents.reduce((sum, s) => {
        const lc = s.contestStats?.leetcode?.totalContests || 0;
        const cc = s.contestStats?.codechef?.totalContests || 0;
        const cf = s.contestStats?.codeforces?.totalContests || 0;
        return sum + lc + cc + cf;
      }, 0);

      // Get top performers
      const topPerformers = [...deptStudents]
        .sort((a, b) => (b.problemStats?.total || 0) - (a.problemStats?.total || 0))
        .slice(0, 10);

      // Platform usage
      const platformStats = deptStudents.reduce((acc, s) => {
        [...(s.mainAccounts || []), ...(s.subAccounts || [])].forEach(account => {
          acc[account.platform] = (acc[account.platform] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      // Difficulty distribution
      const difficultyStats = {
        easy: deptStudents.reduce((sum, s) => sum + (s.problemStats?.easy || 0), 0),
        medium: deptStudents.reduce((sum, s) => sum + (s.problemStats?.medium || 0), 0),
        hard: deptStudents.reduce((sum, s) => sum + (s.problemStats?.hard || 0), 0),
      };

      return res.json({
        department,
        totalStudents: deptStudents.length,
        totalProblems,
        avgProblems,
        totalContests,
        topPerformers,
        platformStats,
        difficultyStats,
        activeStudents: deptStudents.filter(s => (s.problemStats?.total || 0) > 0).length,
        contestParticipants: deptStudents.filter(s => {
          const lc = s.contestStats?.leetcode?.totalContests || 0;
          const cc = s.contestStats?.codechef?.totalContests || 0;
          const cf = s.contestStats?.codeforces?.totalContests || 0;
          return (lc + cc + cf) > 0;
        }).length,
      });
    } catch (error) {
      console.error("Get department stats error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Faculty Analytics - Improvement and Contest Participation
  app.get("/api/faculty/analytics", authMiddleware(["faculty", "admin"]), async (req: Request, res: Response) => {
    try {
      const { getCachedFacultyAnalytics } = await import("./services/facultyAnalyticsService");
      
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get department from user or query param (admin can view any department)
      const department = req.user!.role === "admin" 
        ? (req.query.department as string || user.department)
        : user.department;

      if (!department) {
        return res.status(400).json({ error: "No department assigned to faculty" });
      }

      const analytics = await getCachedFacultyAnalytics(department);
      return res.json(analytics);
    } catch (error: any) {
      console.error("[FacultyAnalytics] Failed to fetch analytics:", error);
      return res.status(500).json({ error: "Failed to fetch faculty analytics" });
    }
  });

  // Bulk Refresh Department Stats (Faculty & Admin)
  app.post("/api/faculty/refresh-all", authMiddleware(["faculty", "admin"]), async (req: Request, res: Response) => {
    try {
      const { refreshDepartmentStats } = await import("./services/bulkRefreshService");
      
      const user = await storage.getUserByUsername(req.user!.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get department from user or request body (admin can refresh any department)
      const department = req.user!.role === "admin" 
        ? (req.body.department || user.department)
        : user.department;

      if (!department) {
        return res.status(400).json({ error: "No department assigned" });
      }

      const progress = await refreshDepartmentStats(department);
      return res.json({
        message: `Started refreshing stats for ${department} department`,
        progress,
      });
    } catch (error: any) {
      console.error("[BulkRefresh] Failed to start refresh:", error);
      return res.status(500).json({ error: error.message || "Failed to start bulk refresh" });
    }
  });

  // Get Bulk Refresh Progress
  app.get("/api/faculty/refresh-progress", authMiddleware(["faculty", "admin"]), async (req: Request, res: Response) => {
    try {
      const { getBulkRefreshProgress } = await import("./services/bulkRefreshService");
      const progress = getBulkRefreshProgress();
      return res.json(progress);
    } catch (error: any) {
      console.error("[BulkRefresh] Failed to get progress:", error);
      return res.status(500).json({ error: "Failed to get refresh progress" });
    }
  });

  // Cancel Bulk Refresh
  app.post("/api/faculty/refresh-cancel", authMiddleware(["faculty", "admin"]), async (req: Request, res: Response) => {
    try {
      const { cancelBulkRefresh } = await import("./services/bulkRefreshService");
      cancelBulkRefresh();
      return res.json({ message: "Bulk refresh cancelled" });
    } catch (error: any) {
      console.error("[BulkRefresh] Failed to cancel refresh:", error);
      return res.status(500).json({ error: "Failed to cancel refresh" });
    }
  });

  app.patch("/api/admin/users/:id/department", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { department } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== "faculty") {
        return res.status(400).json({ error: "Only faculty users can be assigned to departments" });
      }

      // Faculty don't need onboarding, ensure they're marked as onboarded
      const updatedUser = await storage.updateUser(id, { 
        department,
        isOnboarded: true 
      });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update department" });
      }

      return res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        department: updatedUser.department,
        isOnboarded: updatedUser.isOnboarded,
      });
    } catch (error) {
      console.error("Update department error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ADMIN REPORT GENERATION ROUTES ============

  // Bulk scrape all students for a specific platform
  app.post("/api/admin/scrape/:platform", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const validPlatforms = ["LeetCode", "CodeChef", "CodeForces", "GeeksforGeeks", "HackerRank"];
      
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      // Start scraping in background
      scrapeAllStudentsForPlatform(platform).then(result => {
        console.log(`[BulkScrape] ${platform}: ${result.scrapedCount} done`);
      }).catch(err => {
        console.error(`[BulkScrape] ${platform} failed:`, err.message);
      });

      return res.json({ 
        message: `Started scraping all students for ${platform}`,
        status: "running"
      });
    } catch (error) {
      console.error("Bulk scrape error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get scraping progress
  app.get("/api/admin/scrape/progress", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const progress = getScrapeProgress();
      return res.json(progress);
    } catch (error) {
      console.error("Get scrape progress error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create weekly snapshot
  app.post("/api/admin/snapshots", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const snapshot = await createWeeklySnapshot();
      console.log(`[Snapshot] Created: ${snapshot.id}`);
      
      return res.json({
        message: "Weekly snapshot created successfully",
        snapshot
      });
    } catch (error: any) {
      console.error("Create snapshot error:", error);
      return res.status(500).json({ error: error.message || "Failed to create snapshot" });
    }
  });

  // Get all snapshots
  app.get("/api/admin/snapshots", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const snapshots = await adminStorage.getAllSnapshots();
      return res.json(snapshots);
    } catch (error) {
      console.error("Get snapshots error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get latest snapshot
  app.get("/api/admin/snapshots/latest", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const snapshot = await adminStorage.getLatestSnapshot();
      if (!snapshot) {
        return res.status(404).json({ error: "No snapshots found" });
      }
      return res.json(snapshot);
    } catch (error) {
      console.error("Get latest snapshot error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get snapshot by ID
  app.get("/api/admin/snapshots/:id", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const snapshot = await adminStorage.getSnapshotById(id);
      if (!snapshot) {
        return res.status(404).json({ error: "Snapshot not found" });
      }
      return res.json(snapshot);
    } catch (error) {
      console.error("Get snapshot error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate platform-specific report
  app.get("/api/admin/reports/:platform", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { platform } = req.params;
      const validPlatforms = ["LeetCode", "CodeChef", "CodeForces", "GeeksforGeeks", "HackerRank"];
      
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const report = await generatePlatformReport(platform);
      if (!report) {
        return res.status(404).json({ error: "No data available for report. Create a snapshot first." });
      }

      return res.json(report);
    } catch (error) {
      console.error("Generate platform report error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate full report (all platforms)
  app.get("/api/admin/reports", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const report = await generateFullReport();
      if (!report) {
        return res.status(404).json({ error: "No data available for report. Create a snapshot first." });
      }

      return res.json(report);
    } catch (error) {
      console.error("Generate full report error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete snapshot
  app.delete("/api/admin/snapshots/:id", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await adminStorage.deleteSnapshot(id);
      
      if (!success) {
        return res.status(404).json({ error: "Snapshot not found" });
      }

      return res.json({ message: "Snapshot deleted successfully" });
    } catch (error) {
      console.error("Delete snapshot error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ TOPPER OF THE WEEK ROUTES ============

  // Get Topper of the Week
  app.get("/api/topper-of-the-week", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const topper = await getCachedTopper();
      
      if (!topper) {
        return res.json({
          message: "No eligible students for Topper of the Week yet. Keep solving problems!",
          topper: null
        });
      }

      return res.json({ topper });
    } catch (error: any) {
      console.error("[Topper] Failed to get Topper of the Week:", error);
      return res.status(500).json({ error: "Failed to fetch Topper of the Week" });
    }
  });

  // Get Weekly Leaderboard (top 10)
  app.get("/api/weekly-leaderboard", authMiddleware(), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await getCachedLeaderboard(limit);
      
      return res.json({ 
        leaderboard,
        count: leaderboard.length 
      });
    } catch (error: any) {
      console.error("[Topper] Failed to get weekly leaderboard:", error);
      return res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
    }
  });

  // Manual refresh of Topper calculations (admin only)
  app.post("/api/admin/topper/refresh", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      clearTopperCache();
      
      // Trigger recalculation by fetching fresh data
      const topper = await getCachedTopper();
      const leaderboard = await getCachedLeaderboard(10);
      
      return res.json({ 
        message: "Topper calculations refreshed successfully",
        topper,
        leaderboardCount: leaderboard.length
      });
    } catch (error: any) {
      console.error("[Topper] Failed to refresh topper:", error);
      return res.status(500).json({ error: "Failed to refresh topper calculations" });
    }
  });

  // Manual snapshot creation (admin only)
  app.post("/api/admin/snapshot/create", authMiddleware(["admin"]), async (req: Request, res: Response) => {
    try {
      const result = await createDailySnapshot();
      
      return res.json({
        message: "Daily snapshot created successfully",
        snapshotsCreated: result.snapshotsCreated,
        errors: result.errors
      });
    } catch (error: any) {
      console.error("[Snapshot] Failed to create daily snapshot:", error);
      return res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  return httpServer;
}
