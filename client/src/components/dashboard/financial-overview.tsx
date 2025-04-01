import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid 
} from "recharts";

interface FinancialOverviewProps {
  financials: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueBreakdown: {
      electrical: number;
      plumbing: number;
      combined: number;
    };
    expensesByCategory: Record<string, number>;
    recentTransactions: Array<{
      id: number;
      type: string;
      description: string;
      amount: number;
      date: string;
      category: string;
    }>;
  };
  period: string;
  setPeriod: (period: string) => void;
}

const FinancialOverview = ({ financials, period, setPeriod }: FinancialOverviewProps) => {
  // Format revenue breakdown data for pie chart
  const revenueData = [
    { name: "Electrical", value: financials.revenueBreakdown.electrical, color: "#1565C0" },
    { name: "Plumbing", value: financials.revenueBreakdown.plumbing, color: "#00796B" },
    { name: "Combined", value: financials.revenueBreakdown.combined, color: "#FFA000" }
  ].filter(item => item.value > 0);

  // Format expenses by category for bar chart
  const expensesData = Object.entries(financials.expensesByCategory).map(([category, amount]) => ({
    category: formatCategoryName(category),
    amount
  }));

  // Format recent transactions for table
  const recentTransactions = financials.recentTransactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date).toLocaleDateString(),
    formattedAmount: `$${transaction.amount.toFixed(2)}`
  }));
  
  // Revenue vs Expenses data for line chart
  const comparisonData = [
    { name: "Revenue", value: financials.totalRevenue },
    { name: "Expenses", value: financials.totalExpenses },
    { name: "Net Profit", value: financials.netProfit }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium text-neutral-700">Financial Overview</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-base font-medium text-neutral-700 mb-2">Revenue vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                  labelFormatter={(name) => `${name}`}
                />
                <Legend />
                <Bar dataKey="value" name="Amount" fill="#1565C0" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Income breakdown */}
        <Card className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-base font-medium text-neutral-700 mb-2">Income Breakdown</h3>
          {revenueData.length > 0 ? (
            <>
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {revenueData.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-neutral-700">{item.name} Services</span>
                      <span className="text-sm font-medium text-neutral-900">${item.value.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(item.value / financials.totalRevenue) * 100}%`,
                          backgroundColor: item.color
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-neutral-500">
              No revenue data available for this period
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex justify-between">
              <span className="text-neutral-700">Total Revenue</span>
              <span className="font-semibold text-neutral-900">${financials.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-neutral-700">Total Expenses</span>
              <span className="font-semibold text-neutral-900">${financials.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-neutral-200">
              <span className="font-medium text-neutral-800">Net Profit</span>
              <span className="font-semibold text-green-600">${financials.netProfit.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Expense Breakdown */}
      {expensesData.length > 0 && (
        <Card className="bg-white p-4 rounded-lg border border-neutral-200">
          <h3 className="text-base font-medium text-neutral-700 mb-2">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="category" />
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="amount" fill="#00796B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      
      {/* Recent Transactions */}
      <Card className="bg-white p-4 rounded-lg border border-neutral-200">
        <h3 className="text-base font-medium text-neutral-700 mb-2">Recent Transactions</h3>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{transaction.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{transaction.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{formatCategoryName(transaction.category)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === "income" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {transaction.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                        {transaction.type === "income" ? "+" : "-"}{transaction.formattedAmount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-neutral-500">
            No transactions found for this period
          </div>
        )}
      </Card>
    </div>
  );
};

// Helper function to format category names
function formatCategoryName(category: string): string {
  return category
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default FinancialOverview;
