import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getQueryFn } from "@/lib/queryClient";
import type { ServiceRequest } from "@shared/schema";

export default function QuoteAccepted() {
  // Get the service request ID from URL query params
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const serviceRequestId = searchParams.get("id");

  const { data: serviceRequest, isLoading, error } = useQuery<ServiceRequest, Error>({
    queryKey: ["/api/service-requests/public", serviceRequestId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!serviceRequestId,
  });

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-center">Loading your confirmation...</p>
      </div>
    );
  }

  if (error || !serviceRequest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <CardTitle className="text-2xl mb-4 text-center">Error Retrieving Quote</CardTitle>
        <CardDescription className="text-center mb-6">
          We couldn't find your quote information. Please contact our customer service.
        </CardDescription>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Quote Accepted!</CardTitle>
          <CardDescription>
            Thank you for accepting our quote for your {serviceRequest.serviceType} service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="font-medium text-sm text-muted-foreground mb-1">Service Type</div>
              <div className="font-semibold capitalize">{serviceRequest.serviceType} - {serviceRequest.issueType}</div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="font-medium text-sm text-muted-foreground mb-1">Accepted Quote</div>
              <div className="font-semibold text-xl text-primary">
                {formatCurrency(serviceRequest.quotedAmount)}
              </div>
              {serviceRequest.quoteAcceptedDate && (
                <div className="text-xs text-muted-foreground mt-1">
                  Accepted on {new Date(serviceRequest.quoteAcceptedDate).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="text-sm text-center text-muted-foreground">
              We will contact you shortly to schedule your service appointment. 
              If you have any questions, please call (337) 123-4567.
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}