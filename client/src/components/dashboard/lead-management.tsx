import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lead } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Droplet, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface LeadManagementProps {
  leads: Lead[];
}

const LeadManagement = ({ leads }: LeadManagementProps) => {
  const { toast } = useToast();
  const [serviceFilter, setServiceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const itemsPerPage = 5;
  
  // Filter leads by service type
  const filteredLeads = serviceFilter === "all" 
    ? leads 
    : leads.filter(lead => lead.serviceType === serviceFilter);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleAssign = async (lead: Lead) => {
    setIsProcessing(true);
    try {
      await apiRequest("POST", `/api/leads/${lead.id}/assign`, {});
      toast({
        title: "Lead assigned",
        description: "A technician has been assigned to this lead",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign lead",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailsDialog(true);
  };
  
  const closeDetailsDialog = () => {
    setShowDetailsDialog(false);
    setSelectedLead(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-neutral-800">Lead Management</h2>
        <div className="flex items-center">
          <div className="mr-2">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="text-sm w-[160px]">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-1 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white border border-neutral-200 rounded-lg">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Service Type</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Request Date</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Est. Price</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {paginatedLeads.map(lead => (
              <tr key={lead.id}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      {lead.customerName.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-neutral-900">{lead.customerName}</div>
                      <div className="text-xs text-neutral-500">{lead.customerPhone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {lead.serviceType === "electrical" ? (
                      <Zap className="mr-2 h-4 w-4 text-primary" />
                    ) : lead.serviceType === "plumbing" ? (
                      <Droplet className="mr-2 h-4 w-4 text-secondary-500" />
                    ) : (
                      <div className="flex mr-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <Droplet className="h-4 w-4 text-secondary-500" />
                      </div>
                    )}
                    <span className="text-neutral-700 capitalize">{lead.serviceType}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-700">
                  ${lead.estimatedPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lead.status === "new" 
                      ? "bg-primary-100 text-primary-800" 
                      : lead.status === "pending" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-green-100 text-green-800"
                  }`}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary-700 mr-2"
                    onClick={() => handleAssign(lead)}
                    disabled={isProcessing || lead.status === "assigned"}
                  >
                    {lead.status === "assigned" ? "Assigned" : "Assign"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-neutral-500 hover:text-neutral-700"
                    onClick={() => handleViewDetails(lead)}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-3 flex justify-between items-center">
        <div className="text-sm text-neutral-500">
          Showing <span className="font-medium">{Math.min(1, filteredLeads.length)}</span> to <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, filteredLeads.length)}
          </span> of <span className="font-medium">{filteredLeads.length}</span> leads
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
      
      {/* Lead Details Dialog */}
      {selectedLead && (
        <Dialog open={showDetailsDialog} onOpenChange={closeDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                Complete information about this service request.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Customer Information</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="text-sm">
                    <span className="text-neutral-500">Name:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.customerName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Phone:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.customerPhone}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Email:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.customerEmail}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Service Details</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="text-sm">
                    <span className="text-neutral-500">Type:</span>
                    <span className="ml-2 text-neutral-900 capitalize">{selectedLead.serviceType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Issue:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.issueType}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Urgency:</span>
                    <span className="ml-2 text-neutral-900 capitalize">{selectedLead.urgency}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Property:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.propertyType}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-neutral-500">Description:</span>
                  <p className="mt-1 text-neutral-900">{selectedLead.description || "No description provided."}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Address & Schedule</h4>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  <div className="text-sm">
                    <span className="text-neutral-500">Address:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.address}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Preferred Date:</span>
                    <span className="ml-2 text-neutral-900">
                      {selectedLead.preferredDate ? new Date(selectedLead.preferredDate).toLocaleDateString() : "Not specified"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-500">Preferred Time:</span>
                    <span className="ml-2 text-neutral-900 capitalize">{selectedLead.preferredTime || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={closeDetailsDialog}>Close</Button>
              <Button 
                onClick={() => {
                  handleAssign(selectedLead);
                  closeDetailsDialog();
                }}
                disabled={isProcessing || selectedLead.status === "assigned"}
              >
                {selectedLead.status === "assigned" ? "Already Assigned" : "Assign Technician"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LeadManagement;
