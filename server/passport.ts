import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "https://stude-mvnf.onrender.com/api/auth/google/callback";

export function configurePassport() {
  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth callback - Profile ID:", profile.id);
          
          // Check if user exists by Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          console.log("User found by Google ID:", user ? user.id : "none");

          if (!user) {
            // Check if user exists by email
            const email = profile.emails?.[0]?.value;
            console.log("Checking email:", email);
            
            if (email) {
              user = await storage.getUserByEmail(email);
              console.log("User found by email:", user ? user.id : "none");
            }

            if (!user) {
              // Create new user
              const username = profile.emails?.[0]?.value?.split("@")[0] || `user_${profile.id}`;
              console.log("Creating new user with username:", username);
              
              // Check if username already exists
              const existingUser = await storage.getUserByUsername(username);
              const finalUsername = existingUser ? `${username}_${Date.now()}` : username;
              
              console.log("Final username:", finalUsername);
              
              // Check if email belongs to faculty or admin domain (you can customize this logic)
              // For now, all new OAuth users are students and need onboarding
              user = await storage.createUser({
                username: finalUsername,
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                role: "student", // Default role for OAuth users
                isOnboarded: false, // Students need to complete onboarding
              });
              console.log("New user created:", user.id);
            } else {
              // User exists by email but not by Google ID
              // This could be a user who was deleted and is signing up again
              // Or a user who previously used a different auth method
              console.log("Updating existing user with Google ID:", user.id);
              console.log("Existing user role:", user.role, "isOnboarded:", user.isOnboarded);
              
              // If user was faculty/admin but is signing in fresh (no Google ID before),
              // reset them to student role and require onboarding
              const updateData: any = {
                googleId: profile.id,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
              };
              
              // If they don't have a Google ID yet, treat as fresh signup
              if (!user.googleId) {
                console.log("User has no Google ID - treating as fresh signup, resetting to student");
                updateData.role = "student";
                updateData.isOnboarded = false;
                
                // Clean up any old student data if they're changing roles
                if (user.role !== "student" && user.username) {
                  console.log("Cleaning up old student data for role change");
                  await storage.deleteStudent(user.username);
                }
              }
              
              await storage.updateUser(user.id, updateData);
              user = await storage.getUser(user.id);
              console.log("User updated:", user ? user.id : "failed", "New role:", user?.role);
            }
          }

          console.log("OAuth successful for user:", user ? user.id : "none");
          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
