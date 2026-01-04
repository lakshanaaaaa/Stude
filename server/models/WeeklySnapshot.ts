import mongoose, { Schema, model, type Model } from "mongoose";

export interface PlatformSnapshot {
  platform: string;
  totalProblems: number;
  easy: number;
  medium: number;
  hard: number;
  totalContests: number;
  avgRating: number;
  activeUsers: number;
}

export interface StudentSnapshot {
  studentId: string;
  username: string;
  name: string;
  dept: string;
  platforms: {
    platform: string;
    username: string;
    problemsSolved: number;
    easy: number;
    medium: number;
    hard: number;
    contestsAttended: number;
    currentRating: number;
    highestRating: number;
  }[];
  totalProblems: number;
  totalContests: number;
}

export interface WeeklySnapshot {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  createdAt: Date;
  platformStats: PlatformSnapshot[];
  studentSnapshots: StudentSnapshot[];
  totalStudents: number;
  totalProblemsAllPlatforms: number;
  totalContestsAllPlatforms: number;
}

const platformSnapshotSchema = new Schema<PlatformSnapshot>(
  {
    platform: { type: String, required: true },
    totalProblems: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
  },
  { _id: false }
);

const studentPlatformSchema = new Schema(
  {
    platform: { type: String, required: true },
    username: { type: String, default: "" },
    problemsSolved: { type: Number, default: 0 },
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 },
    contestsAttended: { type: Number, default: 0 },
    currentRating: { type: Number, default: 0 },
    highestRating: { type: Number, default: 0 },
  },
  { _id: false }
);

const studentSnapshotSchema = new Schema<StudentSnapshot>(
  {
    studentId: { type: String, required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    dept: { type: String, required: true },
    platforms: [studentPlatformSchema],
    totalProblems: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
  },
  { _id: false }
);

const weeklySnapshotSchema = new Schema<WeeklySnapshot>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    platformStats: [platformSnapshotSchema],
    studentSnapshots: [studentSnapshotSchema],
    totalStudents: { type: Number, default: 0 },
    totalProblemsAllPlatforms: { type: Number, default: 0 },
    totalContestsAllPlatforms: { type: Number, default: 0 },
  },
  { timestamps: true }
);

weeklySnapshotSchema.index({ weekStart: -1 });
weeklySnapshotSchema.index({ weekEnd: -1 });

export const WeeklySnapshotModel: Model<WeeklySnapshot> =
  mongoose.models.WeeklySnapshot || model<WeeklySnapshot>("WeeklySnapshot", weeklySnapshotSchema);
