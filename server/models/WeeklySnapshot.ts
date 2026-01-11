import mongoose, { Schema, model, type Model } from "mongoose";

export interface WeeklySnapshot {
  id: string;
  studentId: string;
  username: string;
  timestamp: Date;
  
  problemStats: {
    leetcode: number;
    codechef: number;
    codeforces: number;
    total: number;
  };
  
  ratings: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
  
  contests: {
    leetcode: number;
    codechef: number;
    codeforces: number;
  };
}

const weeklySnapshotSchema = new Schema<WeeklySnapshot>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    
    problemStats: {
      leetcode: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    
    ratings: {
      leetcode: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
    },
    
    contests: {
      leetcode: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
weeklySnapshotSchema.index({ studentId: 1, timestamp: -1 });

// TTL index to auto-delete snapshots older than 30 days
weeklySnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const WeeklySnapshotModel: Model<WeeklySnapshot> =
  mongoose.models.WeeklySnapshot || model<WeeklySnapshot>("WeeklySnapshot", weeklySnapshotSchema);
