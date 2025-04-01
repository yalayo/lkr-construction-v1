import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";

interface ServiceDetailsProps {
  formData: {
    serviceType: string;
    issueType: string;
    urgency: string;
    propertyType: string;
    description: string;
    previousIssue: boolean;
  };
  updateFormData: (data: Partial<ServiceDetailsProps["formData"]>) => void;
}

const ServiceDetails = ({ formData, updateFormData }: ServiceDetailsProps) => {
  const [issueOptions, setIssueOptions] = useState<string[]>([]);
  
  // Set issue options based on service type
  useEffect(() => {
    if (formData.serviceType === "electrical") {
      setIssueOptions([
        "Power outage",
        "Flickering lights",
        "Circuit breaker issues",
        "Outlet not working",
        "New installation",
        "Electrical inspection",
        "Other electrical issue"
      ]);
    } else if (formData.serviceType === "plumbing") {
      setIssueOptions([
        "Clogged drain",
        "Leaking pipe",
        "Water heater issue",
        "Toilet problems",
        "Low water pressure",
        "Fixture installation",
        "Other plumbing issue"
      ]);
    } else if (formData.serviceType === "both") {
      setIssueOptions([
        "Multiple issues",
        "Bathroom renovation",
        "Kitchen renovation",
        "New construction",
        "Home inspection",
        "Other combined issues"
      ]);
    }
  }, [formData.serviceType]);

  return (
    <div>
      <h2 className="text-xl font-bold text-black mb-4">
        Tell us about your {formData.serviceType === "both" ? "issues" : `${formData.serviceType} issue`}
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="issue_type" className="block text-sm font-bold text-black mb-1">
            What type of issue are you experiencing?
          </Label>
          <Select
            value={formData.issueType}
            onValueChange={(value) => updateFormData({ issueType: value })}
          >
            <SelectTrigger className="w-full text-black border-gray-500 focus:border-black">
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent className="text-black">
              {issueOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="urgency" className="block text-sm font-bold text-black mb-1">
            How urgent is this issue?
          </Label>
          <Select
            value={formData.urgency}
            onValueChange={(value) => updateFormData({ urgency: value })}
          >
            <SelectTrigger className="w-full text-black border-gray-500 focus:border-black">
              <SelectValue placeholder="Select urgency level" />
            </SelectTrigger>
            <SelectContent className="text-black">
              <SelectItem value="emergency">Emergency - Need service immediately</SelectItem>
              <SelectItem value="urgent">Urgent - Within 24 hours</SelectItem>
              <SelectItem value="standard">Standard - Within a few days</SelectItem>
              <SelectItem value="flexible">Flexible - Anytime in the next 2 weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="property_type" className="block text-sm font-bold text-black mb-1">
            Property type
          </Label>
          <Select
            value={formData.propertyType}
            onValueChange={(value) => updateFormData({ propertyType: value })}
          >
            <SelectTrigger className="w-full text-black border-gray-500 focus:border-black">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent className="text-black">
              <SelectItem value="residential-house">Residential - House</SelectItem>
              <SelectItem value="residential-apartment">Residential - Apartment</SelectItem>
              <SelectItem value="commercial-office">Commercial - Office</SelectItem>
              <SelectItem value="commercial-retail">Commercial - Retail</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="description" className="block text-sm font-bold text-black mb-1">
            Please describe the issue in more detail
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={4}
            placeholder="Please provide any additional details that might help us understand your issue better..."
            className="w-full rounded-md border-gray-500 shadow-sm focus:border-black text-black"
          />
        </div>
        
        <div>
          <Label className="block text-sm font-bold text-black mb-1">
            Have you experienced this issue before?
          </Label>
          <RadioGroup
            value={formData.previousIssue ? "yes" : "no"}
            onValueChange={(value) => updateFormData({ previousIssue: value === "yes" })}
            className="flex items-center"
          >
            <div className="flex items-center mr-6">
              <RadioGroupItem id="previous_yes" value="yes" className="mr-2 text-black border-black" />
              <Label htmlFor="previous_yes" className="text-sm font-medium text-black">Yes</Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem id="previous_no" value="no" className="mr-2 text-black border-black" />
              <Label htmlFor="previous_no" className="text-sm font-medium text-black">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
