import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import UserManagement from "@/components/dashboard/user-management";
import { useAuth } from "@/hooks/use-auth";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        // Create mock data for testing until the API is fully implemented
        console.log("Current user:", user);
        
        if (user && user.role === "admin") {
          // Mock data for administrator dashboard
          const mockUsers = [
            {
              id: 1,
              username: "admin",
              name: "Admin User",
              email: "admin@elecplumb.com",
              role: "admin",
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              username: "owner",
              name: "Business Owner",
              email: "owner@elecplumb.com",
              role: "owner",
              createdAt: new Date().toISOString()
            },
            {
              id: 3,
              username: "technician",
              name: "Tech Smith",
              email: "tech@elecplumb.com",
              role: "technician",
              createdAt: new Date().toISOString()
            },
            {
              id: 4,
              username: "johndoe",
              name: "John Doe",
              email: "john@example.com",
              role: "client",
              createdAt: new Date().toISOString()
            }
          ];
          
          setUsers(mockUsers);
        }
      } catch (error) {
        console.error('Error setting up user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, [user]);
  
  // If no user data is available, we're not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <p className="text-neutral-500">You must be logged in to view this page.</p>
      </div>
    );
  }
  
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
          <h1 className="text-2xl font-semibold text-neutral-800 mb-6">System Administration</h1>
          
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
              <TabsTrigger value="data">Data Export/Import</TabsTrigger>
              <TabsTrigger value="logs">Logs & Monitoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <UserManagement users={users} />
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="bg-neutral-50 p-8 rounded-lg text-center">
                <h3 className="text-lg font-medium text-neutral-700 mb-2">System Settings</h3>
                <p className="text-neutral-600">Configure system settings and preferences.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="bg-neutral-50 p-8 rounded-lg text-center">
                <h3 className="text-lg font-medium text-neutral-700 mb-2">Data Export/Import</h3>
                <p className="text-neutral-600">Export or import system data.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <div className="bg-neutral-50 p-8 rounded-lg text-center">
                <h3 className="text-lg font-medium text-neutral-700 mb-2">Logs & Monitoring</h3>
                <p className="text-neutral-600">View system logs and monitor performance.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
