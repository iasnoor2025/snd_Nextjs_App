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
  ];

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
    if (selectedReport === 'customer_equipment') {
      fetchCustomersWithRentals();
      // Reset equipment filters when switching to customer equipment report
      setCategoryFilter('all');
      setStatusFilter('all');
      setIncludeInactive(false);
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

  const generateReport = async () => {
      try {
        setLoading(true);
      const loadingToastId = toast.loading(t('reporting.generating_comprehensive_report'));

        const params = new URLSearchParams({
        report_type: selectedReport,
        startDate: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        ...(departmentFilter !== 'all' && { departmentId: departmentFilter }),
        ...(customerFilter !== 'all' && { customerId: customerFilter }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(includeInactive && { includeInactive: 'true' }),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const apiEndpoint = selectedReport === 'customer_equipment' 
        ? `/api/reports/customer-equipment?${params}`
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
        
        if (data.customer_groups && Array.isArray(data.customer_groups) && data.customer_groups.length > 0) {
          console.log('First customer rentals:', data.customer_groups[0]?.rentals);
          console.log('First customer rentals length:', data.customer_groups[0]?.rentals?.length);
          
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
                      {data.customer_groups.map((customer: any, index: number) => {
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
                      {data.customer_groups.map((customer: any, customerIndex: number) => {
                        console.log(`Processing customer ${customerIndex} rentals:`, customer.rentals);
                        return customer.rentals?.map((rental: any, rentalIndex: number) => {
                          console.log(`Processing rental ${rentalIndex} equipment:`, rental.equipment);
                          return rental.equipment?.map((equipment: any, equipmentIndex: number) => {
                            console.log(`Rendering equipment ${equipmentIndex}:`, equipment);
                            return (
                              <TableRow key={`${customer.customer_info?.id || customerIndex}-${rental.id || rentalIndex}-${equipment.id || equipmentIndex}`}>
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
          console.log('❌ No customer groups found, showing fallback message');
          console.log('Customer groups value:', data.customer_groups);
          console.log('Customer groups is array?', Array.isArray(data.customer_groups));
          return (
            <div className="text-center py-8">
              <p className="text-gray-500">No customer equipment data found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Make sure there are customers with rentals and equipment assigned.
              </p>
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600">Debug Info:</p>
                <p className="text-xs text-gray-500">Data keys: {Object.keys(data).join(', ')}</p>
                <p className="text-xs text-gray-500">Customer groups: {data.customer_groups ? 'exists' : 'null'}</p>
                <p className="text-xs text-gray-500">Customer groups type: {typeof data.customer_groups}</p>
                <p className="text-xs text-gray-500">Customer groups length: {data.customer_groups?.length}</p>
                <p className="text-xs text-gray-500">Summary stats: {data.summary_stats ? 'exists' : 'null'}</p>
                <p className="text-xs text-gray-500">Raw customer groups value: {JSON.stringify(data.customer_groups)}</p>
              </div>
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
    if (!reportData || selectedReport !== 'equipment_by_category') return;
    
    try {
      const loadingToastId = toast.loading('Generating PDF report...');
      
      await EquipmentReportPDFService.downloadEquipmentReportPDF(
        reportData,
        `equipment-report-${new Date().toISOString().split('T')[0]}.pdf`
      );
      
      toast.dismiss(loadingToastId);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const downloadExcelReport = async () => {
    if (!reportData || selectedReport !== 'equipment_by_category') return;
    
    try {
      const loadingToastId = toast.loading('Generating Excel report...');
      
      await EquipmentReportExcelService.downloadEquipmentReportExcel(
        reportData,
        `equipment-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      toast.dismiss(loadingToastId);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel report:', error);
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
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

                <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="customer-filter">{t('reporting.select_customer')}</Label>
                    <Select 
                      value={customerFilter} 
                      onValueChange={setCustomerFilter}
                      disabled={loadingCustomers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select customer"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customersWithRentals.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-sm text-gray-500">
                                {customer.total_rentals} rental{customer.total_rentals !== 1 ? 's' : ''}
                                {customer.active_rentals > 0 && ` (${customer.active_rentals} active)`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Equipment Category Filter - Only show for equipment by category report */}
                {selectedReport === 'equipment_by_category' && (
                  <div className="space-y-2">
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

                {/* Status Filter - Only show for equipment by category report */}
                {selectedReport === 'equipment_by_category' && (
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Equipment Status</Label>
                    <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
                    {selectedReport === 'equipment_by_category' && (
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
