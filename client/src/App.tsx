import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ClientDashboard from "@/pages/client-dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TechnicianDashboard from "@/pages/technician-dashboard";
import AccountSettings from "@/pages/account-settings";
import QuoteAccepted from "@/pages/quote-accepted";
import InventoryManagement from "@/pages/inventory-management";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "./components/onboarding/onboarding-wizard";
import { useAuth } from "./hooks/use-auth";
import { useOnboarding } from "./contexts/onboarding-context";

// Simple component wrappers for protected routes
const AccountSettingsWrapper = () => <AccountSettings />;
const ClientDashboardWrapper = () => <ClientDashboard />;
const OwnerDashboardWrapper = () => <OwnerDashboard />;
const AdminDashboardWrapper = () => <AdminDashboard />;
const TechnicianDashboardWrapper = () => <TechnicianDashboard />;
const InventoryManagementWrapper = () => <InventoryManagement />;

// Simple onboarding component to show the wizard
function OnboardingIntegration() {
  const { user } = useAuth();
  const { isOpen, openOnboarding, closeOnboarding } = useOnboarding();
  
  useEffect(() => {
    if (!user) return;
    
    // Store user ID for the onboarding context to use
    localStorage.setItem('currentUserId', String(user.id));
    
    // Check if the user has seen the onboarding
    const hasSeenOnboarding = localStorage.getItem(`onboarding-completed-${user.id}`);
    
    if (hasSeenOnboarding !== 'true') {
      openOnboarding();
    }
  }, [user, openOnboarding]);
  
  return isOpen && user ? (
    <OnboardingWizard isOpen={true} onClose={closeOnboarding} />
  ) : null;
}

function App() {
  const { user, isLoading } = useAuth();
  
  // If authentication is loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  console.log("App rendering with authentication state:", user ? "authenticated" : "not authenticated");
  
  const [, setLocation] = useLocation();
  
  // Create a wrapped AuthPage component that redirects if user is logged in
  const AuthPageWithRedirect = () => {
    useEffect(() => {
      if (user) {
        console.log("Auth page: User already logged in as:", user?.role);
        // Redirect to the appropriate dashboard
        if (user.role === "owner") {
          setLocation("/owner-dashboard");
        } else if (user.role === "admin") {
          setLocation("/admin-dashboard");
        } else if (user.role === "technician") {
          setLocation("/technician-dashboard");
        } else {
          setLocation("/client-dashboard");
        }
      }
    }, [user]);
    
    // Render the auth page (will redirect via effect if needed)
    return <AuthPage />;
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPageWithRedirect} />
          <Route path="/quote-accepted" component={QuoteAccepted} />
          <ProtectedRoute path="/client-dashboard" component={ClientDashboardWrapper} />
          <ProtectedRoute path="/owner-dashboard" component={OwnerDashboardWrapper} />
          <ProtectedRoute path="/admin-dashboard" component={AdminDashboardWrapper} />
          <ProtectedRoute path="/technician-dashboard" component={TechnicianDashboardWrapper} />
          <ProtectedRoute path="/inventory" component={InventoryManagementWrapper} />
          <ProtectedRoute path="/account-settings" component={AccountSettingsWrapper} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <OnboardingIntegration />
      <Toaster />
    </div>
  );
}

export default App;
