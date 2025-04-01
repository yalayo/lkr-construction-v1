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
    <div className="container flex items-center justify-center min-h-[calc(100vh-12rem)] py-8">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-lg rounded-lg overflow-hidden">
        {/* Left side - Auth forms */}
        <div className="w-full md:w-1/2 p-6 bg-white">
          <div className="mb-8 text-center">
            <div className="flex justify-center items-center mb-2">
              <Zap className="h-6 w-6 text-primary mr-1" />
              <Droplet className="h-6 w-6 text-secondary-500 mr-2" />
              <span className="font-semibold text-2xl text-neutral-800">ElecPlumb</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome to ElecPlumb</h1>
            <p className="text-neutral-600 mt-1">Your trusted service partner in Lake Charles</p>
          </div>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-neutral-600">
                    Don't have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register now
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Fill out the form below to create your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
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
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe123" {...field} />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john@example.com" {...field} />
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(337) 123-4567" {...field} />
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
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
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
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
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
                </CardContent>
                <CardFooter className="flex justify-center">
                  <p className="text-sm text-neutral-600">
                    Already have an account?{" "}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login instead
                    </Button>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side - Hero/Info */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary-600 to-secondary-600 text-white p-12 flex items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Expert Electrical & Plumbing Services</h2>
            <p className="mb-6">
              Join ElecPlumb for reliable electrical and plumbing services in Lake Charles, Louisiana. Our skilled technicians provide prompt, professional service to meet all your home maintenance needs.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <Zap className="h-5 w-5 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium">Professional Electrical Services</h3>
                  <p className="text-sm opacity-80">From circuit repairs to complete installations</p>
                </div>
              </div>
              <div className="flex items-start">
                <Droplet className="h-5 w-5 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium">Expert Plumbing Solutions</h3>
                  <p className="text-sm opacity-80">Fixing leaks, clogs, and complete bathroom renovations</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 mr-2 mt-1" />
                <div>
                  <h3 className="font-medium">Quick Response Times</h3>
                  <p className="text-sm opacity-80">Emergency services available when you need them most</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
