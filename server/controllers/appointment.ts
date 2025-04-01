import { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { sendSMS } from "../utils/twilio";
import { z } from "zod";
import { add, format, parseISO, isValid, isAfter, isSameDay } from "date-fns";

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

  // Get all appointments (for administrators and owners)
  app.get("/api/appointments/all", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).send("Unauthorized");
      }
      
      const appointments = await storage.getAllAppointments();
      // Sort by scheduled date, newest first
      appointments.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });

  // Get appointments by technician ID (for technicians and admins)
  app.get("/api/appointments/technician/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "technician" && req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).send("Unauthorized");
      }
      
      const technicianId = parseInt(req.params.id);
      if (isNaN(technicianId)) {
        return res.status(400).send("Invalid technician ID");
      }
      
      // If a technician is requesting, make sure they're only accessing their own appointments
      if (req.user.role === "technician" && req.user.id !== technicianId) {
        return res.status(403).send("Unauthorized");
      }
      
      const allAppointments = await storage.getAllAppointments();
      const technicianAppointments = allAppointments.filter(a => a.technicianId === technicianId);
      
      // Sort by scheduled date, newest first
      technicianAppointments.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
      );
      
      res.json(technicianAppointments);
    } catch (error) {
      next(error);
    }
  });

  // Get appointments by date range
  app.get("/api/appointments/range", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        return res.status(400).send("Start date and end date are required");
      }
      
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);
      
      if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
        return res.status(400).send("Invalid date format");
      }
      
      // Get appointments based on user role
      let appointments;
      if (req.user.role === "admin" || req.user.role === "owner") {
        // Admins and owners can see all appointments
        appointments = await storage.getAllAppointments();
      } else if (req.user.role === "technician") {
        // Technicians can see all their assigned appointments
        const allAppointments = await storage.getAllAppointments();
        appointments = allAppointments.filter(a => a.technicianId === req.user.id);
      } else {
        // Regular clients can only see their own appointments
        appointments = await storage.getAppointmentsByUserId(req.user.id);
      }
      
      // Filter by date range
      const filteredAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate);
        return (
          appointmentDate >= parsedStartDate && 
          appointmentDate <= parsedEndDate
        );
      });
      
      // Sort by date, earliest first for calendar view
      filteredAppointments.sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
      
      res.json(filteredAppointments);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new appointment
  app.post("/api/appointments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const appointmentSchema = z.object({
        serviceRequestId: z.number(),
        scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        }),
        timeSlot: z.enum(["morning", "afternoon", "evening", "anytime"]),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        duration: z.number().positive().optional(),
        technicianId: z.number().optional(),
        notes: z.string().optional(),
        serviceType: z.string(),
        issueType: z.string()
      });
      
      const appointmentData = appointmentSchema.parse(req.body);
      
      // Get the service request to verify it exists and the user has permission
      const serviceRequest = await storage.getServiceRequest(appointmentData.serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).send("Service request not found");
      }
      
      // Check for permission - owner/admin can schedule for any service request, 
      // users can only schedule for their own service requests
      if (req.user.role !== "admin" && req.user.role !== "owner" && serviceRequest.userId !== req.user.id) {
        return res.status(403).send("Unauthorized to schedule for this service request");
      }
      
      // Verify the appointment date is in the future
      const scheduledDate = new Date(appointmentData.scheduledDate);
      if (isAfter(new Date(), scheduledDate)) {
        return res.status(400).send("Appointment date must be in the future");
      }
      
      // Check for conflicts if a technician is assigned
      if (appointmentData.technicianId) {
        const allAppointments = await storage.getAllAppointments();
        const technicianAppointments = allAppointments.filter(a => 
          a.technicianId === appointmentData.technicianId &&
          isSameDay(new Date(a.scheduledDate), scheduledDate) &&
          a.timeSlot === appointmentData.timeSlot
        );
        
        if (technicianAppointments.length > 0) {
          return res.status(409).json({ 
            error: "Conflict detected", 
            message: "The technician already has an appointment during this time slot",
            conflicts: technicianAppointments
          });
        }
        
        // Get technician details if assigned
        const technician = await storage.getUser(appointmentData.technicianId);
        if (!technician) {
          return res.status(404).send("Technician not found");
        }
        
        // Create appointment with technician details
        const appointment = await storage.createAppointment({
          serviceRequestId: appointmentData.serviceRequestId,
          userId: serviceRequest.userId || req.user.id,
          technicianId: appointmentData.technicianId,
          technicianName: technician.name,
          technicianPhone: technician.phone,
          scheduledDate,
          timeSlot: appointmentData.timeSlot,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          duration: appointmentData.duration,
          serviceType: appointmentData.serviceType,
          issueType: appointmentData.issueType,
          notes: appointmentData.notes,
          reminderScheduled: add(scheduledDate, { days: -1 }) // Schedule reminder for 1 day before
        });
        
        // Update the service request status to reflect the scheduled appointment
        await storage.updateServiceRequest(serviceRequest.id, {
          status: "in_progress",
          technicianId: appointmentData.technicianId,
          technicianName: technician.name,
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd')
        });
        
        // Send confirmation SMS to client
        const clientMessage = `Your appointment for ${appointmentData.serviceType} service has been scheduled for ${format(scheduledDate, 'MMMM dd, yyyy')} (${appointmentData.timeSlot}). Your technician will be ${technician.name}.`;
        await sendSMS(serviceRequest.phone, clientMessage);
        
        // Send notification to technician
        const technicianMessage = `You have been assigned a new ${appointmentData.serviceType} service appointment for ${format(scheduledDate, 'MMMM dd, yyyy')} (${appointmentData.timeSlot}) with ${serviceRequest.name}.`;
        await sendSMS(technician.phone, technicianMessage);
        
        res.status(201).json(appointment);
      } else {
        // Create appointment without technician
        const appointment = await storage.createAppointment({
          serviceRequestId: appointmentData.serviceRequestId,
          userId: serviceRequest.userId || req.user.id,
          scheduledDate,
          timeSlot: appointmentData.timeSlot,
          startTime: appointmentData.startTime,
          endTime: appointmentData.endTime,
          duration: appointmentData.duration,
          serviceType: appointmentData.serviceType,
          issueType: appointmentData.issueType,
          notes: appointmentData.notes,
          reminderScheduled: add(scheduledDate, { days: -1 }) // Schedule reminder for 1 day before
        });
        
        // Update the service request
        await storage.updateServiceRequest(serviceRequest.id, {
          status: "in_progress",
          scheduledDate: format(scheduledDate, 'yyyy-MM-dd')
        });
        
        // Send confirmation to client
        const message = `Your appointment for ${appointmentData.serviceType} service has been scheduled for ${format(scheduledDate, 'MMMM dd, yyyy')} (${appointmentData.timeSlot}). A technician will be assigned soon.`;
        await sendSMS(serviceRequest.phone, message);
        
        res.status(201).json(appointment);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
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
      const message = `Customer ${req.user.name} is trying to reach you regarding appointment #${appointment.id} scheduled for ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')}. Please contact them at ${req.user.phone}.`;
      await sendSMS(appointment.technicianPhone, message);
      
      // Update appointment notes
      await storage.updateAppointment(appointmentId, {
        notes: appointment.notes 
          ? `${appointment.notes}\nCustomer requested contact on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`
          : `Customer requested contact on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`
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
      
      // Check for permission based on role
      const isAuthorized = (
        req.user.role === "admin" || 
        req.user.role === "owner" || 
        (req.user.role === "technician" && appointment.technicianId === req.user.id) ||
        appointment.userId === req.user.id
      );
      
      if (!isAuthorized) {
        return res.status(403).send("Unauthorized");
      }
      
      const rescheduleSchema = z.object({
        scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid date format"
        }),
        timeSlot: z.enum(["morning", "afternoon", "evening", "anytime"]),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        duration: z.number().positive().optional(),
        technicianId: z.number().optional(),
        reason: z.string().optional()
      });
      
      const rescheduleData = rescheduleSchema.parse(req.body);
      const newScheduledDate = new Date(rescheduleData.scheduledDate);
      
      // Verify the new appointment date is in the future
      if (isAfter(new Date(), newScheduledDate)) {
        return res.status(400).send("Appointment date must be in the future");
      }
      
      // Check for conflicts if same technician or new technician is assigned
      const technicianId = rescheduleData.technicianId || appointment.technicianId;
      
      if (technicianId) {
        const allAppointments = await storage.getAllAppointments();
        const conflictAppointments = allAppointments.filter(a => 
          a.id !== appointmentId && // Don't count the current appointment
          a.technicianId === technicianId &&
          isSameDay(new Date(a.scheduledDate), newScheduledDate) &&
          a.timeSlot === rescheduleData.timeSlot
        );
        
        if (conflictAppointments.length > 0) {
          return res.status(409).json({ 
            error: "Conflict detected", 
            message: "The technician already has an appointment during this time slot",
            conflicts: conflictAppointments
          });
        }
      }
      
      // Create a fresh technician object if technician changed
      let technicianName = appointment.technicianName;
      let technicianPhone = appointment.technicianPhone;
      
      if (rescheduleData.technicianId && rescheduleData.technicianId !== appointment.technicianId) {
        const technician = await storage.getUser(rescheduleData.technicianId);
        if (!technician) {
          return res.status(404).send("Technician not found");
        }
        technicianName = technician.name;
        technicianPhone = technician.phone;
      }
      
      // Store the current appointment as reference for the rescheduled one
      const previousAppointmentData = { ...appointment };
      
      // Create the rescheduling note
      const rescheduleNote = `Rescheduled on ${format(new Date(), 'MMMM dd, yyyy HH:mm')} from ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')} (${appointment.timeSlot}) to ${format(newScheduledDate, 'MMMM dd, yyyy')} (${rescheduleData.timeSlot})${rescheduleData.reason ? `. Reason: ${rescheduleData.reason}` : ''}.`;
      
      // Update the status to rescheduled and set previous appointment ID
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        scheduledDate: newScheduledDate,
        timeSlot: rescheduleData.timeSlot,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
        duration: rescheduleData.duration,
        technicianId: rescheduleData.technicianId || appointment.technicianId,
        technicianName,
        technicianPhone,
        status: "rescheduled",
        notes: appointment.notes 
          ? `${appointment.notes}\n${rescheduleNote}`
          : rescheduleNote,
        reminderSent: false,
        reminderScheduled: add(newScheduledDate, { days: -1 }) // Reschedule reminder for 1 day before
      });
      
      // Update the service request with the new scheduled date
      if (appointment.serviceRequestId) {
        await storage.updateServiceRequest(appointment.serviceRequestId, {
          scheduledDate: format(newScheduledDate, 'yyyy-MM-dd'),
          technicianId: rescheduleData.technicianId || appointment.technicianId,
          technicianName
        });
      }
      
      // Notify client about the rescheduling
      const serviceRequest = await storage.getServiceRequest(appointment.serviceRequestId);
      if (serviceRequest) {
        const clientMessage = `Your appointment for ${appointment.serviceType} has been rescheduled to ${format(newScheduledDate, 'MMMM dd, yyyy')} (${rescheduleData.timeSlot})${technicianName ? ` with technician ${technicianName}` : ''}.`;
        await sendSMS(serviceRequest.phone, clientMessage);
      }
      
      // Notify technician about the rescheduling
      if (technicianPhone) {
        const techMessage = `Appointment #${appointment.id} for ${appointment.serviceType} has been rescheduled to ${format(newScheduledDate, 'MMMM dd, yyyy')} (${rescheduleData.timeSlot}).${serviceRequest ? ` Client: ${serviceRequest.name}` : ''}`;
        await sendSMS(technicianPhone, techMessage);
      }
      
      // If technician changed, notify the previous technician that they're no longer assigned
      if (rescheduleData.technicianId && 
          rescheduleData.technicianId !== appointment.technicianId && 
          appointment.technicianPhone) {
        const prevTechMessage = `Appointment #${appointment.id} for ${appointment.serviceType} that was scheduled for ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')} has been reassigned to another technician.`;
        await sendSMS(appointment.technicianPhone, prevTechMessage);
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Cancel an appointment
  app.post("/api/appointments/:id/cancel", async (req, res, next) => {
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
      
      // Check for permission based on role
      const isAuthorized = (
        req.user.role === "admin" || 
        req.user.role === "owner" || 
        (req.user.role === "technician" && appointment.technicianId === req.user.id) ||
        appointment.userId === req.user.id
      );
      
      if (!isAuthorized) {
        return res.status(403).send("Unauthorized");
      }
      
      const cancelSchema = z.object({
        reason: z.string().optional()
      });
      
      const { reason } = cancelSchema.parse(req.body);
      
      // Create the cancellation note
      const cancelNote = `Cancelled on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}${reason ? ` Reason: ${reason}` : ''}.`;
      
      // Update the appointment to cancelled
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        status: "cancelled",
        notes: appointment.notes 
          ? `${appointment.notes}\n${cancelNote}`
          : cancelNote,
        reminderSent: true // Don't send reminder for cancelled appointments
      });
      
      // Notify client about the cancellation
      const serviceRequest = await storage.getServiceRequest(appointment.serviceRequestId);
      if (serviceRequest) {
        const clientMessage = `Your appointment for ${appointment.serviceType} scheduled for ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')} (${appointment.timeSlot}) has been cancelled. Please contact our office to reschedule.`;
        await sendSMS(serviceRequest.phone, clientMessage);
      }
      
      // Notify technician about the cancellation if appointed
      if (appointment.technicianPhone) {
        const techMessage = `Appointment #${appointment.id} for ${appointment.serviceType} scheduled for ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')} (${appointment.timeSlot}) has been cancelled.`;
        await sendSMS(appointment.technicianPhone, techMessage);
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

  // Process reminders (this would typically be called by a scheduled job)
  app.post("/api/appointments/process-reminders", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "owner")) {
        return res.status(403).send("Unauthorized");
      }
      
      const now = new Date();
      const allAppointments = await storage.getAllAppointments();
      
      // Filter appointments that need reminders
      const appointmentsNeedingReminders = allAppointments.filter(appointment => 
        // Only send reminders for scheduled appointments (not completed, cancelled, etc)
        appointment.status === "scheduled" && 
        // That haven't already been sent
        !appointment.reminderSent && 
        // Where the scheduled reminder time is in the past
        appointment.reminderScheduled && new Date(appointment.reminderScheduled) <= now
      );
      
      const results = [];
      
      // Process each appointment that needs a reminder
      for (const appointment of appointmentsNeedingReminders) {
        try {
          // Get client information
          const serviceRequest = await storage.getServiceRequest(appointment.serviceRequestId);
          
          if (serviceRequest) {
            // Send reminder to client
            const message = `Reminder: You have an appointment scheduled for ${format(new Date(appointment.scheduledDate), 'MMMM dd, yyyy')} (${appointment.timeSlot}) for ${appointment.serviceType} service. ${appointment.technicianName ? `Your technician will be ${appointment.technicianName}.` : ''}`;
            await sendSMS(serviceRequest.phone, message);
            
            // Mark reminder as sent
            await storage.updateAppointment(appointment.id, {
              reminderSent: true,
              notes: appointment.notes 
                ? `${appointment.notes}\nReminder sent on ${format(now, 'MMMM dd, yyyy HH:mm')}`
                : `Reminder sent on ${format(now, 'MMMM dd, yyyy HH:mm')}`
            });
            
            results.push({
              id: appointment.id,
              status: "success",
              message: `Reminder sent for appointment ID ${appointment.id}`
            });
          } else {
            results.push({
              id: appointment.id,
              status: "error",
              message: `Could not find service request for appointment ID ${appointment.id}`
            });
          }
        } catch (error) {
          results.push({
            id: appointment.id,
            status: "error",
            message: `Error sending reminder for appointment ID ${appointment.id}: ${error.message}`,
            error: error
          });
        }
      }
      
      res.json({
        processed: appointmentsNeedingReminders.length,
        results
      });
    } catch (error) {
      next(error);
    }
  });
}
