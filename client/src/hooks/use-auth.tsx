import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Manage user state directly
  const [user, setUser] = useState<SelectUser | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user on initial load
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        console.log("Fetching current user data...");
        
        const res = await fetch("/api/user", {
          credentials: "include" // Important for cookies
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log("User not authenticated");
            setUser(null);
            return;
          }
          
          const errText = await res.text();
          console.error("Error fetching user:", errText);
          throw new Error(errText || "Failed to fetch user");
        }
        
        const userData = await res.json();
        console.log("User data fetched successfully:", userData);
        setUser(userData);
      } catch (err) {
        console.error("Error in fetchUser:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUser();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("Attempting login with:", credentials.username);
        const res = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include" // Important for cookies
        });
        
        if (!res.ok) {
          const errText = await res.text();
          console.error("Login failed:", errText);
          throw new Error(errText || "Invalid username or password");
        }
        
        const userData = await res.json();
        console.log("Login successful, user data:", userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Login mutation success, setting user data");
      // Update both the local state and the query cache
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
      
      console.log("Redirecting based on role:", userData.role);
      // Use direct window navigation instead of React Router
      if (userData.role === "client") {
        window.location.href = "/client-dashboard";
      } else if (userData.role === "owner") {
        window.location.href = "/owner-dashboard";
      } else if (userData.role === "admin") {
        window.location.href = "/admin-dashboard";
      }
    },
    onError: (error: Error) => {
      console.error("Login mutation error handler:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log("Attempting registration for:", credentials.username);
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include" // Important for cookies
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("Registration failed:", errText);
        throw new Error(errText || "Registration failed");
      }
      
      const userData = await res.json();
      console.log("Registration successful, user data:", userData);
      return userData;
    },
    onSuccess: (userData: SelectUser) => {
      console.log("Registration mutation success, setting user data");
      // Update both the local state and the query cache
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
      
      // Use direct window navigation for new users
      window.location.href = "/client-dashboard";
    },
    onError: (error: Error) => {
      console.error("Registration mutation error handler:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Attempting logout");
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include" // Important for cookies
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error("Logout failed:", errText);
        throw new Error(errText || "Logout failed");
      }
      
      console.log("Logout successful");
    },
    onSuccess: () => {
      console.log("Logout mutation success, clearing user data");
      // Update both the local state and the query cache
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out successfully",
      });
      
      // Use direct window navigation
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Logout mutation error handler:", error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
