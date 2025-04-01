import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("client"), // client, owner, admin, technician
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Service requests
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceType: text("service_type").notNull(), // electrical, plumbing, both
  issueType: text("issue_type").notNull(),
  urgency: text("urgency").notNull(), // emergency, urgent, standard, flexible
  propertyType: text("property_type").notNull(),
  description: text("description"),
  previousIssue: boolean("previous_issue").default(false),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"), // morning, afternoon, evening, anytime
  status: text("status").notNull().default("new"), // new, quoted, accepted, in_progress, completed, cancelled
  technicianId: integer("technician_id").references(() => users.id),
  technicianName: text("technician_name"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  notes: text("notes"),
  completedDate: timestamp("completed_date"),
  quotedAmount: decimal("quoted_amount", { precision: 10, scale: 2 }),
  quoteDate: timestamp("quote_date"),
  quoteExpiryDate: timestamp("quote_expiry_date"),
  quoteNotes: text("quote_notes"),
  quoteToken: text("quote_token"),  
  quoteAcceptedDate: timestamp("quote_accepted_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  serviceType: text("service_type").notNull(),
  issueType: text("issue_type").notNull(),
  urgency: text("urgency").notNull(),
  propertyType: text("property_type").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("new"), // new, pending, assigned
  createdAt: timestamp("created_at").defaultNow().notNull(),
  priority: integer("priority").default(0), // higher number = higher priority
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  technicianId: integer("technician_id").references(() => users.id),
  technicianName: text("technician_name"),
  technicianPhone: text("technician_phone"),
  scheduledDate: date("scheduled_date").notNull(),
  timeSlot: text("time_slot").notNull(), // morning, afternoon, evening
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  serviceType: text("service_type").notNull(),
  issueType: text("issue_type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Financial transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // income, expense
  serviceRequestId: integer("service_request_id").references(() => serviceRequests.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  category: text("category").notNull(), // electrical-service, plumbing-service, combined-service, materials, tools, advertising, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// // Session table for connect-pg-simple
// We don't manage this table with Drizzle, it's managed by connect-pg-simple
// This is here just for reference
/*
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
*/

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  userId: true,
  technicianId: true, 
  technicianName: true,
  status: true,
  cost: true,
  notes: true,
  completedDate: true,
  quotedAmount: true,
  quoteDate: true,
  quoteExpiryDate: true,
  quoteNotes: true,
  quoteToken: true,
  quoteAcceptedDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  priority: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Quote submission schema
export const quoteSubmissionSchema = z.object({
  serviceRequestId: z.number(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  expiryDays: z.number().int().positive().default(7)
});

export type QuoteSubmission = z.infer<typeof quoteSubmissionSchema>;
