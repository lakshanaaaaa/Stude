import mongoose, { Schema, model, type Model } from "mongoose";
import type { Student, ProblemStats, ContestStats, Badge, CodingAccount } from "@shared/schema";

// Coding Account Schema
const codingAccountSchema = new Schema<CodingAccount>(
  {
    platform: { type: String, required: true },
    username: { type: String, required: true },
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

// Contest Stats Schema
const contestStatsSchema = new Schema<ContestStats>(
  {
    currentRating: { type: Number, default: 0 },
    highestRating: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    ratingHistory: [
      {
        date: String,
        rating: Number,
        platform: String,
      },
    ],
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
    _id: { type: String, required: true },
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

// Create indexes (dept index for filtering)
studentSchema.index({ dept: 1 });

export const StudentModel: Model<Student & { lastScrapedAt?: Date }> =
  mongoose.models.Student || model<Student & { lastScrapedAt?: Date }>("Student", studentSchema);

