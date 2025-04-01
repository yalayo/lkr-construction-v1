import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Zap, Droplet, CheckCircle } from "lucide-react";

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
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="relative">
          <RadioGroupItem 
            value="electrical" 
            id="electrical" 
            className="sr-only" 
          />
          <Label
            htmlFor="electrical"
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-3 rounded-lg shadow transition-all hover:border-black hover:bg-gray-50 ${
              formData.serviceType === "electrical"
                ? "border-black bg-gray-50 ring-4 ring-black ring-opacity-20"
                : "border-gray-400"
            }`}
          >
            {formData.serviceType === "electrical" && (
              <div className="absolute top-3 right-3 text-green-600">
                <CheckCircle className="h-6 w-6 fill-green-100" />
              </div>
            )}
            <div className={`service-icon mb-4 h-20 w-20 rounded-full flex items-center justify-center ${
              formData.serviceType === "electrical" 
                ? "bg-primary text-white" 
                : "bg-gray-200 text-black"
            }`}>
              <Zap className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl text-black">Electrical</h3>
              <p className="text-sm text-black mt-2">
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
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-3 rounded-lg shadow transition-all hover:border-black hover:bg-gray-50 ${
              formData.serviceType === "plumbing"
                ? "border-black bg-gray-50 ring-4 ring-black ring-opacity-20"
                : "border-gray-400"
            }`}
          >
            {formData.serviceType === "plumbing" && (
              <div className="absolute top-3 right-3 text-green-600">
                <CheckCircle className="h-6 w-6 fill-green-100" />
              </div>
            )}
            <div className={`service-icon mb-4 h-20 w-20 rounded-full flex items-center justify-center ${
              formData.serviceType === "plumbing" 
                ? "bg-primary text-white" 
                : "bg-gray-200 text-black"
            }`}>
              <Droplet className="h-10 w-10" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl text-black">Plumbing</h3>
              <p className="text-sm text-black mt-2">
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
            className={`cursor-pointer flex flex-col items-center justify-center p-6 border-3 rounded-lg shadow transition-all hover:border-black hover:bg-gray-50 ${
              formData.serviceType === "both"
                ? "border-black bg-gray-50 ring-4 ring-black ring-opacity-20"
                : "border-gray-400"
            }`}
          >
            {formData.serviceType === "both" && (
              <div className="absolute top-3 right-3 text-green-600">
                <CheckCircle className="h-6 w-6 fill-green-100" />
              </div>
            )}
            <div className="service-icon mb-4 flex">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center -mr-4 z-10 ${
                formData.serviceType === "both" 
                  ? "bg-primary text-white" 
                  : "bg-gray-200 text-black"
              }`}>
                <Zap className="h-10 w-10" />
              </div>
              <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                formData.serviceType === "both" 
                  ? "bg-primary text-white" 
                  : "bg-gray-200 text-black"
              }`}>
                <Droplet className="h-10 w-10" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xl text-black">Both Services</h3>
              <p className="text-sm text-black mt-2">
                Need help with both electrical and plumbing issues
              </p>
            </div>
          </Label>
        </div>
      </RadioGroup>
      
      {formData.serviceType && (
        <div className="mt-6 text-center text-green-600 font-medium">
          You selected: <span className="font-bold capitalize">{formData.serviceType}</span> service
        </div>
      )}
    </div>
  );
};

export default ServiceType;
