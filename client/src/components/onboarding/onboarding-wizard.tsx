import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Progress 
} from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  User,
  Bell,
  Settings,
  Calendar,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Define steps for different user types
const steps = {
  client: [
    {
      title: "Welcome",
      description: "Welcome to ElecPlumb! Let's get you set up.",
      icon: <User className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Welcome to ElecPlumb Service Manager</h3>
          <p className="text-sm text-neutral-600">
            We're excited to help you manage your electrical and plumbing service needs.
            This quick tour will help you understand how to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Request new electrical or plumbing services</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Track the status of your service requests</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Manage your appointments with technicians</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>View and pay invoices</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Your Dashboard",
      description: "This is where you can monitor all your service requests",
      icon: <Home className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Client Dashboard</h3>
          <p className="text-sm text-neutral-600">
            Your dashboard gives you a quick overview of all your service requests and appointments.
          </p>
          <div className="grid gap-4">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Active Service Requests</h4>
              <p className="text-xs text-neutral-600">View and track all your current service requests</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Upcoming Appointments</h4>
              <p className="text-xs text-neutral-600">See when technicians are scheduled to arrive</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Payment History</h4>
              <p className="text-xs text-neutral-600">Review past invoices and payments</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Request Service",
      description: "Learn how to submit new service requests",
      icon: <Calendar className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Requesting a New Service</h3>
          <p className="text-sm text-neutral-600">
            It's easy to request a new electrical or plumbing service. Just follow these steps:
          </p>
          <ol className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium">Click "Request Service" button</p>
                <p className="text-xs text-neutral-600">Located in the navigation menu</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium">Select service type & details</p>
                <p className="text-xs text-neutral-600">Choose electrical or plumbing and describe issue</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium">Enter contact information</p>
                <p className="text-xs text-neutral-600">Provide address and preferred date/time</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">4</div>
              <div>
                <p className="text-sm font-medium">Review and confirm</p>
                <p className="text-xs text-neutral-600">Submit your request and wait for confirmation</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "Notifications",
      description: "Stay updated with alerts and notifications",
      icon: <Bell className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Staying Updated</h3>
          <p className="text-sm text-neutral-600">
            You'll receive timely updates about your service requests:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900">Email Notifications</h4>
              <p className="text-xs text-blue-800 mt-1">Receive detailed updates about your service requests</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900">SMS Alerts</h4>
              <p className="text-xs text-green-800 mt-1">Get text notifications when a technician is on their way</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900">In-App Notifications</h4>
              <p className="text-xs text-purple-800 mt-1">View all your updates in one place in the app</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            You can manage your notification preferences in Account Settings.
          </p>
        </div>
      )
    },
    {
      title: "Account Settings",
      description: "Customize your account preferences",
      icon: <Settings className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personalizing Your Account</h3>
          <p className="text-sm text-neutral-600">
            Make the app work for you by adjusting your account settings:
          </p>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium">Profile Information</h4>
              <p className="text-xs text-neutral-600">Keep your contact information up-to-date</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium">Notification Preferences</h4>
              <p className="text-xs text-neutral-600">Choose how and when you receive updates</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium">Payment Methods</h4>
              <p className="text-xs text-neutral-600">Manage your payment options for quicker checkout</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium">Security Settings</h4>
              <p className="text-xs text-neutral-600">Update your password and security options</p>
            </div>
          </div>
        </div>
      )
    }
  ],
  technician: [
    {
      title: "Welcome",
      description: "Welcome to ElecPlumb! Let's get you set up.",
      icon: <User className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Welcome to ElecPlumb Service Manager</h3>
          <p className="text-sm text-neutral-600">
            We're excited to have you on our team! This quick tour will help you understand how to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>View and manage your assigned service requests</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Update job status and add notes</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Manage your schedule and appointments</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Track time and materials for billing</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Your Dashboard",
      description: "This is where you can monitor all your assigned jobs",
      icon: <Home className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Technician Dashboard</h3>
          <p className="text-sm text-neutral-600">
            Your dashboard gives you a quick overview of all your assigned jobs and schedule.
          </p>
          <div className="grid gap-4">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Today's Schedule</h4>
              <p className="text-xs text-neutral-600">See all appointments for today with customer details</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Upcoming Jobs</h4>
              <p className="text-xs text-neutral-600">View jobs scheduled for the coming days</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Job History</h4>
              <p className="text-xs text-neutral-600">Review completed jobs and job notes</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Managing Jobs",
      description: "Learn how to update job status and info",
      icon: <Calendar className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Managing Service Jobs</h3>
          <p className="text-sm text-neutral-600">
            You can easily update job status and add details as you work. Here's how:
          </p>
          <ol className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium">Accept job assignments</p>
                <p className="text-xs text-neutral-600">Confirm you can take on the job</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium">Update job status</p>
                <p className="text-xs text-neutral-600">Mark as "En Route", "In Progress", "Completed", etc.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium">Add job notes</p>
                <p className="text-xs text-neutral-600">Document work performed, issues found, and solutions</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">4</div>
              <div>
                <p className="text-sm font-medium">Record materials and time</p>
                <p className="text-xs text-neutral-600">Track all parts used and hours worked for billing</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "Communication",
      description: "Stay in touch with customers and the office",
      icon: <Bell className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Communication Tools</h3>
          <p className="text-sm text-neutral-600">
            Effective communication is essential for great service:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900">Customer Notifications</h4>
              <p className="text-xs text-blue-800 mt-1">Automatically notify customers of your ETA and updates</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900">Dispatch Communication</h4>
              <p className="text-xs text-green-800 mt-1">Stay in touch with the office about schedule changes</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900">Photo Documentation</h4>
              <p className="text-xs text-purple-800 mt-1">Upload photos of job sites before and after work</p>
            </div>
          </div>
        </div>
      )
    }
  ],
  owner: [
    {
      title: "Welcome",
      description: "Welcome to ElecPlumb! Let's get you set up.",
      icon: <User className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Welcome to ElecPlumb Business Dashboard</h3>
          <p className="text-sm text-neutral-600">
            We're excited to help you manage your electrical and plumbing business!
            This quick tour will help you understand how to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Monitor overall business performance and metrics</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Track service requests, leads, and appointments</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Manage your team of technicians</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Review financial reports and invoices</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "Business Overview",
      description: "Monitor your business performance",
      icon: <Home className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Business Performance Dashboard</h3>
          <p className="text-sm text-neutral-600">
            Your dashboard gives you a complete view of your business metrics and performance.
          </p>
          <div className="grid gap-4">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Financial Overview</h4>
              <p className="text-xs text-neutral-600">Track revenue, expenses, and profit metrics</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Service Analytics</h4>
              <p className="text-xs text-neutral-600">Monitor job completion rates and service efficiency</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Lead Management</h4>
              <p className="text-xs text-neutral-600">Track conversion rates and lead sources</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Team Performance</h4>
              <p className="text-xs text-neutral-600">Review technician productivity and efficiency</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Team Management",
      description: "Manage your technicians and office staff",
      icon: <Settings className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Managing Your Team</h3>
          <p className="text-sm text-neutral-600">
            Effectively manage your team of technicians and staff:
          </p>
          <ol className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium">Add new team members</p>
                <p className="text-xs text-neutral-600">Create accounts for technicians and staff</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium">Assign jobs and territories</p>
                <p className="text-xs text-neutral-600">Match technicians with appropriate service requests</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium">Monitor performance</p>
                <p className="text-xs text-neutral-600">Track job completion times and customer satisfaction</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">4</div>
              <div>
                <p className="text-sm font-medium">Review timesheets and reports</p>
                <p className="text-xs text-neutral-600">Approve work hours and review field reports</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "Financial Tools",
      description: "Track revenue, expenses, and profitability",
      icon: <Calendar className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Financial Management</h3>
          <p className="text-sm text-neutral-600">
            Keep track of your business finances with our comprehensive tools:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900">Invoice Management</h4>
              <p className="text-xs text-blue-800 mt-1">Generate, send, and track customer invoices</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900">Expense Tracking</h4>
              <p className="text-xs text-green-800 mt-1">Monitor business expenses and categories</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900">Financial Reports</h4>
              <p className="text-xs text-purple-800 mt-1">View profit/loss statements and financial forecasts</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium text-amber-900">Tax Preparation</h4>
              <p className="text-xs text-amber-800 mt-1">Export financial data for tax filing</p>
            </div>
          </div>
        </div>
      )
    }
  ],
  admin: [
    {
      title: "Welcome",
      description: "Welcome to ElecPlumb! Let's get you set up.",
      icon: <User className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Welcome to ElecPlumb Administration</h3>
          <p className="text-sm text-neutral-600">
            You have access to all system administration functions. This quick tour will help you understand how to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Manage user accounts and permissions</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Configure system settings and preferences</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Monitor system performance and logs</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <span>Manage data backups and imports/exports</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: "User Management",
      description: "Create and manage user accounts",
      icon: <Settings className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Managing User Accounts</h3>
          <p className="text-sm text-neutral-600">
            As an administrator, you can manage all users in the system:
          </p>
          <div className="grid gap-4">
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Create New Users</h4>
              <p className="text-xs text-neutral-600">Add accounts for clients, technicians, and administrators</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Manage Permissions</h4>
              <p className="text-xs text-neutral-600">Control what each user can access and modify</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Reset Passwords</h4>
              <p className="text-xs text-neutral-600">Help users regain access to their accounts</p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="text-sm font-medium mb-1">Deactivate Accounts</h4>
              <p className="text-xs text-neutral-600">Temporarily or permanently disable user access</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "System Settings",
      description: "Configure application settings and preferences",
      icon: <Calendar className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">System Configuration</h3>
          <p className="text-sm text-neutral-600">
            Configure how the application functions for all users:
          </p>
          <ol className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">1</div>
              <div>
                <p className="text-sm font-medium">Notification Settings</p>
                <p className="text-xs text-neutral-600">Configure system-wide email and SMS notifications</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">2</div>
              <div>
                <p className="text-sm font-medium">Security Policies</p>
                <p className="text-xs text-neutral-600">Set password requirements and session timeouts</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">3</div>
              <div>
                <p className="text-sm font-medium">Service Categories</p>
                <p className="text-xs text-neutral-600">Define the types of services offered</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-primary font-medium text-sm mt-0.5">4</div>
              <div>
                <p className="text-sm font-medium">Workflow Configuration</p>
                <p className="text-xs text-neutral-600">Define service request lifecycle and statuses</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "Monitoring",
      description: "Monitor system performance and logs",
      icon: <Bell className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">System Monitoring</h3>
          <p className="text-sm text-neutral-600">
            Keep the system running smoothly with monitoring tools:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900">System Logs</h4>
              <p className="text-xs text-blue-800 mt-1">Review application logs for troubleshooting</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900">Database Management</h4>
              <p className="text-xs text-green-800 mt-1">Monitor database performance and usage</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900">API Usage</h4>
              <p className="text-xs text-purple-800 mt-1">Track integration usage and performance</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium text-amber-900">Error Reporting</h4>
              <p className="text-xs text-amber-800 mt-1">Identify and resolve system errors</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Data Management",
      description: "Manage system data and backups",
      icon: <Home className="h-12 w-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Administration</h3>
          <p className="text-sm text-neutral-600">
            Ensure data integrity and availability:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900">Backup Management</h4>
              <p className="text-xs text-blue-800 mt-1">Schedule and monitor system backups</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900">Data Import/Export</h4>
              <p className="text-xs text-green-800 mt-1">Transfer data between systems</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900">Data Cleanup</h4>
              <p className="text-xs text-purple-800 mt-1">Archive or remove old records to maintain performance</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium text-amber-900">Data Validation</h4>
              <p className="text-xs text-amber-800 mt-1">Ensure data quality and consistency</p>
            </div>
          </div>
        </div>
      )
    }
  ]
};

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const userType = user?.role || "client";
  
  // Get the correct steps based on user role
  const userSteps = steps[userType as keyof typeof steps] || steps.client;
  
  // Calculate progress percentage
  const progress = ((currentStep + 1) / userSteps.length) * 100;
  
  useEffect(() => {
    // Reset to first step when wizard is opened
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleNext = () => {
    if (currentStep < userSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    onClose();
  };
  
  const currentStepData = userSteps[currentStep];
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-600">
                Step {currentStep + 1} of {userSteps.length}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <Progress value={progress} className="mx-6 h-1" />
        
        <CardContent className="pt-6 pb-2">
          {currentStepData.content}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handlePrev} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleSkip}>
                Skip tour
              </Button>
            )}
          </div>
          
          <Button onClick={handleNext} className="gap-1">
            <span>{currentStep < userSteps.length - 1 ? "Next" : "Finish"}</span>
            {currentStep < userSteps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook to manage the onboarding wizard state
export function useOnboardingWizard() {
  const [isOpen, setIsOpen] = useState(false);
  
  const openWizard = () => setIsOpen(true);
  const closeWizard = () => setIsOpen(false);
  
  return {
    isOpen,
    openWizard,
    closeWizard,
  };
}

export default OnboardingWizard;