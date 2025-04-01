import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appointment } from "@shared/schema";
import { Calendar, Clock, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ClientAppointmentProps {
  appointment: Appointment;
}

const ClientAppointment = ({ appointment }: ClientAppointmentProps) => {
  const { toast } = useToast();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const handleReschedule = async () => {
    setIsRescheduling(true);
    try {
      // This would typically open a modal or navigate to a reschedule form
      toast({
        title: "Reschedule functionality",
        description: "This would open a reschedule form in a real implementation.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate rescheduling",
        variant: "destructive",
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleContactTechnician = async () => {
    setIsContacting(true);
    try {
      await apiRequest("POST", `/api/appointments/${appointment.id}/contact-technician`, {});
      toast({
        title: "Message sent",
        description: "The technician has been notified and will contact you shortly.",
      });
      
      // Refresh appointment data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to contact technician",
        variant: "destructive",
      });
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <Card className="bg-primary-50 border border-primary-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium text-neutral-800">Upcoming Appointment</h2>
            <p className="text-neutral-600 mb-2">
              {appointment.serviceType === "electrical" ? "Electrical Service" : 
               appointment.serviceType === "plumbing" ? "Plumbing Service" : 
               "Electrical & Plumbing Service"} - {appointment.issueType}
            </p>
            <div className="flex items-center">
              <Calendar className="text-primary mr-2 h-4 w-4" />
              <span className="text-neutral-700">
                {format(new Date(appointment.scheduledDate), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center mt-1">
              <Clock className="text-primary mr-2 h-4 w-4" />
              <span className="text-neutral-700">
                {appointment.timeSlot === "morning" ? "Morning (8:00 AM - 12:00 PM)" :
                 appointment.timeSlot === "afternoon" ? "Afternoon (12:00 PM - 4:00 PM)" :
                 appointment.timeSlot === "evening" ? "Evening (4:00 PM - 7:00 PM)" : "Anytime"}
              </span>
            </div>
            <div className="flex items-center mt-1">
              <User className="text-primary mr-2 h-4 w-4" />
              <span className="text-neutral-700">
                Technician: {appointment.technicianName}
              </span>
            </div>
            {appointment.technicianPhone && (
              <div className="flex items-center mt-1">
                <Phone className="text-primary mr-2 h-4 w-4" />
                <span className="text-neutral-700">
                  {appointment.technicianPhone}
                </span>
              </div>
            )}
          </div>
          <div className="bg-white py-2 px-3 rounded-md border border-primary-100">
            <div className="text-center">
              <span className="block text-sm text-neutral-500">Status</span>
              <span className="text-primary font-medium flex items-center justify-center">
                <Clock className="mr-1 h-4 w-4" /> Scheduled
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex">
          <Button 
            variant="outline" 
            className="mr-2 text-sm"
            onClick={handleReschedule}
            disabled={isRescheduling}
          >
            <Calendar className="mr-1 h-4 w-4" /> 
            {isRescheduling ? "Processing..." : "Reschedule"}
          </Button>
          <Button 
            className="text-sm"
            onClick={handleContactTechnician}
            disabled={isContacting}
          >
            <Phone className="mr-1 h-4 w-4" /> 
            {isContacting ? "Sending..." : "Contact Technician"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAppointment;
