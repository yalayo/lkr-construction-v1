import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Zap, Droplet, Menu, X, User, LogOut, Settings, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/contexts/onboarding-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Use the useAuth hook to get authentication data
  const auth = useAuth();
  const user = auth.user;
  const logoutMutation = auth.logoutMutation;
  
  // Access onboarding context
  const { openOnboarding } = useOnboarding();
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      if (logoutMutation && typeof logoutMutation.mutateAsync === 'function') {
        await logoutMutation.mutateAsync();
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
      // In all cases, redirect to home
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/auth";
    
    switch (user.role) {
      case "admin":
        return "/admin-dashboard";
      case "owner":
        return "/owner-dashboard";
      case "technician":
        return "/technician-dashboard";
      default:
        return "/client-dashboard";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary mr-1">
                <Zap size={24} />
              </span>
              <span className="text-secondary-500 mr-2">
                <Droplet size={24} />
              </span>
              <span className="font-semibold text-xl text-neutral-800">LKR Construction</span>
            </Link>
            {/* Upper menu bar removed as requested */}
          </div>
          
          <div className="flex items-center">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openOnboarding}
                  className="mr-2"
                  title="Help & Onboarding"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <Link href={getDashboardLink()}>
                  <Button variant="outline" className="mr-2 hidden md:inline-flex">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                      {user.name}
                    </div>
                    <div className="px-2 pb-1.5 text-xs text-muted-foreground">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation(getDashboardLink())}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/account-settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openOnboarding}>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Onboarding</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="mr-2">Log in</Button>
                </Link>
                <Link href="/">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
            
            <div className="ml-4 md:hidden">
              <Button
                variant="ghost"
                onClick={toggleMobileMenu}
                className="p-2"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link href="/">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  Home
                </span>
              </Link>
              <Link href="/">
                <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                  Request Service
                </span>
              </Link>
              {user && (
                <>
                  <Link href={getDashboardLink()}>
                    <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                      Dashboard
                    </span>
                  </Link>
                  <Link href="/account-settings">
                    <span className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50">
                      Account Settings
                    </span>
                  </Link>
                  <div 
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                    onClick={openOnboarding}
                  >
                    <span className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help & Onboarding
                    </span>
                  </div>
                  <div 
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                    onClick={handleLogout}
                  >
                    Log out
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
