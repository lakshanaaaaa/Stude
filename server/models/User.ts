import mongoose, { Schema, model, type Model } from "mongoose";
import type { User, UserRole } from "@shared/schema";

const userSchema = new Schema<User>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "faculty", "student"], required: true },
    // Track whether the user has completed onboarding
    isOnboarded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<User> = mongoose.models.User || model<User>("User", userSchema);

