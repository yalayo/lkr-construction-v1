import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "../storage";
import { ServiceRequest } from "@shared/schema";

export function setupTechnicianRoutes(app: Express) {
  // Get jobs assigned to a technician
  app.get("/api/technician/jobs/assigned", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (req.user.role !== 'technician') {
        return res.status(403).json({ error: "Access denied. Technician role required." });
      }

      const technicianId = req.user.id;
      // Get all service requests, then filter by technicianId
      const allRequests = await storage.getAllServiceRequests();
      const assignedJobs = allRequests.filter(
        (request) => request.technicianId === technicianId && request.status !== 'completed'
      );

      // Sort by priority (high to low) and then by creation date (newest first)
      assignedJobs.sort((a, b) => {
        // First sort by priority (high to low)
        if (a.priority !== b.priority) {
          return (b.priority ?? 0) - (a.priority ?? 0);
        }
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Transform into job format
      const jobs = assignedJobs.map(transformServiceRequestToJob);
      
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error fetching assigned jobs:", error);
      res.status(500).json({ error: "Failed to fetch assigned jobs" });
    }
  });

  // Get available jobs (those without a technician assigned)
  app.get("/api/technician/jobs/available", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (req.user.role !== 'technician') {
        return res.status(403).json({ error: "Access denied. Technician role required." });
      }

      // Get all service requests, then filter for those without a technician
      const allRequests = await storage.getAllServiceRequests();
      const availableJobs = allRequests.filter(
        (request) => 
          request.technicianId === null && 
          request.status === 'pending' && 
          request.quotedAmount !== null &&  // Only show jobs with a price estimate
          request.quoteAcceptedDate !== null // Only show jobs with accepted quotes
      );

      // Sort by priority (high to low) and then by creation date (oldest first)
      availableJobs.sort((a, b) => {
        // First sort by priority (high to low)
        if (a.priority !== b.priority) {
          return (b.priority ?? 0) - (a.priority ?? 0);
        }
        // Then by creation date (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // Transform into job format
      const jobs = availableJobs.map(transformServiceRequestToJob);
      
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error fetching available jobs:", error);
      res.status(500).json({ error: "Failed to fetch available jobs" });
    }
  });

  // Get completed jobs for a technician
  app.get("/api/technician/jobs/completed", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (req.user.role !== 'technician') {
        return res.status(403).json({ error: "Access denied. Technician role required." });
      }

      const technicianId = req.user.id;
      // Get all service requests, then filter for completed ones for this technician
      const allRequests = await storage.getAllServiceRequests();
      const completedJobs = allRequests.filter(
        (request) => request.technicianId === technicianId && request.status === 'completed'
      );

      // Sort by completion date (newest first)
      completedJobs.sort((a, b) => 
        new Date(b.updatedAt || b.createdAt).getTime() - 
        new Date(a.updatedAt || a.createdAt).getTime()
      );

      // Transform into job format
      const jobs = completedJobs.map(transformServiceRequestToJob);
      
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
      res.status(500).json({ error: "Failed to fetch completed jobs" });
    }
  });

  // Assign a job to a technician
  app.post("/api/service-requests/:id/assign", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (req.user.role !== 'technician') {
        return res.status(403).json({ error: "Access denied. Technician role required." });
      }

      const serviceRequestId = parseInt(req.params.id);
      const technicianId = req.user.id;  // Use the authenticated technician's ID

      // Verify the service request exists
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Make sure it's not already assigned
      if (serviceRequest.technicianId !== null) {
        return res.status(400).json({ error: "Job is already assigned to a technician" });
      }

      // Make sure it has a quote and it's been accepted
      if (serviceRequest.quotedAmount === null || serviceRequest.quoteAcceptedDate === null) {
        return res.status(400).json({ error: "Job is not yet ready for assignment" });
      }

      // Update the service request with the technician ID and change status to in_progress
      const updatedServiceRequest = await storage.updateServiceRequest(serviceRequestId, {
        technicianId,
        status: 'in_progress',
        updatedAt: new Date()
      });

      res.status(200).json(transformServiceRequestToJob(updatedServiceRequest!));
    } catch (error) {
      console.error("Error assigning job:", error);
      res.status(500).json({ error: "Failed to assign job" });
    }
  });

  // Update a job's status and details
  app.patch("/api/service-requests/:id/update", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (req.user.role !== 'technician') {
        return res.status(403).json({ error: "Access denied. Technician role required." });
      }

      const serviceRequestId = parseInt(req.params.id);
      const technicianId = req.user.id;
      const { status, notes, completionNotes, materialUsed } = req.body;

      // Verify the service request exists
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Make sure it's assigned to this technician
      if (serviceRequest.technicianId !== technicianId) {
        return res.status(403).json({ error: "You can only update jobs assigned to you" });
      }

      // Prepare the update data
      const updateData: Partial<ServiceRequest> = {
        updatedAt: new Date()
      };

      // Only add fields that are provided and not undefined
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (completionNotes !== undefined) updateData.completionNotes = completionNotes;
      if (materialUsed !== undefined) updateData.materialUsed = materialUsed;

      // If status is being set to completed, set completionDate to now
      if (status === 'completed') {
        updateData.completionDate = new Date();
      }

      // Update the service request
      const updatedServiceRequest = await storage.updateServiceRequest(
        serviceRequestId, 
        updateData
      );

      res.status(200).json(transformServiceRequestToJob(updatedServiceRequest!));
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ error: "Failed to update job" });
    }
  });
}

// Helper function to transform a ServiceRequest into a Job format for the frontend
function transformServiceRequestToJob(request: ServiceRequest) {
  return {
    id: request.id,
    title: request.issueType || request.serviceType,
    description: request.description || "",
    status: request.status,
    priority: request.priority || 0,
    createdAt: request.createdAt,
    scheduledDate: request.scheduledDate,
    clientName: request.name, // Use these fields as the client information
    clientAddress: request.address,
    clientPhone: request.phone,
    clientEmail: request.email,
    serviceType: request.serviceType,
    issueType: request.issueType,
    propertyType: request.propertyType,
    notes: request.notes,
    technicianId: request.technicianId,
    completionNotes: request.completionNotes,
    materialUsed: request.materialUsed
  };
}