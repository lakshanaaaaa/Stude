import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserRole } from "@shared/schema";

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

  return httpServer;
}
