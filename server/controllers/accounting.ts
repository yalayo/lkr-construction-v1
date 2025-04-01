import { Express } from "express";
import { storage } from "../storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export function setupAccountingRoutes(app: Express) {
  // Add a new transaction (income or expense)
  app.post("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });
  
  // Get financial stats for dashboard
  app.get("/api/stats", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const period = req.query.period as string || "month";
      
      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      
      if (period === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === "quarter") {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (period === "year") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }
      
      // Get all transactions for the period
      const transactions = await storage.getTransactionsByPeriod(startDate, endDate);
      
      // Calculate income and expenses
      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Get leads and appointments for the period
      const leads = (await storage.getAllLeads())
        .filter(l => new Date(l.createdAt) >= startDate && new Date(l.createdAt) <= endDate);
        
      const pendingLeads = leads.filter(l => l.status === "new" || l.status === "pending").length;
      
      // Get service requests data
      const serviceRequests = (await storage.getAllServiceRequests())
        .filter(sr => new Date(sr.createdAt) >= startDate && new Date(sr.createdAt) <= endDate);
        
      const pendingJobs = serviceRequests.filter(sr => 
        sr.status === "assigned" || sr.status === "scheduled"
      ).length;
      
      const completedJobs = serviceRequests.filter(sr => sr.status === "completed").length;
      
      // Calculate conversion rate
      const conversionRate = leads.length > 0 
        ? Math.round((completedJobs / leads.length) * 100) 
        : 0;
      
      // Get next scheduled job
      const appointments = (await storage.getAllServiceRequests())
        .filter(sr => sr.status === "scheduled" || sr.status === "assigned")
        .sort((a, b) => {
          const aDate = a.preferredDate ? new Date(a.preferredDate) : new Date();
          const bDate = b.preferredDate ? new Date(b.preferredDate) : new Date();
          return aDate.getTime() - bDate.getTime();
        });
        
      const nextJob = appointments.length > 0 
        ? appointments[0].preferredDate 
          ? new Date(appointments[0].preferredDate).toLocaleString() 
          : "Not scheduled"
        : "No upcoming jobs";
      
      res.json({
        newLeads: leads.length,
        pendingLeads,
        pendingJobs,
        revenue: income,
        expenses,
        profit: income - expenses,
        conversionRate,
        nextJob,
        completedJobs
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get financial data for charts and reporting
  app.get("/api/financials", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const period = req.query.period as string || "month";
      
      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      
      if (period === "week") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === "quarter") {
        startDate.setMonth(endDate.getMonth() - 3);
      } else if (period === "year") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }
      
      // Get all transactions for the period
      const transactions = await storage.getTransactionsByPeriod(startDate, endDate);
      
      // Calculate total revenue and expenses
      const totalRevenue = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const totalExpenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Break down revenue by service category
      const electricalRevenue = transactions
        .filter(t => t.type === "income" && t.category === "electrical-service")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const plumbingRevenue = transactions
        .filter(t => t.type === "income" && t.category === "plumbing-service")
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const combinedRevenue = transactions
        .filter(t => t.type === "income" && t.category === "both-service")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Break down expenses by category
      const expensesByCategory = transactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          if (!acc[t.category]) {
            acc[t.category] = 0;
          }
          acc[t.category] += Number(t.amount);
          return acc;
        }, {} as Record<string, number>);
      
      // Get all recent transactions for the table view
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      
      res.json({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        revenueBreakdown: {
          electrical: electricalRevenue,
          plumbing: plumbingRevenue,
          combined: combinedRevenue
        },
        expensesByCategory,
        recentTransactions
      });
    } catch (error) {
      next(error);
    }
  });
}
