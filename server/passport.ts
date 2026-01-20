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
              // Update existing user with Google ID
              console.log("Updating existing user with Google ID:", user.id);
              await storage.updateUser(user.id, {
                googleId: profile.id,
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value,
              });
              user = await storage.getUser(user.id);
              console.log("User updated:", user ? user.id : "failed");
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
