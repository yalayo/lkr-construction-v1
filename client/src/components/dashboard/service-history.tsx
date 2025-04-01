import { ServiceRequest } from "@shared/schema";
import { Zap, Droplet, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";

interface ServiceHistoryProps {
  services: ServiceRequest[];
}

const ServiceHistory = ({ services }: ServiceHistoryProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead>
          <tr>
            <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Service Type
            </th>
            <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Technician
            </th>
            <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  {service.serviceType === "electrical" ? (
                    <Zap className="text-primary mr-2 h-4 w-4" />
                  ) : service.serviceType === "plumbing" ? (
                    <Droplet className="text-secondary-500 mr-2 h-4 w-4" />
                  ) : (
                    <div className="flex mr-2">
                      <Zap className="text-primary h-4 w-4" />
                      <Droplet className="text-secondary-500 h-4 w-4" />
                    </div>
                  )}
                  <span className="text-neutral-700">{service.issueType}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                {format(new Date(service.completedDate || service.createdAt), "MMM dd, yyyy")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                {service.technicianName || "N/A"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleExpand(service.id)}
                  className="flex items-center text-primary hover:text-primary-600"
                >
                  {expandedId === service.id ? (
                    <>Details <ChevronUp className="ml-1 h-4 w-4" /></>
                  ) : (
                    <>Details <ChevronDown className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Expanded details */}
      {expandedId && (
        <div className="mt-2 p-4 bg-neutral-50 rounded-md border border-neutral-200">
          {services.filter(s => s.id === expandedId).map(service => (
            <div key={`expanded-${service.id}`} className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Service Details</h4>
                <p className="text-sm text-neutral-600">{service.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Service Address</h4>
                <p className="text-sm text-neutral-600">{service.address}</p>
              </div>
              
              {service.cost && (
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">Cost</h4>
                  <p className="text-sm text-neutral-600">${service.cost.toFixed(2)}</p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-neutral-700">Notes</h4>
                <p className="text-sm text-neutral-600">
                  {service.notes || "No additional notes for this service."}
                </p>
              </div>
              
              <div className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExpandedId(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
