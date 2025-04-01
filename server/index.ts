import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { DatabaseStorage } from "./storage";
import { db } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database and schema
  try {
    // Create session table manually
    try {
      const { pool } = await import("./db");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL PRIMARY KEY,
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
      `);
      log("Session table created/verified", "db");
    } catch (sessionError) {
      log(`Error setting up session table: ${sessionError}`, "db");
      // Continue anyway since we're using memory store
    }
    
    // Skip Drizzle push to avoid session table conflicts
    log("Checking if tables already exist in database", "db");
    
    try {
      // Check if users table exists
      const { pool } = await import("./db");
      const { rows } = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists
      `);
      
      // If users table doesn't exist, run drizzle push
      if (!rows[0].exists) {
        log("Users table doesn't exist, running drizzle-kit push", "db");
        const result = await import("child_process").then(({ execSync }) => {
          return execSync("npm run db:push").toString();
        });
        log(`Database schema creation result: ${result}`, "db");
      } else {
        log("Database tables already exist, skipping schema push", "db");
      }
    } catch (error) {
      log(`Error checking database tables: ${error}`, "db");
      // Run schema push anyway as fallback
      const result = await import("child_process").then(({ execSync }) => {
        return execSync("npm run db:push").toString();
      });
      log(`Database schema creation result: ${result}`, "db");
    }
    
    // Seed initial users
    if (storage instanceof DatabaseStorage) {
      log("Seeding initial users...", "db");
      await storage.seedUsers();
    }
  } catch (error) {
    log(`Error initializing database: ${error}`, "db");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
