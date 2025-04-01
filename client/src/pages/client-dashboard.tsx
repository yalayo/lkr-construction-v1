import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import ClientAppointment from "@/components/dashboard/client-appointment";
import ServiceHistory from "@/components/dashboard/service-history";
import { Loader2 } from "lucide-react";

const ClientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['/api/appointments'],
  });
  
  const { data: serviceRequests, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/service-requests/history'],
  });
  
  // Find upcoming appointment (first one that is scheduled)
  const upcomingAppointment = appointments?.find(apt => apt.status === "scheduled");
  
  // Filter completed service requests
  const completedServices = serviceRequests?.filter(req => req.status === "completed") || [];

  if (isLoadingAppointments || isLoadingHistory) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">Client Dashboard</h1>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 mr-2">
                {user?.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-neutral-700">{user?.name}</span>
            </div>
          </div>
          
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
              <TabsTrigger value="history">Service History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {upcomingAppointment ? (
                <ClientAppointment appointment={upcomingAppointment} />
              ) : (
                <div className="bg-neutral-50 p-8 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-neutral-700 mb-2">No Upcoming Appointments</h3>
                  <p className="text-neutral-600 mb-4">You don't have any scheduled appointments at the moment.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history">
              {completedServices.length > 0 ? (
                <ServiceHistory services={completedServices} />
              ) : (
                <div className="bg-neutral-50 p-8 rounded-lg text-center">
                  <h3 className="text-lg font-medium text-neutral-700 mb-2">No Service History</h3>
                  <p className="text-neutral-600">You don't have any completed service requests yet.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
