import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  console.log("***** COMPARE PASSWORDS FUNCTION RUNNING *****");
  console.log("Supplied password length:", supplied.length);
  console.log("Stored password format:", stored.startsWith('$2') ? 'bcrypt' : 'unknown');
  
  try {
    // Use bcrypt to compare the passwords
    console.log("Comparing passwords with bcrypt...");
    const result = await bcrypt.compare(supplied, stored);
    console.log("Password match:", result);
    return result;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "elecplumb-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false, // Set to false for development
      sameSite: "lax",
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Authenticating user: ${username}`);
        
        // Get user from database
        const user = await storage.getUserByUsername(username);
        
        // If user not found, authentication fails
        if (!user) {
          console.log(`User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check password
        const isPasswordValid = await comparePasswords(password, user.password);
        
        if (!isPasswordValid) {
          console.log(`Invalid password for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Authentication successful
        console.log(`Authentication successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Remove the password from the response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", req.body.username);
    
    // Validate request body
    if (!req.body.username || !req.body.password) {
      console.log("Login missing credentials");
      return res.status(400).send("Username and password are required");
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        const message = info && info.message ? info.message : "Invalid username or password";
        console.log("Login failed:", message);
        return res.status(401).send(message);
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return next(err);
        }
        
        console.log("Login successful for:", user.username);
        
        // Remove the password from the response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - isAuthenticated:", req.isAuthenticated());
    console.log("GET /api/user - Session:", req.session);
    
    if (!req.isAuthenticated()) {
      console.log("GET /api/user - Not authenticated, sending 401");
      return res.sendStatus(401);
    }
    
    console.log("GET /api/user - User found:", req.user?.username);
    
    // Remove the password from the response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Change password route (requires authentication)
  app.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).send("Current password and new password are required");
      }
      
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Verify current password
      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).send("Current password is incorrect");
      }
      
      // Hash the new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await storage.updateUser(user.id, { password: hashedNewPassword });
      
      res.status(200).send("Password changed successfully");
    } catch (error) {
      next(error);
    }
  });

  // Reset user password (admin only)
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");
      
      // Only admin users can reset passwords
      if (req.user.role !== 'admin') {
        return res.status(403).send("Only administrators can reset passwords");
      }
      
      const { userId, newPassword } = req.body;
      
      if (!userId || !newPassword) {
        return res.status(400).send("User ID and new password are required");
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Hash the new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update the user's password
      await storage.updateUser(user.id, { password: hashedNewPassword });
      
      res.status(200).send("Password reset successfully");
    } catch (error) {
      next(error);
    }
  });
}
