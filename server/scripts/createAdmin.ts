import { config } from "dotenv";
config();

import { connectMongoDB } from "../db/mongodb";
import { MongoStorage } from "../storage/mongodb";
import { randomUUID } from "crypto";

async function createAdmin() {
  await connectMongoDB();
  const storage = new MongoStorage();

  console.log("🔐 Creating admin user...");

  const adminUser = {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
  };

  try {
    const existingUser = await storage.getUserByUsername(adminUser.username);
    if (existingUser) {
      console.log("❌ Admin user already exists");
      return;
    }

    const newAdmin = await storage.createUser(adminUser);
    console.log(`✅ Admin user created successfully`);
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: *****`);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
}

createAdmin()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });