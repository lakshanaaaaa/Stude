import mongoose, { Schema, model, type Model } from "mongoose";
import type { User, UserRole } from "@shared/schema";

const userSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["faculty", "student"], required: true },
  },
  {
    timestamps: true,
    _id: false, // Use custom id field instead of _id
  }
);

export const UserModel: Model<User> = mongoose.models.User || model<User>("User", userSchema);

