import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import ServiceType from "@/components/service-request/service-type";
import ServiceDetails from "@/components/service-request/service-details";
import ContactInfo from "@/components/service-request/contact-info";
import Confirm from "@/components/service-request/confirm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const steps = [
  { id: 1, title: "Service Type" },
  { id: 2, title: "Details" },
  { id: 3, title: "Contact" },
  { id: 4, title: "Confirm" },
];

const HomePage = () => {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: "",
    issueType: "",
    urgency: "",
    propertyType: "",
    description: "",
    previousIssue: false,
    name: "",
    phone: "",
    email: "",
    address: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect logged-in users to their appropriate dashboard
  useEffect(() => {
    if (user) {
      console.log("User is logged in as:", user.role);
      if (user.role === "owner") {
        navigate("/owner-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "client") {
        navigate("/client-dashboard");
      }
    }
  }, [user, navigate]);

  // Set initial service type from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(search);
    const typeParam = urlParams.get("type");
    if (typeParam && ["electrical", "plumbing", "both"].includes(typeParam)) {
      setFormData(prev => ({ ...prev, serviceType: typeParam }));
    }
  }, [search]);

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.serviceType) {
      toast({
        title: "Please select a service type",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2 && (!formData.issueType || !formData.urgency || !formData.propertyType)) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 3 && (!formData.name || !formData.phone || !formData.email)) {
      toast({
        title: "Please provide contact information",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate that all required fields are filled
    if (!formData.serviceType || !formData.issueType || !formData.urgency || 
        !formData.propertyType || !formData.name || !formData.phone || 
        !formData.email || !formData.address) {
      toast({
        title: "Missing information",
        description: "Please ensure all required fields are filled in",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("Submitting service request:", formData);
      const response = await apiRequest("POST", "/api/service-requests", formData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit service request");
      }
      
      // Success - show toast and redirect
      toast({
        title: "Service request submitted successfully!",
        description: "We'll contact you shortly to confirm your appointment.",
      });
      
      // Invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests'] });
      
      // Reset form and go to first step
      setFormData({
        serviceType: "",
        issueType: "",
        urgency: "",
        propertyType: "",
        description: "",
        previousIssue: false,
        name: "",
        phone: "",
        email: "",
        address: "",
        preferredDate: "",
        preferredTime: "",
      });
      setCurrentStep(1);
    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "Error submitting request",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceType formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <ServiceDetails formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <ContactInfo formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Confirm formData={formData} />;
      default:
        return null;
    }
  };

  // Show loading state while authentication check is in progress
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-black mb-6">Request a Service</h1>
          
          {/* Progress Steps */}
          <div className="relative flex justify-between mb-8 px-4 sm:px-8">
            {/* Horizontal Line - Background (light gray) */}
            <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-gray-300" style={{ zIndex: 0 }}></div>
            
            {/* Horizontal Line - Progress (dark) */}
            <div 
              className="absolute top-4 h-[2px] bg-black transition-all duration-300" 
              style={{ 
                zIndex: 0,
                left: '10%',
                width: `${(currentStep - 1) * (80 / (steps.length - 1))}%`,
              }}
            ></div>
            
            {/* Steps */}
            {steps.map((step) => (
              <div 
                key={step.id}
                className="flex flex-col items-center relative z-10"
                style={{ width: `${100 / steps.length}%` }}
              >
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 bg-white ${
                    step.id < currentStep 
                      ? "bg-black border-black text-white" 
                      : step.id === currentStep 
                        ? "border-black text-black" 
                        : "border-gray-400 text-black"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <span className={step.id === currentStep ? "font-bold" : ""}>{step.id}</span>
                  )}
                </div>
                <span 
                  className={`text-sm ${
                    step.id === currentStep 
                      ? "text-black font-bold" 
                      : "text-black"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`${currentStep === 1 ? "invisible" : ""} border-black text-black hover:bg-gray-100`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {currentStep < steps.length ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 text-lg"
              >
                {isSubmitting ? "Submitting..." : "SEND SERVICE REQUEST"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
