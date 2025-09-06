'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { ReportChart } from '@/components/report-chart';
import { 
  BarChart3, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Building, 
  Car, 
  DollarSign,
  Clock,
  Shield,
  Target,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface ReportData {
  success: boolean;
  data: any;
  generated_at: string;
  report_type: string;
  parameters: any;
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}

export default function ReportingDashboardPage() {
  const { t } = useI18n();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const reportTypes = [
    { id: 'overview', name: t('reporting.overview_report'), icon: Building },
    { id: 'employee_analytics', name: t('reporting.employee_analytics'), icon: Users },
    { id: 'project_analytics', name: t('reporting.project_analytics'), icon: Target },
    { id: 'equipment_analytics', name: t('reporting.equipment_analytics'), icon: Car },
    { id: 'financial_analytics', name: t('reporting.financial_analytics'), icon: DollarSign },
    { id: 'operational_analytics', name: t('reporting.operational_analytics'), icon: Activity },
    { id: 'hr_analytics', name: t('reporting.hr_analytics'), icon: Users },
    { id: 'safety_analytics', name: t('reporting.safety_analytics'), icon: Shield },
    { id: 'performance_analytics', name: t('reporting.performance_analytics'), icon: TrendingUp },
    { id: 'rental_analytics', name: t('reporting.rental_analytics'), icon: Car },
    { id: 'customer_analytics', name: t('reporting.customer_analytics'), icon: Building },
  ];

  const generateReport = async () => {
      try {
        setLoading(true);
      const loadingToastId = toast.loading(t('reporting.generating_comprehensive_report'));

        const params = new URLSearchParams({
        report_type: selectedReport,
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ...(departmentFilter !== 'all' && { departmentId: departmentFilter }),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`/api/reports/comprehensive?${params}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate report`);
        }

        const responseData = await response.json();
      console.log('Report data received:', responseData);
      
      // Extract the actual report data from the API response
      const data = responseData.data || responseData;
      setReportData(data);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success(t('reporting.comprehensive_report_generated_successfully'));
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Dismiss loading toast and show error
      toast.dismiss();
      toast.error(t('reporting.failed_to_generate_comprehensive_report'));
      } finally {
        setLoading(false);
      }
    };

  const renderMetricCards = (data: any) => {
    const cards: MetricCard[] = [];

    // Return empty array if no data
    if (!data) {
      return cards;
    }

    switch (selectedReport) {
      case 'overview':
        if (data.overview) {
          cards.push(
            { title: 'Total Employees', value: data.overview.employees?.total || 0, icon: Users, color: 'blue' },
            { title: 'Active Projects', value: data.overview.projects?.active || 0, icon: Target, color: 'green' },
            { title: 'Total Equipment', value: data.overview.equipment?.total || 0, icon: Car, color: 'purple' },
            { title: 'Total Customers', value: data.overview.customers?.total || 0, icon: Building, color: 'orange' },
            { title: 'Total Revenue', value: `SAR ${(data.overview.rentals?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'emerald' },
            { title: 'Total Hours', value: `${Number(data.overview.operational?.total_hours || 0).toFixed(0)}h`, icon: Clock, color: 'cyan' }
          );
        }
        break;
      case 'employee_analytics':
        if (data.performance_metrics) {
          cards.push(
            { title: 'Total Employees', value: data.performance_metrics.total_employees || 0, icon: Users, color: 'blue' },
            { title: 'Active Employees', value: data.performance_metrics.active_employees || 0, icon: Users, color: 'green' },
            { title: 'Average Salary', value: `SAR ${Number(data.performance_metrics.avg_salary || 0).toFixed(0)}`, icon: DollarSign, color: 'emerald' }
          );
        }
        break;
      case 'project_analytics':
        if (data.project_stats) {
          cards.push(
            { title: 'Total Projects', value: data.project_stats.total_projects || 0, icon: Target, color: 'blue' },
            { title: 'Active Projects', value: data.project_stats.active_projects || 0, icon: Target, color: 'green' },
            { title: 'Completed Projects', value: data.project_stats.completed_projects || 0, icon: Target, color: 'emerald' },
            { title: 'Total Budget', value: `SAR ${Number(data.project_stats.total_budget || 0).toLocaleString()}`, icon: DollarSign, color: 'purple' },
            { title: 'Average Budget', value: `SAR ${Number(data.project_stats.avg_budget || 0).toFixed(0)}`, icon: DollarSign, color: 'orange' }
          );
        }
        break;
      case 'equipment_analytics':
        if (data.equipment_stats) {
          cards.push(
            { title: 'Total Equipment', value: data.equipment_stats.total_equipment || 0, icon: Car, color: 'blue' },
            { title: 'Active Equipment', value: data.equipment_stats.active_equipment || 0, icon: Car, color: 'green' },
            { title: 'Total Value', value: `SAR ${Number(data.equipment_stats.total_value || 0).toLocaleString()}`, icon: DollarSign, color: 'purple' },
            { title: 'Average Value', value: `SAR ${Number(data.equipment_stats.avg_value || 0).toFixed(0)}`, icon: DollarSign, color: 'orange' }
          );
        }
        break;
      case 'financial_analytics':
        if (data.payroll_stats || data.rental_stats) {
          cards.push(
            { title: 'Total Payroll', value: `SAR ${Number(data.payroll_stats?.total_payroll || 0).toLocaleString()}`, icon: DollarSign, color: 'blue' },
            { title: 'Average Salary', value: `SAR ${Number(data.payroll_stats?.avg_salary || 0).toFixed(0)}`, icon: DollarSign, color: 'green' },
            { title: 'Total Revenue', value: `SAR ${Number(data.rental_stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'emerald' },
            { title: 'Total Advances', value: `SAR ${Number(data.advance_stats?.total_advances || 0).toLocaleString()}`, icon: DollarSign, color: 'orange' }
          );
        }
        break;
      case 'operational_analytics':
        if (data.timesheet_stats || data.project_stats || data.equipment_stats) {
          cards.push(
            { title: 'Total Timesheets', value: data.timesheet_stats?.total_timesheets || 0, icon: Clock, color: 'blue' },
            { title: 'Total Hours', value: `${Number(data.timesheet_stats?.total_hours || 0).toFixed(0)}h`, icon: Clock, color: 'green' },
            { title: 'Avg Hours/Day', value: `${Number(data.timesheet_stats?.avg_hours_per_day || 0).toFixed(1)}h`, icon: Activity, color: 'purple' },
            { title: 'Total Projects', value: data.project_stats?.total_projects || 0, icon: Target, color: 'orange' },
            { title: 'Total Equipment', value: data.equipment_stats?.total_equipment || 0, icon: Car, color: 'cyan' },
            { title: 'Active Equipment', value: data.equipment_stats?.active_equipment || 0, icon: Car, color: 'emerald' }
          );
        }
        break;
      case 'hr_analytics':
        if (data.employee_stats || data.leave_stats || data.training_stats) {
          cards.push(
            { title: 'Total Employees', value: data.employee_stats?.total_employees || 0, icon: Users, color: 'blue' },
            { title: 'Active Employees', value: data.employee_stats?.active_employees || 0, icon: Users, color: 'green' },
            { title: 'Average Salary', value: `SAR ${Number(data.employee_stats?.avg_salary || 0).toFixed(0)}`, icon: DollarSign, color: 'emerald' },
            { title: 'Total Leaves', value: data.leave_stats?.total_leaves || 0, icon: Clock, color: 'orange' },
            { title: 'Total Leave Days', value: Number(data.leave_stats?.total_days || 0).toFixed(0), icon: Clock, color: 'purple' },
            { title: 'Avg Leave Days', value: Number(data.leave_stats?.avg_days || 0).toFixed(1), icon: Clock, color: 'cyan' },
            { title: 'Total Trainings', value: data.training_stats?.total_trainings || 0, icon: Target, color: 'pink' }
          );
        }
        break;
      case 'safety_analytics':
        if (data.incident_stats) {
          const totalIncidents = data.incident_stats.total_incidents || 0;
          const resolvedIncidents = data.incident_stats.resolved_incidents || 0;
          const pendingIncidents = data.incident_stats.pending_incidents || 0;
          const safetyScore = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100;
          
          cards.push(
            { title: 'Total Incidents', value: totalIncidents, icon: Shield, color: 'red' },
            { title: 'Resolved Incidents', value: resolvedIncidents, icon: Shield, color: 'green' },
            { title: 'Pending Incidents', value: pendingIncidents, icon: Shield, color: 'orange' },
            { title: 'Safety Score', value: `${safetyScore}%`, icon: Shield, color: 'blue' }
          );
        }
        break;
      case 'performance_analytics':
        if (data.project_performance || data.employee_performance || data.equipment_performance) {
          const projectCompletionRate = data.project_performance?.total_projects > 0 
            ? Math.round((data.project_performance.completed_projects / data.project_performance.total_projects) * 100)
            : 0;
          const employeeActiveRate = data.employee_performance?.total_employees > 0
            ? Math.round((data.employee_performance.active_employees / data.employee_performance.total_employees) * 100)
            : 0;
          const equipmentActiveRate = data.equipment_performance?.total_equipment > 0
            ? Math.round((data.equipment_performance.active_equipment / data.equipment_performance.total_equipment) * 100)
            : 0;
          
          cards.push(
            { title: 'Project Completion Rate', value: `${projectCompletionRate}%`, icon: Target, color: 'blue' },
            { title: 'Employee Active Rate', value: `${employeeActiveRate}%`, icon: Users, color: 'green' },
            { title: 'Equipment Active Rate', value: `${equipmentActiveRate}%`, icon: Car, color: 'purple' },
            { title: 'Total Projects', value: data.project_performance?.total_projects || 0, icon: Target, color: 'orange' },
            { title: 'Total Employees', value: data.employee_performance?.total_employees || 0, icon: Users, color: 'cyan' },
            { title: 'Total Equipment', value: data.equipment_performance?.total_equipment || 0, icon: Car, color: 'emerald' }
          );
        }
        break;
      case 'rental_analytics':
        if (data.rental_stats || data.company_rentals) {
          cards.push(
            { title: 'Total Rentals', value: data.rental_stats?.total_rentals || 0, icon: Car, color: 'blue' },
            { title: 'Active Rentals', value: data.rental_stats?.active_rentals || 0, icon: Car, color: 'green' },
            { title: 'Completed Rentals', value: data.rental_stats?.completed_rentals || 0, icon: Car, color: 'emerald' },
            { title: 'Total Revenue', value: `SAR ${Number(data.rental_stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'purple' },
            { title: 'Avg Rental Amount', value: `SAR ${Number(data.rental_stats?.avg_rental_amount || 0).toFixed(0)}`, icon: DollarSign, color: 'orange' },
            { title: 'Companies with Rentals', value: data.company_rentals?.length || 0, icon: Building, color: 'cyan' }
          );
        }
        break;
      case 'customer_analytics':
        if (data.customer_stats || data.customer_details) {
          cards.push(
            { title: 'Total Customers', value: data.customer_stats?.total_customers || 0, icon: Building, color: 'blue' },
            { title: 'Active Customers', value: data.customer_stats?.active_customers || 0, icon: Building, color: 'green' },
            { title: 'Customers with Rentals', value: data.customer_stats?.customers_with_rentals || 0, icon: Car, color: 'purple' },
            { title: 'Customers with Projects', value: data.customer_stats?.customers_with_projects || 0, icon: Target, color: 'orange' },
            { title: 'Customer Retention Rate', value: `${data.customer_stats?.total_customers > 0 ? Math.round((data.customer_stats.active_customers / data.customer_stats.total_customers) * 100) : 0}%`, icon: TrendingUp, color: 'emerald' }
          );
        }
        break;
    }

    return cards;
  };

  const renderDataTable = (data: any) => {
    // Return null if no data
    if (!data) {
      return null;
    }

    switch (selectedReport) {
      case 'employee_analytics':
        if (data.leave_analysis && data.leave_analysis.length > 0) {
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Total Days</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.leave_analysis.map((leave: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{leave.leave_type}</TableCell>
                    <TableCell>{leave.total_days}</TableCell>
                    <TableCell>{leave.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        }
        break;
      case 'overview':
        if (data.overview) {
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>{data.overview.employees?.total || 0}</TableCell>
                  <TableCell>{data.overview.employees?.active || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {data.overview.employees?.active > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Projects</TableCell>
                  <TableCell>{data.overview.projects?.total || 0}</TableCell>
                  <TableCell>{data.overview.projects?.active || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.overview.projects?.active > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Equipment</TableCell>
                  <TableCell>{data.overview.equipment?.total || 0}</TableCell>
                  <TableCell>{data.overview.equipment?.active || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-800">
                      {data.overview.equipment?.active > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Customers</TableCell>
                  <TableCell>{data.overview.customers?.total || 0}</TableCell>
                  <TableCell>{data.overview.customers?.active || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      {data.overview.customers?.active > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
        break;
      case 'operational_analytics':
        if (data.timesheet_stats || data.project_stats || data.equipment_stats) {
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Timesheets</TableCell>
                  <TableCell>Total Count</TableCell>
                  <TableCell>{data.timesheet_stats?.total_timesheets || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.timesheet_stats?.total_timesheets > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Timesheets</TableCell>
                  <TableCell>Total Hours</TableCell>
                  <TableCell>{Number(data.timesheet_stats?.total_hours || 0).toFixed(0)}h</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {data.timesheet_stats?.total_hours > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Timesheets</TableCell>
                  <TableCell>Avg Hours/Day</TableCell>
                  <TableCell>{Number(data.timesheet_stats?.avg_hours_per_day || 0).toFixed(1)}h</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-800">
                      {data.timesheet_stats?.avg_hours_per_day > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Projects</TableCell>
                  <TableCell>Total Projects</TableCell>
                  <TableCell>{data.project_stats?.total_projects || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      {data.project_stats?.total_projects > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Equipment</TableCell>
                  <TableCell>Total Equipment</TableCell>
                  <TableCell>{data.equipment_stats?.total_equipment || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-cyan-100 text-cyan-800">
                      {data.equipment_stats?.total_equipment > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Equipment</TableCell>
                  <TableCell>Active Equipment</TableCell>
                  <TableCell>{data.equipment_stats?.active_equipment || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {data.equipment_stats?.active_equipment > 0 ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
        break;
      case 'hr_analytics':
        if (data.employee_stats || data.leave_stats || data.training_stats) {
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>Total Employees</TableCell>
                  <TableCell>{data.employee_stats?.total_employees || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.employee_stats?.total_employees > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>Active Employees</TableCell>
                  <TableCell>{data.employee_stats?.active_employees || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {data.employee_stats?.active_employees > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>Average Salary</TableCell>
                  <TableCell>SAR {Number(data.employee_stats?.avg_salary || 0).toFixed(0)}</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {data.employee_stats?.avg_salary > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Leaves</TableCell>
                  <TableCell>Total Leaves</TableCell>
                  <TableCell>{data.leave_stats?.total_leaves || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      {data.leave_stats?.total_leaves > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Leaves</TableCell>
                  <TableCell>Total Leave Days</TableCell>
                  <TableCell>{Number(data.leave_stats?.total_days || 0).toFixed(0)}</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-800">
                      {data.leave_stats?.total_days > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Leaves</TableCell>
                  <TableCell>Average Leave Days</TableCell>
                  <TableCell>{Number(data.leave_stats?.avg_days || 0).toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge className="bg-cyan-100 text-cyan-800">
                      {data.leave_stats?.avg_days > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Training</TableCell>
                  <TableCell>Total Trainings</TableCell>
                  <TableCell>{data.training_stats?.total_trainings || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-pink-100 text-pink-800">
                      {data.training_stats?.total_trainings > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
        break;
      case 'safety_analytics':
        if (data.incident_stats) {
          const totalIncidents = data.incident_stats.total_incidents || 0;
          const resolvedIncidents = data.incident_stats.resolved_incidents || 0;
          const pendingIncidents = data.incident_stats.pending_incidents || 0;
          const safetyScore = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 100;
          
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Incidents</TableCell>
                  <TableCell>{totalIncidents}</TableCell>
                  <TableCell>
                    <Badge className="bg-red-100 text-red-800">
                      {totalIncidents > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resolved Incidents</TableCell>
                  <TableCell>{resolvedIncidents}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {resolvedIncidents > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Pending Incidents</TableCell>
                  <TableCell>{pendingIncidents}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      {pendingIncidents > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Safety Score</TableCell>
                  <TableCell>{safetyScore}%</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {safetyScore > 80 ? 'Excellent' : safetyScore > 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
        break;
      case 'performance_analytics':
        if (data.project_performance || data.employee_performance || data.equipment_performance) {
          const projectCompletionRate = data.project_performance?.total_projects > 0 
            ? Math.round((data.project_performance.completed_projects / data.project_performance.total_projects) * 100)
            : 0;
          const employeeActiveRate = data.employee_performance?.total_employees > 0
            ? Math.round((data.employee_performance.active_employees / data.employee_performance.total_employees) * 100)
            : 0;
          const equipmentActiveRate = data.equipment_performance?.total_equipment > 0
            ? Math.round((data.equipment_performance.active_equipment / data.equipment_performance.total_equipment) * 100)
            : 0;
          
          return (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Projects</TableCell>
                  <TableCell>Total Projects</TableCell>
                  <TableCell>{data.project_performance?.total_projects || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800">
                      {data.project_performance?.total_projects > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Projects</TableCell>
                  <TableCell>Completion Rate</TableCell>
                  <TableCell>{projectCompletionRate}%</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {projectCompletionRate > 80 ? 'Excellent' : projectCompletionRate > 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>Total Employees</TableCell>
                  <TableCell>{data.employee_performance?.total_employees || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-cyan-100 text-cyan-800">
                      {data.employee_performance?.total_employees > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Employees</TableCell>
                  <TableCell>Active Rate</TableCell>
                  <TableCell>{employeeActiveRate}%</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-800">
                      {employeeActiveRate > 90 ? 'Excellent' : employeeActiveRate > 80 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Equipment</TableCell>
                  <TableCell>Total Equipment</TableCell>
                  <TableCell>{data.equipment_performance?.total_equipment || 0}</TableCell>
                  <TableCell>
                    <Badge className="bg-orange-100 text-orange-800">
                      {data.equipment_performance?.total_equipment > 0 ? 'Active' : 'No Data'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Equipment</TableCell>
                  <TableCell>Active Rate</TableCell>
                  <TableCell>{equipmentActiveRate}%</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800">
                      {equipmentActiveRate > 80 ? 'Excellent' : equipmentActiveRate > 60 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
        break;
      case 'rental_analytics':
        if (data.company_rentals && data.company_rentals.length > 0) {
          return (
            <div className="space-y-6">
              {/* Company Rentals Summary */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Rentals by Company</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Total Rentals</TableHead>
                      <TableHead>Active Rentals</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.company_rentals.map((company: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{company.company_name || 'Unknown Company'}</TableCell>
                        <TableCell>{company.total_rentals || 0}</TableCell>
                        <TableCell>{company.active_rentals || 0}</TableCell>
                        <TableCell>SAR {Number(company.total_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={company.active_rentals > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {company.active_rentals > 0 ? 'Active' : 'No Active Rentals'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Equipment Details */}
              {data.equipment_rentals && data.equipment_rentals.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Equipment Rental Details</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.equipment_rentals.map((rental: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{rental.equipment_name || 'Unknown Equipment'}</TableCell>
                          <TableCell>{rental.equipment_type || 'N/A'}</TableCell>
                          <TableCell>{rental.equipment_model || 'N/A'}</TableCell>
                          <TableCell>{rental.company_name || 'Unknown Company'}</TableCell>
                          <TableCell>SAR {Number(rental.rental_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              rental.rental_status === 'active' ? "bg-green-100 text-green-800" :
                              rental.rental_status === 'completed' ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {rental.rental_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Operator Assignments */}
              {data.operator_assignments && data.operator_assignments.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Operator Assignments</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operator</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Assignment Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.operator_assignments.map((assignment: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{assignment.operator_name || 'Unassigned'}</TableCell>
                          <TableCell>{assignment.equipment_name || 'Unknown Equipment'}</TableCell>
                          <TableCell>{assignment.company_name || 'Unknown Company'}</TableCell>
                          <TableCell>
                            <Badge className={
                              assignment.assignment_status === 'active' ? "bg-green-100 text-green-800" :
                              assignment.assignment_status === 'completed' ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {assignment.assignment_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        }
        break;
      case 'customer_analytics':
        if (data.customer_details && data.customer_details.length > 0) {
    return (
            <div className="space-y-6">
              {/* Customer Overview */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Customer Overview</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Rentals</TableHead>
                      <TableHead>Total Projects</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customer_details.map((customer: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.customer_name || 'Unknown Customer'}</TableCell>
                        <TableCell>{customer.customer_type || 'N/A'}</TableCell>
                        <TableCell>{customer.contact_person || 'N/A'}</TableCell>
                        <TableCell>{customer.phone || 'N/A'}</TableCell>
                        <TableCell>{customer.email || 'N/A'}</TableCell>
                        <TableCell>{customer.city || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={customer.customer_status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {customer.customer_status || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.total_rentals || 0}</TableCell>
                        <TableCell>{customer.total_projects || 0}</TableCell>
                        <TableCell>SAR {Number(customer.total_rental_amount || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
        </div>

              {/* Customer Rental History */}
              {data.customer_rentals && data.customer_rentals.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Customer Rental History</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.customer_rentals.map((rental: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{rental.customer_name || 'Unknown Customer'}</TableCell>
                          <TableCell>{rental.equipment_name || 'Unknown Equipment'}</TableCell>
                          <TableCell>{rental.equipment_type || 'N/A'}</TableCell>
                          <TableCell>SAR {Number(rental.rental_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>{rental.operator_name || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Badge className={
                              rental.rental_status === 'active' ? "bg-green-100 text-green-800" :
                              rental.rental_status === 'completed' ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {rental.rental_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{rental.start_date ? new Date(rental.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{rental.end_date ? new Date(rental.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
        </div>
              )}

              {/* Customer Project History */}
              {data.customer_projects && data.customer_projects.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Customer Project History</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.customer_projects.map((project: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{project.customer_name || 'Unknown Customer'}</TableCell>
                          <TableCell>{project.project_name || 'Unknown Project'}</TableCell>
                          <TableCell>SAR {Number(project.project_budget || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={
                              project.project_status === 'active' ? "bg-green-100 text-green-800" :
                              project.project_status === 'completed' ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {project.project_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
        </div>
              )}
      </div>
    );
  }
        break;
    }
    return null;
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Report' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('reporting.comprehensive_analytics')}</h1>
            <p className="text-gray-600 mt-2">{t('reporting.comprehensive_analytics_description')}</p>
          </div>
          <div className="flex gap-2">
            <PermissionContent action="export" subject="Report">
              <Button onClick={exportReport} disabled={!reportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('reporting.export_report')}
              </Button>
            </PermissionContent>
            <PermissionContent action="read" subject="Report">
              <Button onClick={generateReport} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? t('reporting.generating') : t('reporting.generate_report')}
                </Button>
            </PermissionContent>
          </div>
        </div>

        {/* Report Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('reporting.report_configuration')}</CardTitle>
            <CardDescription>{t('reporting.configure_parameters')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="report-type">{t('reporting.select_report_type')}</Label>
                <Select value={selectedReport} onValueChange={setSelectedReport}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('reporting.select_report_type')} />
              </SelectTrigger>
              <SelectContent>
                    {reportTypes.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        <div className="flex items-center gap-2">
                          <report.icon className="h-4 w-4" />
                          {report.name}
              </div>
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            </div>
              <div>
                <Label htmlFor="date-range">{t('reporting.date_range')}</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('reporting.select_date_range')} />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="7">{t('reporting.last_7_days')}</SelectItem>
                    <SelectItem value="30">{t('reporting.last_30_days')}</SelectItem>
                    <SelectItem value="90">{t('reporting.last_90_days')}</SelectItem>
                    <SelectItem value="365">{t('reporting.last_year')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
              <div>
                <Label htmlFor="department">{t('reporting.department_filter')}</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('reporting.select_department')} />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="all">{t('reporting.all_departments')}</SelectItem>
                    <SelectItem value="1">{t('reporting.engineering')}</SelectItem>
                    <SelectItem value="2">{t('reporting.operations')}</SelectItem>
                    <SelectItem value="3">{t('reporting.finance')}</SelectItem>
                    <SelectItem value="4">{t('reporting.hr')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {renderMetricCards(reportData).map((card, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
              </div>
                      <div className={`p-3 rounded-full bg-${card.color}-100`}>
                        <card.icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
              ))}
            </div>

            {/* Charts and Data Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Charts */}
              <div className="space-y-6">
                {selectedReport === 'employee_analytics' && reportData.leave_analysis && (
                  <ReportChart
                    title="Leave Analysis"
                    description="Breakdown of leave types and usage"
                    data={reportData.leave_analysis.map((leave: any) => ({
                      label: leave.leave_type,
                      value: parseInt(leave.total_days)
                    }))}
                    type="pie"
                  />
                )}
                
                {selectedReport === 'overview' && reportData.overview && (
                  <ReportChart
                    title="System Overview"
                    description="Key metrics across all modules"
                    data={[
                      { label: 'Employees', value: reportData.overview.employees?.total || 0 },
                      { label: 'Projects', value: reportData.overview.projects?.total || 0 },
                      { label: 'Equipment', value: reportData.overview.equipment?.total || 0 },
                      { label: 'Customers', value: reportData.overview.customers?.total || 0 }
                    ]}
                    type="bar"
                  />
                )}

                {selectedReport === 'project_analytics' && reportData.project_stats && (
                  <ReportChart
                    title="Project Status"
                    description="Distribution of projects by status"
                    data={[
                      { label: 'Active', value: reportData.project_stats.active_projects || 0 },
                      { label: 'Completed', value: reportData.project_stats.completed_projects || 0 },
                      { label: 'Total', value: reportData.project_stats.total_projects || 0 }
                    ]}
                    type="pie"
                  />
                )}

                {selectedReport === 'operational_analytics' && reportData.timesheet_stats && (
                  <ReportChart
                    title="Operational Metrics"
                    description="Key operational performance indicators"
                    data={[
                      { label: 'Total Hours', value: Number(reportData.timesheet_stats.total_hours || 0) },
                      { label: 'Total Timesheets', value: reportData.timesheet_stats.total_timesheets || 0 },
                      { label: 'Avg Hours/Day', value: Number(reportData.timesheet_stats.avg_hours_per_day || 0) },
                      { label: 'Total Equipment', value: reportData.equipment_stats?.total_equipment || 0 }
                    ]}
                    type="bar"
                  />
                )}

                {selectedReport === 'hr_analytics' && reportData.employee_stats && (
                  <ReportChart
                    title="HR Analytics"
                    description="Human resources key performance indicators"
                    data={[
                      { label: 'Total Employees', value: reportData.employee_stats.total_employees || 0 },
                      { label: 'Active Employees', value: reportData.employee_stats.active_employees || 0 },
                      { label: 'Total Leaves', value: reportData.leave_stats?.total_leaves || 0 },
                      { label: 'Total Trainings', value: reportData.training_stats?.total_trainings || 0 }
                    ]}
                    type="bar"
                  />
                )}

                {selectedReport === 'hr_analytics' && reportData.leave_stats && (
                  <ReportChart
                    title="Leave Analysis"
                    description="Employee leave patterns and statistics"
                    data={[
                      { label: 'Total Leave Days', value: Number(reportData.leave_stats.total_days || 0) },
                      { label: 'Average Leave Days', value: Number(reportData.leave_stats.avg_days || 0) }
                    ]}
                    type="pie"
                  />
                )}

                {selectedReport === 'safety_analytics' && reportData.incident_stats && (
                  <ReportChart
                    title="Safety Metrics"
                    description="Safety incident tracking and resolution"
                    data={[
                      { label: 'Total Incidents', value: reportData.incident_stats.total_incidents || 0 },
                      { label: 'Resolved Incidents', value: reportData.incident_stats.resolved_incidents || 0 },
                      { label: 'Pending Incidents', value: reportData.incident_stats.pending_incidents || 0 }
                    ]}
                    type="bar"
                  />
                )}

                {selectedReport === 'performance_analytics' && (reportData.project_performance || reportData.employee_performance || reportData.equipment_performance) && (
                  <ReportChart
                    title="Performance Metrics"
                    description="Overall system performance indicators"
                    data={[
                      { label: 'Total Projects', value: reportData.project_performance?.total_projects || 0 },
                      { label: 'Total Employees', value: reportData.employee_performance?.total_employees || 0 },
                      { label: 'Total Equipment', value: reportData.equipment_performance?.total_equipment || 0 },
                      { label: 'Active Projects', value: reportData.project_performance?.active_projects || 0 },
                      { label: 'Active Employees', value: reportData.employee_performance?.active_employees || 0 },
                      { label: 'Active Equipment', value: reportData.equipment_performance?.active_equipment || 0 }
                    ]}
                    type="bar"
                  />
                )}

                {selectedReport === 'performance_analytics' && reportData.project_performance && (
                  <ReportChart
                    title="Project Performance"
                    description="Project completion and status distribution"
                    data={[
                      { label: 'Active Projects', value: reportData.project_performance.active_projects || 0 },
                      { label: 'Completed Projects', value: reportData.project_performance.completed_projects || 0 },
                      { label: 'Total Projects', value: reportData.project_performance.total_projects || 0 }
                    ]}
                    type="pie"
                  />
                )}

                {selectedReport === 'rental_analytics' && reportData.rental_stats && (
                  <ReportChart
                    title="Rental Status Distribution"
                    description="Breakdown of rental statuses"
                    data={[
                      { label: 'Active Rentals', value: reportData.rental_stats.active_rentals || 0 },
                      { label: 'Completed Rentals', value: reportData.rental_stats.completed_rentals || 0 },
                      { label: 'Total Rentals', value: reportData.rental_stats.total_rentals || 0 }
                    ]}
                    type="pie"
                  />
                )}

                {selectedReport === 'rental_analytics' && reportData.company_rentals && reportData.company_rentals.length > 0 && (
                  <ReportChart
                    title="Rentals by Company"
                    description="Equipment rentals per company"
                    data={reportData.company_rentals.map((company: any) => ({
                      label: company.company_name || 'Unknown Company',
                      value: company.total_rentals || 0
                    }))}
                    type="bar"
                  />
                )}

                {selectedReport === 'customer_analytics' && reportData.customer_stats && (
                  <ReportChart
                    title="Customer Status Distribution"
                    description="Active vs inactive customers"
                    data={[
                      { label: 'Active Customers', value: reportData.customer_stats?.active_customers || 0 },
                      { label: 'Inactive Customers', value: (reportData.customer_stats?.total_customers || 0) - (reportData.customer_stats?.active_customers || 0) },
                      { label: 'Total Customers', value: reportData.customer_stats?.total_customers || 0 }
                    ]}
                    type="pie"
                  />
                )}

                {selectedReport === 'customer_analytics' && reportData.customer_details && reportData.customer_details.length > 0 && (
                  <ReportChart
                    title="Customer Revenue Analysis"
                    description="Revenue generated per customer"
                    data={reportData.customer_details
                      .filter((customer: any) => customer.total_rental_amount > 0)
                      .slice(0, 10)
                      .map((customer: any) => ({
                        label: customer.customer_name || 'Unknown Customer',
                        value: Number(customer.total_rental_amount || 0)
                      }))}
                    type="bar"
                  />
                          )}
                        </div>

              {/* Data Tables */}
          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('reporting.detailed_data')}
                  </CardTitle>
              <CardDescription>
                    {t('reporting.generated_on')}: {new Date(reportData.generated_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
                  {renderDataTable(reportData)}
                </CardContent>
              </Card>
            </div>

          </div>
        )}

        {/* Empty State */}
        {!reportData && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('reporting.no_report_generated')}</h3>
              <p className="text-gray-600 mb-4">
                {t('reporting.select_report_type_and_generate')}
              </p>
              <Button onClick={generateReport}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                {t('reporting.generate_report')}
                  </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
