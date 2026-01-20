import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectMongoDB } from "./db/mongodb";
import { initializeStorage } from "./storage";
import { computeAndStoreLeaderboards } from "./services/leaderboardService";
import passport from "passport";
import { configurePassport } from "./passport";
import { configureCloudinary } from "./config/cloudinary";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// Initialize Cloudinary
configureCloudinary();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only add short response info for non-GET requests or errors
      if (capturedJsonResponse && (req.method !== "GET" || res.statusCode >= 400)) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        // Truncate long responses
        logLine += ` :: ${responseStr.length > 100 ? responseStr.substring(0, 100) + '...' : responseStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Connect to MongoDB and initialize storage
  try {
    await connectMongoDB();
    await initializeStorage();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.log("⚠️  Continuing with in-memory storage...");
  }

  await registerRoutes(httpServer, app);

  // Start periodic leaderboard computation (every 30 minutes)
  // Runs only in server process connected to main MongoDB (MONGODB_URI)
  const LEADERBOARD_INTERVAL_MS = 30 * 60 * 1000;
  try {
    // Initial computation (non-blocking)
    computeAndStoreLeaderboards();

    setInterval(() => {
      computeAndStoreLeaderboards();
    }, LEADERBOARD_INTERVAL_MS);
  } catch (err) {
    console.error("[Leaderboard] Failed to start scheduler:", err);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5005", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      console.log(`\n🚀 Frontend is available at: http://0.0.0.0:${port}\n`);
    },
  );
})();
