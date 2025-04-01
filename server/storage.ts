import { 
  users, User, InsertUser, 
  serviceRequests, ServiceRequest, InsertServiceRequest, 
  leads, Lead, InsertLead, 
  appointments, Appointment, InsertAppointment, 
  transactions, Transaction, InsertTransaction,
  inventoryItems, InventoryItem, InsertInventoryItem,
  inventoryTransactions, InventoryTransaction, InsertInventoryTransaction,
  serviceRequestItems, ServiceRequestItem, InsertServiceRequestItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, and, sql, asc, gt, lt, gte, lte } from "drizzle-orm";
import { db } from "./db";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { getSafeAllServiceRequests, getSafeServiceRequestsByUserId, getSafeServiceRequest } from "./storage-fix";

// Create session stores
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
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointment(id: number, data: Partial<Appointment>): Promise<Appointment | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]>;
  
  // Inventory operations
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getLowStockItems(): Promise<InventoryItem[]>;
  updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  
  // Inventory Transaction operations
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getInventoryTransactionsByItemId(itemId: number): Promise<InventoryTransaction[]>;
  getInventoryTransactionsByServiceRequest(serviceRequestId: number): Promise<InventoryTransaction[]>;
  
  // Service Request Items operations
  addItemToServiceRequest(item: InsertServiceRequestItem): Promise<ServiceRequestItem>;
  getServiceRequestItems(serviceRequestId: number): Promise<ServiceRequestItem[]>;
  removeItemFromServiceRequest(id: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Switch back to in-memory session store to avoid schema conflicts
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours in milliseconds
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
    try {
      // Insert directly without creating an intermediate object
      const [serviceRequest] = await db
        .insert(serviceRequests)
        .values({
          name: request.name,
          email: request.email,
          phone: request.phone,
          serviceType: request.serviceType,
          issueType: request.issueType,
          urgency: request.urgency,
          propertyType: request.propertyType,
          address: request.address,
          status: "new",
          description: request.description || null,
          previousIssue: request.previousIssue === undefined ? false : request.previousIssue,
          preferredDate: request.preferredDate || null,
          preferredTime: request.preferredTime || null,
          userId: null // This field needs to be provided separately after user creation
        })
        .returning();
      
      return serviceRequest;
    } catch (error) {
      console.error("Error creating service request:", error);
      throw error;
    }
  }
  
  async getServiceRequest(id: number): Promise<ServiceRequest | undefined> {
    // Use the safe implementation to avoid errors with missing columns
    return getSafeServiceRequest(db, id);
  }
  
  async getServiceRequestsByUserId(userId: number): Promise<ServiceRequest[]> {
    // Use the safe implementation to avoid errors with missing columns
    return getSafeServiceRequestsByUserId(db, userId);
  }
  
  async getAllServiceRequests(): Promise<ServiceRequest[]> {
    // Use the safe implementation to avoid errors with missing columns
    return getSafeAllServiceRequests(db);
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
  
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
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

  // Inventory methods
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [inventoryItem] = await db
      .insert(inventoryItems)
      .values(item)
      .returning();
    
    return inventoryItem;
  }
  
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    
    return item;
  }
  
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }
  
  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(
        sql`${inventoryItems.quantity} <= ${inventoryItems.minQuantity}`
      );
  }
  
  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  // Inventory Transaction methods
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    // Create the transaction
    const [inventoryTransaction] = await db
      .insert(inventoryTransactions)
      .values(transaction)
      .returning();
    
    // Update the inventory item quantity
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, transaction.itemId));
    
    if (item) {
      const newQuantity = item.quantity + transaction.quantity;
      await db
        .update(inventoryItems)
        .set({ 
          quantity: newQuantity,
          lastRestocked: transaction.quantity > 0 ? new Date() : item.lastRestocked,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, transaction.itemId));
    }
    
    return inventoryTransaction;
  }
  
  async getInventoryTransactionsByItemId(itemId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.itemId, itemId));
  }
  
  async getInventoryTransactionsByServiceRequest(serviceRequestId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.serviceRequestId, serviceRequestId));
  }
  
  // Service Request Items methods
  async addItemToServiceRequest(item: InsertServiceRequestItem): Promise<ServiceRequestItem> {
    // Create the service request item record
    const [serviceRequestItem] = await db
      .insert(serviceRequestItems)
      .values({
        serviceRequestId: item.serviceRequestId,
        itemId: item.itemId,
        quantity: item.quantity,
        unitCost: item.unitCost
      })
      .returning();
    
    // Create the corresponding inventory transaction (removing from inventory)
    await this.createInventoryTransaction({
      itemId: item.itemId,
      quantity: -item.quantity, // Negative quantity means removal
      transactionType: 'use',
      serviceRequestId: item.serviceRequestId,
      userId: 1, // Default to admin - this should be changed to the actual user
      notes: `Used in service request #${item.serviceRequestId}`
    });
    
    return serviceRequestItem;
  }
  
  async getServiceRequestItems(serviceRequestId: number): Promise<ServiceRequestItem[]> {
    return await db
      .select()
      .from(serviceRequestItems)
      .where(eq(serviceRequestItems.serviceRequestId, serviceRequestId));
  }
  
  async removeItemFromServiceRequest(id: number): Promise<void> {
    // Get the item first to know how much to add back to inventory
    const [item] = await db
      .select()
      .from(serviceRequestItems)
      .where(eq(serviceRequestItems.id, id));
    
    if (item) {
      // Create a transaction to add the items back to inventory
      await this.createInventoryTransaction({
        itemId: item.itemId,
        quantity: item.quantity, // Positive quantity means addition
        transactionType: 'return',
        serviceRequestId: item.serviceRequestId,
        userId: 1, // Default to admin - this should be changed to the actual user
        notes: `Returned from service request #${item.serviceRequestId}`
      });
      
      // Remove the service request item
      await db
        .delete(serviceRequestItems)
        .where(eq(serviceRequestItems.id, id));
    }
  }
}

