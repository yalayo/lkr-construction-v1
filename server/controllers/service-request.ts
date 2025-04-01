import { Express } from "express";
import { storage } from "../storage";
import { sendSMS } from "../utils/twilio";
import { insertServiceRequestSchema, InsertServiceRequest } from "@shared/schema";
import { z } from "zod";

export function setupServiceRequestRoutes(app: Express) {
  // Create a new service request
  app.post("/api/service-requests", async (req, res, next) => {
    try {
      const validatedData = insertServiceRequestSchema.parse(req.body);
      
      // Associate with user if logged in
      if (req.isAuthenticated()) {
        validatedData.userId = req.user.id;
      }
      
      const serviceRequest = await storage.createServiceRequest(validatedData);
      
      // Create a lead from the service request
      const estimatedPrice = calculateEstimatedPrice(serviceRequest);
      const lead = await storage.createLead({
        serviceRequestId: serviceRequest.id,
        customerName: serviceRequest.name,
        customerPhone: serviceRequest.phone,
        customerEmail: serviceRequest.email,
        serviceType: serviceRequest.serviceType,
        issueType: serviceRequest.issueType,
        urgency: serviceRequest.urgency,
        propertyType: serviceRequest.propertyType,
        description: serviceRequest.description,
        address: serviceRequest.address,
        preferredDate: serviceRequest.preferredDate,
        preferredTime: serviceRequest.preferredTime,
        estimatedPrice,
        status: "new",
        // Calculate priority - higher for emergency and high-value jobs
        priority: calculatePriority(serviceRequest, estimatedPrice)
      });
      
      // Send SMS notification to customer
      const message = `Thank you for your service request! Click the link to view your request status: ${getClientUrl()}/client-dashboard`;
      await sendSMS(serviceRequest.phone, message);
      
      res.status(201).json(serviceRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Get service request history for current user
  app.get("/api/service-requests/history", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const serviceRequests = await storage.getServiceRequestsByUserId(req.user.id);
      // Sort by creation date, newest first
      serviceRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(serviceRequests);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all leads (for owner dashboard)
  app.get("/api/leads", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const leads = await storage.getAllLeads();
      
      // Sort by priority (highest first), then by creation date (oldest first for FIFO)
      leads.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // FIFO
      });
      
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });
  
  // Assign a technician to a lead
  app.post("/api/leads/:id/assign", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const leadId = parseInt(req.params.id);
      if (isNaN(leadId)) {
        return res.status(400).send("Invalid lead ID");
      }
      
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).send("Lead not found");
      }
      
      // Get the technician (in a real app, would select from available technicians)
      const technicians = (await storage.getUsers()).filter(user => user.role === "technician");
      if (technicians.length === 0) {
        return res.status(400).send("No technicians available");
      }
      
      // Use the first technician for this example
      const technician = technicians[0];
      
      // Update the lead status
      const updatedLead = await storage.updateLead(leadId, {
        status: "assigned"
      });
      
      // Update the service request
      const serviceRequest = await storage.getServiceRequest(lead.serviceRequestId);
      if (serviceRequest) {
        await storage.updateServiceRequest(serviceRequest.id, {
          status: "assigned",
          technicianId: technician.id,
          technicianName: technician.name
        });
        
        // Create an appointment
        const scheduledDate = lead.preferredDate 
          ? new Date(lead.preferredDate) 
          : new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
          
        const timeSlot = lead.preferredTime || "morning";
        
        const appointment = await storage.createAppointment({
          serviceRequestId: serviceRequest.id,
          userId: serviceRequest.userId || 0, // If no userId (anonymous request), use 0
          technicianId: technician.id,
          technicianName: technician.name,
          technicianPhone: technician.phone,
          scheduledDate,
          timeSlot,
          status: "scheduled",
          serviceType: serviceRequest.serviceType,
          issueType: serviceRequest.issueType,
          notes: `Assigned to ${technician.name}`
        });
        
        // Send SMS notification to customer
        const message = `Good news! A technician has been assigned to your service request. Please confirm your appointment for ${scheduledDate.toLocaleDateString()} (${timeSlot}) by visiting: ${getClientUrl()}/client-dashboard`;
        await sendSMS(serviceRequest.phone, message);
        
        res.json({ lead: updatedLead, appointment });
      } else {
        res.status(404).send("Service request not found");
      }
    } catch (error) {
      next(error);
    }
  });
}

// Helper function to calculate estimated price based on service type and issue
function calculateEstimatedPrice(request: InsertServiceRequest): number {
  let basePrice = 0;
  
  // Base price by service type
  if (request.serviceType === "electrical") {
    basePrice = 150;
  } else if (request.serviceType === "plumbing") {
    basePrice = 130;
  } else if (request.serviceType === "both") {
    basePrice = 250;
  }
  
  // Adjustments based on urgency
  if (request.urgency === "emergency") {
    basePrice *= 1.5; // 50% premium for emergency
  } else if (request.urgency === "urgent") {
    basePrice *= 1.25; // 25% premium for urgent
  }
  
  // Adjustments based on property type
  if (request.propertyType.startsWith("commercial") || request.propertyType === "industrial") {
    basePrice *= 1.4; // 40% premium for commercial/industrial
  }
  
  return parseFloat(basePrice.toFixed(2));
}

// Helper function to calculate priority score for leads
function calculatePriority(request: InsertServiceRequest, price: number): number {
  let priority = 0;
  
  // Priority based on urgency
  if (request.urgency === "emergency") {
    priority += 100;
  } else if (request.urgency === "urgent") {
    priority += 50;
  } else if (request.urgency === "standard") {
    priority += 25;
  }
  
  // Priority based on price (higher price = higher priority, but less important than urgency)
  priority += Math.floor(price / 10);
  
  return priority;
}

// Helper function to get client URL
function getClientUrl(): string {
  const domains = process.env.REPLIT_DOMAINS?.split(",")[0] || "http://localhost:5000";
  return domains;
}
