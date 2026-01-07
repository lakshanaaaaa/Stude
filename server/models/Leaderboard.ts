import mongoose, { Schema, type Model } from "mongoose";

export type LeaderboardScope = "overall" | "platform";

export interface LeaderboardEntryOverall {
  userId: string;
  username: string;
  name: string;
  dept: string;
  totalSolved: number;
  highestRatingValue: number;
  highestRatingPlatform: "LeetCode" | "CodeChef" | "CodeForces" | null;
}

export interface LeaderboardEntryPlatform {
  userId: string;
  username: string;
  name: string;
  dept: string;
  problemsSolved: number;
  highestRating: number;
}

export interface LeaderboardDocument {
  scope: LeaderboardScope;
  platform: "LeetCode" | "CodeChef" | "CodeForces" | null;
  generatedAt: Date;
  // For simplicity store entries as any; they will match the interfaces above
  entries: any[];
}

const leaderboardSchema = new Schema<LeaderboardDocument>(
  {
    scope: { type: String, required: true },
    platform: { type: String, default: null },
    generatedAt: { type: Date, required: true },
    entries: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

leaderboardSchema.index({ scope: 1, platform: 1 }, { unique: true });

export const LeaderboardModel: Model<LeaderboardDocument> =
  mongoose.models.Leaderboard ||
  mongoose.model<LeaderboardDocument>("Leaderboard", leaderboardSchema);



