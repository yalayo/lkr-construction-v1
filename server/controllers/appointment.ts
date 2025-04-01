import { Express } from "express";
import { storage } from "../storage";
import { sendSMS } from "../utils/twilio";
import { z } from "zod";

export function setupAppointmentRoutes(app: Express) {
  // Get appointments for current user
  app.get("/api/appointments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const appointments = await storage.getAppointmentsByUserId(req.user.id);
      // Sort by scheduled date, newest first
      appointments.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });
  
  // Contact technician (sends SMS notification)
  app.post("/api/appointments/:id/contact-technician", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).send("Invalid appointment ID");
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).send("Appointment not found");
      }
      
      // Check if user owns this appointment
      if (appointment.userId !== req.user.id) {
        return res.status(403).send("Unauthorized");
      }
      
      if (!appointment.technicianPhone) {
        return res.status(400).send("Technician contact information not available");
      }
      
      // In a real app, this would send an SMS to the technician
      // For this example, we'll just simulate it
      const message = `Customer ${req.user.name} is trying to reach you regarding appointment #${appointment.id} scheduled for ${new Date(appointment.scheduledDate).toLocaleDateString()}. Please contact them at ${req.user.phone}.`;
      await sendSMS(appointment.technicianPhone, message);
      
      // Update appointment notes
      await storage.updateAppointment(appointmentId, {
        notes: appointment.notes 
          ? `${appointment.notes}\nCustomer requested contact on ${new Date().toLocaleString()}`
          : `Customer requested contact on ${new Date().toLocaleString()}`
      });
      
      res.json({ success: true, message: "Technician has been notified" });
    } catch (error) {
      next(error);
    }
  });
  
  // Reschedule an appointment
  app.post("/api/appointments/:id/reschedule", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).send("Invalid appointment ID");
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).send("Appointment not found");
      }
      
      // Check if user owns this appointment
      if (appointment.userId !== req.user.id) {
        return res.status(403).send("Unauthorized");
      }
      
      const rescheduleSchema = z.object({
        scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        }),
        timeSlot: z.enum(["morning", "afternoon", "evening", "anytime"])
      });
      
      const { scheduledDate, timeSlot } = rescheduleSchema.parse(req.body);
      
      // Update the appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        scheduledDate: new Date(scheduledDate),
        timeSlot,
        notes: appointment.notes 
          ? `${appointment.notes}\nRescheduled on ${new Date().toLocaleString()} to ${new Date(scheduledDate).toLocaleDateString()} (${timeSlot})`
          : `Rescheduled on ${new Date().toLocaleString()} to ${new Date(scheduledDate).toLocaleDateString()} (${timeSlot})`
      });
      
      // Notify technician about the rescheduling
      if (appointment.technicianPhone) {
        const message = `Appointment #${appointment.id} with ${req.user.name} has been rescheduled to ${new Date(scheduledDate).toLocaleDateString()} (${timeSlot}).`;
        await sendSMS(appointment.technicianPhone, message);
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Complete an appointment (for technicians or admins)
  app.post("/api/appointments/:id/complete", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "technician" && req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).send("Unauthorized");
      }
      
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).send("Invalid appointment ID");
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).send("Appointment not found");
      }
      
      // If user is a technician, check if they are assigned to this appointment
      if (req.user.role === "technician" && appointment.technicianId !== req.user.id) {
        return res.status(403).send("Unauthorized");
      }
      
      const completeSchema = z.object({
        notes: z.string().optional(),
        cost: z.number().positive().optional()
      });
      
      const { notes, cost } = completeSchema.parse(req.body);
      
      // Update the appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        status: "completed",
        notes: notes 
          ? (appointment.notes ? `${appointment.notes}\n${notes}` : notes)
          : appointment.notes
      });
      
      // Update the service request
      const serviceRequest = await storage.getServiceRequest(appointment.serviceRequestId);
      if (serviceRequest) {
        await storage.updateServiceRequest(serviceRequest.id, {
          status: "completed",
          cost,
          completedDate: new Date(),
          notes: notes 
            ? (serviceRequest.notes ? `${serviceRequest.notes}\n${notes}` : notes)
            : serviceRequest.notes
        });
        
        // Create a transaction record for accounting
        if (cost) {
          await storage.createTransaction({
            type: "income",
            serviceRequestId: serviceRequest.id,
            description: `Service payment for ${serviceRequest.serviceType} - ${serviceRequest.issueType}`,
            amount: cost,
            date: new Date(),
            category: `${serviceRequest.serviceType}-service`,
            notes: `Completed by ${appointment.technicianName}`
          });
        }
        
        // Notify customer about completion
        const message = `Your service request for ${serviceRequest.serviceType} has been completed. Thank you for choosing our services!`;
        await sendSMS(serviceRequest.phone, message);
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
}
