import { z } from "zod";

// Coding platform types
export const codingPlatforms = [
  "LeetCode",
  "CodeChef", 
  "CodeForces",
  "GeeksforGeeks",
  "HackerRank",
  "CodeStudio"
] as const;

export type CodingPlatform = typeof codingPlatforms[number];

// Coding account schema
export const codingAccountSchema = z.object({
  platform: z.enum(codingPlatforms),
  username: z.string().min(1),
});

export type CodingAccount = z.infer<typeof codingAccountSchema>;

// User roles
export const userRoles = ["admin", "faculty", "student"] as const;
export type UserRole = typeof userRoles[number];

// User schema for authentication
export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(userRoles),
  isOnboarded: z.boolean().default(false),
});

export const insertUserSchema = userSchema.omit({ id: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  username: z.string().min(1),
  dept: z.string().min(1),
  regNo: z.string().min(1),
  email: z.string().email(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  resumeLink: z.string().optional(),
  mainAccounts: z.array(codingAccountSchema),
  subAccounts: z.array(codingAccountSchema),
  avatarColor: z.string().optional(),
  problemStats: z.object({
    total: z.number().default(0),
    easy: z.number().default(0),
    medium: z.number().default(0),
    hard: z.number().default(0),
    platformStats: z.record(z.number()).default({}),
    solvedOverTime: z.array(z.object({ date: z.string(), count: z.number() })).default([]),
  }).optional(),
  contestStats: z.object({
    currentRating: z.number().default(0),
    highestRating: z.number().default(0),
    totalContests: z.number().default(0),
    ratingHistory: z.array(z.object({ date: z.string(), rating: z.number(), platform: z.string() })).default([]),
  }).optional(),
  badges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    platform: z.string(),
    icon: z.string().default(""),
    level: z.number().default(1),
  })).optional(),
});

export const insertStudentSchema = studentSchema.omit({ id: true });
export const updateStudentSchema = studentSchema.partial().omit({ id: true, username: true });

export type Student = z.infer<typeof studentSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;

// Analytics data types (for dummy data)
export interface ProblemStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  platformStats: Record<CodingPlatform, number>;
  solvedOverTime: { date: string; count: number }[];
}

export interface ContestStats {
  currentRating: number;
  highestRating: number;
  totalContests: number;
  ratingHistory: { date: string; rating: number; platform: CodingPlatform }[];
}

export interface Badge {
  id: string;
  name: string;
  platform: CodingPlatform;
  icon: string;
  level: number;
}

export interface StudentAnalytics {
  problemStats: ProblemStats;
  contestStats: ContestStats;
  badges: Badge[];
}

// Auth response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
    isOnboarded: boolean;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}
