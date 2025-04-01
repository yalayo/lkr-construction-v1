import { users, User, InsertUser, serviceRequests, ServiceRequest, InsertServiceRequest, leads, Lead, InsertLead, appointments, Appointment, InsertAppointment, transactions, Transaction, InsertTransaction } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, and, sql, asc, gt, lt, gte, lte } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Service Request operations
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequest(id: number): Promise<ServiceRequest | undefined>;
  getServiceRequestsByUserId(userId: number): Promise<ServiceRequest[]>;
  getAllServiceRequests(): Promise<ServiceRequest[]>;
  updateServiceRequest(id: number, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  
  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: number): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  updateLead(id: number, data: Partial<Lead>): Promise<Lead | undefined>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]>;
  
  // Session store
  sessionStore: ReturnType<typeof createMemoryStore> | ReturnType<typeof connectPg>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: ReturnType<typeof createMemoryStore> | ReturnType<typeof connectPg>;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Seed users needs to be handled carefully with database
    // This will be called after database push in index.ts
  }

  async seedUsers() {
    // First check if admin user already exists to avoid duplicates
    const existingAdmin = await this.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists, skipping seed");
      return;
    }
    
    const adminUser: InsertUser = {
      username: "admin",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Admin User",
      email: "admin@elecplumb.com",
      phone: "(337) 123-4567",
      role: "admin"
    };
    
    const ownerUser: InsertUser = {
      username: "owner",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Owner User",
      email: "owner@elecplumb.com",
      phone: "(337) 123-4568",
      role: "owner"
    };
    
    const techUser: InsertUser = {
      username: "technician",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Tech User",
      email: "tech@elecplumb.com",
      phone: "(337) 123-4569",
      role: "technician"
    };

    await this.createUser(adminUser);
    await this.createUser(ownerUser);
    await this.createUser(techUser);
    
    console.log("Seed users created successfully");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Service Request methods
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db
      .insert(serviceRequests)
      .values({ ...request, status: "new" })
      .returning();
    
    return serviceRequest;
  }
  
  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    const [request] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id));
    
    return request;
  }
  
  async getServiceRequestsByUserId(userId: number): Promise<ServiceRequest[]> {
    return await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.userId, userId));
  }
  
  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests);
  }
  
  async updateServiceRequest(id: number, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const [updatedRequest] = await db
      .update(serviceRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    
    return updatedRequest;
  }

  // Lead methods
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    
    return lead;
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id));
    
    return lead;
  }
  
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }
  
  async updateLead(id: number, data: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set(data)
      .where(eq(leads.id, id))
      .returning();
    
    return updatedLead;
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    
    return appointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return appointment;
  }
  
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId));
  }
  
  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    
    return updatedAppointment;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    
    return transaction;
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }
  
  async getTransactionsByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          sql`${transactions.date} >= ${startDateStr}`,
          sql`${transactions.date} <= ${endDateStr}`
        )
      );
  }
}

// Memory storage for fallback if needed
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private serviceRequests: Map<number, ServiceRequest>;
  private leads: Map<number, Lead>;
  private appointments: Map<number, Appointment>;
  private transactions: Map<number, Transaction>;
  currentId: {
    users: number;
    serviceRequests: number;
    leads: number;
    appointments: number;
    transactions: number;
  };
  sessionStore: ReturnType<typeof createMemoryStore> | ReturnType<typeof connectPg>;

  constructor() {
    this.users = new Map();
    this.serviceRequests = new Map();
    this.leads = new Map();
    this.appointments = new Map();
    this.transactions = new Map();
    
    this.currentId = {
      users: 1,
      serviceRequests: 1,
      leads: 1,
      appointments: 1,
      transactions: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in milliseconds
    });
    
    // Create default admin, owner, and technician accounts for testing
    this.seedUsers();
  }

  private seedUsers() {
    const adminUser: InsertUser = {
      username: "admin",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Admin User",
      email: "admin@elecplumb.com",
      phone: "(337) 123-4567",
      role: "admin"
    };
    
    const ownerUser: InsertUser = {
      username: "owner",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Owner User",
      email: "owner@elecplumb.com",
      phone: "(337) 123-4568",
      role: "owner"
    };
    
    const techUser: InsertUser = {
      username: "technician",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // "password"
      name: "Tech User",
      email: "tech@elecplumb.com",
      phone: "(337) 123-4569",
      role: "technician"
    };

    this.createUser(adminUser);
    this.createUser(ownerUser);
    this.createUser(techUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const user: User = { ...insertUser, id, createdAt, updatedAt };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Service Request methods
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const id = this.currentId.serviceRequests++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const status = "new";
    
    const serviceRequest: ServiceRequest = { 
      ...request, 
      id, 
      status,
      createdAt, 
      updatedAt 
    };
    
    this.serviceRequests.set(id, serviceRequest);
    return serviceRequest;
  }
  
  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.get(id);
  }
  
  async getServiceRequestsByUserId(userId: number): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values())
      .filter(request => request.userId === userId);
  }
  
  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    return Array.from(this.serviceRequests.values());
  }
  
  async updateServiceRequest(id: number, data: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const request = await this.getServiceRequest(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...data, updatedAt: new Date() };
    this.serviceRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Lead methods
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentId.leads++;
    const createdAt = new Date();
    
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt
    };
    
    this.leads.set(id, lead);
    return lead;
  }
  
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }
  
  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }
  
  async updateLead(id: number, data: Partial<Lead>): Promise<Lead | undefined> {
    const lead = await this.getLead(id);
    if (!lead) return undefined;
    
    const updatedLead = { ...lead, ...data };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId.appointments++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.userId === userId);
  }
  
  async updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...data, updatedAt: new Date() };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId.transactions++;
    const createdAt = new Date();
    
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt 
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
  
  async getTransactionsByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => {
        const transDate = new Date(transaction.date);
        return transDate >= startDate && transDate <= endDate;
      });
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
