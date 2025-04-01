import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Zap, Droplet } from "lucide-react";

interface ServiceTypeProps {
  formData: {
    serviceType: string;
  };
  updateFormData: (data: { serviceType: string }) => void;
}

const ServiceType = ({ formData, updateFormData }: ServiceTypeProps) => {
  const handleChange = (value: string) => {
    updateFormData({ serviceType: value });
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-neutral-700 mb-4">Select Service Type</h2>
      <p className="text-neutral-600 mb-6">
        Please select the type of service you need assistance with.
      </p>
      
      <RadioGroup 
        value={formData.serviceType} 
        onValueChange={handleChange}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative">
          <RadioGroupItem 
            value="electrical" 
            id="electrical" 
            className="sr-only" 
          />
          <Label
            htmlFor="electrical"
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-primary-300 hover:bg-primary-50 ${
              formData.serviceType === "electrical"
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200"
            }`}
          >
            <div className="service-icon mb-3 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-500">
              <Zap className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">Electrical</h3>
              <p className="text-sm text-neutral-800 mt-1">
                Wiring, circuits, outlets, lighting, and all electrical issues
              </p>
            </div>
          </Label>
        </div>
        
        <div className="relative">
          <RadioGroupItem 
            value="plumbing" 
            id="plumbing" 
            className="sr-only" 
          />
          <Label
            htmlFor="plumbing"
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-secondary-300 hover:bg-secondary-50 ${
              formData.serviceType === "plumbing"
                ? "border-secondary-500 bg-secondary-50"
                : "border-neutral-200"
            }`}
          >
            <div className="service-icon mb-3 h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500">
              <Droplet className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">Plumbing</h3>
              <p className="text-sm text-neutral-800 mt-1">
                Leaks, drains, fixtures, toilets, and all plumbing issues
              </p>
            </div>
          </Label>
        </div>
        
        <div className="relative">
          <RadioGroupItem 
            value="both" 
            id="both" 
            className="sr-only" 
          />
          <Label
            htmlFor="both"
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-neutral-400 hover:bg-neutral-50 ${
              formData.serviceType === "both"
                ? "border-neutral-500 bg-neutral-50"
                : "border-neutral-200"
            }`}
          >
            <div className="service-icon mb-3 flex">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 -mr-3 z-10">
                <Zap className="h-8 w-8" />
              </div>
              <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500">
                <Droplet className="h-8 w-8" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-medium text-lg">Both Services</h3>
              <p className="text-sm text-neutral-800 mt-1">
                Need help with both electrical and plumbing issues
              </p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ServiceType;
