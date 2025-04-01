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
      <h2 className="text-xl font-bold text-black mb-4">Select Service Type</h2>
      <p className="text-black mb-6">
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
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-black hover:bg-gray-100 ${
              formData.serviceType === "electrical"
                ? "border-black bg-gray-100"
                : "border-gray-500"
            }`}
          >
            <div className="service-icon mb-3 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-black">
              <Zap className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-black">Electrical</h3>
              <p className="text-sm text-black mt-1">
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
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-black hover:bg-gray-100 ${
              formData.serviceType === "plumbing"
                ? "border-black bg-gray-100"
                : "border-gray-500"
            }`}
          >
            <div className="service-icon mb-3 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-black">
              <Droplet className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-black">Plumbing</h3>
              <p className="text-sm text-black mt-1">
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
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all hover:border-black hover:bg-gray-100 ${
              formData.serviceType === "both"
                ? "border-black bg-gray-100"
                : "border-gray-500"
            }`}
          >
            <div className="service-icon mb-3 flex">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-black -mr-3 z-10">
                <Zap className="h-8 w-8" />
              </div>
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-black">
                <Droplet className="h-8 w-8" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-black">Both Services</h3>
              <p className="text-sm text-black mt-1">
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
