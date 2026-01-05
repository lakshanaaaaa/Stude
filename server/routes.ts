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
      const students = await storage.getAllStudents();
      return res.json(students);
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

  app.patch("/api/student/:username", authMiddleware(["student"]), async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (req.user!.username !== username) {
        return res.status(403).json({ error: "You can only edit your own profile" });
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
    try {
      const { username } = req.params;
      console.log(`\n=== Scraping request for: ${username} ===`);
      
      const student = await storage.getStudentByUsername(username);

      if (!student) {
        console.error(`Student not found: ${username}`);
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

      console.log(`Scraping completed. Results:`);
      console.log(`  Total problems: ${scrapedData.problemStats.total}`);
      console.log(`  LeetCode contests: ${scrapedData.contestStats.leetcode?.totalContests || 0}`);
      console.log(`  CodeChef contests: ${scrapedData.contestStats.codechef?.totalContests || 0}`);
      console.log(`  CodeForces contests: ${scrapedData.contestStats.codeforces?.totalContests || 0}`);
      console.log(`  Badges: ${scrapedData.badges.length}`);

      // Update student with scraped data
      const updatedStudent = await storage.updateStudentAnalytics(username, scrapedData);

      if (!updatedStudent) {
        console.error(`Failed to update student analytics for ${username}`);
        return res.status(500).json({ error: "Failed to update student data" });
      }

      console.log(`Successfully updated student data for ${username}`);
      console.log(`=== Scraping complete ===\n`);

      return res.json({
        success: true,
        student: updatedStudent,
        message: "Profile data scraped and updated successfully"
      });
    } catch (error: any) {
      console.error("Scrape student error:", error);
      console.error("Error stack:", error.stack);
      return res.status(500).json({ error: error.message || "Failed to scrape student data" });
    }
  });

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

      const user = await storage.getUserByUsername(currentUsername);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is already onboarded
      if (user.isOnboarded) {
        const existingStudent = await storage.getStudentByUsername(currentUsername);
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
        return res.status(400).json({ error: "Username and department are required" });
      }

      if (!leetcode && !codeforces && !codechef) {
        return res.status(400).json({ error: "At least one coding platform account is required" });
      }

      // Check if new username is available (if different from current)
      if (username !== currentUsername) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ error: "Username is already taken" });
        }
      }

      // Check if student already exists
      const existingStudent = await storage.getStudentByUsername(currentUsername);
      if (existingStudent) {
        const updatedUser = await storage.updateUser(user.id, { 
          isOnboarded: true,
          username: username 
        });
        return res.json({ 
          success: true, 
          student: existingStudent,
          user: {
            id: updatedUser!.id,
            username: updatedUser!.username,
            role: updatedUser!.role,
            isOnboarded: updatedUser!.isOnboarded,
          }
        });
      }

      const mainAccounts = [];
      if (leetcode) mainAccounts.push({ platform: "LeetCode" as const, username: leetcode });
      if (codeforces) mainAccounts.push({ platform: "CodeForces" as const, username: codeforces });
      if (codechef) mainAccounts.push({ platform: "CodeChef" as const, username: codechef });

      const student = await storage.createStudent({
        name: user.name || username,
        username: username,
        dept: department,
        regNo: "Not Set",
        email: user.email || `${username}@college.edu`,
        mainAccounts,
        subAccounts: [],
      });

      const updatedUser = await storage.updateUser(user.id, { 
        isOnboarded: true,
        username: username 
      });

      return res.json({ 
        success: true, 
        student,
        user: {
          id: updatedUser!.id,
          username: updatedUser!.username,
          role: updatedUser!.role,
          isOnboarded: updatedUser!.isOnboarded,
        }
      });
    } catch (error) {
      console.error("Onboarding error:", error);
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
      }

      // Delete user
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

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

      const updatedUser = await storage.updateUser(id, { department });
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update department" });
      }

      return res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        department: updatedUser.department,
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

      console.log(`[Admin] Starting bulk scrape for platform: ${platform}`);
      
      // Start scraping in background
      scrapeAllStudentsForPlatform(platform).then(result => {
        console.log(`[Admin] Bulk scrape completed for ${platform}:`, result);
      }).catch(err => {
        console.error(`[Admin] Bulk scrape failed for ${platform}:`, err);
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
      console.log("[Admin] Creating weekly snapshot...");
      const snapshot = await createWeeklySnapshot();
      console.log("[Admin] Weekly snapshot created:", snapshot.id);
      
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

  return httpServer;
}
