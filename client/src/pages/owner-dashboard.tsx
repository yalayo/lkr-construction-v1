import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import StatsOverview from "@/components/dashboard/stats-overview";
import LeadManagement from "@/components/dashboard/lead-management";
import FinancialOverview from "@/components/dashboard/financial-overview";

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState("leads");
  const [filterPeriod, setFilterPeriod] = useState("month");
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats', filterPeriod],
  });
  
  const { data: leads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ['/api/leads'],
  });
  
  const { data: financials, isLoading: isLoadingFinancials } = useQuery({
    queryKey: ['/api/financials', filterPeriod],
  });
  
  if (isLoadingStats || isLoadingLeads || isLoadingFinancials) {
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
