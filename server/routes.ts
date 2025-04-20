import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupServiceRequestRoutes } from "./controllers/service-request";
import { setupAppointmentRoutes } from "./controllers/appointment";
import { setupAccountingRoutes } from "./controllers/accounting";
import { setupDashboardRoutes } from "./controllers/dashboard";
import { setupInventoryRoutes } from "./controllers/inventory";
import { setupTechnicianRoutes } from "./controllers/technician";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker and monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Set up service request and lead management routes
  setupServiceRequestRoutes(app);
  
  // Set up appointment scheduling routes
  setupAppointmentRoutes(app);
  
  // Set up accounting routes
  setupAccountingRoutes(app);
  
  // Set up dashboard routes
  setupDashboardRoutes(app);
  
  // Set up inventory management routes
  setupInventoryRoutes(app);
  
  // Set up technician routes
  setupTechnicianRoutes(app);
  
  // User management routes
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      
      const users = await storage.getUsers();
      // Remove passwords before sending
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // Update user
  app.patch("/api/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Don't allow password updates through this route
      const { password, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      
      // Remove password before sending
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
