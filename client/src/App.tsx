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
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

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

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
