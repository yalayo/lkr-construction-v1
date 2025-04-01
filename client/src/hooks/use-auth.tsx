import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
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

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

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
    onSuccess: (user: SelectUser) => {
      console.log("Login mutation success, setting user data in cache");
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      console.log("Redirecting based on role:", user.role);
      // Redirect based on role
      if (user.role === "client") {
        setLocation("/client-dashboard");
      } else if (user.role === "owner") {
        setLocation("/owner-dashboard");
      } else if (user.role === "admin") {
        setLocation("/admin-dashboard");
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
    onSuccess: (user: SelectUser) => {
      console.log("Registration mutation success, setting user data in cache");
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
      
      // Redirect to client dashboard for new users
      setLocation("/client-dashboard");
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
      console.log("Logout mutation success, clearing user data from cache");
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
      setLocation("/");
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
