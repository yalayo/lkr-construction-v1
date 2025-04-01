import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Zap, Droplet, Loader2, Clock } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const loginMutation = authContext?.loginMutation;
  const registerMutation = authContext?.registerMutation;
  
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [_, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "client") {
        navigate("/client-dashboard");
      } else if (user.role === "owner") {
        navigate("/owner-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      }
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Login form submit handler
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoggingIn(true);
      console.log("Login form submitted with values:", values);
      
      // Direct fetch to bypass TanStack Query for troubleshooting
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include"
      });

      console.log("Login response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Login failed:", errorText);
        throw new Error(errorText || "Login failed");
      }
      
      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      console.log("User role:", userData.role);
      
      // Force a hard redirect to the appropriate dashboard
      console.log("Redirecting based on role:", userData.role);
      
      // Directly redirecting with window.location instead of using wouter
      if (userData.role === "client") {
        console.log("Redirecting to client dashboard");
        window.location.href = "/client-dashboard";
      } else if (userData.role === "owner") {
        console.log("Redirecting to owner dashboard");
        window.location.href = "/owner-dashboard";
      } else if (userData.role === "admin") {
        console.log("Redirecting to admin dashboard");
        window.location.href = "/admin-dashboard";
      } else {
        console.error("Unknown role:", userData.role);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register form submit handler
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      setIsRegistering(true);
      console.log("Register form submitted with values:", values);
      
      // Omit confirmPassword as it's not part of the schema
      const { confirmPassword, ...registrationData } = values;
      const registrationPayload = {
        ...registrationData,
        role: "client", // Default role is client
      };
      
      console.log("Attempting registration...");
      
      // Direct fetch to bypass TanStack Query for troubleshooting
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationPayload),
        credentials: "include"
      });
      
      console.log("Register response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Registration failed:", errorText);
        throw new Error(errorText || "Registration failed");
      }
      
      const userData = await response.json();
      console.log("Registration successful, user data:", userData);
      
      // Force a hard redirect to the client dashboard for new users
      window.location.href = "/client-dashboard";
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left side - Hero/Info */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-black to-gray-800 text-white p-12 flex flex-col justify-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
            </svg>
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
          </div>
          
          {/* Logo and brand */}
          <div className="mb-8 relative">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded-full p-2 mr-4">
                <div className="flex">
                  <Zap className="h-6 w-6 text-black" />
                  <Droplet className="h-6 w-6 text-black ml-1" />
                </div>
              </div>
              <h2 className="text-3xl font-bold">LKR Construction</h2>
            </div>
            <div className="h-1 w-20 bg-white mb-8"></div>
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Your Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Service Partner</span> in Lake Charles
            </h1>
            <p className="text-lg mb-8 text-gray-200">Access your account to manage service requests, track appointments, and view your service history.</p>
          </div>
          
          {/* Features */}
          <div className="space-y-6 relative">
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">24/7 Emergency Service</h3>
                <p className="text-gray-300">Always available for your urgent needs</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Licensed Professionals</h3>
                <p className="text-gray-300">Experienced, certified technicians</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <Droplet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Quality Guaranteed</h3>
                <p className="text-gray-300">100% satisfaction guarantee on all work</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Auth forms */}
        <div className="w-full md:w-1/2 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                  <p className="text-gray-600 mt-1">Enter your credentials to access your account</p>
                </div>
                
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-black hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 text-white"
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-medium text-black hover:text-gray-800" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register now
                    </Button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
                  <p className="text-gray-600 mt-1">Fill out the form below to get started</p>
                </div>
                
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Doe" 
                              className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe123" 
                                className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john@example.com" 
                                className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(337) 123-4567" 
                              className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="h-12 border-gray-300 focus:border-black focus:ring-black" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-black hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 text-white"
                      disabled={isRegistering}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0 font-medium text-black hover:text-gray-800" 
                      onClick={() => setActiveTab("login")}
                    >
                      Sign in
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;