import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import ServiceType from "@/components/service-request/service-type";
import ServiceDetails from "@/components/service-request/service-details";
import ContactInfo from "@/components/service-request/contact-info";
import Confirm from "@/components/service-request/confirm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const steps = [
  { id: 1, title: "Service Type" },
  { id: 2, title: "Details" },
  { id: 3, title: "Contact" },
  { id: 4, title: "Confirm" },
];

const RequestService = () => {
  const search = useSearch();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    serviceType: "",
    issueType: "",
    urgency: "",
    propertyType: "",
    description: "",
    previousIssue: false,
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/service-requests", formData);
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
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        address: "",
        preferredDate: "",
        preferredTime: "",
      });
      setCurrentStep(1);
    } catch (error) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Request a Service</h1>
          
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 px-4 sm:px-8">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center w-1/4 relative ${
                  step.id < currentStep 
                    ? "after:bg-primary-500" 
                    : "after:bg-neutral-200"
                } ${
                  step.id !== steps.length 
                    ? "after:content-[''] after:h-[2px] after:w-full after:absolute after:top-4 after:left-1/2 after:z-0"
                    : ""
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 z-10 ${
                    step.id < currentStep 
                      ? "bg-primary-500 border-primary-500 text-white" 
                      : step.id === currentStep 
                        ? "border-primary-500 text-primary-500" 
                        : "border-neutral-300 text-neutral-400 bg-white"
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span 
                  className={`text-sm ${
                    step.id === currentStep 
                      ? "text-neutral-800 font-medium" 
                      : step.id < currentStep 
                        ? "text-neutral-600" 
                        : "text-neutral-400"
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
              className={currentStep === 1 ? "invisible" : ""}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestService;
