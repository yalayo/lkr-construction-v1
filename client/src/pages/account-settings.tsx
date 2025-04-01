import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ChangePasswordForm from "@/components/user/change-password-form";
import AdminResetPassword from "@/components/user/admin-reset-password";
import { useEffect } from "react";
import { useLocation } from "wouter";

const AccountSettings = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    // Return a loading placeholder instead of null to satisfy React.ReactElement typing
    return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
      
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">User Information</h2>
          <div className="mt-4 space-y-2">
            <p><span className="font-medium">Username:</span> {user.username}</p>
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Phone:</span> {user.phone}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
          </div>
        </div>
        
        <Tabs defaultValue="password" className="max-w-xl">
          <TabsList className="mb-4">
            <TabsTrigger value="password">Change Password</TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="reset">Reset User Password</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="password">
            <ChangePasswordForm />
          </TabsContent>
          
          {user.role === 'admin' && (
            <TabsContent value="reset">
              <AdminResetPassword />
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default AccountSettings;