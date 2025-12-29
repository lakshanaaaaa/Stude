import { storage, initializeStorage } from "../storage";
import { connectMongoDB } from "../db/mongodb";

async function makeUserAdmin(email: string) {
  try {
    // Initialize storage (MongoDB if available)
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (MONGODB_URI) {
      await connectMongoDB();
      await initializeStorage();
    }

    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    if (user.role === "admin") {
      console.log(`✅ User is already an admin`);
      process.exit(0);
    }

    // Update user role to admin
    const updatedUser = await storage.updateUser(user.id, { role: "admin" });

    if (updatedUser) {
      console.log(`✅ Successfully updated ${user.username} to admin role`);
      console.log(`New role: ${updatedUser.role}`);
    } else {
      console.error(`❌ Failed to update user role`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error making user admin:", error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2] || "dineshsenathipathi@gmail.com";

console.log(`Making user with email ${email} an admin...`);
makeUserAdmin(email);
