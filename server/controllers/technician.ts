import { Express } from "express";
import { storage } from "../storage";

export function setupTechnicianRoutes(app: Express) {
  // Get all technicians
  app.get("/api/users/technicians", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const users = await storage.getUsers();
      // Filter to only technicians and remove passwords
      const technicians = users
        .filter(user => user.role === "technician")
        .map(technician => {
          const { password, ...technicianWithoutPassword } = technician;
          return technicianWithoutPassword;
        });
      
      res.json(technicians);
    } catch (error) {
      next(error);
    }
  });
  
  // Get technician workload (appointments count by status)
  app.get("/api/technicians/workload", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).send("Unauthorized");
      }
      
      const technicians = await storage.getUsers();
      const appointments = await storage.getAllAppointments();
      
      // Filter to only technicians and calculate workload
      const technicianWorkloads = technicians
        .filter(user => user.role === "technician")
        .map(technician => {
          const { password, ...technicianData } = technician;
          
          // Count appointments for this technician by status
          const technicianAppointments = appointments.filter(
            appointment => appointment.technicianId === technician.id
          );
          
          const scheduled = technicianAppointments.filter(a => a.status === "scheduled").length;
          const completed = technicianAppointments.filter(a => a.status === "completed").length;
          const cancelled = technicianAppointments.filter(a => a.status === "cancelled").length;
          const rescheduled = technicianAppointments.filter(a => a.status === "rescheduled").length;
          const total = technicianAppointments.length;
          
          return {
            ...technicianData,
            workload: {
              scheduled,
              completed,
              cancelled,
              rescheduled,
              total
            }
          };
        });
      
      res.json(technicianWorkloads);
    } catch (error) {
      next(error);
    }
  });
  
  // Get technician by ID
  app.get("/api/technicians/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const technicianId = parseInt(req.params.id);
      if (isNaN(technicianId)) {
        return res.status(400).send("Invalid technician ID");
      }
      
      const technician = await storage.getUser(technicianId);
      if (!technician || technician.role !== "technician") {
        return res.status(404).send("Technician not found");
      }
      
      // Don't allow non-admins to view other technicians' info
      if (req.user.role !== "admin" && req.user.role !== "owner" && req.user.id !== technicianId) {
        return res.status(403).send("Unauthorized");
      }
      
      const { password, ...technicianWithoutPassword } = technician;
      res.json(technicianWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Get technician's current schedule
  app.get("/api/technicians/:id/schedule", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const technicianId = parseInt(req.params.id);
      if (isNaN(technicianId)) {
        return res.status(400).send("Invalid technician ID");
      }
      
      // Check if requesting user is authorized
      if (req.user.role !== "admin" && req.user.role !== "owner" && req.user.id !== technicianId) {
        return res.status(403).send("Unauthorized");
      }
      
      const technician = await storage.getUser(technicianId);
      if (!technician || technician.role !== "technician") {
        return res.status(404).send("Technician not found");
      }
      
      const allAppointments = await storage.getAllAppointments();
      const technicianAppointments = allAppointments.filter(
        appointment => appointment.technicianId === technicianId
      );
      
      // Group by date for easier calendar rendering
      const scheduleByDate = technicianAppointments.reduce((acc, appointment) => {
        const dateKey = new Date(appointment.scheduledDate).toISOString().split('T')[0];
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        acc[dateKey].push(appointment);
        return acc;
      }, {} as Record<string, any[]>);
      
      res.json({
        technicianId,
        technicianName: technician.name,
        schedule: scheduleByDate
      });
    } catch (error) {
      next(error);
    }
  });
}