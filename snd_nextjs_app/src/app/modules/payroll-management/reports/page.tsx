'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Activity,
  BarChart3,
  CalendarIcon,
  DollarSign,
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReportData {
  total_payroll: number;
  total_employees: number;
  average_salary: number;
  total_overtime: number;
  total_deductions: number;
  department_breakdown: Array<{
    department: string;
    total_payroll: number;
    employee_count: number;
  }>;
  monthly_trends: Array<{
    month: string;
    total_payroll: number;
    employee_count: number;
  }>;
}

const mockReportData: ReportData = {
  total_payroll: 125000,
  total_employees: 25,
  average_salary: 5000,
  total_overtime: 15000,
  total_deductions: 25000,
  department_breakdown: [
    { department: 'Engineering', total_payroll: 45000, employee_count: 8 },
    { department: 'Sales', total_payroll: 35000, employee_count: 6 },
    { department: 'Marketing', total_payroll: 25000, employee_count: 4 },
    { department: 'HR', total_payroll: 20000, employee_count: 3 },
    { department: 'Finance', total_payroll: 15000, employee_count: 2 },
    { department: 'Operations', total_payroll: 15000, employee_count: 2 },
  ],
  monthly_trends: [
    { month: 'Jan', total_payroll: 120000, employee_count: 24 },
    { month: 'Feb', total_payroll: 122000, employee_count: 24 },
    { month: 'Mar', total_payroll: 125000, employee_count: 25 },
    { month: 'Apr', total_payroll: 128000, employee_count: 25 },
    { month: 'May', total_payroll: 130000, employee_count: 26 },
    { month: 'Jun', total_payroll: 132000, employee_count: 26 },
  ],
};

export default function PayrollReportsPage() {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of year
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    // Simulate loading report data
    setLoading(true);
    setTimeout(() => {
      setReportData(mockReportData);
      setLoading(false);
    }, 1000);
  }, [reportType, dateRange]);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format: string) => {
    try {
      toast.loading(`Downloading ${format.toUpperCase()} report...`);
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`${format.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const reportTypes = [
    { value: 'summary', label: 'Payroll Summary', icon: BarChart3 },
    { value: 'department', label: 'Department Breakdown', icon: Users },
    { value: 'overtime', label: 'Overtime Analysis', icon: Activity },
    { value: 'deductions', label: 'Deductions Report', icon: TrendingUp },
    { value: 'comparison', label: 'Period Comparison', icon: PieChart },
    { value: 'detailed', label: 'Detailed Payroll', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Generating report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payroll Reports</h1>
          <p className="text-gray-600">Generate and analyze payroll reports</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleGenerateReport} disabled={loading}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center">
                        <type.icon className="h-4 w-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={date => setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={date => setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${reportData.total_payroll.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.total_employees}</div>
              <p className="text-xs text-muted-foreground">+1 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.average_salary.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${reportData.total_overtime.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Department Breakdown */}
      {reportData && reportType === 'department' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Payroll distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.department_breakdown.map((dept, index) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                      }}
                    ></div>
                    <div>
                      <div className="font-medium">{dept.department}</div>
                      <div className="text-sm text-gray-500">{dept.employee_count} employees</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${dept.total_payroll.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">
                      {((dept.total_payroll / reportData.total_payroll) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends */}
      {reportData && reportType === 'summary' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Payroll trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.monthly_trends.map(month => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="font-medium">{month.month}</div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">{month.employee_count} employees</div>
                    <div className="font-medium">${month.total_payroll.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
          <CardDescription>Download the report in various formats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('excel')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('json')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
