import mongoose, { Schema, model, type Model } from "mongoose";
import type { User, UserRole } from "@shared/schema";

const userSchema = new Schema<User>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for OAuth users
    role: { type: String, enum: ["admin", "faculty", "student"], required: true },
    // Track whether the user has completed onboarding
    isOnboarded: { type: Boolean, default: false },
    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    name: { type: String },
    avatar: { type: String },
    // Department for faculty users
    department: { type: String },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<User> = mongoose.models.User || model<User>("User", userSchema);

