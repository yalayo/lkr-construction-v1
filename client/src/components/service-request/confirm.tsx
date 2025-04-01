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
      <h2 className="text-xl font-bold text-black mb-2">
        Confirm Service Request
      </h2>
      <p className="text-black mb-6">
        Please review your service request details before submitting.
      </p>
      
      <div className="space-y-6">
        {/* Service Details */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h3 className="font-bold text-black mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2 text-black" />
            Service Details
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              {formData.serviceType === "electrical" ? (
                <Zap className="h-5 w-5 mr-2 text-black" />
              ) : formData.serviceType === "plumbing" ? (
                <Droplet className="h-5 w-5 mr-2 text-black" />
              ) : (
                <div className="flex mr-2">
                  <Zap className="h-5 w-5 text-black" />
                  <Droplet className="h-5 w-5 text-black" />
                </div>
              )}
              <div>
                <span className="text-sm font-bold text-black">Service Type:</span>
                <span className="ml-2 font-medium text-black capitalize">{formData.serviceType}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Issue Type:</span>
                <span className="ml-2 font-medium text-black">{formData.issueType}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Urgency:</span>
                <span className="ml-2 font-medium text-black">{getUrgencyDisplay(formData.urgency)}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Property Type:</span>
                <span className="ml-2 font-medium text-black">{getPropertyTypeDisplay(formData.propertyType)}</span>
              </div>
            </div>
            
            {formData.description && (
              <div className="pt-2">
                <span className="text-sm font-bold text-black block mb-1">Description:</span>
                <p className="text-black bg-white p-3 rounded border border-gray-300">
                  {formData.description}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h3 className="font-bold text-black mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-black" />
            Contact Information
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Name:</span>
                <span className="ml-2 font-medium text-black">{formData.name}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Phone:</span>
                <span className="ml-2 font-medium text-black">{formData.phone}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Email:</span>
                <span className="ml-2 font-medium text-black">{formData.email}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Address:</span>
                <span className="ml-2 font-medium text-black">{formData.address}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Preferred Schedule */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h3 className="font-bold text-black mb-3 flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-black" />
            Preferred Schedule
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Date:</span>
                <span className="ml-2 font-medium text-black">
                  {formData.preferredDate 
                    ? format(new Date(formData.preferredDate), "EEEE, MMMM d, yyyy")
                    : "Not specified"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-black" />
              <div>
                <span className="text-sm font-bold text-black">Time:</span>
                <span className="ml-2 font-medium text-black">
                  {formData.preferredTime 
                    ? getTimeDisplay(formData.preferredTime)
                    : "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-black font-medium mt-4">
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
