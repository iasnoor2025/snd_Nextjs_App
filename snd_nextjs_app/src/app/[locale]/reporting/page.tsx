'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { ReportChart } from '@/components/report-chart';
import { 
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
import React from 'react';
import { EquipmentReportPDFService } from '@/lib/services/equipment-report-pdf-service';
import { EquipmentReportExcelService } from '@/lib/services/equipment-report-excel-service';
import { SupervisorEquipmentReportPDFService } from '@/lib/services/supervisor-equipment-report-pdf-service';
import { SupervisorEquipmentReportExcelService } from '@/lib/services/supervisor-equipment-report-excel-service';

interface ReportData {
  success: boolean;
  data: any;
  generated_at: string;
  report_type: string;
  parameters: any;
  // Additional properties for different report types
  leave_analysis?: any[];
  overview?: any;
  project_stats?: any;
  timesheet_stats?: any;
  equipment_stats?: any;
  employee_stats?: any;
  leave_stats?: any;
  training_stats?: any;
  incident_stats?: any;
  project_performance?: any;
  employee_performance?: any;
  equipment_performance?: any;
  rental_stats?: any;
  company_rentals?: any[];
  customer_stats?: any;
  customer_details?: any[];
  summary_stats?: any;
  customer_groups?: any[];
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
  const [customerFilter, setCustomerFilter] = useState('all');
  const [customersWithRentals, setCustomersWithRentals] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [equipmentCategories, setEquipmentCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [supervisorFilter, setSupervisorFilter] = useState('all');
  const [supervisorsWithEquipment, setSupervisorsWithEquipment] = useState<any[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  const reportTypes = [
    { id: 'overview', name: t('reporting.overview_report'), icon: Building },
    { id: 'employee_analytics', name: t('reporting.employee_analytics'), icon: Users },
    { id: 'project_analytics', name: t('reporting.project_analytics'), icon: Target },
    { id: 'equipment_analytics', name: t('reporting.equipment_analytics'), icon: Car },
    { id: 'equipment_by_category', name: 'Equipment Report by Category', icon: Car },
    { id: 'financial_analytics', name: t('reporting.financial_analytics'), icon: DollarSign },
    { id: 'operational_analytics', name: t('reporting.operational_analytics'), icon: Activity },
    { id: 'hr_analytics', name: t('reporting.hr_analytics'), icon: Users },
    { id: 'safety_analytics', name: t('reporting.safety_analytics'), icon: Shield },
    { id: 'performance_analytics', name: t('reporting.performance_analytics'), icon: TrendingUp },
    { id: 'rental_analytics', name: t('reporting.rental_analytics'), icon: Car },
    { id: 'customer_analytics', name: t('reporting.customer_analytics'), icon: Building },
    { id: 'customer_equipment', name: 'Customer Equipment Report', icon: Car },
    { id: 'supervisor_equipment', name: 'Supervisor Equipment Report', icon: Users },
  ];

  // Fetch supervisors with equipment when supervisor equipment report is selected
  const fetchSupervisorsWithEquipment = async () => {
    if (selectedReport !== 'supervisor_equipment') return;
    
    try {
      setLoadingSupervisors(true);
      // Fetch the report data to get supervisors
      const response = await fetch('/api/reports/supervisor-equipment?status=all');
      if (response.ok) {
        const data = await response.json();
        const supervisorGroups = data.data?.supervisor_groups || data.supervisor_groups || [];
        // Extract unique supervisors
        const supervisors = supervisorGroups.map((group: any) => ({
          id: group.supervisor_id,
          name: group.supervisor_name,
          file_number: group.supervisor_file_number,
        }));
        setSupervisorsWithEquipment(supervisors);
      } else {
        console.error('Failed to fetch supervisors with equipment');
        setSupervisorsWithEquipment([]);
      }
    } catch (error) {
      console.error('Error fetching supervisors with equipment:', error);
      setSupervisorsWithEquipment([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  // Fetch customers with rentals when component mounts or when customer equipment report is selected
  const fetchCustomersWithRentals = async () => {
    if (selectedReport !== 'customer_equipment') return;
    
    try {
      setLoadingCustomers(true);
      const response = await fetch('/api/customers/with-rentals');
      if (response.ok) {
        const data = await response.json();
        setCustomersWithRentals(data.data || []);
      } else {
        console.error('Failed to fetch customers with rentals');
        setCustomersWithRentals([]);
      }
    } catch (error) {
      console.error('Error fetching customers with rentals:', error);
      setCustomersWithRentals([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch equipment categories when equipment report is selected
  const fetchEquipmentCategories = async () => {
    if (selectedReport !== 'equipment_by_category') return;
    
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/equipment/categories');
      if (response.ok) {
        const data = await response.json();
        setEquipmentCategories(data.data || []);
      } else {
        console.error('Failed to fetch equipment categories');
        setEquipmentCategories([]);
      }
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      setEquipmentCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch data when specific report types are selected
  React.useEffect(() => {
    reportGeneratedRef.current = false; // Reset flag when report type changes
    if (selectedReport === 'customer_equipment') {
      fetchCustomersWithRentals();
      // Reset equipment filters when switching to customer equipment report
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
      setSupervisorFilter('all');
    } else if (selectedReport === 'supervisor_equipment') {
      fetchSupervisorsWithEquipment();
      // Reset filters when switching to supervisor equipment report
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
      setCustomerFilter('all');
    } else if (selectedReport === 'equipment_by_category') {
      fetchEquipmentCategories();
      // Reset customer filter when switching to equipment report
      setCustomerFilter('all');
    } else {
      // Reset all filters when switching to other report types
      setCustomerFilter('all');
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
    }
  }, [selectedReport]);

  // Track if report was manually generated to avoid auto-trigger on initial load
  const reportGeneratedRef = React.useRef(false);

  // Auto-regenerate report when customer filter changes (only if report already exists)
  React.useEffect(() => {
    if (selectedReport === 'customer_equipment' && reportData && reportGeneratedRef.current) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        generateReport();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerFilter, selectedReport]);

  // Auto-regenerate report when supervisor filter changes (only if report already exists)
  React.useEffect(() => {
    if (selectedReport === 'supervisor_equipment' && reportData && reportGeneratedRef.current) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        generateReport();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorFilter, selectedReport]);

  // Auto-regenerate report when status filter changes (only if report already exists)
  React.useEffect(() => {
    if ((selectedReport === 'supervisor_equipment' || selectedReport === 'equipment_by_category') && reportData && reportGeneratedRef.current) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        generateReport();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, selectedReport]);

  const generateReport = async () => {
      try {
        setLoading(true);
      const loadingToastId = toast.loading(t('reporting.generating_comprehensive_report'));

        const paramsObj: any = {
        report_type: selectedReport,
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };
      
      if (departmentFilter !== 'all') paramsObj.departmentId = departmentFilter;
      if (customerFilter !== 'all') paramsObj.customerId = customerFilter;
      if (categoryFilter !== 'all') paramsObj.categoryId = categoryFilter;
      if (statusFilter !== 'all' && selectedReport === 'supervisor_equipment') paramsObj.status = statusFilter;
      if (statusFilter !== 'all' && selectedReport === 'equipment_by_category') paramsObj.status = statusFilter;
      if (supervisorFilter !== 'all' && selectedReport === 'supervisor_equipment') paramsObj.supervisorId = supervisorFilter;
      if (includeInactive) paramsObj.includeInactive = 'true';
      
      const params = new URLSearchParams(paramsObj);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const apiEndpoint = selectedReport === 'customer_equipment' 
        ? `/api/reports/customer-equipment?${params}`
        : selectedReport === 'supervisor_equipment'
        ? `/api/reports/supervisor-equipment?${params}`
        : selectedReport === 'equipment_by_category'
        ? `/api/reports/equipment?${params}`
        : `/api/reports/comprehensive?${params}`;
      
      const response = await fetch(apiEndpoint, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate report`);
        }

        const responseData = await response.json();
      
      // Extract the actual report data from the API response
      const data = responseData.data || responseData;
      setReportData(data);
      reportGeneratedRef.current = true; // Mark that report was generated
      
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
      case 'equipment_by_category':
        if (data.summary_stats) {
          cards.push(
            { title: 'Total Equipment', value: data.summary_stats.totalEquipment || 0, icon: Car, color: 'blue' },
            { title: 'Active Equipment', value: data.summary_stats.activeEquipment || 0, icon: Car, color: 'green' },
            { title: 'Available Equipment', value: data.summary_stats.availableEquipment || 0, icon: Car, color: 'emerald' },
            { title: 'Rented Equipment', value: data.summary_stats.rentedEquipment || 0, icon: Car, color: 'orange' },
            { title: 'Maintenance Equipment', value: data.summary_stats.maintenanceEquipment || 0, icon: Car, color: 'red' },
            { title: 'Total Value', value: `SAR ${Number(data.summary_stats.totalValue || 0).toLocaleString()}`, icon: DollarSign, color: 'purple' }
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
            { title: t('safety.stats.totalIncidents'), value: totalIncidents, icon: Shield, color: 'red' },
            { title: t('safety.stats.resolvedCases'), value: resolvedIncidents, icon: Shield, color: 'green' },
            { title: t('safety.stats.openCases'), value: pendingIncidents, icon: Shield, color: 'orange' },
            { title: t('reporting.safetyScore'), value: `${safetyScore}%`, icon: Shield, color: 'blue' }
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
      case 'customer_equipment':
        if (data.summary_stats) {
          cards.push(
            { title: 'Total Customers', value: data.summary_stats.total_customers || 0, icon: Building, color: 'blue' },
            { title: 'Customers with Rentals', value: data.summary_stats.customers_with_rentals || 0, icon: Building, color: 'green' },
            { title: 'Total Equipment', value: data.summary_stats.total_equipment || 0, icon: Car, color: 'purple' },
            { title: 'Equipment with Operators', value: data.summary_stats.equipment_with_operators || 0, icon: Users, color: 'emerald' },
            { title: 'Equipment without Operators', value: data.summary_stats.equipment_without_operators || 0, icon: Car, color: 'orange' },
            { title: 'Total Operators', value: data.summary_stats.total_operators || 0, icon: Users, color: 'cyan' }
          );
        }
        break;
      case 'supervisor_equipment':
        const supervisorStats = data.data?.summary_stats || data.summary_stats;
        if (supervisorStats) {
          cards.push(
            { title: 'Total Supervisors', value: supervisorStats.total_supervisors || 0, icon: Users, color: 'blue' },
            { title: 'Total Equipment', value: supervisorStats.total_equipment || 0, icon: Car, color: 'purple' },
            { title: 'Total Items', value: supervisorStats.total_items || 0, icon: Car, color: 'green' },
            { title: 'Avg Equipment/Supervisor', value: supervisorStats.average_equipment_per_supervisor || 0, icon: TrendingUp, color: 'emerald' }
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

      case 'customer_equipment':
        // Handle both array and object formats
        let customerGroupsArray = data.customer_groups;
        if (customerGroupsArray && !Array.isArray(customerGroupsArray)) {
          // Convert object to array if needed
          customerGroupsArray = Object.values(customerGroupsArray);
        }
        
        if (customerGroupsArray && Array.isArray(customerGroupsArray) && customerGroupsArray.length > 0) {
          console.log('First customer rentals:', customerGroupsArray[0]?.rentals);
          console.log('First customer rentals length:', customerGroupsArray[0]?.rentals?.length);
          
          return (
            <div className="space-y-6">
              {/* Customer Equipment Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Customer Equipment Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Total Equipment</TableHead>
                        <TableHead>Equipment with Operators</TableHead>
                        <TableHead>Equipment without Operators</TableHead>
                        <TableHead>Total Operators</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerGroupsArray.map((customer: any, index: number) => {
                        console.log(`Rendering customer ${index}:`, customer);
                        return (
                          <TableRow key={customer.customer_info?.id || index}>
                            <TableCell className="font-medium">{customer.customer_info?.name || 'N/A'}</TableCell>
                            <TableCell>{customer.customer_info?.type || 'N/A'}</TableCell>
                            <TableCell>{customer.customer_info?.contact_person || 'N/A'}</TableCell>
                            <TableCell>{customer.equipment_summary?.total_equipment || 0}</TableCell>
                            <TableCell>
                              <Badge variant="default">{customer.equipment_summary?.equipment_with_operators || 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{customer.equipment_summary?.equipment_without_operators || 0}</Badge>
                            </TableCell>
                            <TableCell>{customer.equipment_summary?.total_operators || 0}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Detailed Equipment List */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Detailed Equipment List</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Rental</TableHead>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Operator Contact</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerGroupsArray.map((customer: any, customerIndex: number) => {
                        console.log(`Processing customer ${customerIndex} rentals:`, customer.rentals);
                        return customer.rentals?.map((rental: any, rentalIndex: number) => {
                          console.log(`Processing rental ${rentalIndex} equipment:`, rental.equipment);
                          return rental.equipment?.map((equipment: any, equipmentIndex: number) => {
                            console.log(`Rendering equipment ${equipmentIndex}:`, equipment);
                            // Create unique key by including all indices to prevent duplicates
                            const uniqueKey = `customer-${customer.customer_info?.id || customerIndex}-rental-${rental.id || rentalIndex}-equipment-${equipment.id || equipmentIndex}-idx-${customerIndex}-${rentalIndex}-${equipmentIndex}`;
                            return (
                              <TableRow key={uniqueKey}>
                                <TableCell className="font-medium">{customer.customer_info?.name || 'N/A'}</TableCell>
                                <TableCell>{rental.rental_number || 'N/A'}</TableCell>
                                <TableCell>{equipment.name || 'N/A'}</TableCell>
                                <TableCell>{equipment.type || 'N/A'}</TableCell>
                                <TableCell>{equipment.model || 'N/A'}</TableCell>
                                <TableCell>{equipment.serial || 'N/A'}</TableCell>
                                <TableCell>
                                  {equipment.operator ? (
                                    <Badge variant="default">{equipment.operator.name || 'N/A'}</Badge>
                                  ) : (
                                    <Badge variant="secondary">No Operator</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {equipment.operator ? equipment.operator.phone || 'N/A' : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {equipment.operator ? (
                                    <Badge variant="default">{equipment.operator.assignment_status || 'Active'}</Badge>
                                  ) : (
                                    <Badge variant="secondary">Unassigned</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          }) || [];
                        }) || [];
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No customer equipment data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are customers with rentals and equipment assigned.
              </p>
            </div>
          );
        }
        break;
      case 'supervisor_equipment':
        const supervisorGroups = data.data?.supervisor_groups || data.supervisor_groups;
        if (supervisorGroups && Array.isArray(supervisorGroups) && supervisorGroups.length > 0) {
          return (
            <div className="space-y-6">
              {/* Supervisor Equipment Summary */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Supervisor Equipment Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supervisor</TableHead>
                        <TableHead>File Number</TableHead>
                        <TableHead>Equipment Count</TableHead>
                        <TableHead>Total Items</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supervisorGroups.map((supervisor: any, index: number) => (
                        <TableRow key={supervisor.supervisor_id || index}>
                          <TableCell className="font-medium">{supervisor.supervisor_name || 'N/A'}</TableCell>
                          <TableCell>{supervisor.supervisor_file_number || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="default">{supervisor.equipment_count || 0}</Badge>
                          </TableCell>
                          <TableCell>{supervisor.total_items || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Detailed Equipment List by Supervisor */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Detailed Equipment List by Supervisor</h3>
                </div>
                <div className="space-y-6">
                  {supervisorGroups.map((supervisor: any, supervisorIndex: number) => (
                    <div key={supervisor.supervisor_id || supervisorIndex} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="px-4 py-2 bg-gray-50 rounded-t">
                        <h4 className="font-semibold text-gray-900">
                          {supervisor.supervisor_name || 'N/A'}
                          {supervisor.supervisor_file_number && ` (File: ${supervisor.supervisor_file_number})`}
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            - {supervisor.equipment_count} Equipment
                          </span>
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Serial #</TableHead>
                              <TableHead>Equipment</TableHead>
                              <TableHead>Customer Name</TableHead>
                              <TableHead>Rental Status</TableHead>
                              <TableHead>Operator</TableHead>
                              <TableHead>Item Status</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>Completed Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(supervisor.equipment) && supervisor.equipment.length > 0 ? (
                              [...supervisor.equipment]
                                .sort((a: any, b: any) => {
                                  const nameA = (a?.customer_name || '').toLowerCase();
                                  const nameB = (b?.customer_name || '').toLowerCase();
                                  if (!nameA && !nameB) return 0;
                                  if (!nameA) return 1;
                                  if (!nameB) return -1;
                                  return nameA.localeCompare(nameB);
                                })
                                .map((equipment: any, equipmentIndex: number) => {
                                // Calculate global serial number
                                let globalSerial = 1;
                                for (let i = 0; i < supervisorIndex; i++) {
                                  if (supervisorGroups[i]?.equipment) {
                                    globalSerial += supervisorGroups[i].equipment.length;
                                  }
                                }
                                globalSerial += equipmentIndex;
                                
                                return (
                                  <TableRow key={`${supervisor.supervisor_id}-${equipment.equipment_id}-${equipment.rental_id}-${equipmentIndex}`}>
                                    <TableCell className="text-center font-medium">{globalSerial}</TableCell>
                                    <TableCell className="font-medium">{equipment.display_name || equipment.equipment_name || 'N/A'}</TableCell>
                                    <TableCell>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="truncate max-w-[200px]">
                                              {equipment.customer_name || 'N/A'}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{equipment.customer_name || 'N/A'}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={equipment.rental_status === 'active' ? 'default' : 'secondary'}>
                                        {equipment.rental_status || 'N/A'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {equipment.operator_name ? (
                                        <Badge variant="default">{equipment.operator_name}</Badge>
                                      ) : (
                                        <Badge variant="secondary">No Operator</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={equipment.item_status === 'active' ? 'default' : 'secondary'}>
                                        {equipment.item_status || 'N/A'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{equipment.item_start_date || 'N/A'}</TableCell>
                                    <TableCell>{equipment.item_completed_date || 'N/A'}</TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center text-gray-500 py-4">
                                  No equipment assigned
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No supervisor equipment data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are rental items with supervisors assigned.
              </p>
            </div>
          );
        }
        break;
      case 'equipment_by_category':
        if (data.equipment_by_category && Object.keys(data.equipment_by_category).length > 0) {
          return (
            <div className="space-y-6">
              {/* Category Statistics */}
              {data.category_stats && data.category_stats.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Category Statistics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Rented</TableHead>
                          <TableHead>Maintenance</TableHead>
                          <TableHead>Total Value</TableHead>
                          <TableHead>Avg Daily Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.category_stats.map((category: any, index: number) => (
                          <TableRow key={category.categoryId || index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {category.categoryIcon && <span>{category.categoryIcon}</span>}
                                {category.categoryName}
                              </div>
                            </TableCell>
                            <TableCell>{category.totalEquipment}</TableCell>
                            <TableCell>
                              <Badge variant="default">{category.activeEquipment}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{category.availableEquipment}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{category.rentedEquipment}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{category.maintenanceEquipment}</Badge>
                            </TableCell>
                            <TableCell>SAR {Number(category.totalValue).toLocaleString()}</TableCell>
                            <TableCell>SAR {Number(category.avgDailyRate).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Equipment by Category */}
              {Object.values(data.equipment_by_category).map((category: any, categoryIndex: number) => (
                <div key={category.categoryId || categoryIndex} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {category.categoryIcon && <span>{category.categoryIcon}</span>}
                        {category.categoryName} ({category.equipment.length} items)
                      </div>
                    </h3>
                    {category.categoryDescription && (
                      <p className="text-sm text-gray-600 mt-1">{category.categoryDescription}</p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Manufacturer</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Serial</TableHead>
                          <TableHead>Door #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Daily Rate</TableHead>
                          <TableHead>Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.equipment.map((equipment: any, equipmentIndex: number) => (
                          <TableRow key={equipment.id || equipmentIndex}>
                            <TableCell className="font-medium">{equipment.name}</TableCell>
                            <TableCell>{equipment.manufacturer || 'N/A'}</TableCell>
                            <TableCell>{equipment.modelNumber || 'N/A'}</TableCell>
                            <TableCell>{equipment.serialNumber || 'N/A'}</TableCell>
                            <TableCell>{equipment.doorNumber || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  equipment.status === 'available' ? 'default' :
                                  equipment.status === 'rented' ? 'secondary' :
                                  equipment.status === 'maintenance' ? 'destructive' : 'outline'
                                }
                              >
                                {equipment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{equipment.locationName || 'N/A'}</TableCell>
                            <TableCell>
                              {equipment.assignedEmployeeName ? (
                                <Badge variant="outline">{equipment.assignedEmployeeName}</Badge>
                              ) : (
                                <Badge variant="secondary">Unassigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>SAR {Number(equipment.purchasePrice || 0).toLocaleString()}</TableCell>
                            <TableCell>SAR {Number(equipment.dailyRate || 0).toFixed(2)}</TableCell>
                            <TableCell>{equipment.assetCondition || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          );
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No equipment data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are equipment records in the system.
              </p>
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
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDFReport = async () => {
    if (!reportData || (selectedReport !== 'equipment_by_category' && selectedReport !== 'supervisor_equipment')) return;
    
    let loadingToastId: string | number | undefined;
    try {
      loadingToastId = toast.loading('Generating PDF report...');
      
      if (selectedReport === 'equipment_by_category') {
        await EquipmentReportPDFService.downloadEquipmentReportPDF(
          reportData,
          `equipment-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else if (selectedReport === 'supervisor_equipment') {
        await SupervisorEquipmentReportPDFService.downloadSupervisorEquipmentReportPDF(
          reportData,
          `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
      }
      
      // Small delay to ensure PDF generation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.dismiss(loadingToastId);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error('Failed to generate PDF report');
    }
  };

  const downloadExcelReport = async () => {
    if (!reportData || (selectedReport !== 'equipment_by_category' && selectedReport !== 'supervisor_equipment')) return;
    
    let loadingToastId: string | number | undefined;
    try {
      loadingToastId = toast.loading('Generating Excel report...');
      
      if (selectedReport === 'equipment_by_category') {
        await EquipmentReportExcelService.downloadEquipmentReportExcel(
          reportData,
          `equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`
        );
      } else if (selectedReport === 'supervisor_equipment') {
        await SupervisorEquipmentReportExcelService.downloadSupervisorEquipmentReportExcel(
          reportData,
          `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`
        );
      }
      
      // Small delay to ensure Excel generation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.dismiss(loadingToastId);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel report:', error);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error('Failed to generate Excel report');
    }
  };

  return (
    <ProtectedRoute>
      <PermissionContent action="read" subject="Report">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('reporting.comprehensive_analytics')}
            </h1>
            <p className="text-gray-600">
              {t('reporting.comprehensive_analytics_description')}
            </p>
          </div>

          {/* Report Configuration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('reporting.report_configuration')}</CardTitle>
              <CardDescription>{t('reporting.configure_parameters')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 min-w-[200px]">
                  <Label htmlFor="report-type">{t('reporting.select_report_type')}</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reporting.select_report_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-[150px]">
                  <Label htmlFor="date-range">{t('reporting.date_range')}</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reporting.date_range')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">{t('reporting.last_7_days')}</SelectItem>
                      <SelectItem value="30">{t('reporting.last_30_days')}</SelectItem>
                      <SelectItem value="90">{t('reporting.last_90_days')}</SelectItem>
                      <SelectItem value="365">{t('reporting.last_year')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-[180px]">
                  <Label htmlFor="department-filter">{t('reporting.department_filter')}</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reporting.department_filter')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reporting.all_departments')}</SelectItem>
                      <SelectItem value="hr">{t('reporting.hr_department')}</SelectItem>
                      <SelectItem value="finance">{t('reporting.finance_department')}</SelectItem>
                      <SelectItem value="operations">{t('reporting.operations_department')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Filter - Only show for customer equipment report */}
                {selectedReport === 'customer_equipment' && (
                  <div className="space-y-2 min-w-[250px]">
                    <Label htmlFor="customer-filter">{t('reporting.select_customer')}</Label>
                    <Select 
                      value={customerFilter} 
                      onValueChange={setCustomerFilter}
                      disabled={loadingCustomers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCustomers ? t('reporting.loading') : t('reporting.select_customer')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customersWithRentals.map((customer) => {
                          const displayText = `${customer.name} (${customer.total_rentals} rental${customer.total_rentals !== 1 ? 's' : ''}${customer.active_rentals > 0 ? `, ${customer.active_rentals} active` : ''})`;
                          return (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Supervisor Filter - Only show for supervisor equipment report */}
                {selectedReport === 'supervisor_equipment' && (
                  <div className="space-y-2 min-w-[250px]">
                    <Label htmlFor="supervisor-filter">Select Supervisor</Label>
                    <Select 
                      value={supervisorFilter} 
                      onValueChange={setSupervisorFilter}
                      disabled={loadingSupervisors}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingSupervisors ? "Loading supervisors..." : "Select supervisor"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Supervisors</SelectItem>
                        {supervisorsWithEquipment.map((supervisor) => (
                          <SelectItem key={supervisor.id} value={supervisor.id.toString()}>
                            {supervisor.name}
                            {supervisor.file_number && ` (File: ${supervisor.file_number})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Equipment Category Filter - Only show for equipment by category report */}
                {selectedReport === 'equipment_by_category' && (
                  <div className="space-y-2 min-w-[200px]">
                    <Label htmlFor="category-filter">Equipment Category</Label>
                    <Select 
                      value={categoryFilter} 
                      onValueChange={setCategoryFilter}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {equipmentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Filter - Show for equipment by category and supervisor equipment reports */}
                {(selectedReport === 'equipment_by_category' || selectedReport === 'supervisor_equipment') && (
                  <div className="space-y-2 min-w-[150px]">
                    <Label htmlFor="status-filter">
                      {selectedReport === 'supervisor_equipment' ? 'Item Status' : 'Equipment Status'}
                    </Label>
                    <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {selectedReport === 'supervisor_equipment' ? (
                          <>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Include Inactive Checkbox - Only show for equipment by category report */}
                {selectedReport === 'equipment_by_category' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include-inactive" 
                      checked={includeInactive}
                      onCheckedChange={(checked) => setIncludeInactive(checked as boolean)}
                    />
                    <Label htmlFor="include-inactive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Include Inactive Equipment
                    </Label>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? t('reporting.generating') : t('reporting.generate_report')}
                </Button>
                {reportData && (
                  <>
                    <Button onClick={exportReport} variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      {t('reporting.export_report')}
                    </Button>
                    {(selectedReport === 'equipment_by_category' || selectedReport === 'supervisor_equipment') && (
                      <>
                        <Button onClick={downloadPDFReport} variant="outline" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button onClick={downloadExcelReport} variant="outline" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download Excel
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {reportData && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {renderMetricCards(reportData).map((card, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{card.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      </div>
                      <div className={`p-2 rounded-full bg-${card.color}-100`}>
                        <card.icon className={`h-6 w-6 text-${card.color}-600`} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              {selectedReport === 'customer_equipment' && reportData.summary_stats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Equipment Distribution</CardTitle>
                      <CardDescription>Equipment with and without operators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ReportChart
                        title="Equipment Distribution"
                        data={[
                          { label: 'Equipment with Operators', value: reportData.summary_stats.equipment_with_operators || 0, color: '#10b981' },
                          { label: 'Equipment without Operators', value: reportData.summary_stats.equipment_without_operators || 0, color: '#f59e0b' }
                        ]}
                        type="pie"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.detailed_data')}</CardTitle>
                  <CardDescription>
                    {t('reporting.generated_on')}: {new Date(reportData.generated_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderDataTable(reportData)}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </PermissionContent>
    </ProtectedRoute>
  );
}
