import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserRole } from "@shared/schema";
import { scrapeStudentData } from "./scrapers/index";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key-change-in-production";

interface JWTPayload {
  id: string;
  username: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
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

      req.user = decoded;
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
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // All signups default to student role
      const newUser = await storage.createUser({
        username,
        password,
        role: "student",
      });

      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          isOnboarded: newUser.isOnboarded,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isOnboarded: user.isOnboarded,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
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

      // Extract usernames from mainAccounts
      const leetcodeAccount = student.mainAccounts?.find(acc => acc.platform === "LeetCode");
      const codechefAccount = student.mainAccounts?.find(acc => acc.platform === "CodeChef");
      const codeforcesAccount = student.mainAccounts?.find(acc => acc.platform === "CodeForces");

      console.log(`Platform usernames:`);
      console.log(`  LeetCode: ${leetcodeAccount?.username || 'Not set'}`);
      console.log(`  CodeChef: ${codechefAccount?.username || 'Not set'}`);
      console.log(`  CodeForces: ${codeforcesAccount?.username || 'Not set'}`);

      if (!leetcodeAccount && !codechefAccount && !codeforcesAccount) {
        console.error(`No platform accounts configured for ${username}`);
        return res.status(400).json({ error: "No platform accounts configured. Please add your LeetCode, CodeChef, or CodeForces username in Edit Profile." });
      }

      // Scrape data
      console.log(`Starting scraping process...`);
      const scrapedData = await scrapeStudentData(
        leetcodeAccount?.username,
        codechefAccount?.username,
        codeforcesAccount?.username
      );

      console.log(`Scraping completed. Results:`);
      console.log(`  Total problems: ${scrapedData.problemStats.total}`);
      console.log(`  Current rating: ${scrapedData.contestStats.currentRating}`);
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
  app.post("/api/auth/onboard", authMiddleware(["student"]), async (req: Request, res: Response) => {
    try {
      const { leetcode, codeforces, codechef } = req.body;
      const username = req.user!.username;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if student already exists
      const existingStudent = await storage.getStudentByUsername(username);
      if (existingStudent) {
        const updatedUser = await storage.updateUser(user.id, { isOnboarded: true });
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
        name: username,
        username,
        dept: "Not Set",
        regNo: "Not Set",
        email: `${username}@college.edu`,
        mainAccounts,
        subAccounts: [],
      });

      const updatedUser = await storage.updateUser(user.id, { isOnboarded: true });

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

  return httpServer;
}
