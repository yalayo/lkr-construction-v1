import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import RequestService from "@/pages/request-service";
import ClientDashboard from "@/pages/client-dashboard";
import OwnerDashboard from "@/pages/owner-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AccountSettings from "@/pages/account-settings";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "./components/onboarding/onboarding-wizard";
import { useAuth } from "./hooks/use-auth";
import { useOnboarding } from "./contexts/onboarding-context";

// Fix Account Settings component wrapper for protected route
const AccountSettingsWrapper = () => <AccountSettings />;
const ClientDashboardWrapper = () => <ClientDashboard />;
const OwnerDashboardWrapper = () => <OwnerDashboard />;
const AdminDashboardWrapper = () => <AdminDashboard />;

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/request-service" component={RequestService} />
      <ProtectedRoute path="/client-dashboard" component={ClientDashboardWrapper} />
      <ProtectedRoute path="/owner-dashboard" component={OwnerDashboardWrapper} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboardWrapper} />
      <ProtectedRoute path="/account-settings" component={AccountSettingsWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

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
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
      <OnboardingIntegration />
      <Toaster />
    </div>
  );
}

export default App;
