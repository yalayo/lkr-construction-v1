import { Express } from "express";
import { storage } from "../storage";

export function setupDashboardRoutes(app: Express) {
  // Get dashboard data for owners/admins
  app.get("/api/dashboard", async (req, res, next) => {
    try {
      console.log('Dashboard API request received');
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        console.log('Dashboard API - Authentication failed', req.isAuthenticated(), req.user?.role);
        return res.status(403).send("Unauthorized");
      }
      
      // Get the period from query params (default to "month")
      const period = (req.query.period as string) || "month";
      console.log('Dashboard API - Period:', period);
      
      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 1); // Default to month
      }
      
      console.log('Dashboard API - Fetching data...');
      // Fetch all required data
      const serviceRequests = await storage.getAllServiceRequests();
      console.log('Dashboard API - Service Requests:', serviceRequests.length);
      
      const leads = await storage.getAllLeads();
      console.log('Dashboard API - Leads:', leads.length);
      
      const appointments = await storage.getAllAppointments();
      console.log('Dashboard API - Appointments:', appointments.length);
      
      const transactions = await storage.getTransactionsByPeriod(startDate, now);
      console.log('Dashboard API - Transactions:', transactions.length);
      
      // Calculate revenue, expenses and profit
      const revenueTransactions = transactions.filter(t => t.type === 'income');
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      const totalRevenue = revenueTransactions.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalExpenses = expenseTransactions.reduce((sum, t) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const netProfit = totalRevenue - totalExpenses;
      
      // Calculate revenue breakdown by service type
      const electricalRevenue = revenueTransactions
        .filter(t => t.category === 'electrical')
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
      const plumbingRevenue = revenueTransactions
        .filter(t => t.category === 'plumbing')
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
      const combinedRevenue = revenueTransactions
        .filter(t => t.category === 'both')
        .reduce((sum, t) => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      
      // Calculate expenses by category
      const expensesByCategory: Record<string, number> = {};
      expenseTransactions.forEach(t => {
        const category = t.category || 'Uncategorized';
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        const validAmount = isNaN(amount) ? 0 : amount;
        expensesByCategory[category] = (expensesByCategory[category] || 0) + validAmount;
      });
      
      // Count leads and calculate conversion rate
      const newLeads = leads.filter(l => l.status === 'new').length;
      const pendingLeads = leads.filter(l => l.status !== 'completed' && l.status !== 'rejected').length;
      const convertedLeads = leads.filter(l => l.status === 'completed').length;
      const totalLeadsWithOutcome = leads.filter(l => l.status === 'completed' || l.status === 'rejected').length;
      const conversionRate = totalLeadsWithOutcome > 0 
        ? Math.round((convertedLeads / totalLeadsWithOutcome) * 100) 
        : 0;
      
      // Count pending jobs
      const pendingJobs = serviceRequests.filter(sr => 
        sr.status !== 'completed' && sr.status !== 'cancelled'
      ).length;
      
      // Count completed jobs
      const completedJobs = serviceRequests.filter(sr => sr.status === 'completed').length;
      
      // Get next upcoming job
      const upcomingAppointments = appointments
        .filter(a => a.status === 'scheduled' && new Date(a.scheduledDate) > new Date())
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      
      let nextJob = 'No upcoming jobs';
      if (upcomingAppointments.length > 0) {
        const next = upcomingAppointments[0];
        const date = new Date(next.scheduledDate);
        
        // Format as "Today/Tomorrow/Mon Mar 10, 2:00 PM - Service Description"
        const now = new Date();
        let dateStr;
        
        if (date.toDateString() === now.toDateString()) {
          dateStr = 'Today';
        } else {
          // Check if tomorrow
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (date.toDateString() === tomorrow.toDateString()) {
            dateStr = 'Tomorrow';
          } else {
            dateStr = date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
        
        // Format time based on time slot or scheduled time
        let timeStr = next.timeSlot || '(time TBD)';
        if (timeStr === 'morning') {
          timeStr = '8:00 AM - 12:00 PM';
        } else if (timeStr === 'afternoon') {
          timeStr = '1:00 PM - 5:00 PM';
        } else if (timeStr === 'evening') {
          timeStr = '5:00 PM - 8:00 PM';
        }
        
        nextJob = `${dateStr}, ${timeStr} - ${next.serviceType} ${next.issueType}`;
      }
      
      // Build and return the dashboard data
      const dashboardData = {
        stats: {
          newLeads,
          pendingLeads,
          pendingJobs,
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: netProfit,
          conversionRate,
          nextJob,
          completedJobs
        },
        leads,
        financials: {
          totalRevenue,
          totalExpenses,
          netProfit,
          revenueBreakdown: {
            electrical: electricalRevenue,
            plumbing: plumbingRevenue,
            combined: combinedRevenue
          },
          expensesByCategory,
          recentTransactions: transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10) // Get 10 most recent transactions
        }
      };
      
      console.log('Dashboard API - Response data prepared. Leads found:', leads?.length || 0);
      console.log('Dashboard API - First lead:', leads && leads.length > 0 ? JSON.stringify(leads[0]) : 'No leads');
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      next(error);
    }
  });
  
  // Get all appointments (for owner/admin)
  app.get("/api/appointments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  });
  
  // Get financial data (for owner/admin)
  app.get("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || (req.user.role !== "owner" && req.user.role !== "admin")) {
        return res.status(403).send("Unauthorized");
      }
      
      // Extract start and end dates from query parameters if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }
      
      // If dates are provided, get transactions for specified period
      let transactions;
      if (startDate && endDate) {
        transactions = await storage.getTransactionsByPeriod(startDate, endDate);
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });
}