import mongoose, { Schema, model, type Model } from "mongoose";
import type { Student, ProblemStats, ContestStats, Badge, CodingAccount, Project, WeeklyActivity, DerivedScores, SkillVector, PerformanceMetrics, ActivityMetrics, ProjectMetrics } from "@shared/schema";

// Coding Account Schema
const codingAccountSchema = new Schema<CodingAccount>(
  {
    platform: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false }
);

// Project Schema
const projectSchema = new Schema<Project>(
  {
    name: { type: String, required: true },
    techStack: [{ type: String }],
    domain: { type: String, required: true },
    impactScore: { type: Number, min: 0, max: 100, required: true },
    description: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    liveUrl: { type: String, default: "" },
  },
  { _id: false }
);

// Weekly Activity Schema
const weeklyActivitySchema = new Schema<WeeklyActivity>(
  {
    problemsSolved7Days: { type: Number, default: 0 },
    contestsAttended30Days: { type: Number, default: 0 },
    ratingGrowth30Days: { type: Number, default: 0 },
    lastUpdated: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

// Derived Scores Schema
const derivedScoresSchema = new Schema<DerivedScores>(
  {
    problemSolvingScore: { type: Number, min: 0, max: 100, default: 0 },
    contestStrengthScore: { type: Number, min: 0, max: 100, default: 0 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    lastCalculated: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);



// Skill Vector Schema
const skillVectorSchema = new Schema<SkillVector>(
  {
    type: Map,
    of: { type: Number, min: 0, max: 100 },
    default: {},
  },
  { _id: false }
);

// Performance Metrics Schema
const performanceMetricsSchema = new Schema<PerformanceMetrics>(
  {
    problemSolvingScore: { type: Number, min: 0, max: 100, default: 0 },
    contestScore: { type: Number, min: 0, max: 100, default: 0 },
    difficultyScore: {
      easy: { type: Number, min: 0, max: 100, default: 0 },
      medium: { type: Number, min: 0, max: 100, default: 0 },
      hard: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  { _id: false }
);

// Activity Metrics Schema
const activityMetricsSchema = new Schema<ActivityMetrics>(
  {
    recentActivityScore: { type: Number, min: 0, max: 100, default: 0 },
    problemsLast7Days: { type: Number, default: 0 },
    ratingGrowth: { type: Number, default: 0 },
  },
  { _id: false }
);

// Project Metrics Schema
const projectMetricsSchema = new Schema<ProjectMetrics>(
  {
    projectCount: { type: Number, default: 0 },
    relevantTech: [{ type: String }],
    projectStrengthScore: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

// Problem Stats Schema
const problemStatsSchema = new Schema<ProblemStats>(
  {
    total: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    platformStats: {
      type: Map,
      of: Number,
      default: {},
    },
    solvedOverTime: [
      {
        date: String,
        count: Number,
      },
    ],
  },
  { _id: false }
);

// Contest Stats Schema for individual platform
const platformContestStatsSchema = new Schema(
  {
    currentRating: { type: Number, default: 0 },
    highestRating: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    ratingHistory: [
      {
        date: String,
        rating: Number,
      },
    ],
  },
  { _id: false }
);

// Contest Stats Schema
const contestStatsSchema = new Schema<ContestStats>(
  {
    leetcode: { type: platformContestStatsSchema, default: () => ({}) },
    codechef: { type: platformContestStatsSchema, default: () => ({}) },
    codeforces: { type: platformContestStatsSchema, default: () => ({}) },
  },
  { _id: false }
);

// Badge Schema
const badgeSchema = new Schema<Badge>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    platform: { type: String, required: true },
    icon: { type: String, default: "" },
    level: { type: Number, default: 1 },
  },
  { _id: false }
);

// Student Schema
const studentSchema = new Schema<Student>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    dept: { type: String, required: true },
    regNo: { type: String, required: true },
    email: { type: String, required: true },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    resumeLink: { type: String, default: "" },
    mainAccounts: [codingAccountSchema],
    subAccounts: [codingAccountSchema],
    avatarColor: { type: String, default: "" },
    // NEW FIELDS for enhanced JD matching and analytics
    skills: [{ type: String }], // Normalized skills for JD matching
    domains: [{ type: String }], // Domain preferences for interest matching
    projects: [projectSchema], // Project portfolio for selection reasoning
    weeklyActivity: { type: weeklyActivitySchema, default: () => ({}) },
    derivedScores: { type: derivedScoresSchema, default: () => ({}) },
    // Analytics data
    problemStats: { type: problemStatsSchema, default: () => ({}) },
    contestStats: { type: contestStatsSchema, default: () => ({}) },
    badges: [badgeSchema],
    // Metadata
    lastScrapedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
studentSchema.index({ dept: 1 });
studentSchema.index({ skills: 1 }); // For skill-based JD matching
studentSchema.index({ "derivedScores.overallScore": -1 }); // For ranking
studentSchema.index({ "weeklyActivity.lastUpdated": -1 }); // For activity tracking
studentSchema.index({ "projects.domain": 1 }); // For domain-based filtering

export const StudentModel: Model<Student & { lastScrapedAt?: Date }> =
  mongoose.models.Student || model<Student & { lastScrapedAt?: Date }>("Student", studentSchema);

