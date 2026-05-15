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
  password: z.string().optional(), // Optional for OAuth users
  role: z.enum(userRoles),
  isOnboarded: z.boolean().default(false),
  googleId: z.string().optional(), // Google OAuth ID
  email: z.string().email().optional(), // Email from OAuth
  name: z.string().optional(), // Name from OAuth
  avatar: z.string().optional(), // Profile picture from OAuth
  department: z.string().optional(), // Department for faculty users
});

export const insertUserSchema = userSchema.omit({ id: true });
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Project schema
export const projectSchema = z.object({
  name: z.string().min(1),
  techStack: z.array(z.string()),
  domain: z.string().min(1),
  impactScore: z.number().min(0).max(100),
  description: z.string().optional(),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;

// Weekly activity schema
export const weeklyActivitySchema = z.object({
  problemsSolved7Days: z.number().default(0),
  contestsAttended30Days: z.number().default(0),
  ratingGrowth30Days: z.number().default(0),
  lastUpdated: z.string().optional(), // ISO date string
});

export type WeeklyActivity = z.infer<typeof weeklyActivitySchema>;

// Skill vector schema for proficiency tracking
export const skillVectorSchema = z.record(z.string(), z.number().min(0).max(100));
export type SkillVector = z.infer<typeof skillVectorSchema>;

// Performance metrics schema
export const performanceMetricsSchema = z.object({
  problemSolvingScore: z.number().min(0).max(100).default(0),
  contestScore: z.number().min(0).max(100).default(0),
  difficultyScore: z.object({
    easy: z.number().min(0).max(100).default(0),
    medium: z.number().min(0).max(100).default(0),
    hard: z.number().min(0).max(100).default(0),
  }),
});

export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>;

// Activity metrics schema
export const activityMetricsSchema = z.object({
  recentActivityScore: z.number().min(0).max(100).default(0),
  problemsLast7Days: z.number().default(0),
  ratingGrowth: z.number().default(0),
});

export type ActivityMetrics = z.infer<typeof activityMetricsSchema>;

// Project metrics schema
export const projectMetricsSchema = z.object({
  projectCount: z.number().default(0),
  relevantTech: z.array(z.string()).default([]),
  projectStrengthScore: z.number().min(0).max(100).default(0),
});

export type ProjectMetrics = z.infer<typeof projectMetricsSchema>;

// Derived scores schema (keeping for backward compatibility)
export const derivedScoresSchema = z.object({
  problemSolvingScore: z.number().min(0).max(100).default(0),
  contestStrengthScore: z.number().min(0).max(100).default(0),
  consistencyScore: z.number().min(0).max(100).default(0),
  overallScore: z.number().min(0).max(100).default(0),
  lastCalculated: z.string().optional(), // ISO date string
});

export type DerivedScores = z.infer<typeof derivedScoresSchema>;

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
  // NEW: Normalized skills for JD matching (MOST IMPORTANT)
  skills: z.array(z.string()).default([]),
  // NEW: Domain preferences for interest matching
  domains: z.array(z.string()).default([]),
  // NEW: Project portfolio for selection reasoning
  projects: z.array(projectSchema).default([]),
  // NEW: Weekly activity summary for evidence
  weeklyActivity: weeklyActivitySchema.optional(),
  // NEW: Derived performance scores for ranking
  derivedScores: derivedScoresSchema.optional(),
  // Existing analytics data
  problemStats: z.object({
    total: z.number().default(0),
    easy: z.number().default(0),
    medium: z.number().default(0),
    hard: z.number().default(0),
    platformStats: z.record(z.number()).default({}),
    solvedOverTime: z.array(z.object({ date: z.string(), count: z.number() })).default([]),
  }).optional(),
  contestStats: z.object({
    leetcode: z.object({
      currentRating: z.number().default(0),
      highestRating: z.number().default(0),
      totalContests: z.number().default(0),
      ratingHistory: z.array(z.object({ date: z.string(), rating: z.number() })).default([]),
    }).optional(),
    codechef: z.object({
      currentRating: z.number().default(0),
      highestRating: z.number().default(0),
      totalContests: z.number().default(0),
      ratingHistory: z.array(z.object({ date: z.string(), rating: z.number() })).default([]),
    }).optional(),
    codeforces: z.object({
      currentRating: z.number().default(0),
      highestRating: z.number().default(0),
      totalContests: z.number().default(0),
      ratingHistory: z.array(z.object({ date: z.string(), rating: z.number() })).default([]),
    }).optional(),
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

// Analytics data types (for dummy data and backward compatibility)
export interface ProblemStats {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  platformStats: Record<CodingPlatform, number>;
  solvedOverTime: { date: string; count: number }[];
}

export interface ContestStats {
  leetcode?: {
    currentRating: number;
    highestRating: number;
    totalContests: number;
    ratingHistory: { date: string; rating: number }[];
  };
  codechef?: {
    currentRating: number;
    highestRating: number;
    totalContests: number;
    ratingHistory: { date: string; rating: number }[];
  };
  codeforces?: {
    currentRating: number;
    highestRating: number;
    totalContests: number;
    ratingHistory: { date: string; rating: number }[];
  };
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