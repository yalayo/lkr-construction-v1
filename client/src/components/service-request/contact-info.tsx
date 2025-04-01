import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface ContactInfoProps {
  formData: {
    name: string;
    phone: string;
    email: string;
    address: string;
    preferredDate: string;
    preferredTime: string;
  };
  updateFormData: (data: Partial<ContactInfoProps["formData"]>) => void;
}

const ContactInfo = ({ formData, updateFormData }: ContactInfoProps) => {
  const { user } = useAuth();
  
  // Auto-fill user data if available
  useEffect(() => {
    if (user) {
      updateFormData({
        name: user.name || formData.name,
        phone: user.phone || formData.phone,
        email: user.email || formData.email,
      });
    }
  }, [user]);

  // Convert stored date string to Date object for calendar
  const dateValue = formData.preferredDate ? new Date(formData.preferredDate) : undefined;
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateFormData({ preferredDate: date.toISOString() });
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-neutral-700 mb-4">
        Contact Information
      </h2>
      <p className="text-neutral-600 mb-6">
        Please provide your contact details and preferred appointment time.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="John Doe"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              placeholder="(337) 123-4567"
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="john@example.com"
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">
            Service Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="1234 Street, Lake Charles, LA 70601"
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="preferred_date" className="block text-sm font-medium text-neutral-700 mb-1">
              Preferred Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.preferredDate ? (
                    format(new Date(formData.preferredDate), "PPP")
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 2))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label htmlFor="preferred_time" className="block text-sm font-medium text-neutral-700 mb-1">
              Preferred Time
            </Label>
            <Select
              value={formData.preferredTime}
              onValueChange={(value) => updateFormData({ preferredTime: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12:00 PM - 4:00 PM)</SelectItem>
                <SelectItem value="evening">Evening (4:00 PM - 7:00 PM)</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
