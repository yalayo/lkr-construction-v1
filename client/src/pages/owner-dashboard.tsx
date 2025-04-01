import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, Droplet, Calendar, ArrowRight, AlertCircle, PhoneCall } from "lucide-react";
import StatsOverview from "@/components/dashboard/stats-overview";
import LeadManagement from "@/components/dashboard/lead-management";
import FinancialOverview from "@/components/dashboard/financial-overview";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Helper function for urgency colors
const urgencyColor = (urgency: string) => {
  switch (urgency.toLowerCase()) {
    case 'emergency': return '#f87171'; // red-400
    case 'urgent': return '#fbbf24'; // amber-400
    case 'standard': return '#60a5fa'; // blue-400
    case 'flexible': return '#4ade80'; // green-400
    default: return '#94a3b8'; // slate-400
  }
};

// Service request component
const ServiceRequestCard = ({ request }: { request: any }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'emergency': return 'text-red-500';
      case 'urgent': return 'text-amber-500';
      case 'standard': return 'text-blue-500';
      case 'flexible': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'emergency': return 'bg-red-100';
      case 'urgent': return 'bg-amber-100';
      case 'standard': return 'bg-blue-100';
      case 'flexible': return 'bg-green-100';
      default: return 'bg-gray-100';
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'electrical':
        return <Zap className="h-5 w-5 text-blue-500" />;
      case 'plumbing':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      default:
        return <div className="flex"><Zap className="h-5 w-5 text-blue-500" /><Droplet className="h-5 w-5 text-blue-500 ml-1" /></div>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="mb-4 overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
      style={{ borderLeftColor: urgencyColor(request.urgency) }}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {getServiceIcon(request.serviceType)}
              <h3 className="ml-2 text-lg font-semibold">{request.name}</h3>
              <Badge 
                className={`ml-3 ${getUrgencyBg(request.urgency)} ${getUrgencyColor(request.urgency)} border-0`}
              >
                {request.urgency}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Type</p>
                <p className="font-medium">{request.serviceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Issue</p>
                <p className="font-medium">{request.issueType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="font-medium">{request.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Preferred Date</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                  <p className="font-medium">{formatDate(request.preferredDate)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col justify-between">
            <div className="text-right mb-auto">
              <p className="text-sm text-gray-500">Requested on</p>
              <p className="font-medium">{formatDate(request.createdAt)}</p>
            </div>
            
            <div className="flex mt-4 space-x-2">
              <Button size="sm" variant="outline">
                <PhoneCall className="h-4 w-4 mr-1" /> Call
              </Button>
              <Button size="sm" variant="default" className="bg-black hover:bg-gray-800">
                Assign <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [filterPeriod, setFilterPeriod] = useState("month");
  
  // Fetch all service requests
  const { 
    data: serviceRequests = [], 
    isLoading: isLoadingRequests 
  } = useQuery({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/service-requests');
      return await res.json();
    }
  });
  
  // Fetch stats, leads, and financials data
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard
  } = useQuery({
    queryKey: ['/api/dashboard', filterPeriod],
    queryFn: async () => {
      // For now, we'll use mock data
      // In production, we would fetch this from the backend
      return {
        stats: {
          newLeads: 24,
          pendingLeads: 12,
          pendingJobs: 8,
          revenue: 15250,
          expenses: 8750,
          profit: 6500,
          conversionRate: 68,
          nextJob: "Today, 2:00 PM - Electrical Panel Upgrade",
          completedJobs: 42
        },
        leads: [
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
        ],
        financials: {
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
        }
      };
    }
  });
  
  const isLoading = isLoadingRequests || isLoadingDashboard;
  
  // Sort service requests by creation date (oldest first for FIFO)
  const sortedRequests = [...(serviceRequests || [])].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your business operations and track performance</p>
      </div>
      
      {/* Stats Overview */}
      <div className="mb-8">
        {dashboardData?.stats && <StatsOverview stats={dashboardData.stats} />}
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="requests" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="requests" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Service Requests
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Lead Management
          </TabsTrigger>
          <TabsTrigger value="financials" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Financial Overview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl font-semibold">Service Requests</CardTitle>
              <CardDescription>
                Showing service requests in order of arrival (First In, First Out)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {sortedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No service requests yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Service requests will appear here once customers submit them
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium">
                      {sortedRequests.length} {sortedRequests.length === 1 ? 'request' : 'requests'} found
                    </div>
                    {/* Add filter controls here if needed */}
                  </div>
                  <div className="space-y-4">
                    {sortedRequests.map((request) => (
                      <ServiceRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leads">
          {dashboardData?.leads && <LeadManagement leads={dashboardData.leads as any[]} />}
        </TabsContent>
        
        <TabsContent value="financials">
          {dashboardData?.financials && (
            <FinancialOverview 
              financials={dashboardData.financials as any} 
              period={filterPeriod}
              setPeriod={setFilterPeriod}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
