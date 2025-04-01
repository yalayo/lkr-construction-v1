import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap, Droplet, Calendar, ArrowRight, AlertCircle, PhoneCall, Check, DollarSign } from "lucide-react";
import StatsOverview from "@/components/dashboard/stats-overview";
import LeadManagement from "@/components/dashboard/lead-management";
import FinancialOverview from "@/components/dashboard/financial-overview";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceRequest } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

// Define a schema for quote submission
const quoteFormSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Must be a positive number" }
  ),
  notes: z.string().optional(),
  expiryDays: z.string().min(1, "Expiry days required").refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "Must be a positive number" }
  ),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

// Service request component
const ServiceRequestCard = ({ request }: { request: ServiceRequest }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      amount: "",
      notes: "",
      expiryDays: "7"
    }
  });
  
  const quoteSubmitMutation = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      // Convert input values to appropriate types
      const data = {
        amount: parseFloat(values.amount),
        notes: values.notes,
        expiryDays: parseInt(values.expiryDays)
      };
      
      const response = await apiRequest(
        "POST", 
        `/api/service-requests/${request.id}/quote`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      // Close dialog and show success toast
      setIsQuoteDialogOpen(false);
      form.reset();
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      
      toast({
        title: "Quote Sent",
        description: "The customer has been notified via SMS about the quote.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Error submitting quote:", error);
      toast({
        title: "Failed to Send Quote",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmitQuote = (values: QuoteFormValues) => {
    quoteSubmitMutation.mutate(values);
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'new': return 'bg-blue-100 text-blue-600';
        case 'quoted': return 'bg-purple-100 text-purple-600';
        case 'accepted': return 'bg-green-100 text-green-600';
        case 'completed': return 'bg-green-500 text-white';
        case 'in_progress': return 'bg-yellow-100 text-yellow-600';
        case 'cancelled': return 'bg-red-100 text-red-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };
    
    return (
      <Badge className={`${getStatusColor()}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };
  
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

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Not specified';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return 'Not quoted';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };
  
  // Determine which action buttons to show based on request status
  const renderActionButtons = () => {
    switch (request.status) {
      case 'new':
        return (
          <>
            <Button size="sm" variant="outline">
              <PhoneCall className="h-4 w-4 mr-1" /> Call
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsQuoteDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-1" /> Submit Quote
            </Button>
          </>
        );
      case 'quoted':
        return (
          <>
            <Button size="sm" variant="outline">
              <PhoneCall className="h-4 w-4 mr-1" /> Call
            </Button>
            <Button size="sm" variant="secondary">
              Waiting for Approval
            </Button>
          </>
        );
      case 'accepted':
        return (
          <>
            <Button size="sm" variant="outline">
              <PhoneCall className="h-4 w-4 mr-1" /> Call
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="bg-black hover:bg-gray-800"
            >
              Assign <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        );
      case 'assigned':
      case 'in_progress':
        return (
          <>
            <Button size="sm" variant="outline">
              <PhoneCall className="h-4 w-4 mr-1" /> Call
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Mark as completed
                // Implementation would go here
              }}
            >
              <Check className="h-4 w-4 mr-1" /> Complete Job
            </Button>
          </>
        );
      default:
        return (
          <Button size="sm" variant="outline">
            <PhoneCall className="h-4 w-4 mr-1" /> Call
          </Button>
        );
    }
  };

  return (
    <>
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
                <div className="ml-auto">
                  <StatusBadge status={request.status} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service Type</p>
                  <p className="font-medium">{request.serviceType} - {request.issueType}</p>
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
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    {request.status === 'quoted' ? 'Quote Amount' : 
                     request.status === 'accepted' || request.status === 'completed' ? 'Accepted Amount' : 
                     'Estimated Value'}
                  </p>
                  <p className="font-medium">{formatCurrency(request.quotedAmount)}</p>
                  {request.quoteDate && (
                    <p className="text-xs text-gray-500">Quoted on {formatDate(request.quoteDate)}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 flex flex-col justify-between">
              <div className="text-right mb-auto">
                <p className="text-sm text-gray-500">Requested on</p>
                <p className="font-medium">{formatDate(request.createdAt)}</p>
              </div>
              
              <div className="flex mt-4 space-x-2">
                {renderActionButtons()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quote Submission Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
            <DialogDescription>
              Provide a quote for {request.name}'s {request.serviceType} service.
              This quote will be sent to the customer via SMS.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitQuote)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quote Valid For (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="7"
                        min="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details about the quote..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsQuoteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={quoteSubmitMutation.isPending}
                >
                  {quoteSubmitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Quote'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [filterPeriod, setFilterPeriod] = useState("month");
  
  // Fetch all service requests using standard query client fetch
  const { 
    data: serviceRequests = [] as ServiceRequest[], 
    isLoading: isLoadingRequests,
    error: requestsError
  } = useQuery<ServiceRequest[]>({
    queryKey: ['/api/service-requests'],
    queryFn: async () => {
      try {
        console.log('Fetching service requests for dashboard');
        // Make sure we only fetch when user is authenticated
        if (!user) {
          console.log('User not authenticated, skipping fetch');
          return [];
        }
        console.log('Authenticated as:', user?.username, 'with role:', user?.role);
        
        // Use apiRequest from queryClient for consistent auth handling
        const res = await fetch('/api/service-requests', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || `Error fetching service requests: ${res.status}`);
        }
        
        const data: ServiceRequest[] = await res.json();
        console.log('Received service requests:', data.length);
        return data;
      } catch (error) {
        console.error('Error fetching service requests:', error);
        throw error;
      }
    },
    // Only run this query when the user is authenticated
    enabled: !!user,
    // Add retry and stale time configurations
    retry: 2,
    staleTime: 30000 // 30 seconds
  });
  
  // Fetch stats, leads, and financials data
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError
  } = useQuery({
    queryKey: ['/api/dashboard', filterPeriod],
    queryFn: async () => {
      try {
        console.log('Fetching dashboard data');
        // Make sure we only fetch when user is authenticated
        if (!user) {
          console.log('User not authenticated, skipping dashboard fetch');
          return {
            stats: null,
            leads: [],
            financials: null
          };
        }
        console.log('User authenticated as:', user.username, 'with role:', user.role);
        console.log('Dashboard fetch as:', user.username, 'with role:', user.role);
        
        // Call the dashboard API endpoint 
        const response = await fetch(`/api/dashboard?period=${filterPeriod}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching dashboard data: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
      }
    },
    // Only run this query when the user is authenticated
    enabled: !!user
  });
  
  const isLoading = isLoadingRequests || isLoadingDashboard;
  
  // Sort service requests by urgency first, then by creation date (oldest first for FIFO)
  const sortedRequests = [...(serviceRequests || [])].sort((a, b) => {
    // Prioritize by urgency first (emergency > urgent > standard > flexible)
    const urgencyOrder: Record<string, number> = { 'emergency': 0, 'urgent': 1, 'standard': 2, 'flexible': 3 };
    const urgencyA = urgencyOrder[a.urgency?.toLowerCase() || ''] ?? 4;
    const urgencyB = urgencyOrder[b.urgency?.toLowerCase() || ''] ?? 4;
    
    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB; // Sort by urgency first
    }
    
    // If urgency is the same, sort by creation date (oldest first for FIFO)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  // Show error state if there was an error fetching service requests or dashboard data
  if (requestsError || dashboardError) {
    const error = requestsError || dashboardError;
    console.error('Dashboard error:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-red-500">Error Loading Dashboard</h2>
        <p className="text-gray-600">
          {error instanceof Error 
            ? error.message 
            : 'There was an error loading the dashboard. Please try again.'}
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
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
                Showing service requests by urgency, then by arrival time (First In, First Out)
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
          {dashboardData?.leads && <LeadManagement leads={dashboardData.leads} />}
        </TabsContent>
        
        <TabsContent value="financials">
          {dashboardData?.financials && (
            <FinancialOverview 
              financials={dashboardData.financials} 
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