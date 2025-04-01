import { Card } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowUp, 
  ChartLine 
} from "lucide-react";

interface StatsOverviewProps {
  stats: {
    newLeads: number;
    pendingLeads: number;
    pendingJobs: number;
    revenue: number;
    expenses: number;
    profit: number;
    conversionRate: number;
    nextJob: string;
    completedJobs: number;
  };
}

const StatsOverview = ({ stats }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* New Leads Card */}
      <Card className="bg-white p-4 border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-500">New Leads</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.newLeads}</p>
          </div>
          <div className="p-2 bg-primary-50 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2 flex items-center">
          <ArrowUp className="h-3 w-3 mr-1" /> 
          {stats.pendingLeads} pending leads
        </p>
      </Card>
      
      {/* Pending Jobs Card */}
      <Card className="bg-white p-4 border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-500">Pending Jobs</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.pendingJobs}</p>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Next job: <span className="font-medium">{stats.nextJob}</span>
        </p>
      </Card>
      
      {/* Revenue Card */}
      <Card className="bg-white p-4 border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-500">Revenue (MTD)</p>
            <p className="text-2xl font-semibold text-neutral-800">${stats.revenue.toFixed(2)}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2 flex items-center">
          <ArrowUp className="h-3 w-3 mr-1" /> 
          ${stats.profit.toFixed(2)} profit
        </p>
      </Card>
      
      {/* Conversion Rate Card */}
      <Card className="bg-white p-4 border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-500">Conversion Rate</p>
            <p className="text-2xl font-semibold text-neutral-800">{stats.conversionRate}%</p>
          </div>
          <div className="p-2 bg-primary-50 rounded-lg">
            <ChartLine className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2 flex items-center">
          <TrendingUp className="h-3 w-3 mr-1" /> 
          {stats.completedJobs} completed jobs
        </p>
      </Card>
    </div>
  );
};

export default StatsOverview;
