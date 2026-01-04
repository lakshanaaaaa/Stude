import mongoose from "mongoose";
import { randomUUID } from "crypto";
import type { WeeklySnapshot, StudentSnapshot, PlatformSnapshot } from "../models/WeeklySnapshot";

// Separate connection for admin database
let adminConnection: mongoose.Connection | null = null;

// Define schemas for admin database
const platformSnapshotSchema = new mongoose.Schema(
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

const studentPlatformSchema = new mongoose.Schema(
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

const studentSnapshotSchema = new mongoose.Schema(
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

const weeklySnapshotSchema = new mongoose.Schema(
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

export async function getAdminConnection(): Promise<mongoose.Connection> {
  if (adminConnection && adminConnection.readyState === 1) {
    return adminConnection;
  }

  const adminUri = process.env.MONGODB_URI_ADMIN;
  if (!adminUri) {
    throw new Error("MONGODB_URI_ADMIN environment variable is not set");
  }

  adminConnection = mongoose.createConnection(adminUri);
  
  await new Promise<void>((resolve, reject) => {
    adminConnection!.on("connected", () => {
      console.log("✅ Connected to Admin MongoDB");
      resolve();
    });
    adminConnection!.on("error", (err) => {
      console.error("❌ Admin MongoDB connection error:", err);
      reject(err);
    });
  });

  return adminConnection;
}

export class AdminStorage {
  private WeeklySnapshotModel: mongoose.Model<WeeklySnapshot> | null = null;

  private async getModel(): Promise<mongoose.Model<WeeklySnapshot>> {
    if (this.WeeklySnapshotModel) {
      return this.WeeklySnapshotModel;
    }

    const conn = await getAdminConnection();
    this.WeeklySnapshotModel = conn.model<WeeklySnapshot>("WeeklySnapshot", weeklySnapshotSchema);
    return this.WeeklySnapshotModel;
  }

  async createWeeklySnapshot(data: Omit<WeeklySnapshot, "id" | "createdAt">): Promise<WeeklySnapshot> {
    const Model = await this.getModel();
    const id = randomUUID();
    
    const snapshot = new Model({
      _id: id,
      id,
      ...data,
      createdAt: new Date(),
    });
    
    await snapshot.save();
    return snapshot.toObject() as WeeklySnapshot;
  }

  async getLatestSnapshot(): Promise<WeeklySnapshot | null> {
    const Model = await this.getModel();
    const snapshot = await Model.findOne().sort({ weekEnd: -1 }).lean();
    return snapshot as WeeklySnapshot | null;
  }

  async getSnapshotByWeek(weekStart: Date): Promise<WeeklySnapshot | null> {
    const Model = await this.getModel();
    const startOfDay = new Date(weekStart);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(weekStart);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await Model.findOne({
      weekStart: { $gte: startOfDay, $lte: endOfDay }
    }).lean();
    
    return snapshot as WeeklySnapshot | null;
  }

  async getAllSnapshots(): Promise<WeeklySnapshot[]> {
    const Model = await this.getModel();
    const snapshots = await Model.find().sort({ weekEnd: -1 }).lean();
    return snapshots as WeeklySnapshot[];
  }

  async getSnapshotById(id: string): Promise<WeeklySnapshot | null> {
    const Model = await this.getModel();
    const snapshot = await Model.findOne({ id }).lean();
    return snapshot as WeeklySnapshot | null;
  }

  async deleteSnapshot(id: string): Promise<boolean> {
    const Model = await this.getModel();
    const result = await Model.deleteOne({ id });
    return result.deletedCount > 0;
  }
}

export const adminStorage = new AdminStorage();
