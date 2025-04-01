import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import {
  users,
  serviceRequests,
  leads,
  appointments,
  transactions,
  inventoryItems,
  inventoryTransactions,
  serviceRequestItems,
  type User,
  type InsertUser,
  type ServiceRequest,
  type InsertServiceRequest,
  type Lead,
  type InsertLead,
  type Appointment,
  type InsertAppointment,
  type Transaction,
  type InsertTransaction,
  type InventoryItem,
  type InsertInventoryItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type ServiceRequestItem,
  type InsertServiceRequestItem,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// Type for database results with flexible structure
interface DbServiceRequestResult {
  id: number;
  userId: number | null;
  serviceType: string;
  issueType: string;
  urgency: string;
  propertyType: string;
  description: string | null;
  previousIssue: boolean;
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  technicianId: number | null;
  technicianName: string | null;
  cost: number | null;
  notes: string | null;
  completedDate: string | null; 
  quotedAmount: number | null;
  quoteDate: string | null;
  quoteExpiryDate: string | null;
  quoteNotes: string | null;
  quoteToken: string | null;
  quoteAcceptedDate: string | null;
  priority?: number;
  quoteAccepted?: boolean;
  scheduledDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow any additional properties
}

// Implementation for the `getAllServiceRequests` function that uses explicit column selection 
// and handles missing columns with fallback values
export async function getSafeAllServiceRequests(db: any): Promise<ServiceRequest[]> {
  // Explicitly select columns to prevent errors with mismatched database schemas
  const dbResults = await db.select({
    id: serviceRequests.id,
    userId: serviceRequests.userId,
    serviceType: serviceRequests.serviceType,
    issueType: serviceRequests.issueType,
    urgency: serviceRequests.urgency,
    propertyType: serviceRequests.propertyType,
    description: serviceRequests.description,
    previousIssue: serviceRequests.previousIssue,
    name: serviceRequests.name,
    phone: serviceRequests.phone,
    email: serviceRequests.email,
    address: serviceRequests.address,
    preferredDate: serviceRequests.preferredDate,
    preferredTime: serviceRequests.preferredTime,
    status: serviceRequests.status,
    technicianId: serviceRequests.technicianId,
    technicianName: serviceRequests.technicianName,
    cost: serviceRequests.cost,
    notes: serviceRequests.notes,
    completedDate: serviceRequests.completedDate,
    quotedAmount: serviceRequests.quotedAmount,
    quoteDate: serviceRequests.quoteDate,
    quoteExpiryDate: serviceRequests.quoteExpiryDate,
    quoteNotes: serviceRequests.quoteNotes,
    quoteToken: serviceRequests.quoteToken,
    quoteAcceptedDate: serviceRequests.quoteAcceptedDate,
    priority: serviceRequests.priority,
    quoteAccepted: serviceRequests.quoteAccepted,
    scheduledDate: serviceRequests.scheduledDate,
    createdAt: serviceRequests.createdAt,
    updatedAt: serviceRequests.updatedAt,
  }).from(serviceRequests);

  // For each result, add missing fields with fallback values
  return dbResults.map((request: DbServiceRequestResult) => ({
    ...request,
    // Add missing fields with fallback values
    completionNotes: null,
    materialUsed: null,
    completionDate: request.completedDate || null, // Use completedDate for completionDate
    priority: request.priority || 0,
    quoteAccepted: request.quoteAccepted || false,
    scheduledDate: request.scheduledDate || null,
  } as ServiceRequest));
}

// Implementation for the `getServiceRequestsByUserId` function that uses explicit column selection 
// and handles missing columns with fallback values
export async function getSafeServiceRequestsByUserId(db: any, userId: number): Promise<ServiceRequest[]> {
  // Explicitly select columns to prevent errors with mismatched database schemas
  const dbResults = await db.select({
    id: serviceRequests.id,
    userId: serviceRequests.userId,
    serviceType: serviceRequests.serviceType,
    issueType: serviceRequests.issueType,
    urgency: serviceRequests.urgency,
    propertyType: serviceRequests.propertyType,
    description: serviceRequests.description,
    previousIssue: serviceRequests.previousIssue,
    name: serviceRequests.name,
    phone: serviceRequests.phone,
    email: serviceRequests.email,
    address: serviceRequests.address,
    preferredDate: serviceRequests.preferredDate,
    preferredTime: serviceRequests.preferredTime,
    status: serviceRequests.status,
    technicianId: serviceRequests.technicianId,
    technicianName: serviceRequests.technicianName,
    cost: serviceRequests.cost,
    notes: serviceRequests.notes,
    completedDate: serviceRequests.completedDate,
    quotedAmount: serviceRequests.quotedAmount,
    quoteDate: serviceRequests.quoteDate,
    quoteExpiryDate: serviceRequests.quoteExpiryDate,
    quoteNotes: serviceRequests.quoteNotes,
    quoteToken: serviceRequests.quoteToken,
    quoteAcceptedDate: serviceRequests.quoteAcceptedDate,
    priority: serviceRequests.priority,
    quoteAccepted: serviceRequests.quoteAccepted,
    scheduledDate: serviceRequests.scheduledDate,
    createdAt: serviceRequests.createdAt,
    updatedAt: serviceRequests.updatedAt,
  })
  .from(serviceRequests)
  .where(eq(serviceRequests.userId, userId));

  // For each result, add missing fields with fallback values
  return dbResults.map((request: DbServiceRequestResult) => ({
    ...request,
    // Add missing fields with fallback values
    completionNotes: null,
    materialUsed: null,
    completionDate: request.completedDate || null, // Use completedDate for completionDate
    priority: request.priority || 0,
    quoteAccepted: request.quoteAccepted || false,
    scheduledDate: request.scheduledDate || null,
  } as ServiceRequest));
}

// Implementation for the `getServiceRequest` function that uses explicit column selection 
// and handles missing columns with fallback values
export async function getSafeServiceRequest(db: any, id: number): Promise<ServiceRequest | undefined> {
  // Explicitly select columns to prevent errors with mismatched database schemas
  const [request] = await db.select({
    id: serviceRequests.id,
    userId: serviceRequests.userId,
    serviceType: serviceRequests.serviceType,
    issueType: serviceRequests.issueType,
    urgency: serviceRequests.urgency,
    propertyType: serviceRequests.propertyType,
    description: serviceRequests.description,
    previousIssue: serviceRequests.previousIssue,
    name: serviceRequests.name,
    phone: serviceRequests.phone,
    email: serviceRequests.email,
    address: serviceRequests.address,
    preferredDate: serviceRequests.preferredDate,
    preferredTime: serviceRequests.preferredTime,
    status: serviceRequests.status,
    technicianId: serviceRequests.technicianId,
    technicianName: serviceRequests.technicianName,
    cost: serviceRequests.cost,
    notes: serviceRequests.notes,
    completedDate: serviceRequests.completedDate,
    quotedAmount: serviceRequests.quotedAmount,
    quoteDate: serviceRequests.quoteDate,
    quoteExpiryDate: serviceRequests.quoteExpiryDate,
    quoteNotes: serviceRequests.quoteNotes,
    quoteToken: serviceRequests.quoteToken,
    quoteAcceptedDate: serviceRequests.quoteAcceptedDate,
    priority: serviceRequests.priority,
    quoteAccepted: serviceRequests.quoteAccepted,
    scheduledDate: serviceRequests.scheduledDate,
    createdAt: serviceRequests.createdAt,
    updatedAt: serviceRequests.updatedAt,
  })
  .from(serviceRequests)
  .where(eq(serviceRequests.id, id));
  
  if (!request) return undefined;
  
  // Add missing fields with fallback values
  return {
    ...request,
    completionNotes: null,
    materialUsed: null,
    completionDate: request.completedDate || null, // Use completedDate for completionDate
    priority: request.priority || 0,
    quoteAccepted: request.quoteAccepted || false,
    scheduledDate: request.scheduledDate || null,
  } as ServiceRequest;
}