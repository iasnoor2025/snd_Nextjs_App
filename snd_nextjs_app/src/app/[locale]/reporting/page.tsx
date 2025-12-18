'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { ReportChart } from '@/components/report-chart';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
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
  Activity,
  Columns,
  ChevronDown,
  Printer,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import React from 'react';
import { EquipmentReportPDFService, EquipmentReportData } from '@/lib/services/equipment-report-pdf-service';
import { EquipmentReportExcelService } from '@/lib/services/equipment-report-excel-service';
import { SupervisorEquipmentReportPDFService, SupervisorEquipmentReportData } from '@/lib/services/supervisor-equipment-report-pdf-service';
import { SupervisorEquipmentReportExcelService } from '@/lib/services/supervisor-equipment-report-excel-service';
import { EmployeeAdvanceReportPDFService, EmployeeAdvanceReportData } from '@/lib/services/employee-advance-report-pdf-service';

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
  timesheet_details?: any[];
  rental_summary?: any[];
  monthly_items?: any[];
}

interface MetricCard {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: string;
}

export default function ReportingDashboardPage() {
  const { t, isRTL } = useI18n();
  const params = useParams();
  const localeFromParams = (params?.locale as string) || 'en';
  const isArabicLocale = localeFromParams === 'ar';
  const pdfIsRTL = isRTL || isArabicLocale;
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
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [customersForTimesheet, setCustomersForTimesheet] = useState<any[]>([]);
  const [loadingCustomersForTimesheet, setLoadingCustomersForTimesheet] = useState(false);
  const [hasTimesheetFilter, setHasTimesheetFilter] = useState('all'); // 'all', 'yes', 'no'
  const [showOnlyCompanyName, setShowOnlyCompanyName] = useState(false); // Show only company name when checked
  const [employeeFilter, setEmployeeFilter] = useState('all'); // For employee advance report
  
  // Column visibility for rental timesheet report
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    si: true,
    equipment: true,
    unitPrice: true,
    rate: true,
    startDate: true,
    operator: true,
    supervisor: true,
    duration: true,
    total: true,
    completedDate: true,
  });
  
  const rentalTimesheetColumns = [
    { id: 'si', label: 'SI#' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'unitPrice', label: 'Unit Price' },
    { id: 'rate', label: 'Rate' },
    { id: 'startDate', label: 'Start Date' },
    { id: 'operator', label: 'Operator' },
    { id: 'supervisor', label: 'Supervisor' },
    { id: 'duration', label: 'Duration' },
    { id: 'total', label: 'Total' },
    { id: 'completedDate', label: 'Completed Date' },
  ];

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
    { id: 'rental_timesheet', name: 'Rental Timesheet Report', icon: Clock },
    { id: 'customer_analytics', name: t('reporting.customer_analytics'), icon: Building },
    { id: 'customer_equipment', name: 'Customer Equipment Report', icon: Car },
    { id: 'supervisor_equipment', name: 'Supervisor Equipment Report', icon: Users },
    { id: 'employee_advance', name: 'Employee Advance Report', icon: Wallet },
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

  // Fetch customers for rental timesheet report (filtered by month and hasTimesheet)
  const fetchCustomersForTimesheet = async () => {
    if (selectedReport !== 'rental_timesheet') return;
    
    try {
      setLoadingCustomersForTimesheet(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (monthFilter) {
        params.append('month', monthFilter);
      }
      if (hasTimesheetFilter !== 'all') {
        params.append('hasTimesheet', hasTimesheetFilter);
      }
      
      const url = `/api/customers/with-rentals${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomersForTimesheet(data.data || []);
      } else {
        console.error('Failed to fetch customers for timesheet');
        setCustomersForTimesheet([]);
      }
    } catch (error) {
      console.error('Error fetching customers for timesheet:', error);
      setCustomersForTimesheet([]);
    } finally {
      setLoadingCustomersForTimesheet(false);
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
      setMonthFilter('');
      setCompanyFilter('all');
    } else if (selectedReport === 'supervisor_equipment') {
      fetchSupervisorsWithEquipment();
      // Reset filters when switching to supervisor equipment report
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
      setCustomerFilter('all');
      setMonthFilter('');
      setCompanyFilter('all');
    } else if (selectedReport === 'equipment_by_category') {
      fetchEquipmentCategories();
      // Reset customer filter when switching to equipment report
      setCustomerFilter('all');
      setMonthFilter('');
      setCompanyFilter('all');
    } else if (selectedReport === 'rental_timesheet') {
      fetchCustomersForTimesheet();
      // Reset other filters when switching to rental timesheet report
      setCustomerFilter('all');
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
      setSupervisorFilter('all');
      setHasTimesheetFilter('all');
      setShowOnlyCompanyName(false);
      // Reset column visibility to default (all visible)
    } else if (selectedReport === 'employee_advance') {
      // Reset other filters when switching to employee advance report
      setCustomerFilter('all');
      setCategoryFilter('all');
      setSupervisorFilter('all');
      setDepartmentFilter('all');
      setVisibleColumns({
        si: true,
        equipment: true,
        unitPrice: true,
        rate: true,
        startDate: true,
        operator: true,
        supervisor: true,
        duration: true,
        total: true,
        completedDate: true,
      });
    } else {
      // Reset all filters when switching to other report types
      setCustomerFilter('all');
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
      setMonthFilter('');
      setCompanyFilter('all');
      setHasTimesheetFilter('all');
      setShowOnlyCompanyName(false);
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

  // Re-fetch customers when month or hasTimesheet filter changes
  React.useEffect(() => {
    if (selectedReport === 'rental_timesheet') {
      fetchCustomersForTimesheet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, hasTimesheetFilter, selectedReport]);

  // Auto-regenerate report when month, company, or hasTimesheet filter changes for rental timesheet (only if report already exists)
  React.useEffect(() => {
    if (selectedReport === 'rental_timesheet' && reportData && reportGeneratedRef.current) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        generateReport();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, companyFilter, hasTimesheetFilter, selectedReport]);

  const generateReport = async () => {
      try {
        setLoading(true);
      const loadingToastId = toast.loading(t('reporting.generating_comprehensive_report'));

        const paramsObj: any = {
        report_type: selectedReport,
      };
      
      // For rental timesheet, use month filter if provided, otherwise don't send date range
      if (selectedReport === 'rental_timesheet') {
        if (monthFilter) {
          paramsObj.month = monthFilter;
        }
        // Don't send startDate/endDate for rental timesheet - show all data if no month filter
      } else if (selectedReport !== 'employee_advance') {
        // For employee advance, don't send date range - show all data
        paramsObj.startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
        paramsObj.endDate = new Date().toISOString();
      }
      // For employee_advance, don't send date filters - show all advances
      
      if (departmentFilter !== 'all') paramsObj.departmentId = departmentFilter;
      if (customerFilter !== 'all') paramsObj.customerId = customerFilter;
      if (categoryFilter !== 'all') paramsObj.categoryId = categoryFilter;
      if (selectedReport === 'supervisor_equipment') paramsObj.status = statusFilter;
      if (selectedReport === 'equipment_by_category') paramsObj.status = statusFilter;
      if (supervisorFilter !== 'all' && selectedReport === 'supervisor_equipment') paramsObj.supervisorId = supervisorFilter;
      if (includeInactive) paramsObj.includeInactive = 'true';
      if (selectedReport === 'rental_timesheet' && companyFilter !== 'all') paramsObj.customerId = companyFilter;
      if (selectedReport === 'rental_timesheet' && hasTimesheetFilter !== 'all') paramsObj.hasTimesheet = hasTimesheetFilter;
      if (selectedReport === 'employee_advance' && employeeFilter && employeeFilter !== 'all' && employeeFilter !== '') {
        paramsObj.employeeId = employeeFilter;
      }
      if (selectedReport === 'employee_advance' && statusFilter !== 'all') paramsObj.status = statusFilter;
      
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

      case 'employee_advance':
        if (data.summary_stats) {
          cards.push(
            { title: 'Total Advances', value: data.summary_stats.total_advances || 0, icon: Wallet, color: 'blue' },
            { title: 'Total Amount', value: `SAR ${Number(data.summary_stats.total_amount || 0).toLocaleString()}`, icon: DollarSign, color: 'green' },
            { title: 'Total Repaid', value: `SAR ${Number(data.summary_stats.total_repaid || 0).toLocaleString()}`, icon: DollarSign, color: 'emerald' },
            { title: 'Total Remaining', value: `SAR ${Number(data.summary_stats.total_remaining || 0).toLocaleString()}`, icon: Wallet, color: 'orange' },
            { title: 'Pending', value: data.summary_stats.pending_count || 0, icon: Clock, color: 'yellow' },
            { title: 'Approved', value: data.summary_stats.approved_count || 0, icon: TrendingUp, color: 'green' }
          );
        }
        break;

      case 'employee_advance':
        if (data.summary_stats) {
          cards.push(
            { title: 'Total Advances', value: data.summary_stats.total_advances || 0, icon: Wallet, color: 'blue' },
            { title: 'Total Amount', value: `SAR ${Number(data.summary_stats.total_amount || 0).toLocaleString()}`, icon: DollarSign, color: 'green' },
            { title: 'Total Repaid', value: `SAR ${Number(data.summary_stats.total_repaid || 0).toLocaleString()}`, icon: DollarSign, color: 'emerald' },
            { title: 'Total Remaining', value: `SAR ${Number(data.summary_stats.total_remaining || 0).toLocaleString()}`, icon: Wallet, color: 'orange' },
            { title: 'Pending', value: data.summary_stats.pending_count || 0, icon: Clock, color: 'yellow' },
            { title: 'Approved', value: data.summary_stats.approved_count || 0, icon: TrendingUp, color: 'green' }
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
      case 'rental_timesheet':
        if (data.timesheet_stats) {
          cards.push(
            { title: 'Total Timesheet Entries', value: data.timesheet_stats.total_entries || 0, icon: Clock, color: 'blue' },
            { title: 'Total Regular Hours', value: `${Number(data.timesheet_stats.total_regular_hours || 0).toFixed(1)}h`, icon: Clock, color: 'green' },
            { title: 'Total Overtime Hours', value: `${Number(data.timesheet_stats.total_overtime_hours || 0).toFixed(1)}h`, icon: Clock, color: 'orange' },
            { title: 'Total Hours', value: `${Number(data.timesheet_stats.total_hours || 0).toFixed(1)}h`, icon: Clock, color: 'purple' },
            { title: 'Active Rentals', value: data.timesheet_stats.active_rentals || 0, icon: Car, color: 'emerald' },
            { title: 'Equipment Items', value: data.timesheet_stats.equipment_items || 0, icon: Car, color: 'cyan' }
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

                        return customer.rentals?.map((rental: any, rentalIndex: number) => {

                          return rental.equipment?.map((equipment: any, equipmentIndex: number) => {

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
                                        <span>
                                          {equipment.operator_name}
                                          {equipment.operator_file_number && ` (${equipment.operator_file_number})`}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">No Operator</span>
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
      case 'rental_timesheet':
        // Handle case when "Show Only Company Name" is checked and "No Timesheet" is selected
        // Even if no items are returned, show the selected company name
        if (showOnlyCompanyName && hasTimesheetFilter === 'no' && companyFilter !== 'all') {
          const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
          if (selectedCustomer && (!data.monthly_items || data.monthly_items.length === 0 || 
              (data.monthly_items.length > 0 && data.monthly_items[0].items.length === 0))) {
            return (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {monthFilter ? new Date(`${monthFilter}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All Months'}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">{selectedCustomer.name}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          }
        }
        
        if (data.monthly_items && Array.isArray(data.monthly_items) && data.monthly_items.length > 0) {
          return (
            <div className="space-y-8">
              {data.monthly_items.map((monthData: any, monthIndex: number) => {
                // Calculate duration for each item
                const itemsWithDuration = monthData.items.map((item: any) => {
                  let duration = 'N/A';
                  let durationValue = 0;
                  
                  if (item.start_date) {
                    const startDate = new Date(item.start_date);
                    const endDate = item.completed_date ? new Date(item.completed_date) : new Date();
                    
                    // Calculate duration based on month filter if present
                    let diffDays = 0;
                    
                    if (monthFilter) {
                      // Calculate days within the selected month
                      const [year, monthNum] = monthFilter.split('-').map(Number);
                      const monthStart = new Date(year, monthNum - 1, 1);
                      const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
                      
                      // Find the overlap between item period and selected month
                      const effectiveStart = startDate > monthStart ? startDate : monthStart;
                      const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
                      
                      if (effectiveStart <= effectiveEnd) {
                        const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                        diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                      } else {
                        diffDays = 0;
                      }
                    } else {
                      // No month filter - calculate total days
                      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    
                    if (item.total_hours && parseFloat(item.total_hours.toString()) > 0) {
                      // If we have timesheet hours, show hours
                      const totalHours = parseFloat(item.total_hours.toString());
                      duration = `${totalHours.toFixed(0)} hours`;
                      durationValue = totalHours;
                    } else if (diffDays > 0) {
                      // Otherwise show days
                      duration = `${diffDays} days`;
                      durationValue = diffDays;
                    } else {
                      duration = '0 days';
                      durationValue = 0;
                    }
                  }
                  
                  // Calculate total based on unit price, rate type, and timesheet hours
                  // Convert rate to hourly equivalent, then multiply by hours (matches rental service logic)
                  const unitPrice = parseFloat(item.unit_price?.toString() || '0') || 0;
                  const totalHours = parseFloat(item.total_hours?.toString() || '0') || 0;
                  const rateType = item.rate_type || 'daily';
                  
                  let total = 0;
                  if (totalHours > 0) {
                    // Convert rate to hourly equivalent based on rate type
                    let hourlyRate = unitPrice;
                    if (rateType === 'daily') {
                      hourlyRate = unitPrice / 10; // Daily rate / 10 hours
                    } else if (rateType === 'weekly') {
                      hourlyRate = unitPrice / (7 * 10); // Weekly rate / (7 days * 10 hours)
                    } else if (rateType === 'monthly') {
                      hourlyRate = unitPrice / (30 * 10); // Monthly rate / (30 days * 10 hours)
                    }
                    // If rateType is 'hourly', hourlyRate = unitPrice
                    total = hourlyRate * totalHours;
                  } else {
                    // If no timesheet hours, calculate based on date duration
                    if (item.start_date) {
                      const startDate = new Date(item.start_date);
                      const endDate = item.completed_date ? new Date(item.completed_date) : new Date();
                      
                      let diffDays = 0;
                      
                      if (monthFilter) {
                        // Calculate days within the selected month
                        const [year, monthNum] = monthFilter.split('-').map(Number);
                        const monthStart = new Date(year, monthNum - 1, 1);
                        const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
                        
                        // Find the overlap between item period and selected month
                        const effectiveStart = startDate > monthStart ? startDate : monthStart;
                        const effectiveEnd = endDate < monthEnd ? endDate : monthEnd;
                        
                        if (effectiveStart <= effectiveEnd) {
                          const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                          diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        } else {
                          diffDays = 0;
                        }
                      } else {
                        // No month filter - calculate total days
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                      }
                      
                      if (diffDays > 0) {
                        if (rateType === 'daily') {
                          total = unitPrice * diffDays;
                        } else if (rateType === 'hourly') {
                          total = unitPrice * (diffDays * 10); // Assume 10 hours per day
                        } else if (rateType === 'weekly') {
                          total = unitPrice * Math.ceil(diffDays / 7);
                        } else if (rateType === 'monthly') {
                          total = unitPrice * Math.ceil(diffDays / 30);
                        } else {
                          total = unitPrice;
                        }
                      } else {
                        total = 0;
                      }
                    } else {
                      total = unitPrice;
                    }
                  }

                  return {
                    ...item,
                    duration,
                    total,
                  };
                });

                // Sort items by equipment name
                const sortedItems = [...itemsWithDuration].sort((a: any, b: any) => {
                  const nameA = (a.equipment_name || '').toLowerCase();
                  const nameB = (b.equipment_name || '').toLowerCase();
                  
                  // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
                  const extractNumber = (name: string) => {
                    const match = name.match(/^(\d+)/);
                    return match ? parseInt(match[1]) : null;
                  };
                  
                  const numA = extractNumber(nameA);
                  const numB = extractNumber(nameB);
                  
                  // If both have numeric prefixes, compare numerically
                  if (numA !== null && numB !== null) {
                    if (numA !== numB) {
                      return numA - numB;
                    }
                    // If numbers are equal, compare full names
                    return nameA.localeCompare(nameB);
                  }
                  
                  // If one has numeric prefix and the other doesn't, numeric comes first
                  if (numA !== null && numB === null) return -1;
                  if (numA === null && numB !== null) return 1;
                  
                  // Both are non-numeric, sort alphabetically
                  return nameA.localeCompare(nameB);
                });

                return (
                  <div key={monthData.month} className="bg-white rounded-lg shadow">
                    {/* Month Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">{monthData.monthLabel}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span><strong>Items:</strong> {monthData.totalItems}</span>
                          <span><strong>Active:</strong> {monthData.activeItems}</span>
                          <span><strong>Value:</strong> SAR {Number(monthData.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Items Table */}
                    <div className="space-y-4">
                      {/* Column Selection Dropdown */}
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Columns className="h-4 w-4" />
                              <span>Select Columns</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2 space-y-2">
                              {rentalTimesheetColumns.map((column) => {
                                const isChecked = visibleColumns[column.id];
                                const visibleCount = Object.values(visibleColumns).filter(v => v).length;
                                const isLastVisible = isChecked && visibleCount === 1;
                                
                                return (
                                  <div
                                    key={column.id}
                                    className="flex items-center space-x-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                                    onClick={() => {
                                      // Prevent unchecking if it's the last visible column
                                      if (!isChecked && visibleCount === 1) {
                                        return;
                                      }
                                      if (!isLastVisible) {
                                        setVisibleColumns(prev => ({
                                          ...prev,
                                          [column.id]: !prev[column.id]
                                        }));
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      disabled={isLastVisible}
                                      onCheckedChange={(checked) => {
                                        // Prevent unchecking if it's the last visible column
                                        if (!checked && visibleCount === 1) {
                                          return;
                                        }
                                        setVisibleColumns(prev => ({
                                          ...prev,
                                          [column.id]: checked as boolean
                                        }));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label
                                      className="text-sm font-normal cursor-pointer flex-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {column.label}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {showOnlyCompanyName ? (
                                <TableHead>Company Name</TableHead>
                              ) : (
                                <>
                                  {visibleColumns.si && <TableHead className="w-12">SI#</TableHead>}
                                  {visibleColumns.equipment && <TableHead>Equipment</TableHead>}
                                  {visibleColumns.unitPrice && <TableHead>Unit Price</TableHead>}
                                  {visibleColumns.rate && <TableHead>Rate</TableHead>}
                                  {visibleColumns.startDate && <TableHead>Start Date</TableHead>}
                                  {visibleColumns.operator && <TableHead>Operator</TableHead>}
                                  {visibleColumns.supervisor && <TableHead>Supervisor</TableHead>}
                                  {visibleColumns.duration && <TableHead>Duration</TableHead>}
                                  {visibleColumns.total && <TableHead>Total</TableHead>}
                                  {visibleColumns.completedDate && <TableHead>Completed Date</TableHead>}
                                </>
                              )}
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {showOnlyCompanyName ? (
                            // Show only unique company names
                            // When "No Timesheet" filter is active, show all companies that have items without timesheets
                            (() => {
                              // Extract unique company names from items
                              // When hasTimesheetFilter === 'no', the API already filters to only return items without timesheets
                              // So we just need to show all unique company names from the filtered results
                              const uniqueCompanies = Array.from(
                                new Set(
                                  sortedItems
                                    .map((item: any) => item.customer_name)
                                    .filter((name: string) => name)
                                )
                              ).sort();
                              
                              // If no companies found in items but a specific company is selected with "No Timesheet" filter,
                              // show that company name
                              if (uniqueCompanies.length === 0 && hasTimesheetFilter === 'no' && companyFilter !== 'all') {
                                const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
                                if (selectedCustomer) {
                                  return (
                                    <TableRow>
                                      <TableCell className="font-medium">{selectedCustomer.name}</TableCell>
                                    </TableRow>
                                  );
                                }
                              }
                              
                              return uniqueCompanies.map((companyName: string, index: number) => (
                                <TableRow key={`company-${index}`}>
                                  <TableCell className="font-medium">{companyName}</TableCell>
                                </TableRow>
                              ));
                            })()
                          ) : (
                            sortedItems.map((item: any, itemIndex: number) => (
                              <TableRow key={`${item.rental_item_id}-${item.rental_id}-${itemIndex}`}>
                                {visibleColumns.si && (
                                  <TableCell className="text-center">{item.serial_number || itemIndex + 1}</TableCell>
                                )}
                                {visibleColumns.equipment && (
                                  <TableCell className="font-medium">{item.equipment_name || 'N/A'}</TableCell>
                                )}
                                {visibleColumns.unitPrice && (
                                  <TableCell>SAR {Number(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                )}
                                {visibleColumns.rate && (
                                  <TableCell>
                                    <Badge variant="outline">{item.rate_type || 'N/A'}</Badge>
                                  </TableCell>
                                )}
                                {visibleColumns.startDate && (
                                  <TableCell>{item.start_date ? new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</TableCell>
                                )}
                                {visibleColumns.operator && (
                                  <TableCell>{item.operator_display || '-'}</TableCell>
                                )}
                                {visibleColumns.supervisor && (
                                  <TableCell>{item.supervisor_display || '-'}</TableCell>
                                )}
                                {visibleColumns.duration && (
                                  <TableCell>{item.duration}</TableCell>
                                )}
                                {visibleColumns.total && (
                                  <TableCell className="font-medium">SAR {Number(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                )}
                                {visibleColumns.completedDate && (
                                  <TableCell>{item.completed_date ? new Date(item.completed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
                                )}
                              </TableRow>
                            ))
                          )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        } else if (data.timesheet_details && Array.isArray(data.timesheet_details) && data.timesheet_details.length > 0) {
          // Fallback to detailed entries if monthly items not available
          return (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Detailed Timesheet Entries</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rental Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Regular Hours</TableHead>
                      <TableHead>Overtime Hours</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.timesheet_details.map((entry: any, index: number) => (
                      <TableRow key={entry.id || index}>
                        <TableCell className="font-medium">{entry.date || 'N/A'}</TableCell>
                        <TableCell>{entry.rental_number || 'N/A'}</TableCell>
                        <TableCell>{entry.customer_name || 'N/A'}</TableCell>
                        <TableCell>{entry.equipment_name || 'N/A'}</TableCell>
                        <TableCell>{Number(entry.regular_hours || 0).toFixed(2)}h</TableCell>
                        <TableCell>{Number(entry.overtime_hours || 0).toFixed(2)}h</TableCell>
                        <TableCell className="font-medium">
                          {Number((parseFloat(entry.regular_hours?.toString() || '0') + parseFloat(entry.overtime_hours?.toString() || '0')).toFixed(2))}h
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{entry.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        } else {
          // Handle case when "Show Only Company Name" is checked and "No Timesheet" is selected
          // Show the selected company name even if no items are returned
          if (showOnlyCompanyName && hasTimesheetFilter === 'no' && companyFilter !== 'all') {
            const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
            if (selectedCustomer) {
              return (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {monthFilter ? new Date(`${monthFilter}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All Months'}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{selectedCustomer.name}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            }
          }
          
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No rental timesheet data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are rental timesheet entries in the selected date range.
              </p>
            </div>
          );
        }
        break;

      case 'employee_advance':
        if (data.advance_details && Array.isArray(data.advance_details) && data.advance_details.length > 0) {
          return (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Advance Details</h3>
              </div>
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SI#</TableHead>
                        <TableHead>File Number</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Repaid</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.advance_details.map((advance: any, index: number) => (
                        <TableRow key={advance.id || index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{advance.employee_file_number || 'N/A'}</TableCell>
                          <TableCell className="font-medium">{advance.employee_name || 'N/A'}</TableCell>
                          <TableCell>SAR {Number(advance.amount || 0).toLocaleString()}</TableCell>
                          <TableCell>{advance.purpose || advance.reason || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                advance.status === 'approved' || advance.status === 'paid' ? 'default' :
                                advance.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {advance.status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>SAR {Number(advance.repaid_amount || 0).toLocaleString()}</TableCell>
                          <TableCell>SAR {Number(advance.remaining_balance || 0).toLocaleString()}</TableCell>
                          <TableCell>{advance.created_at ? new Date(advance.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No employee advance data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are advance payments in the selected date range.
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

  // Print rental timesheet report
  const handlePrintRentalTimesheet = () => {
    if (!reportData || selectedReport !== 'rental_timesheet') return;
    
    const data = reportData.monthly_items || [];
    const formatDate = (date: Date, formatStr: string) => {
      const d = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      if (formatStr === 'MMM dd, yyyy') {
        return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
      }
      if (formatStr === 'MMMM yyyy') {
        return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
      if (formatStr === 'MMMM dd, yyyy') {
        return `${monthNames[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
      }
      return d.toLocaleDateString();
    };

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rental Timesheet Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; margin: 0; font-size: 12px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 20px; }
            h2 { color: #666; margin-top: 15px; margin-bottom: 5px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 3px 5px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; font-size: 12px; }
            td { font-size: 12px; }
            .sl-col { width: 35px; text-align: center; }
            .equipment-col { min-width: 120px; }
            .price-col { width: 80px; text-align: right; }
            .rate-col { width: 60px; text-align: center; }
            .date-col { width: 95px; }
            .operator-col { min-width: 110px; }
            .duration-col { width: 75px; text-align: center; }
            .total-col { width: 100px; text-align: right; font-weight: bold; }
            .completed-col { width: 100px; }
            .summary { background-color: #f9f9f9; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
            .month-section { page-break-after: auto; margin-bottom: 15px; }
            @media print {
              body { padding: 6px; font-size: 11px; }
              .no-print { display: none; }
              table { font-size: 11px; }
              th, td { padding: 2px 4px; font-size: 11px; }
            }
          </style>
        </head>
        <body>
          <h1>Rental Timesheet Report</h1>
          <div class="summary">
            <strong>Report Date:</strong> ${formatDate(new Date(), 'MMMM dd, yyyy')}<br/>
            ${companyFilter && companyFilter !== 'all' ? (() => {
              const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
              return selectedCustomer ? `<strong>Company:</strong> ${selectedCustomer.name}<br/>` : '';
            })() : ''}
            ${monthFilter ? `<strong>Month:</strong> ${formatDate(new Date(`${monthFilter}-01`), 'MMMM yyyy')}<br/>` : ''}
            ${hasTimesheetFilter !== 'all' ? `<strong>Has Timesheet:</strong> ${hasTimesheetFilter === 'yes' ? 'Yes' : 'No'}<br/>` : ''}
          </div>
    `;

    // Handle case when data is empty but a specific company is selected with "No Timesheet" filter
    if (data.length === 0 && showOnlyCompanyName && hasTimesheetFilter === 'no' && companyFilter !== 'all') {
      const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
      if (selectedCustomer) {
        const monthLabel = monthFilter 
          ? formatDate(new Date(`${monthFilter}-01`), 'MMMM yyyy')
          : 'All Months';
        html += `
          <div class="month-section">
            <h2>${monthLabel}</h2>
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${selectedCustomer.name}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }
    } else {
      data.forEach((monthData: any) => {
        html += `
          <div class="month-section">
            <h2>${monthData.monthLabel}</h2>
            <div class="summary">
              <strong>Items:</strong> ${monthData.totalItems} | 
              <strong>Active:</strong> ${monthData.activeItems} | 
              <strong>Value:</strong> SAR ${Number(monthData.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <table>
              <thead>
                <tr>
                  ${showOnlyCompanyName ? '<th>Company Name</th>' : `
                    ${visibleColumns.si ? '<th class="sl-col">SI#</th>' : ''}
                    ${visibleColumns.equipment ? '<th class="equipment-col">Equipment</th>' : ''}
                    ${visibleColumns.unitPrice ? '<th class="price-col">Unit Price</th>' : ''}
                    ${visibleColumns.rate ? '<th class="rate-col">Rate</th>' : ''}
                    ${visibleColumns.startDate ? '<th class="date-col">Start Date</th>' : ''}
                    ${visibleColumns.operator ? '<th class="operator-col">Operator</th>' : ''}
                    ${visibleColumns.supervisor ? '<th class="operator-col">Supervisor</th>' : ''}
                    ${visibleColumns.duration ? '<th class="duration-col">Duration</th>' : ''}
                    ${visibleColumns.total ? '<th class="total-col">Total</th>' : ''}
                    ${visibleColumns.completedDate ? '<th class="completed-col">Completed Date</th>' : ''}
                  `}
                </tr>
              </thead>
              <tbody>
        `;

      // Sort items by equipment name
      const sortedItems = [...monthData.items].sort((a: any, b: any) => {
        const nameA = ((a.equipment_name || '')).toLowerCase();
        const nameB = ((b.equipment_name || '')).toLowerCase();
        
        // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
        const extractNumber = (name: string) => {
          const match = name.match(/^(\d+)/);
          return match ? parseInt(match[1]) : null;
        };
        
        const numA = extractNumber(nameA);
        const numB = extractNumber(nameB);
        
        // If both have numeric prefixes, compare numerically
        if (numA !== null && numB !== null) {
          if (numA !== numB) {
            return numA - numB;
          }
          // If numbers are equal, compare full names
          return nameA.localeCompare(nameB);
        }
        
        // If one has numeric prefix and the other doesn't, numeric comes first
        if (numA !== null && numB === null) return -1;
        if (numA === null && numB !== null) return 1;
        
        // Both are non-numeric, sort alphabetically
        return nameA.localeCompare(nameB);
      });

      if (showOnlyCompanyName) {
        // Show only unique company names
        // When "No Timesheet" filter is active, the API already filters to only return items without timesheets
        // So we just need to show all unique company names from the filtered results
        const uniqueCompanies = Array.from(
          new Set(
            sortedItems
              .map((item: any) => item.customer_name)
              .filter((name: string) => name)
          )
        ).sort();
        
        // If no companies found in items but a specific company is selected with "No Timesheet" filter,
        // show that company name
        if (uniqueCompanies.length === 0 && hasTimesheetFilter === 'no' && companyFilter !== 'all') {
          const selectedCustomer = customersForTimesheet.find(c => c.id.toString() === companyFilter);
          if (selectedCustomer) {
            html += `
              <tr>
                <td>${selectedCustomer.name}</td>
              </tr>
            `;
          }
        } else {
          uniqueCompanies.forEach((companyName: string) => {
            html += `
              <tr>
                <td>${companyName}</td>
              </tr>
            `;
          });
        }
      } else {
        sortedItems.forEach((item: any, index: number) => {
          const equipmentName = item.equipment_name || 'N/A';
          const unitPrice = parseFloat(item.unit_price || 0) || 0;
          const rateType = item.rate_type || 'daily';
          const startDate = item.start_date ? formatDate(new Date(item.start_date), 'MMM dd, yyyy') : 'N/A';
          const operatorName = item.operator_display || item.operator_name || '-';
          const supervisorName = item.supervisor_display || item.supervisor_name || '-';
          
          // Calculate duration for print view
          let duration = '-';
          if (item.start_date) {
            const itemStartDate = new Date(item.start_date);
            const itemEndDate = item.completed_date ? new Date(item.completed_date) : new Date();
            
            if (monthFilter) {
              // Calculate days within the selected month
              const [year, monthNum] = monthFilter.split('-').map(Number);
              const monthStart = new Date(year, monthNum - 1, 1);
              const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
              
              // Find the overlap between item period and selected month
              const effectiveStart = itemStartDate > monthStart ? itemStartDate : monthStart;
              const effectiveEnd = itemEndDate < monthEnd ? itemEndDate : monthEnd;
              
              if (effectiveStart <= effectiveEnd) {
                const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                duration = `${diffDays} days`;
              } else {
                duration = '0 days';
              }
            } else {
              // No month filter - calculate total days
              const diffTime = Math.abs(itemEndDate.getTime() - itemStartDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              duration = `${diffDays} days`;
            }
          }
          
          // Calculate total for print view
          let total = 0;
          const totalHours = parseFloat(item.total_hours?.toString() || '0') || 0;
          
          if (totalHours > 0) {
            // Convert rate to hourly equivalent based on rate type
            let hourlyRate = unitPrice;
            if (rateType === 'daily') {
              hourlyRate = unitPrice / 10; // Daily rate / 10 hours
            } else if (rateType === 'weekly') {
              hourlyRate = unitPrice / (7 * 10); // Weekly rate / (7 days * 10 hours)
            } else if (rateType === 'monthly') {
              hourlyRate = unitPrice / (30 * 10); // Monthly rate / (30 days * 10 hours)
            }
            total = hourlyRate * totalHours;
          } else {
            // If no timesheet hours, calculate based on date duration
            if (item.start_date) {
              const itemStartDate = new Date(item.start_date);
              const itemEndDate = item.completed_date ? new Date(item.completed_date) : new Date();
              
              let diffDays = 0;
              
              if (monthFilter) {
                // Calculate days within the selected month
                const [year, monthNum] = monthFilter.split('-').map(Number);
                const monthStart = new Date(year, monthNum - 1, 1);
                const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
                
                // Find the overlap between item period and selected month
                const effectiveStart = itemStartDate > monthStart ? itemStartDate : monthStart;
                const effectiveEnd = itemEndDate < monthEnd ? itemEndDate : monthEnd;
                
                if (effectiveStart <= effectiveEnd) {
                  const diffTime = Math.abs(effectiveEnd.getTime() - effectiveStart.getTime());
                  diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                } else {
                  diffDays = 0;
                }
              } else {
                // No month filter - calculate total days
                const diffTime = Math.abs(itemEndDate.getTime() - itemStartDate.getTime());
                diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              }
              
              if (diffDays > 0) {
                if (rateType === 'daily') {
                  total = unitPrice * diffDays;
                } else if (rateType === 'hourly') {
                  total = unitPrice * (diffDays * 10); // Assume 10 hours per day
                } else if (rateType === 'weekly') {
                  total = unitPrice * Math.ceil(diffDays / 7);
                } else if (rateType === 'monthly') {
                  total = unitPrice * Math.ceil(diffDays / 30);
                } else {
                  total = unitPrice;
                }
              } else {
                total = 0;
              }
            } else {
              total = unitPrice;
            }
          }
          
          let completedDate = '-';
          
          if (item.completed_date) {
            const completedDateObj = new Date(item.completed_date);
            const [monthName, yearStr] = monthData.monthLabel.split(' ');
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const reportMonth = monthNames.indexOf(monthName);
            const reportYear = parseInt(yearStr);
            
            const reportMonthStart = new Date(reportYear, reportMonth, 1);
            reportMonthStart.setHours(0, 0, 0, 0);
            const reportMonthEnd = new Date(reportYear, reportMonth + 1, 0);
            reportMonthEnd.setHours(23, 59, 59, 999);
            
            if (completedDateObj >= reportMonthStart && completedDateObj <= reportMonthEnd) {
              completedDate = formatDate(completedDateObj, 'MMM dd, yyyy');
            }
          }

          html += `
            <tr>
              ${visibleColumns.si ? `<td class="sl-col">${index + 1}</td>` : ''}
              ${visibleColumns.equipment ? `<td class="equipment-col">${equipmentName}</td>` : ''}
              ${visibleColumns.unitPrice ? `<td class="price-col">SAR ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
              ${visibleColumns.rate ? `<td class="rate-col">${rateType}</td>` : ''}
              ${visibleColumns.startDate ? `<td class="date-col">${startDate}</td>` : ''}
              ${visibleColumns.operator ? `<td class="operator-col">${operatorName}</td>` : ''}
              ${visibleColumns.supervisor ? `<td class="operator-col">${supervisorName}</td>` : ''}
              ${visibleColumns.duration ? `<td class="duration-col">${duration}</td>` : ''}
              ${visibleColumns.total ? `<td class="total-col">SAR ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
              ${visibleColumns.completedDate ? `<td class="completed-col">${completedDate}</td>` : ''}
            </tr>
          `;
        });
      }

        html += `
              </tbody>
            </table>
          </div>
        `;
      });
    }

    html += `
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  // Download employee advance PDF
  const handleDownloadEmployeeAdvancePDF = async () => {
    if (!reportData || selectedReport !== 'employee_advance') return;
    
    try {
      const loadingToastId = toast.loading('Generating PDF report...');
      
      await EmployeeAdvanceReportPDFService.downloadEmployeeAdvanceReportPDF(
        reportData as unknown as EmployeeAdvanceReportData,
        `employee-advance-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      
      toast.dismiss(loadingToastId);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error downloading employee advance PDF:', error);
      toast.error('Failed to download PDF report');
    }
  };

  // Download rental timesheet PDF
  const handleDownloadRentalTimesheetPDF = async () => {
    if (!reportData || selectedReport !== 'rental_timesheet') return;
    
    try {
      const loadingToastId = toast.loading('Generating PDF report...');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (monthFilter) {
        params.append('month', monthFilter);
      }
      if (companyFilter && companyFilter !== 'all') {
        params.append('customerId', companyFilter);
      }
      if (hasTimesheetFilter !== 'all') {
        params.append('hasTimesheet', hasTimesheetFilter);
      }
      
      // Add visible columns as JSON string
      params.append('visibleColumns', JSON.stringify(visibleColumns));
      
      // Add showOnlyCompanyName flag
      params.append('showOnlyCompanyName', showOnlyCompanyName.toString());
      
      const url = `/api/reports/rental-timesheet/pdf?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        toast.dismiss(loadingToastId);
        toast.error('Failed to generate PDF');
        return;
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const monthStr = monthFilter ? `_${monthFilter}` : '';
      link.download = `Rental_Timesheet_Report${monthStr}_${dateStr}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.dismiss(loadingToastId);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      toast.error('Failed to download PDF report');
    }
  };

  const downloadPDFReport = async () => {
    if (!reportData || (selectedReport !== 'equipment_by_category' && selectedReport !== 'supervisor_equipment')) return;
    
    let loadingToastId: string | number | undefined;
    try {
      loadingToastId = toast.loading('Generating PDF report...');
      
      if (selectedReport === 'equipment_by_category') {
        await EquipmentReportPDFService.downloadEquipmentReportPDF(
          reportData as unknown as EquipmentReportData,
          `equipment-report-${new Date().toISOString().split('T')[0]}.pdf`
        );
      } else if (selectedReport === 'supervisor_equipment') {
        await SupervisorEquipmentReportPDFService.downloadSupervisorEquipmentReportPDF(
          reportData as unknown as SupervisorEquipmentReportData,
          `supervisor-equipment-report-${new Date().toISOString().split('T')[0]}.pdf`,
          { isRTL: pdfIsRTL }
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
          reportData as unknown as EquipmentReportData,
          `equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`
        );
      } else if (selectedReport === 'supervisor_equipment') {
        await SupervisorEquipmentReportExcelService.downloadSupervisorEquipmentReportExcel(
          reportData as unknown as SupervisorEquipmentReportData,
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

                {/* Date Range - Hide for rental timesheet and employee advance reports */}
                {selectedReport !== 'rental_timesheet' && selectedReport !== 'employee_advance' && (
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
                )}

                {/* Department Filter - Hide for rental timesheet and employee advance reports */}
                {selectedReport !== 'rental_timesheet' && selectedReport !== 'employee_advance' && (
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
                )}

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

                {/* Month Filter - Only show for rental timesheet report */}
                {selectedReport === 'rental_timesheet' && (
                  <div className="space-y-2 min-w-[200px]">
                    <Label htmlFor="month-filter">Month Filter</Label>
                    <Input
                      id="month-filter"
                      type="month"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      placeholder="Select month (optional)"
                    />
                    {monthFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMonthFilter('')}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}

                {/* Company Filter - Only show for rental timesheet report */}
                {selectedReport === 'rental_timesheet' && (
                  <div className="space-y-2 min-w-[250px]">
                    <Label htmlFor="company-filter">Company</Label>
                    <Select 
                      value={companyFilter} 
                      onValueChange={setCompanyFilter}
                      disabled={loadingCustomersForTimesheet}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCustomersForTimesheet ? "Loading..." : "Select company"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {customersForTimesheet.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                            {customer.total_rentals > 0 && ` (${customer.total_rentals} rental${customer.total_rentals !== 1 ? 's' : ''})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Has Timesheet Filter - Only show for rental timesheet report */}
                {selectedReport === 'rental_timesheet' && (
                  <div className="space-y-2 min-w-[200px]">
                    <Label htmlFor="has-timesheet-filter">Has Timesheet</Label>
                    <Select 
                      value={hasTimesheetFilter} 
                      onValueChange={setHasTimesheetFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rentals</SelectItem>
                        <SelectItem value="yes">Has Timesheet</SelectItem>
                        <SelectItem value="no">No Timesheet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Employee Filter - Only show for employee advance report */}
                {selectedReport === 'employee_advance' && (
                  <div className="space-y-2 min-w-[250px]">
                    <EmployeeDropdown
                      value={employeeFilter === 'all' ? undefined : employeeFilter}
                      onValueChange={(value) => setEmployeeFilter(value || 'all')}
                      placeholder="All Employees"
                      label="Employee"
                    />
                  </div>
                )}

                {/* Status Filter - Only show for employee advance report */}
                {selectedReport === 'employee_advance' && (
                  <div className="space-y-2 min-w-[150px]">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show Only Company Name Checkbox - Only show for rental timesheet report */}
                {selectedReport === 'rental_timesheet' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-only-company-name" 
                      checked={showOnlyCompanyName}
                      onCheckedChange={(checked) => setShowOnlyCompanyName(checked as boolean)}
                    />
                    <Label htmlFor="show-only-company-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Show Only Company Name
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
                    {selectedReport === 'rental_timesheet' ? (
                      <>
                        <Button 
                          onClick={handlePrintRentalTimesheet} 
                          variant="outline" 
                          className="flex items-center gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Print
                        </Button>
                        <Button 
                          onClick={handleDownloadRentalTimesheetPDF} 
                          variant="outline" 
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </>
                    ) : selectedReport === 'employee_advance' ? (
                      <Button 
                        onClick={handleDownloadEmployeeAdvancePDF} 
                        variant="outline" 
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    ) : (
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
