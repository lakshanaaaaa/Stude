import mongoose from "mongoose";

// Load .env file if not in production
if (process.env.NODE_ENV !== "production") {
  try {
    const { config } = await import("dotenv");
    config();
  } catch (e) {
    // dotenv not available, continue
  }
}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/studentperfanalytics";

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectMongoDB() {
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  console.log("MongoDB disconnected");
}

// Handle connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  isConnected = false;
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  isConnected = false;
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
  isConnected = true;
});

