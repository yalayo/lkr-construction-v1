import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Package
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define types for job data
type Job = {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: number;
  createdAt: string;
  scheduledDate: string | null;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  serviceType: string;
  issueType: string;
  propertyType: string;
  notes: string | null;
  technicianId: number | null;
  completionNotes: string | null;
  materialUsed: string | null;
};

// Type for job updates
type JobUpdate = {
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  completionNotes?: string;
  materialUsed?: string;
};

// Type for materials used in jobs
type Material = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("assigned");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updateData, setUpdateData] = useState<JobUpdate>({
    status: undefined,
    notes: "",
    completionNotes: "",
    materialUsed: ""
  });
  
  // Fetch assigned jobs
  const { data: assignedJobs, isLoading: isLoadingAssigned } = useQuery<Job[]>({
    queryKey: ['/api/technician/jobs/assigned'],
    retry: 1,
    enabled: !!user && user.role === 'technician',
  });
  
  // Fetch available jobs
  const { data: availableJobs, isLoading: isLoadingAvailable } = useQuery<Job[]>({
    queryKey: ['/api/technician/jobs/available'],
    retry: 1,
    enabled: !!user && user.role === 'technician',
  });
  
  // Fetch completed jobs
  const { data: completedJobs, isLoading: isLoadingCompleted } = useQuery<Job[]>({
    queryKey: ['/api/technician/jobs/completed'],
    retry: 1,
    enabled: !!user && user.role === 'technician',
  });
  
  // Mutation to update job status
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: JobUpdate }) => {
      const response = await fetch(`/api/service-requests/${id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job updated successfully",
        description: "The job status has been updated.",
      });
      // Invalidate queries to refresh job data
      queryClient.invalidateQueries({ queryKey: ['/api/technician/jobs/assigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technician/jobs/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technician/jobs/completed'] });
      // Close the dialog
      setIsUpdateDialogOpen(false);
      // Reset form data
      setUpdateData({
        status: undefined,
        notes: "",
        completionNotes: "",
        materialUsed: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to assign a job to self
  const assignJobMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/service-requests/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technicianId: user?.id }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to assign job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job assigned successfully",
        description: "You have been assigned to this job.",
      });
      // Invalidate queries to refresh job data
      queryClient.invalidateQueries({ queryKey: ['/api/technician/jobs/assigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/technician/jobs/available'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle job selection for viewing details
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
  };
  
  // Handle job status update
  const handleUpdateJob = () => {
    if (!selectedJob) return;
    
    // Filter out undefined fields
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== "")
    );
    
    if (Object.keys(filteredUpdateData).length === 0) {
      toast({
        title: "No changes to update",
        description: "Please make changes before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    updateJobMutation.mutate({ 
      id: selectedJob.id, 
      data: filteredUpdateData as JobUpdate 
    });
  };
  
  // Handle job assignment
  const handleAssignJob = (job: Job) => {
    assignJobMutation.mutate(job.id);
  };
  
  // Format a date string
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      return dateString;
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: number) => {
    if (priority >= 7) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>;
    } else if (priority >= 4) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
    }
  };
  
  // Filter jobs based on search query
  const filterJobs = (jobs: Job[] | undefined, query: string) => {
    if (!jobs || jobs.length === 0 || !query.trim()) {
      return jobs || [];
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return jobs.filter(job => 
      job.id.toString().includes(lowerQuery) ||
      job.clientName.toLowerCase().includes(lowerQuery) ||
      job.clientAddress.toLowerCase().includes(lowerQuery) ||
      job.serviceType.toLowerCase().includes(lowerQuery) ||
      job.issueType?.toLowerCase().includes(lowerQuery) ||
      (job.notes && job.notes.toLowerCase().includes(lowerQuery))
    );
  };
  
  // Get filtered job lists
  const filteredAssignedJobs = filterJobs(assignedJobs, searchQuery);
  const filteredAvailableJobs = filterJobs(availableJobs, searchQuery);
  const filteredCompletedJobs = filterJobs(completedJobs, searchQuery);
  
  // If not authenticated or not a technician
  if (!user || user.role !== 'technician') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You must be logged in as a technician to view this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingAssigned || isLoadingAvailable || isLoadingCompleted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Technician Dashboard</h1>
          <p className="text-gray-600">
            Manage your assigned jobs and track your progress
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full py-2 px-3">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {user.name?.[0] || "T"}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{user.name || "Technician"}</p>
              <p className="text-xs text-gray-500">{user.username}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Job Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned Jobs</p>
                <h3 className="text-3xl font-bold mt-1">{assignedJobs?.length || 0}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Jobs</p>
                <h3 className="text-3xl font-bold mt-1">{availableJobs?.length || 0}</h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Jobs</p>
                <h3 className="text-3xl font-bold mt-1">{completedJobs?.length || 0}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search jobs by ID, client, address, service type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchQuery("")}
            >
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="assigned" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            <span>Assigned Jobs {assignedJobs && assignedJobs.length > 0 && 
              <Badge variant="default" className="ml-2">{assignedJobs.length}</Badge>}
            </span>
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            <span>Available Jobs {availableJobs && availableJobs.length > 0 && 
              <Badge variant="default" className="ml-2">{availableJobs.length}</Badge>}
            </span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed Jobs</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <CardTitle>Your Assigned Jobs</CardTitle>
              <CardDescription>
                Jobs that have been assigned to you and need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAssignedJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignedJobs.map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">#{job.id}</TableCell>
                          <TableCell>{job.clientName}</TableCell>
                          <TableCell>{job.serviceType}</TableCell>
                          <TableCell>{getStatusBadge(job.status)}</TableCell>
                          <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                          <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectJob(job)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setUpdateData({
                                    status: job.status,
                                    notes: job.notes || "",
                                    completionNotes: job.completionNotes || "",
                                    materialUsed: job.materialUsed || ""
                                  });
                                  setIsUpdateDialogOpen(true);
                                }}
                              >
                                Update Status
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <ClipboardList className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No assigned jobs</h3>
                  <p className="text-gray-500 mb-4">You currently don't have any assigned jobs.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("available")}
                  >
                    Check Available Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>
                Jobs that need to be assigned to a technician
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAvailableJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableJobs.map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">#{job.id}</TableCell>
                          <TableCell>{job.clientName}</TableCell>
                          <TableCell>{job.serviceType}</TableCell>
                          <TableCell>{job.issueType}</TableCell>
                          <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                          <TableCell>{formatDate(job.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSelectJob(job)}
                              >
                                View Details
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleAssignJob(job)}
                                disabled={assignJobMutation.isPending}
                              >
                                {assignJobMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Assign to Me
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No available jobs</h3>
                  <p className="text-gray-500 mb-4">There are currently no jobs available to claim.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("assigned")}
                  >
                    Back to Assigned Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs</CardTitle>
              <CardDescription>
                Jobs that you have completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCompletedJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>Materials Used</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompletedJobs.map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell className="font-medium">#{job.id}</TableCell>
                          <TableCell>{job.clientName}</TableCell>
                          <TableCell>{job.serviceType}</TableCell>
                          <TableCell>{formatDate(job.createdAt)}</TableCell>
                          <TableCell>{job.materialUsed ? 'Yes' : 'No'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSelectJob(job)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No completed jobs</h3>
                  <p className="text-gray-500 mb-4">You haven't completed any jobs yet.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("assigned")}
                  >
                    Back to Assigned Jobs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Job #{selectedJob.id} - {selectedJob.title || selectedJob.serviceType}</DialogTitle>
              <DialogDescription>
                {getStatusBadge(selectedJob.status)} {getPriorityBadge(selectedJob.priority)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Client Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedJob.clientName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedJob.clientPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedJob.clientEmail}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedJob.clientAddress}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Job Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">Service: {selectedJob.serviceType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">Issue: {selectedJob.issueType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">Property: {selectedJob.propertyType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">Scheduled: {formatDate(selectedJob.scheduledDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-sm border rounded-md p-3 bg-gray-50">
                  {selectedJob.description || "No description provided."}
                </p>
              </div>
              
              {selectedJob.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                  <p className="text-sm border rounded-md p-3 bg-gray-50">
                    {selectedJob.notes}
                  </p>
                </div>
              )}
              
              {selectedJob.completionNotes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Completion Notes</h3>
                  <p className="text-sm border rounded-md p-3 bg-gray-50">
                    {selectedJob.completionNotes}
                  </p>
                </div>
              )}
              
              {selectedJob.materialUsed && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Materials Used</h3>
                  <p className="text-sm border rounded-md p-3 bg-gray-50">
                    {selectedJob.materialUsed}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-2">
                {selectedJob.status !== "completed" && (
                  <Button
                    onClick={() => {
                      setUpdateData({
                        status: selectedJob.status,
                        notes: selectedJob.notes || "",
                        completionNotes: selectedJob.completionNotes || "",
                        materialUsed: selectedJob.materialUsed || ""
                      });
                      setIsUpdateDialogOpen(true);
                      setSelectedJob(null);
                    }}
                  >
                    Update Job Status
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Update Job Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>
              Update the status and details of this job
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Job Status</Label>
              <Select
                value={updateData.status}
                onValueChange={(value) => 
                  setUpdateData({ ...updateData, status: value as JobUpdate["status"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any general notes about this job"
                value={updateData.notes}
                onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                rows={2}
              />
            </div>
            
            {updateData.status === "completed" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="completionNotes">Completion Notes</Label>
                  <Textarea
                    id="completionNotes"
                    placeholder="Describe what was done to complete this job"
                    value={updateData.completionNotes}
                    onChange={(e) => setUpdateData({ ...updateData, completionNotes: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="materialUsed">Materials Used</Label>
                  <Textarea
                    id="materialUsed"
                    placeholder="List materials used for this job"
                    value={updateData.materialUsed}
                    onChange={(e) => setUpdateData({ ...updateData, materialUsed: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateJob}
              disabled={updateJobMutation.isPending}
            >
              {updateJobMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;