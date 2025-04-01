import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO, isValid } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, User, Phone, Mail, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";

// Define types
type Appointment = {
  id: number;
  serviceRequestId: number;
  userId: number;
  technicianId: number | null;
  technicianName: string | null;
  technicianPhone: string | null;
  scheduledDate: string;
  timeSlot: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: string;
  serviceType: string;
  issueType: string;
  notes: string | null;
  reminderSent: boolean;
  reminderScheduled: string | null;
  previousAppointmentId: number | null;
  createdAt: string;
  updatedAt: string;
};

type ServiceRequest = {
  id: number;
  serviceType: string;
  issueType: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

type User = {
  id: number;
  name: string;
  phone: string;
  role: string;
};

const AppointmentCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>('morning');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | undefined>();
  const [selectedServiceRequestId, setSelectedServiceRequestId] = useState<number | undefined>();
  const [notes, setNotes] = useState<string>('');
  const [rescheduleDetails, setRescheduleDetails] = useState({
    scheduledDate: '',
    timeSlot: 'morning',
    startTime: '',
    endTime: '',
    reason: '',
    technicianId: ''
  });
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Get date range for current view
  const startDate = view === 'month' 
    ? new Date(date.getFullYear(), date.getMonth(), 1)
    : view === 'week'
      ? startOfWeek(date)
      : date;
      
  const endDate = view === 'month'
    ? new Date(date.getFullYear(), date.getMonth() + 1, 0)
    : view === 'week'
      ? addDays(startOfWeek(date), 6)
      : date;
  
  // Format dates for API
  const formattedStartDate = format(startDate, 'yyyy-MM-dd');
  const formattedEndDate = format(endDate, 'yyyy-MM-dd');

  // Fetch appointments for the current view
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments
  } = useQuery({
    queryKey: ['/api/appointments/range', formattedStartDate, formattedEndDate],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/appointments/range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
      return await res.json();
    }
  });

  // Fetch technicians for appointment assignment
  const {
    data: technicians = [],
    isLoading: isLoadingTechnicians
  } = useQuery({
    queryKey: ['/api/users/technicians'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users/technicians');
      return await res.json();
    },
    enabled: user?.role === 'admin' || user?.role === 'owner',
  });

  // Fetch service requests for appointment creation
  const {
    data: serviceRequests = [],
    isLoading: isLoadingServiceRequests
  } = useQuery({
    queryKey: ['/api/service-requests/available'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/service-requests/available');
      return await res.json();
    },
    enabled: user?.role === 'admin' || user?.role === 'owner',
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/appointments/${selectedAppointment?.id}/reschedule`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment rescheduled",
        description: "The appointment has been successfully rescheduled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      setIsRescheduleOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast({
          title: "Scheduling conflict",
          description: "The selected time conflicts with another appointment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reschedule appointment. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/appointments/${selectedAppointment?.id}/cancel`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      setIsCancelOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/appointments', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment created",
        description: "The appointment has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
      setIsCreateOpen(false);
      setSelectedDate(new Date());
      setTimeSlot('morning');
      setStartTime('09:00');
      setEndTime('12:00');
      setSelectedTechnicianId(undefined);
      setSelectedServiceRequestId(undefined);
      setNotes('');
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast({
          title: "Scheduling conflict",
          description: "The selected time conflicts with another appointment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create appointment. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Contact technician mutation
  const contactTechnicianMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/appointments/${selectedAppointment?.id}/contact-technician`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "The technician has been notified and will contact you soon.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to contact technician. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Process reminders mutation (admin only)
  const processRemindersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/appointments/process-reminders');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reminders processed",
        description: `Successfully processed ${data.processed} reminder(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/range'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process reminders. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle date navigation
  const handleDateChange = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
      setDate(newDate);
    } else if (view === 'week') {
      setDate(direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1));
    } else {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
      setDate(newDate);
    }
  };

  // Handle appointment selection
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  // Handle reschedule form submission
  const handleReschedule = () => {
    if (!rescheduleDetails.scheduledDate || !isValid(parseISO(rescheduleDetails.scheduledDate))) {
      toast({
        title: "Invalid date",
        description: "Please select a valid date for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    rescheduleAppointmentMutation.mutate({
      scheduledDate: rescheduleDetails.scheduledDate,
      timeSlot: rescheduleDetails.timeSlot,
      startTime: rescheduleDetails.startTime || undefined,
      endTime: rescheduleDetails.endTime || undefined,
      technicianId: rescheduleDetails.technicianId ? parseInt(rescheduleDetails.technicianId) : undefined,
      reason: rescheduleDetails.reason
    });
  };

  // Handle cancel form submission
  const handleCancel = () => {
    cancelAppointmentMutation.mutate({
      reason: cancelReason
    });
  };

  // Handle create form submission
  const handleCreateAppointment = () => {
    if (!selectedDate || !selectedServiceRequestId) {
      toast({
        title: "Missing information",
        description: "Please select a date and service request.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      serviceRequestId: selectedServiceRequestId,
      scheduledDate: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot,
      startTime,
      endTime,
      technicianId: selectedTechnicianId,
      notes,
      serviceType: serviceRequests.find((sr: ServiceRequest) => sr.id === selectedServiceRequestId)?.serviceType || '',
      issueType: serviceRequests.find((sr: ServiceRequest) => sr.id === selectedServiceRequestId)?.issueType || ''
    });
  };

  // Open reschedule dialog with appointment details pre-filled
  const openRescheduleDialog = () => {
    if (!selectedAppointment) return;
    
    setRescheduleDetails({
      scheduledDate: format(new Date(selectedAppointment.scheduledDate), 'yyyy-MM-dd'),
      timeSlot: selectedAppointment.timeSlot,
      startTime: selectedAppointment.startTime || '',
      endTime: selectedAppointment.endTime || '',
      reason: '',
      technicianId: selectedAppointment.technicianId?.toString() || ''
    });
    
    setIsDetailsOpen(false);
    setIsRescheduleOpen(true);
  };

  // Open cancel dialog
  const openCancelDialog = () => {
    setIsDetailsOpen(false);
    setIsCancelOpen(true);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge className="bg-amber-500">Rescheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get time slot display
  const getTimeSlotDisplay = (timeSlot: string) => {
    switch(timeSlot) {
      case 'morning':
        return 'Morning (8am - 12pm)';
      case 'afternoon':
        return 'Afternoon (12pm - 5pm)';
      case 'evening':
        return 'Evening (5pm - 8pm)';
      case 'anytime':
        return 'Anytime';
      default:
        return timeSlot;
    }
  };

  // Generate calendar day cells with appointments
  const renderDayCell = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointments.filter(
      (appointment: Appointment) => format(new Date(appointment.scheduledDate), 'yyyy-MM-dd') === formattedDay
    );

    return (
      <div 
        className={`h-24 border p-1 overflow-y-auto ${
          isSameDay(day, new Date()) ? 'bg-blue-50' : ''
        }`}
      >
        <div className="text-xs font-semibold">{format(day, 'd')}</div>
        <div className="mt-1">
          {dayAppointments.map((appointment: Appointment) => (
            <div 
              key={appointment.id}
              className={`text-xs p-1 mb-1 rounded cursor-pointer truncate ${
                appointment.status === 'cancelled' 
                  ? 'bg-red-100 line-through'
                  : appointment.status === 'completed'
                    ? 'bg-green-100'
                    : 'bg-blue-100'
              }`}
              onClick={() => handleAppointmentClick(appointment)}
            >
              {appointment.timeSlot} - {appointment.serviceType}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointment Calendar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            New Appointment
          </Button>
          <Select value={view} onValueChange={(value) => setView(value as 'day' | 'week' | 'month')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {view === 'month' 
                ? format(date, 'MMMM yyyy') 
                : view === 'week'
                  ? `Week of ${format(startOfWeek(date), 'MMM d')} - ${format(addDays(startOfWeek(date), 6), 'MMM d, yyyy')}`
                  : format(date, 'EEEE, MMMM d, yyyy')
              }
            </CardTitle>
            <CardDescription>
              {isLoadingAppointments 
                ? 'Loading appointments...' 
                : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`
              }
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleDateChange('prev')}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDateChange('next')}>
              Next
            </Button>
            {(user?.role === 'admin' || user?.role === 'owner') && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => processRemindersMutation.mutate()}
                disabled={processRemindersMutation.isPending}
              >
                {processRemindersMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Reminders
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : appointmentsError ? (
            <div className="text-center text-red-500 p-4">
              Failed to load appointments. Please try again.
            </div>
          ) : view === 'month' ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-medium p-2 bg-gray-100">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: 42 }).map((_, index) => {
                const currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
                currentDate.setDate(1 - currentDate.getDay() + index);
                
                // If the day is from previous or next month, hide appointments
                const isCurrentMonth = currentDate.getMonth() === date.getMonth();
                
                return (
                  <div 
                    key={index} 
                    className={`${isCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    {renderDayCell(currentDate)}
                  </div>
                );
              })}
            </div>
          ) : view === 'week' ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(startOfWeek(date), index);
                return (
                  <div key={index} className="text-center font-medium p-2 bg-gray-100">
                    {format(day, 'EEE, MMM d')}
                  </div>
                );
              })}
              
              {/* Week days */}
              {Array.from({ length: 7 }).map((_, index) => {
                const day = addDays(startOfWeek(date), index);
                return renderDayCell(day);
              })}
            </div>
          ) : (
            <div>
              <div className="font-medium mb-4 text-center">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {['morning', 'afternoon', 'evening'].map(slot => {
                  const slotAppointments = appointments.filter(
                    (appointment: Appointment) => 
                      format(new Date(appointment.scheduledDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
                      appointment.timeSlot === slot
                  );
                  
                  return (
                    <div key={slot} className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">{getTimeSlotDisplay(slot)}</h3>
                      {slotAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {slotAppointments.map((appointment: Appointment) => (
                            <div 
                              key={appointment.id}
                              className={`p-3 rounded-md cursor-pointer ${
                                appointment.status === 'cancelled' 
                                  ? 'bg-red-50 border-red-200 border'
                                  : appointment.status === 'completed'
                                    ? 'bg-green-50 border-green-200 border'
                                    : 'bg-blue-50 border-blue-200 border'
                              }`}
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium">{appointment.serviceType}</div>
                                {getStatusBadge(appointment.status)}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {appointment.startTime && appointment.endTime 
                                  ? `${appointment.startTime} - ${appointment.endTime}`
                                  : getTimeSlotDisplay(appointment.timeSlot)
                                }
                              </div>
                              <div className="text-sm mt-1 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {appointment.technicianName || 'Unassigned'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm italic">No appointments scheduled</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>Appointment Details</span>
                  {getStatusBadge(selectedAppointment.status)}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedAppointment.scheduledDate), 'EEEE, MMMM d, yyyy')} - {getTimeSlotDisplay(selectedAppointment.timeSlot)}
                  {selectedAppointment.startTime && selectedAppointment.endTime && (
                    <span> ({selectedAppointment.startTime} - {selectedAppointment.endTime})</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-1">Service Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedAppointment.serviceType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedAppointment.issueType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Created: {format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {selectedAppointment.reminderSent && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Reminder sent</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-1">Technician</h3>
                  {selectedAppointment.technicianName ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedAppointment.technicianName}</span>
                      </div>
                      {selectedAppointment.technicianPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedAppointment.technicianPhone}</span>
                        </div>
                      )}
                      {user?.role === 'client' && selectedAppointment.technicianPhone && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2" 
                          onClick={() => contactTechnicianMutation.mutate()}
                          disabled={contactTechnicianMutation.isPending}
                        >
                          {contactTechnicianMutation.isPending && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          Contact Technician
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No technician assigned yet</div>
                  )}
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-1">Notes</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded-md whitespace-pre-line">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between sm:justify-between">
                <div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/service-requests/${selectedAppointment.serviceRequestId}`)}
                  >
                    View Service Request
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <>
                      <Button variant="outline" size="sm" onClick={openRescheduleDialog}>
                        Reschedule
                      </Button>
                      <Button variant="destructive" size="sm" onClick={openCancelDialog}>
                        Cancel
                      </Button>
                    </>
                  )}
                  <Button variant="default" size="sm" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Change the date and time for this appointment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                type="date"
                id="scheduledDate"
                min={format(new Date(), 'yyyy-MM-dd')}
                value={rescheduleDetails.scheduledDate}
                onChange={(e) => setRescheduleDetails({...rescheduleDetails, scheduledDate: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeSlot">Time Slot</Label>
              <Select
                value={rescheduleDetails.timeSlot}
                onValueChange={(value) => setRescheduleDetails({...rescheduleDetails, timeSlot: value})}
              >
                <SelectTrigger id="timeSlot">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time (optional)</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={rescheduleDetails.startTime}
                  onChange={(e) => setRescheduleDetails({...rescheduleDetails, startTime: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={rescheduleDetails.endTime}
                  onChange={(e) => setRescheduleDetails({...rescheduleDetails, endTime: e.target.value})}
                />
              </div>
            </div>
            {(user?.role === 'admin' || user?.role === 'owner') && (
              <div className="grid gap-2">
                <Label htmlFor="technician">Technician</Label>
                <Select
                  value={rescheduleDetails.technicianId}
                  onValueChange={(value) => setRescheduleDetails({...rescheduleDetails, technicianId: value})}
                >
                  <SelectTrigger id="technician">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {technicians.map((tech: User) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Rescheduling</Label>
              <Textarea
                id="reason"
                rows={3}
                placeholder="Please provide a reason for rescheduling"
                value={rescheduleDetails.reason}
                onChange={(e) => setRescheduleDetails({...rescheduleDetails, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={rescheduleAppointmentMutation.isPending}
            >
              {rescheduleAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reschedule Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                rows={3}
                placeholder="Please provide a reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelAppointmentMutation.isPending}
            >
              {cancelAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a service request
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceRequest">Service Request</Label>
              <Select
                value={selectedServiceRequestId?.toString()}
                onValueChange={(value) => setSelectedServiceRequestId(parseInt(value))}
              >
                <SelectTrigger id="serviceRequest">
                  <SelectValue placeholder="Select service request" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingServiceRequests ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : serviceRequests.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No available service requests</div>
                  ) : (
                    serviceRequests.map((request: ServiceRequest) => (
                      <SelectItem key={request.id} value={request.id.toString()}>
                        {request.id} - {request.serviceType} ({request.name})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createTimeSlot">Time Slot</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger id="createTimeSlot">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
                  <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="createStartTime">Start Time (optional)</Label>
                <Input
                  type="time"
                  id="createStartTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="createEndTime">End Time (optional)</Label>
                <Input
                  type="time"
                  id="createEndTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            {(user?.role === 'admin' || user?.role === 'owner') && (
              <div className="grid gap-2">
                <Label htmlFor="createTechnician">Technician (optional)</Label>
                <Select
                  value={selectedTechnicianId?.toString()}
                  onValueChange={(value) => setSelectedTechnicianId(value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger id="createTechnician">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {isLoadingTechnicians ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      technicians.map((tech: User) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="createNotes">Notes (optional)</Label>
              <Textarea
                id="createNotes"
                rows={3}
                placeholder="Add any notes about this appointment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentCalendar;