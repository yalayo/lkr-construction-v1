import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Upload, RefreshCw, File, FileText, Database, Settings, Users, Activity, Package } from "lucide-react";
import UserManagement from "@/components/dashboard/user-management";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [exportFormat, setExportFormat] = useState("json");
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchData() {
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
          
          const mockLogs = [
            {
              id: 1,
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              level: "INFO",
              source: "AUTH",
              message: "User login: admin"
            },
            {
              id: 2,
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              level: "WARNING",
              source: "API",
              message: "Rate limit approaching: /api/users - 85%"
            },
            {
              id: 3,
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              level: "ERROR",
              source: "DATABASE",
              message: "Connection timeout - reconnected automatically"
            },
            {
              id: 4,
              timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
              level: "INFO",
              source: "SYSTEM",
              message: "Daily backup completed successfully"
            }
          ];
          
          setUsers(mockUsers);
          setSystemLogs(mockLogs);
        }
      } catch (error) {
        console.error('Error setting up data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">System Administration</h1>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2">
                {user?.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-neutral-700">{user?.name}</span>
            </div>
          </div>
          
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="users" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                <span>Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                <span>Data Export/Import</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                <span>Logs & Monitoring</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users">
              <UserManagement users={users} />
            </TabsContent>
            
            <TabsContent value="inventory">
              <div className="bg-white rounded-lg border">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-800">Inventory Management</h3>
                      <p className="text-sm text-neutral-600">Manage your inventory items and stock levels</p>
                    </div>
                    <Button onClick={() => window.location.href = "/inventory"} className="gap-1">
                      <Package className="h-4 w-4" />
                      <span>Go to Inventory</span>
                    </Button>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-blue-50">
                        <CardContent className="p-6">
                          <h4 className="text-lg font-medium text-blue-700 mb-2">Inventory Overview</h4>
                          <p className="text-sm text-blue-600">
                            View and manage all your inventory items, update stock levels, and track inventory transactions
                          </p>
                          <p className="mt-4 text-xs text-blue-800">
                            The full inventory management system provides detailed views of your stock levels, allows for item categorization, 
                            and tracks all stock movements
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-amber-50">
                        <CardContent className="p-6">
                          <h4 className="text-lg font-medium text-amber-700 mb-2">Low Stock Alerts</h4>
                          <p className="text-sm text-amber-600">
                            Get notified about inventory items that are low in stock and need replenishment
                          </p>
                          <p className="mt-4 text-xs text-amber-800">
                            Set minimum threshold levels for each item and receive automatic alerts when stock falls below these levels
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50">
                        <CardContent className="p-6">
                          <h4 className="text-lg font-medium text-green-700 mb-2">Inventory Reporting</h4>
                          <p className="text-sm text-green-600">
                            Generate reports on inventory usage, stock value, and restock requirements
                          </p>
                          <p className="mt-4 text-xs text-green-800">
                            Access detailed reports to optimize your inventory management and reduce costs
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex justify-center mt-8">
                      <Button onClick={() => window.location.href = "/inventory"} size="lg" className="gap-2">
                        <Package className="h-5 w-5" />
                        <span>Access Full Inventory System</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="bg-white rounded-lg border">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-4">System Settings</h3>
                  <p className="text-sm text-neutral-600 mb-6">Configure system-wide preferences and settings</p>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-neutral-700">Notifications</h4>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications" className="text-sm font-medium">
                            Email Notifications
                          </Label>
                          <p className="text-xs text-neutral-500 mt-1">
                            Send email notifications for important system events
                          </p>
                        </div>
                        <Switch id="email-notifications" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications" className="text-sm font-medium">
                            SMS Notifications
                          </Label>
                          <p className="text-xs text-neutral-500 mt-1">
                            Send SMS notifications for critical alerts
                          </p>
                        </div>
                        <Switch id="sms-notifications" defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-neutral-700">Security</h4>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="two-factor" className="text-sm font-medium">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-xs text-neutral-500 mt-1">
                            Require 2FA for all admin accounts
                          </p>
                        </div>
                        <Switch id="two-factor" />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="session-timeout" className="text-sm font-medium">
                          Session Timeout (minutes)
                        </Label>
                        <Input id="session-timeout" type="number" defaultValue="60" className="w-full" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>Save Settings</Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <div className="bg-white rounded-lg border">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-neutral-800 mb-4">Data Export/Import</h3>
                  <p className="text-sm text-neutral-600 mb-6">Manage system data exports and imports</p>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-neutral-700">Export Data</h4>
                      <Separator />
                      
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="export-format" className="text-sm font-medium">
                            Export Format
                          </Label>
                          <Select value={exportFormat} onValueChange={setExportFormat}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="xml">XML</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            <span>Export All Data</span>
                          </Button>
                          <Button variant="outline" className="flex-1 gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Export Users Only</span>
                          </Button>
                          <Button variant="outline" className="flex-1 gap-2">
                            <File className="h-4 w-4" />
                            <span>Export Services Only</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-neutral-700">Import Data</h4>
                      <Separator />
                      
                      <div className="grid gap-4">
                        <div className="border-2 border-dashed rounded-md p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto text-neutral-400" />
                          <p className="mt-2 text-sm font-medium text-neutral-700">
                            Drag and drop file to import, or
                          </p>
                          <Button variant="link" className="mt-1">
                            browse files
                          </Button>
                          <p className="mt-1 text-xs text-neutral-500">
                            Supports JSON, CSV, or XML formats
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button disabled>Import Data</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="logs">
              <div className="bg-white rounded-lg border">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-neutral-800">System Logs</h3>
                      <p className="text-sm text-neutral-600">Monitor system activity and performance</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-1">
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-left">
                          <th className="px-4 py-3 text-sm font-medium text-neutral-600">Timestamp</th>
                          <th className="px-4 py-3 text-sm font-medium text-neutral-600">Level</th>
                          <th className="px-4 py-3 text-sm font-medium text-neutral-600">Source</th>
                          <th className="px-4 py-3 text-sm font-medium text-neutral-600">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {systemLogs.map(log => (
                          <tr key={log.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3 text-sm text-neutral-800">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                log.level === "ERROR" ? "bg-red-100 text-red-800" :
                                log.level === "WARNING" ? "bg-amber-100 text-amber-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-800">{log.source}</td>
                            <td className="px-4 py-3 text-sm text-neutral-800">{log.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      Download Full Logs
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
