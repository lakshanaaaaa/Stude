import mongoose, { Schema, model, type Model } from "mongoose";

export interface RoleRequest {
  id: string;
  userId: string;
  username: string;
  email: string;
  name: string;
  requestedRole: "faculty" | "admin";
  department?: string; // Required for faculty
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const roleRequestSchema = new Schema<RoleRequest>(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    email: { type: String },
    name: { type: String },
    requestedRole: { type: String, enum: ["faculty", "admin"], required: true },
    department: { type: String },
    reason: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
roleRequestSchema.index({ status: 1, createdAt: -1 });
roleRequestSchema.index({ userId: 1, status: 1 });

export const RoleRequestModel: Model<RoleRequest> =
  mongoose.models.RoleRequest || model<RoleRequest>("RoleRequest", roleRequestSchema);
