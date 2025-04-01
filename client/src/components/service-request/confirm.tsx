import { format } from "date-fns";
import { Zap, Droplet, User, Phone, Mail, MapPin, CalendarDays, Clock, Info, CheckCircle } from "lucide-react";

interface ConfirmProps {
  formData: {
    serviceType: string;
    issueType: string;
    urgency: string;
    propertyType: string;
    description: string;
    previousIssue: boolean;
    name: string;
    phone: string;
    email: string;
    address: string;
    preferredDate: string;
    preferredTime: string;
  };
}

const Confirm = ({ formData }: ConfirmProps) => {
  // Function to map property type value to display text
  const getPropertyTypeDisplay = (value: string): string => {
    const propertyTypes: Record<string, string> = {
      "residential-house": "Residential - House",
      "residential-apartment": "Residential - Apartment",
      "commercial-office": "Commercial - Office",
      "commercial-retail": "Commercial - Retail",
      "industrial": "Industrial",
      "other": "Other"
    };
    return propertyTypes[value] || value;
  };
  
  // Function to map urgency value to display text
  const getUrgencyDisplay = (value: string): string => {
    const urgencyLevels: Record<string, string> = {
      "emergency": "Emergency - Need service immediately",
      "urgent": "Urgent - Within 24 hours",
      "standard": "Standard - Within a few days",
      "flexible": "Flexible - Anytime in the next 2 weeks"
    };
    return urgencyLevels[value] || value;
  };
  
  // Function to map time value to display text
  const getTimeDisplay = (value: string): string => {
    const times: Record<string, string> = {
      "morning": "Morning (8:00 AM - 12:00 PM)",
      "afternoon": "Afternoon (12:00 PM - 4:00 PM)",
      "evening": "Evening (4:00 PM - 7:00 PM)",
      "anytime": "Anytime"
    };
    return times[value] || value;
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-neutral-700 mb-2">
        Confirm Service Request
      </h2>
      <p className="text-neutral-600 mb-6">
        Please review your service request details before submitting.
      </p>
      
      <div className="space-y-6">
        {/* Service Details */}
        <div className="bg-neutral-50 p-4 rounded-lg">
          <h3 className="font-medium text-neutral-800 mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary" />
            Service Details
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              {formData.serviceType === "electrical" ? (
                <Zap className="h-5 w-5 mr-2 text-primary" />
              ) : formData.serviceType === "plumbing" ? (
                <Droplet className="h-5 w-5 mr-2 text-secondary-500" />
              ) : (
                <div className="flex mr-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <Droplet className="h-5 w-5 text-secondary-500" />
                </div>
              )}
              <div>
                <span className="text-sm text-neutral-500">Service Type:</span>
                <span className="ml-2 font-medium capitalize">{formData.serviceType}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Issue Type:</span>
                <span className="ml-2 font-medium">{formData.issueType}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Urgency:</span>
                <span className="ml-2 font-medium">{getUrgencyDisplay(formData.urgency)}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Property Type:</span>
                <span className="ml-2 font-medium">{getPropertyTypeDisplay(formData.propertyType)}</span>
              </div>
            </div>
            
            {formData.description && (
              <div className="pt-2">
                <span className="text-sm text-neutral-500 block mb-1">Description:</span>
                <p className="text-neutral-700 bg-white p-3 rounded border border-neutral-200">
                  {formData.description}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-neutral-50 p-4 rounded-lg">
          <h3 className="font-medium text-neutral-800 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary" />
            Contact Information
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Name:</span>
                <span className="ml-2 font-medium">{formData.name}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Phone:</span>
                <span className="ml-2 font-medium">{formData.phone}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Email:</span>
                <span className="ml-2 font-medium">{formData.email}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Address:</span>
                <span className="ml-2 font-medium">{formData.address}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferred Schedule */}
        <div className="bg-neutral-50 p-4 rounded-lg">
          <h3 className="font-medium text-neutral-800 mb-3 flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-primary" />
            Preferred Schedule
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Date:</span>
                <span className="ml-2 font-medium">
                  {formData.preferredDate 
                    ? format(new Date(formData.preferredDate), "EEEE, MMMM d, yyyy")
                    : "Not specified"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-neutral-600" />
              <div>
                <span className="text-sm text-neutral-500">Time:</span>
                <span className="ml-2 font-medium">
                  {formData.preferredTime 
                    ? getTimeDisplay(formData.preferredTime)
                    : "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-neutral-600 mt-4">
          <p>
            By submitting this request, you agree to our terms of service and privacy policy.
            We'll contact you shortly to confirm your appointment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