// Memory storage for fallback if needed
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private serviceRequests: Map<number, ServiceRequest>;
  private leads: Map<number, Lead>;
  private appointments: Map<number, Appointment>;
  private transactions: Map<number, Transaction>;
  private inventoryItems: Map<number, InventoryItem>;
  private inventoryTransactions: Map<number, InventoryTransaction>;
  private serviceRequestItems: Map<number, ServiceRequestItem>;
  currentId: {
    users: number;
    serviceRequests: number;
    leads: number;
    appointments: number;
    transactions: number;
    inventoryItems: number;
    inventoryTransactions: number;
    serviceRequestItems: number;
  };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.serviceRequests = new Map();
    this.leads = new Map();
    this.appointments = new Map();
    this.transactions = new Map();
    this.inventoryItems = new Map();
    this.inventoryTransactions = new Map();
    this.serviceRequestItems = new Map();
    
    this.currentId = {
      users: 1,
      serviceRequests: 1,
      leads: 1,
      appointments: 1,
      transactions: 1,
      inventoryItems: 1,
      inventoryTransactions: 1,
      serviceRequestItems: 1
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
    // Ensure role is always defined
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      updatedAt,
      role: insertUser.role || 'client' // Default to client if role is not specified
    };
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
    
    // Ensure all required fields are present with appropriate defaults
    const serviceRequest: ServiceRequest = {
      id,
      name: request.name,
      email: request.email,
      phone: request.phone,
      serviceType: request.serviceType,
      issueType: request.issueType,
      urgency: request.urgency,
      propertyType: request.propertyType,
      address: request.address,
      status: "new",
      createdAt,
      updatedAt,
      userId: null, // Will be set after user creation
      technicianId: null,
      technicianName: null,
      cost: null,
      notes: null,
      description: request.description || null,
      previousIssue: request.previousIssue ?? false,
      preferredDate: request.preferredDate || null,
      preferredTime: request.preferredTime || null,
      completedDate: null,
      quotedAmount: null,
      quoteDate: null,
      quoteExpiryDate: null,
      quoteNotes: null,
      quoteToken: null,
      quoteAcceptedDate: null
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
    const requests = Array.from(this.serviceRequests.values());
    
    // Add missing fields for consistency with the database implementation
    return requests.map(request => ({
      ...request,
      // Add missing fields with fallback values
      completionNotes: request.completionNotes || null,
      materialUsed: request.materialUsed || null,
      completionDate: request.completionDate || request.completedDate || null,
      priority: request.priority || 0,
    }));
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
    
    // Add required fields with default values for memory storage
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt,
      // Default values for required fields
      status: insertLead.status || 'new',
      description: insertLead.description || null,
      preferredDate: insertLead.preferredDate || null,
      preferredTime: insertLead.preferredTime || null,
      priority: 0
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
    
    // Add required fields with default values for memory storage
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt, 
      updatedAt,
      // Default values for required fields
      status: insertAppointment.status || 'scheduled',
      technicianId: insertAppointment.technicianId || null,
      technicianName: insertAppointment.technicianName || null,
      notes: insertAppointment.notes || null,
      technicianPhone: insertAppointment.technicianPhone || null
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
  
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
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
    
    // Add required fields with default values for memory storage
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt,
      // Default values for required fields
      notes: insertTransaction.notes || null,
      serviceRequestId: insertTransaction.serviceRequestId || null
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

  // Inventory methods
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentId.inventoryItems++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const lastRestocked = new Date();
    
    const inventoryItem: InventoryItem = {
      id,
      name: item.name,
      description: item.description || null,
      category: item.category,
      sku: item.sku,
      quantity: item.quantity || 0,
      minQuantity: item.minQuantity || 5,
      cost: item.cost,
      supplier: item.supplier || null,
      location: item.location || null,
      lastRestocked,
      createdAt,
      updatedAt
    };
    
    this.inventoryItems.set(id, inventoryItem);
    return inventoryItem;
  }
  
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.quantity <= item.minQuantity);
  }
  
  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data, updatedAt: new Date() };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Inventory Transaction methods
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const id = this.currentId.inventoryTransactions++;
    const transactionDate = new Date();
    
    const inventoryTransaction: InventoryTransaction = {
      id,
      itemId: transaction.itemId,
      quantity: transaction.quantity,
      transactionType: transaction.transactionType,
      userId: transaction.userId,
      notes: transaction.notes || null,
      serviceRequestId: transaction.serviceRequestId || null,
      transactionDate
    };
    
    this.inventoryTransactions.set(id, inventoryTransaction);
    
    // Update the inventory item quantity
    const item = await this.getInventoryItem(transaction.itemId);
    if (item) {
      const newQuantity = item.quantity + transaction.quantity;
      await this.updateInventoryItem(transaction.itemId, {
        quantity: newQuantity,
        lastRestocked: transaction.quantity > 0 ? new Date() : item.lastRestocked
      });
    }
    
    return inventoryTransaction;
  }
  
  async getInventoryTransactionsByItemId(itemId: number): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values())
      .filter(transaction => transaction.itemId === itemId);
  }
  
  async getInventoryTransactionsByServiceRequest(serviceRequestId: number): Promise<InventoryTransaction[]> {
    return Array.from(this.inventoryTransactions.values())
      .filter(transaction => transaction.serviceRequestId === serviceRequestId);
  }
  
  // Service Request Items methods
  async addItemToServiceRequest(item: InsertServiceRequestItem): Promise<ServiceRequestItem> {
    const id = this.currentId.serviceRequestItems++;
    const addedAt = new Date();
    
    const serviceRequestItem: ServiceRequestItem = {
      ...item,
      id,
      addedAt
    };
    
    this.serviceRequestItems.set(id, serviceRequestItem);
    
    // Create the corresponding inventory transaction (removing from inventory)
    await this.createInventoryTransaction({
      itemId: item.itemId,
      quantity: -item.quantity, // Negative quantity means removal
      transactionType: 'use',
      serviceRequestId: item.serviceRequestId,
      userId: 1, // Default to admin - this should be changed to the actual user
      notes: `Used in service request #${item.serviceRequestId}`
    });
    
    return serviceRequestItem;
  }
  
  async getServiceRequestItems(serviceRequestId: number): Promise<ServiceRequestItem[]> {
    return Array.from(this.serviceRequestItems.values())
      .filter(item => item.serviceRequestId === serviceRequestId);
  }
  
  async removeItemFromServiceRequest(id: number): Promise<void> {
    const item = this.serviceRequestItems.get(id);
    if (!item) return;
    
    // Create a transaction to add the items back to inventory
    await this.createInventoryTransaction({
      itemId: item.itemId,
      quantity: item.quantity, // Positive quantity means addition
      transactionType: 'return',
      serviceRequestId: item.serviceRequestId,
      userId: 1, // Default to admin - this should be changed to the actual user
      notes: `Returned from service request #${item.serviceRequestId}`
    });
    
    // Remove the service request item
    this.serviceRequestItems.delete(id);
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
