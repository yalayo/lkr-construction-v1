import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import StatsOverview from "@/components/dashboard/stats-overview";
import LeadManagement from "@/components/dashboard/lead-management";
import FinancialOverview from "@/components/dashboard/financial-overview";
import { useAuth } from "@/hooks/use-auth";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>(null);
  
  useEffect(() => {
    // In a production environment, we would fetch this data from the API
    // For now, we'll use mock data
    setTimeout(() => {
      const mockStats = {
        newLeads: 24,
        pendingLeads: 12,
        pendingJobs: 8,
        revenue: 15250,
        expenses: 8750,
        profit: 6500,
        conversionRate: 68,
        nextJob: "Today, 2:00 PM - Electrical Panel Upgrade",
        completedJobs: 42
      };
      
      const mockLeads = [
        {
          id: 1,
          name: "James Wilson",
          email: "james@example.com",
          phone: "(555) 111-2233",
          serviceType: "Electricity",
          issueType: "Wiring Issues",
          urgency: "High",
          status: "pending",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedPrice: 450
        },
        {
          id: 2,
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "(555) 222-3344",
          serviceType: "Plumbing",
          issueType: "Pipe Leak",
          urgency: "Medium",
          status: "contacted",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedPrice: 325
        },
        {
          id: 3,
          name: "Robert Brown",
          email: "robert@example.com",
          phone: "(555) 333-4455",
          serviceType: "Both",
          issueType: "Bathroom Renovation",
          urgency: "Low",
          status: "scheduled",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          estimatedPrice: 1200
        }
      ];
      
      const mockFinancials = {
        totalRevenue: 45750,
        totalExpenses: 28200,
        netProfit: 17550,
        revenueBreakdown: {
          electrical: 28000,
          plumbing: 15250,
          combined: 2500
        },
        expensesByCategory: {
          "Materials": 14500,
          "Labor": 9500,
          "Overhead": 2800,
          "Marketing": 1400
        },
        recentTransactions: [
          {
            id: 1,
            type: "Income",
            description: "Circuit Panel Replacement - Johnson Residence",
            amount: 1250,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Electrical"
          },
          {
            id: 2,
            type: "Expense",
            description: "Electrical Supplies - Home Depot",
            amount: 485,
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Materials"
          },
          {
            id: 3,
            type: "Income",
            description: "Main Water Line Repair - Smith Residence",
            amount: 875,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            category: "Plumbing"
          }
        ]
      };
      
      setStats(mockStats);
      setLeads(mockLeads);
      setFinancials(mockFinancials);
      setIsLoading(false);
    }, 1000); // Simulate network delay
  }, [filterPeriod]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Owner Dashboard</h1>
          
          {/* Stats Overview */}
          <div className="mb-8">
            <StatsOverview stats={stats} />
          </div>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="leads" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="leads">Lead Management</TabsTrigger>
              <TabsTrigger value="financials">Financial Overview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="leads">
              <LeadManagement leads={leads} />
            </TabsContent>
            
            <TabsContent value="financials">
              <FinancialOverview 
                financials={financials} 
                period={filterPeriod}
                setPeriod={setFilterPeriod}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerDashboard;
