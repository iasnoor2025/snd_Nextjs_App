'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/use-i18n';
import { loadJsPDF } from '@/lib/client-libraries';
import { PermissionContent, RoleBased, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import { useDeleteConfirmations } from '@/lib/utils/confirmation-utils';
import { format } from 'date-fns';
import {
  AlertCircle,
  Ban,
  BarChart3,
  Calculator,
  CalendarDays,
  Calendar as CalendarIcon,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileDown,
  FileText,
  Filter,
  MoreHorizontal,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Square,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface PayrollItem {
  id: number;
  payroll_id: number;
  type: string;
  description: string;
  amount: number;
  is_taxable: boolean;
  tax_rate: number;
  order: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  file_number: string;
  basic_salary: number;
  department: string;
  designation: string;
  status: string;
}

interface Payroll {
  id: number;
  employee_id: number;
  employee: Employee;
  month: number;
  year: number;
  base_salary: number;
  overtime_amount: number;
  bonus_amount: number;
  deduction_amount: number;
  advance_deduction: number;
  final_amount: number;
  total_worked_hours: number;
  overtime_hours: number;
  status: string;
  notes: string;
  approved_by: number | null;
  approved_at: string | null;
  paid_by: number | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  items: PayrollItem[];
}

interface PayrollResponse {
  data: Payroll[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  first_page_url: string;
  last_page_url: string;
  path: string;
  links: any[];
}

export default function PayrollManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { t } = useTranslation(['common', 'payroll']);
  const { isRTL } = useI18n();
  const [payrolls, setPayrolls] = useState<PayrollResponse | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [generating, setGenerating] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [recalculating, setRecalculating] = useState(false);
  const [downloadingPayslip, setDownloadingPayslip] = useState<number | null>(null);
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});

  // Get allowed actions for payroll management
  const allowedActions = getAllowedActions('Payroll');

  // Fetch payrolls from API
  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '10',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (monthFilter) {
        params.append('month', monthFilter.toISOString().slice(0, 7)); // Format as YYYY-MM
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/payroll?${params}`);
      const data = await response.json();

      if (data.success) {
        // The API response structure matches PayrollResponse interface
        setPayrolls(data);

        // Batch translate employee names for Arabic display
        if (data.data && data.data.length > 0) {
          const namesToTranslate = data.data
            .map(
              payroll =>
                payroll.employee?.full_name ||
                `${payroll.employee?.first_name} ${payroll.employee?.last_name}`
            )
            .filter(name => name && name.trim() !== '');

          if (namesToTranslate.length > 0) {
            batchTranslateNames(namesToTranslate, isRTL, setTranslatedNames);
          }
        }
      } else {
        toast.error(t('payroll:error.fetchPayrolls'));
        // Set empty data structure to prevent errors
        setPayrolls({
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
          next_page_url: null,
          prev_page_url: null,
          first_page_url: '',
          last_page_url: '',
          path: '',
          links: [],
        });
      }
    } catch (error) {
      toast.error(t('payroll:error.fetchPayrolls'));
      
      // Set empty data structure to prevent errors
      setPayrolls({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: '',
        last_page_url: '',
        path: '',
        links: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [currentPage, statusFilter, monthFilter, searchTerm]);

  const handleGenerateApproved = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/payroll/generate-payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setIsApproveDialogOpen(false);
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.generateApproved'));
      }
    } catch (error) {
      toast.error(t('payroll:error.generateApproved'));
      
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('payroll:success.approve'));
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.approve'));
      }
    } catch (error) {
      toast.error(t('payroll:error.approve'));
      
    }
  };

  const handleProcessPayment = async (payrollId: number) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: 'bank_transfer',
          reference: `PAY-${payrollId}-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('payroll:success.processPayment'));
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.processPayment'));
      }
    } catch (error) {
      toast.error(t('payroll:error.processPayment'));
      
    }
  };

  const handleCancel = async (payrollId: number) => {
    if (!confirm(t('payroll:confirm.cancel'))) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${payrollId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('payroll:success.cancel'));
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.cancel'));
      }
    } catch (error) {
      toast.error(t('payroll:error.cancel'));
      
    }
  };

  const handleDelete = async (payrollId: number) => {
    if (!confirm(t('payroll:confirm.delete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('payroll:success.delete'));
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.delete'));
      }
    } catch (error) {
      toast.error(t('payroll:error.delete'));
      
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayrolls.size === 0) {
      toast.error(t('payroll:error.selectPayrolls'));
      return;
    }

    if (!confirm(t('payroll:confirm.bulkDelete', { count: selectedPayrolls.size }))) {
      return;
    }

    try {
      const response = await fetch('/api/payroll/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedPayrolls) }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedPayrolls(new Set());
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(data.message || t('payroll:error.bulkDelete'));
      }
    } catch (error) {
      toast.error(t('payroll:error.bulkDelete'));
      
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const payrollIds =
        payrolls?.data && Array.isArray(payrolls.data) ? payrolls.data.map(p => p.id) : [];
      setSelectedPayrolls(new Set(payrollIds));
    } else {
      setSelectedPayrolls(new Set());
    }
  };

  const handleSelectPayroll = (payrollId: number, checked: boolean) => {
    if (checked) {
      setSelectedPayrolls(prev => new Set([...prev, payrollId]));
    } else {
      setSelectedPayrolls(prev => new Set([...prev].filter(id => id !== payrollId)));
    }
  };

  const handleDownloadPayslip = async (payrollId: number) => {
    try {
      // Navigate to the payslip page for this payroll
      window.open(`/modules/payroll-management/${payrollId}/payslip`, '_blank');
      toast.success(t('payroll:success.payslipOpen'));
    } catch (error) {
      toast.error(t('payroll:error.payslipOpen'));
      
    }
  };

  const handleDirectDownloadPayslip = async (payrollId: number) => {
    try {
      setDownloadingPayslip(payrollId);
      
      // Fetch data and use custom PDF generation
      const dataResponse = await fetch(`/api/payroll/${payrollId}/payslip`);
      const data = await dataResponse.json();

        if (data.success) {
          // Create a temporary iframe to render the payslip
          const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.top = '-9999px';
        iframe.style.width = '1200px';
        iframe.style.height = '900px';
        document.body.appendChild(iframe);

        // Calculate additional data needed for the payslip
        const monthName = new Date(
          data.data.payroll.year,
          data.data.payroll.month - 1
        ).toLocaleDateString('en-US', { month: 'long' });
        const startDate = new Date(data.data.payroll.year, data.data.payroll.month - 1, 1);
        const endDate = new Date(data.data.payroll.year, data.data.payroll.month, 0);
        const formattedStartDate = startDate.toLocaleDateString();
        const formattedEndDate = endDate.toLocaleDateString();
        const daysInMonth = new Date(data.data.payroll.year, data.data.payroll.month, 0).getDate();

        // Calculate attendance data
        const attendanceMap = new Map();
        if (data.data.attendanceData && Array.isArray(data.data.attendanceData)) {
          data.data.attendanceData.forEach((day: any) => {
            attendanceMap.set(day.date, day);
          });
        }

        // Calculate totals
        const basicSalary = Number(data.data.payroll.base_salary) || 0;
        const overtimeAmount = Number(data.data.payroll.overtime_amount) || 0;
        const bonusAmount = Number(data.data.payroll.bonus_amount) || 0;
        const advanceDeduction = Number(data.data.payroll.advance_deduction) || 0;
        const totalWorkedHoursFromAttendance = data.data.attendanceData.reduce(
          (total: number, day: any) => {
            return total + (Number(day.hours) || 0) + (Number(day.overtime) || 0);
          },
          0
        );
        const overtimeHoursFromAttendance = data.data.attendanceData.reduce(
          (total: number, day: any) => {
            return total + (Number(day.overtime) || 0);
          },
          0
        );
        const daysWorkedFromAttendance = data.data.attendanceData.reduce(
          (count: number, day: any) => {
            return count + (Number(day.hours) > 0 || Number(day.overtime) > 0 ? 1 : 0);
          },
          0
        );

        // Calculate absent days
        const absentDays = data.data.attendanceData.reduce((count: number, day: any) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isFriday = dayName === 'Fri';
          if (Number(day.hours) === 0 && Number(day.overtime) === 0 && !isFriday) {
            return count + 1;
          }
          return count;
        }, 0);

        const absentDeduction = absentDays > 0 ? (basicSalary / daysInMonth) * absentDays : 0;
        const totalAllowances =
          (Number(data.data.employee.food_allowance) || 0) +
          (Number(data.data.employee.housing_allowance) || 0) +
          (Number(data.data.employee.transport_allowance) || 0);
        const netSalary =
          basicSalary +
          totalAllowances +
          overtimeAmount +
          bonusAmount -
          absentDeduction -
          advanceDeduction;

        const employeeName =
          data.data.employee.full_name ||
          `${data.data.employee.first_name || ''} ${data.data.employee.last_name || ''}`.trim() ||
          'Unknown Employee';

        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'SAR',
          }).format(amount);
        };

        // Generate attendance table HTML
        const generateAttendanceTable = () => {
          let tableHTML =
            '<table class="w-full border-collapse rounded-lg overflow-hidden shadow-md">';
          tableHTML += '<thead><tr>';

          // Day numbers header
          for (let day = 1; day <= 31; day++) {
            tableHTML += `<th class="bg-gray-900 text-white font-semibold p-1 text-center text-xs">${day.toString().padStart(2, '0')}</th>`;
          }
          tableHTML += '</tr><tr>';

          // Day names header
          for (let day = 1; day <= 31; day++) {
            const date = new Date(
              `${data.data.payroll.year}-${String(data.data.payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
            );
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            tableHTML += `<th class="bg-gray-900 text-gray-300 font-medium p-1 text-center text-xs">${dayName.substring(0, 1).toUpperCase()}</th>`;
          }
          tableHTML += '</tr></thead><tbody><tr>';

          // Regular hours row
          for (let day = 1; day <= 31; day++) {
            const date = new Date(
              `${data.data.payroll.year}-${String(data.data.payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
            );
            const dateString = date.toISOString().split('T')[0];
            const dayData = attendanceMap.get(dateString);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isFriday = dayName === 'Fri';

            let displayValue = '-';
            let cellClass = 'bg-white';

            if (dayData && Number(dayData.hours) > 0) {
              displayValue = dayData.hours.toString();
              cellClass = 'text-green-700 font-semibold';
            } else if (isFriday && (!dayData || Number(dayData.hours) === 0)) {
              displayValue = 'F';
              cellClass = 'bg-blue-100';
            } else if (
              !dayData ||
              (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0)
            ) {
              displayValue = 'A';
              cellClass = 'bg-red-100 text-red-700 font-semibold';
            }

            tableHTML += `<td class="p-1 text-center text-xs border border-gray-200 ${cellClass}">${displayValue}</td>`;
          }
          tableHTML += '</tr><tr>';

          // Overtime hours row
          for (let day = 1; day <= 31; day++) {
            const date = new Date(
              `${data.data.payroll.year}-${String(data.data.payroll.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
            );
            const dateString = date.toISOString().split('T')[0];
            const dayData = attendanceMap.get(dateString);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const isFriday = dayName === 'Fri';

            let overtimeValue = '-';
            let cellClass = 'bg-white';

            if (dayData && Number(dayData.hours) > 0) {
              const overtime = Number(dayData.overtime) || 0;
              if (overtime > 0) {
                overtimeValue = overtime.toString();
                cellClass = 'text-blue-700 font-semibold';
              } else {
                overtimeValue = '0';
              }
            } else if (isFriday && (!dayData || Number(dayData.hours) === 0)) {
              cellClass = 'bg-blue-100';
            } else if (
              !dayData ||
              (Number(dayData.hours) === 0 && Number(dayData.overtime) === 0)
            ) {
              cellClass = 'bg-red-100';
            }

            tableHTML += `<td class="p-1 text-center text-xs border border-gray-200 ${cellClass}">${overtimeValue}</td>`;
          }
          tableHTML += '</tr></tbody></table>';

          return tableHTML;
        };

        // Write the payslip HTML to the iframe with exact same structure as the payslip page
        const payslipHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Payslip</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              .payslip-container { background: white; width: 100%; max-width: none; margin: 0; padding: 0; box-shadow: none; border: none; }
                                 .bg-gradient-to-br { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 0.3rem; border-radius: 0; margin-bottom: 0.3rem; }
              .grid.grid-cols-1.lg\\:grid-cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.5rem; }
              .bg-gray-50.border.border-gray-200.rounded-lg.p-4 { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem; }
              .text-xs.font-semibold.text-gray-600.uppercase.tracking-wide.mb-3 { font-size: 0.65rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
              .space-y-2 { display: flex; flex-direction: column; gap: 0.3rem; }
              .flex.justify-between.items-center { display: flex; justify-content: space-between; align-items: center; padding: 0.2rem 0; border-bottom: 1px solid #f3f4f6; }
              .text-xs.text-gray-600.font-medium { font-size: 0.65rem; color: #6b7280; font-weight: 500; }
              .text-xs.font-semibold.text-gray-900 { font-size: 0.65rem; font-weight: 600; color: #111827; }
              .text-xs.font-semibold.text-green-700 { font-size: 0.65rem; font-weight: 600; color: #15803d; }
              .text-sm.font-semibold.text-gray-900.mb-2.pb-1.border-b.border-gray-200 { font-size: 0.75rem; font-weight: 600; color: #111827; margin-bottom: 0.4rem; padding-bottom: 0.2rem; border-bottom: 1px solid #e5e7eb; }
              .overflow-x-auto { overflow-x: auto; }
              .w-full.border-collapse.rounded-lg.overflow-hidden.shadow-md { width: 100%; border-collapse: collapse; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
              .bg-gray-900.text-white.font-semibold.p-1.text-center.text-xs { background: #111827; color: white; font-weight: 600; padding: 0.2rem 0.25rem; text-align: center; font-size: 0.65rem; vertical-align: middle; }
              .bg-gray-900.text-gray-300.font-medium.p-1.text-center.text-xs { background: #111827; color: #d1d5db; font-weight: 500; padding: 0.2rem 0.25rem; text-align: center; font-size: 0.65rem; vertical-align: middle; }
              .p-1.text-center.text-xs.border.border-gray-200 { padding: 0.2rem 0.25rem; text-align: center; font-size: 0.65rem; border: 1px solid #e5e7eb; vertical-align: middle; }
              .text-green-700.font-semibold { color: #15803d; font-weight: 600; font-size: 0.65rem; vertical-align: middle; }
              .bg-blue-100 { background: #dbeafe; }
              .bg-red-100.text-red-700.font-semibold { background: #fee2e2; color: #dc2626; font-weight: 600; font-size: 0.65rem; vertical-align: middle; }
              .text-blue-700.font-semibold { color: #2563eb; font-weight: 600; font-size: 0.65rem; vertical-align: middle; }
              .bg-red-100 { background: #fee2e2; }
              .mt-2.p-2.bg-gray-50.rounded.text-xs.text-gray-600 { margin-top: 0.3rem; padding: 0.4rem; background: #f9fafb; border-radius: 0.25rem; font-size: 0.65rem; color: #6b7280; line-height: 1.4; }
              .grid.grid-cols-1.lg\\:grid-cols-2.gap-4.mb-4 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
              .text-sm.font-semibold.text-gray-900.mb-3 { font-size: 0.7rem; font-weight: 600; color: #111827; margin-bottom: 0.3rem; }
              .text-xs.font-semibold.text-gray-700.uppercase.tracking-wide.mb-2 { font-size: 0.65rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
              .text-xs.font-semibold.text-red-700 { font-size: 0.65rem; font-weight: 600; color: #dc2626; }
              .border-t.border-gray-200.pt-2 { border-top: 1px solid #e5e7eb; padding-top: 0.3rem; }
              .border-t-2.border-gray-300.pt-2 { border-top: 2px solid #d1d5db; padding-top: 0.3rem; }
              .text-sm.font-bold.text-gray-900 { font-size: 0.7rem; font-weight: 700; color: #111827; }
              .text-sm.font-bold.text-green-700 { font-size: 0.7rem; font-weight: 700; color: #15803d; }
              .grid.grid-cols-1.md\\:grid-cols-3.gap-4.pt-4.border-t.border-gray-200 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #e5e7eb; }
              .text-center.p-3.bg-gray-50.border.border-gray-200.rounded-lg { text-align: center; padding: 0.4rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
              .text-xs.font-semibold.text-gray-600.uppercase.tracking-wide.mb-2 { font-size: 0.65rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem; }
              .text-sm.font-semibold.text-gray-900.mb-4 { font-size: 0.7rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem; }
              .border-t.border-gray-300.pt-1.text-xs.text-gray-500 { border-top: 1px solid #d1d5db; padding-top: 0.2rem; font-size: 0.6rem; color: #6b7280; }
              .ml-4.space-y-1.text-xs.text-gray-500 { margin-left: 0.5rem; display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.6rem; color: #6b7280; }
              .flex.items-center.justify-between { display: flex; align-items: center; justify-content: space-between; }
              .flex.items-center.space-x-4 { display: flex; align-items: center; gap: 0.5rem; }
              .bg-white.p-2.rounded-lg.shadow-md { background: white; padding: 0.3rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
              .w-8.h-8.object-contain { width: 2rem; height: 2rem; object-fit: contain; }
              .text-xl.font-bold { font-size: 0.9rem; font-weight: 700; }
              .text-sm.opacity-90 { font-size: 0.7rem; opacity: 0.9; }
              .text-xs.opacity-90 { font-size: 0.6rem; opacity: 0.9; }
              .text-lg.font-semibold { font-size: 0.8rem; font-weight: 600; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="payslip-container">
              <!-- Compact Header -->
              <div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="bg-white p-2 rounded-lg shadow-md">
                      <img src="/snd-logo.png" alt="SND Logo" class="w-8 h-8 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                      <div class="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-100 rounded" style="display: none;">SND</div>
                    </div>
                    <div>
                      <h1 class="text-xl font-bold">Samhan Naser Al-Dosri Est.</h1>
                      <p class="text-sm opacity-90">For Gen. Contracting & Rent. Equipments</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <h2 class="text-lg font-semibold">Employee Pay Slip</h2>
                    <p class="text-sm opacity-90">${monthName} ${data.data.payroll.year}</p>
                  </div>
                </div>
              </div>

              <!-- Compact Employee Information Grid -->
              <div class="p-4">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <!-- Employee Details -->
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Employee Details</h3>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">File Number</span>
                        <span class="text-xs font-semibold text-gray-900">${data.data.employee.file_number || '-'}</span>
                      </div>
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Employee Name</span>
                        <span class="text-xs font-semibold text-gray-900">${employeeName.toUpperCase()}</span>
                      </div>
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Designation</span>
                        <span class="text-xs font-semibold text-gray-900">${data.data.employee.designation || '-'}</span>
                      </div>
                      <div class="flex justify-between items-center py-1">
                        <span class="text-xs text-gray-600 font-medium">Employee ID</span>
                        <span class="text-xs font-semibold text-gray-900">${data.data.employee.id}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Work Details -->
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Work Details</h3>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Pay Period</span>
                        <span class="text-xs font-semibold text-gray-900">${monthName} ${data.data.payroll.year}</span>
                      </div>
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Date Range</span>
                        <span class="text-xs font-semibold text-gray-900">${formattedStartDate} - ${formattedEndDate}</span>
                      </div>
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Status</span>
                        <span class="text-xs font-semibold text-gray-900 capitalize">${data.data.payroll.status}</span>
                      </div>
                      <div class="flex justify-between items-center py-1">
                        <span class="text-xs text-gray-600 font-medium">Payroll ID</span>
                        <span class="text-xs font-semibold text-gray-900">#${data.data.payroll.id}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Salary Summary -->
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Salary Summary</h3>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center py-1 border-b border-gray-100">
                        <span class="text-xs text-gray-600 font-medium">Basic Salary</span>
                        <span class="text-xs font-semibold text-green-700">${formatCurrency(basicSalary)}</span>
                      </div>
                      ${
                        Number(data.data.employee.food_allowance) > 0
                          ? `
                        <div class="flex justify-between items-center py-1 border-b border-gray-200">
                          <span class="text-xs text-gray-600 font-medium">Food Allowance</span>
                          <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.food_allowance))}</span>
                        </div>
                      `
                          : ''
                      }
                      ${
                        Number(data.data.employee.housing_allowance) > 0
                          ? `
                        <div class="flex justify-between items-center py-1 border-b border-gray-200">
                          <span class="text-xs text-gray-600 font-medium">Housing Allowance</span>
                          <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.housing_allowance))}</span>
                        </div>
                      `
                          : ''
                      }
                      ${
                        Number(data.data.employee.transport_allowance) > 0
                          ? `
                        <div class="flex justify-between items-center py-1 border-b border-gray-200">
                          <span class="text-xs text-gray-600 font-medium">Transport Allowance</span>
                          <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.transport_allowance))}</span>
                        </div>
                      `
                          : ''
                      }
                      <div class="flex justify-between items-center py-1 border-b border-gray-200">
                        <span class="text-xs text-gray-600 font-medium">Overtime Pay</span>
                        <span class="text-xs font-semibold text-green-700">${formatCurrency(overtimeAmount)}</span>
                      </div>
                      <div class="flex justify-between items-center py-1">
                        <span class="text-xs text-gray-600 font-medium">Net Salary</span>
                        <span class="text-xs font-semibold text-green-700">${formatCurrency(netSalary)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Compact Attendance Record -->
                <div class="mb-4">
                  <h3 class="text-sm font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-200">Attendance Record</h3>
                  <div class="overflow-x-auto">
                    ${generateAttendanceTable()}
                  </div>
                  <div class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <span class="text-green-700 font-semibold">8</span> = regular hours, <span class="text-blue-700 font-semibold">More than 8</span> = overtime hours, <span class="text-red-700 font-semibold">A</span> = absent, <span class="text-blue-700 font-semibold">F</span> = Friday (weekend)
                  </div>
                </div>

                <!-- Compact Summary Section -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <!-- Working Hours Summary -->
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">Working Hours Summary</h3>
                    <div class="space-y-2">
                      <!-- Hours Breakdown -->
                      <div class="mb-3">
                        <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Hours Breakdown</h4>
                        <div class="space-y-1">
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Total Hours Worked</span>
                            <span class="text-xs font-semibold text-gray-900">${totalWorkedHoursFromAttendance} hrs</span>
                          </div>
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Regular Hours</span>
                            <span class="text-xs font-semibold text-gray-900">${totalWorkedHoursFromAttendance - overtimeHoursFromAttendance} hrs</span>
                          </div>
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Overtime Hours</span>
                            <span class="text-xs font-semibold text-green-700">${overtimeHoursFromAttendance} hrs</span>
                          </div>
                        </div>
                      </div>

                      <!-- Attendance Summary -->
                      <div class="mb-3">
                        <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Attendance Summary</h4>
                        <div class="space-y-1">
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Days Worked</span>
                            <span class="text-xs font-semibold text-gray-900">${daysWorkedFromAttendance} days</span>
                          </div>
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Absent Days</span>
                            <span class="text-xs font-semibold text-red-700">${absentDays} days</span>
                          </div>
                        </div>
                      </div>

                      <!-- Deductions -->
                      <div class="border-t border-gray-200 pt-2">
                        <div class="flex justify-between items-center py-1">
                          <span class="text-xs text-gray-600 font-medium">Absent Deduction</span>
                          <span class="text-xs font-semibold text-red-700">-${formatCurrency(absentDeduction)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Salary Breakdown -->
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">Salary Breakdown</h3>
                    <div class="space-y-2">
                      <!-- Earnings Section -->
                      <div class="mb-3">
                        <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Earnings</h4>
                        <div class="space-y-1">
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Basic Salary</span>
                            <span class="text-xs font-semibold text-green-700">${formatCurrency(basicSalary)}</span>
                          </div>
                          ${
                            Number(data.data.employee.food_allowance) > 0
                              ? `
                            <div class="flex justify-between items-center py-1">
                              <span class="text-xs text-gray-600 font-medium">Food Allowance</span>
                              <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.food_allowance))}</span>
                            </div>
                          `
                              : ''
                          }
                          ${
                            Number(data.data.employee.housing_allowance) > 0
                              ? `
                            <div class="flex justify-between items-center py-1">
                              <span class="text-xs text-gray-600 font-medium">Housing Allowance</span>
                              <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.housing_allowance))}</span>
                            </div>
                          `
                              : ''
                          }
                          ${
                            Number(data.data.employee.transport_allowance) > 0
                              ? `
                            <div class="flex justify-between items-center py-1">
                              <span class="text-xs text-gray-600 font-medium">Transport Allowance</span>
                              <span class="text-xs font-semibold text-gray-900">${formatCurrency(Number(data.data.employee.transport_allowance))}</span>
                            </div>
                          `
                              : ''
                          }
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Overtime Pay</span>
                            <span class="text-xs font-semibold text-green-700">${formatCurrency(overtimeAmount)}</span>
                          </div>
                          ${
                            overtimeHoursFromAttendance > 0
                              ? `
                            <div class="ml-4 space-y-1 text-xs text-gray-500">
                              <div class="flex justify-between items-center">
                                <span>Overtime Hours:</span>
                                <span>${overtimeHoursFromAttendance} hrs</span>
                              </div>
                              <div class="flex justify-between items-center">
                                <span>Overtime Rate:</span>
                                <span>
                                  ${
                                    data.data.employee.overtime_fixed_rate &&
                                    data.data.employee.overtime_fixed_rate > 0
                                      ? `${formatCurrency(Number(data.data.employee.overtime_fixed_rate))}/hr (Fixed)`
                                      : `${data.data.employee.overtime_rate_multiplier || 1.5}x (Basic/30/8)`
                                  }
                                </span>
                              </div>
                            </div>
                          `
                              : ''
                          }
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Bonus Amount</span>
                            <span class="text-xs font-semibold text-green-700">${formatCurrency(bonusAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Deductions Section -->
                      <div class="mb-3">
                        <h4 class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Deductions</h4>
                        <div class="space-y-1">
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Absent Days Deduction</span>
                            <span class="text-xs font-semibold text-red-700">-${formatCurrency(absentDeduction)}</span>
                          </div>
                          <div class="flex justify-between items-center py-1">
                            <span class="text-xs text-gray-600 font-medium">Advance Deduction</span>
                            <span class="text-xs font-semibold text-red-700">-${formatCurrency(advanceDeduction)}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Total Section -->
                      <div class="border-t-2 border-gray-300 pt-2">
                        <div class="flex justify-between items-center py-2">
                          <span class="text-sm font-bold text-gray-900">Net Salary</span>
                          <span class="text-sm font-bold text-green-700">${formatCurrency(netSalary)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Compact Signatures Section -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div class="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Chief Accountant</h4>
                    <div class="text-sm font-semibold text-gray-900 mb-4">Samir Taima</div>
                    <div class="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Verified By</h4>
                    <div class="text-sm font-semibold text-gray-900 mb-4">Salem Samhan Al-Dosri</div>
                    <div class="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Employee</h4>
                    <div class="text-sm font-semibold text-gray-900 mb-4">${employeeName}</div>
                    <div class="border-t border-gray-300 pt-1 text-xs text-gray-500">Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        iframe.contentDocument?.write(payslipHTML);
        iframe.contentDocument?.close();

        // Wait for content to load, then generate PDF
        setTimeout(async () => {
          try {
            // Dynamically load jsPDF library
            const jsPDF = await loadJsPDF();

            // Create PDF using jsPDF only (without html2canvas)
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 20;

            // Set font
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(24);

            // Company header
            pdf.text('C.A.T. INTERNATIONAL L.L.L.C.', pageWidth / 2, margin, { align: 'center' });

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Equipment Rental & Construction Services', pageWidth / 2, margin + 15, {
              align: 'center',
            });

            // Payslip title
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PAYSLIP', pageWidth / 2, margin + 40, { align: 'center' });

            // Employee information
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            const employeeName = data.data.employee.full_name || 'Unknown Employee';
            const employeeId = data.data.employee.file_number || data.data.employee.id;
            const monthName = new Date(
              data.data.payroll.year,
              data.data.payroll.month - 1
            ).toLocaleDateString('en-US', { month: 'long' });

            pdf.text(`Employee: ${employeeName}`, margin, margin + 70);
            pdf.text(`Employee ID: ${employeeId}`, margin, margin + 85);
            pdf.text(`Month: ${monthName} ${data.data.payroll.year}`, margin, margin + 100);

            // Salary details
            pdf.text(
              `Basic Salary: ${formatCurrency(Number(data.data.payroll.base_salary || 0))}`,
              margin,
              margin + 125
            );
            pdf.text(
              `Overtime: ${formatCurrency(Number(data.data.payroll.overtime_amount || 0))}`,
              margin,
              margin + 140
            );
            pdf.text(
              `Bonus: ${formatCurrency(Number(data.data.payroll.bonus_amount || 0))}`,
              margin,
              margin + 155
            );
            pdf.text(
              `Deductions: ${formatCurrency(Number(data.data.payroll.deduction_amount || 0))}`,
              margin,
              margin + 170
            );
            pdf.text(
              `Final Amount: ${formatCurrency(Number(data.data.payroll.final_amount || 0))}`,
              margin,
              margin + 185
            );

            // Save PDF
            const fileName = `payslip_${employeeId}_${monthName}_${data.data.payroll.year}.pdf`;
            pdf.save(fileName);

            // Clean up
            document.body.removeChild(iframe);
            toast.success(t('payroll:success.payslipDownload'));
          } catch (error) {
            
            document.body.removeChild(iframe);
            toast.error(t('payroll:error.payslipDownload'));
          }
        }, 1500);
      } else {
        toast.error(data.message || t('payroll:error.payslipDownload'));
      }
    } catch (error) {
      toast.error(t('payroll:error.payslipDownload'));
      
    } finally {
      setDownloadingPayslip(null);
    }
  };

  const handleRecalculateOvertime = async () => {
    try {
      setRecalculating(true);
      const response = await fetch('/api/payroll/regenerate-overtime', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchPayrolls(); // Refresh the list
      } else {
        toast.error(result.message || t('payroll:error.recalculateOvertime'));
      }
    } catch (error) {
      
      toast.error(t('payroll:error.recalculateOvertime'));
    } finally {
      setRecalculating(false);
    }
  };

  // getStatusBadge function removed - now using inline logic in the table

  const formatCurrency = (amount: number) => {
    const locale = isRTL ? 'ar-SA' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);

    // Convert to Arabic numerals if in RTL mode
    return isRTL ? convertToArabicNumerals(formatted, true) : formatted;
  };

  const formatDate = (dateString: string) => {
    const formatted = format(new Date(dateString), 'MMM dd, yyyy');
    return isRTL ? convertToArabicNumerals(formatted, true) : formatted;
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Payroll' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('payroll:loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Payroll' }}>
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('payroll:title')}</h1>
            <p className="text-muted-foreground">{t('payroll:description')}</p>
          </div>
          <div className="flex gap-2">
            <PermissionContent action="export" subject="Payroll">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('payroll:export')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Payroll">
              <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    {t('payroll:generateApproved')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('payroll:generateApprovedTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('payroll:generateApprovedDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsApproveDialogOpen(false)}
                      disabled={generating}
                    >
                      {t('payroll:cancel')}
                    </Button>
                    <Button onClick={handleGenerateApproved} disabled={generating}>
                      {generating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {t('payroll:generating')}
                        </>
                      ) : (
                        t('payroll:generatePayroll')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PermissionContent>

            <Button
              onClick={handleRecalculateOvertime}
              disabled={recalculating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {recalculating ? t('payroll:recalculating') : t('payroll:recalculateOvertime')}
            </Button>

            <Link href="/modules/payroll-management/reports">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('payroll:reports')}
              </Button>
            </Link>
            <Link href="/modules/payroll-management/salary-advances">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('payroll:salaryAdvances')}
              </Button>
            </Link>
            <Link href="/modules/payroll-management/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t('payroll:settings')}
              </Button>
            </Link>
            <Link href="/modules/payroll-management/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('payroll:createPayroll')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('payroll:filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t('payroll:search')}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('payroll:searchPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('payroll:status')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('payroll:selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('payroll:allStatus')}</SelectItem>
                    <SelectItem value="pending">{t('payroll:pending')}</SelectItem>
                    <SelectItem value="approved">{t('payroll:approved')}</SelectItem>
                    <SelectItem value="paid">{t('payroll:paid')}</SelectItem>
                    <SelectItem value="cancelled">{t('payroll:cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">{t('payroll:month')}</Label>
                <Input
                  id="month"
                  type="month"
                  value={monthFilter ? monthFilter.toISOString().slice(0, 7) : ''}
                  onChange={e => setMonthFilter(new Date(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee">{t('payroll:employee')}</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={employeeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEmployeeFilter('all')}
                  >
                    {t('payroll:allEmployees')}
                  </Button>
                  <EmployeeDropdown
                    value={employeeFilter === 'all' ? '' : employeeFilter}
                    onValueChange={value => setEmployeeFilter(value || 'all')}
                    placeholder={t('payroll:selectEmployee')}
                    showSearch={true}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedPayrolls.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedPayrolls.size}{' '}
                    {t('payroll:selectedPayrolls', { count: selectedPayrolls.size })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('payroll:deleteSelected')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPayrolls(new Set())}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('payroll:clearSelection')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payrolls Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('payroll:payrolls', { total: payrolls?.total || 0 })}</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedPayrolls.size ===
                      (payrolls?.data && Array.isArray(payrolls.data) ? payrolls.data.length : 0) &&
                    (payrolls?.data && Array.isArray(payrolls.data) ? payrolls.data.length : 0) > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">{t('payroll:selectAll')}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:employee')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:period')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:basicSalary')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:overtime')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:finalAmount')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:status')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                        {t('payroll:created')}
                      </TableHead>
                      <TableHead className={isRTL ? 'text-left' : 'text-right'}>
                        {t('payroll:actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls?.data && Array.isArray(payrolls.data) ? (
                      payrolls.data.map(payroll => (
                        <TableRow key={payroll.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedPayrolls.has(payroll.id)}
                              onCheckedChange={checked =>
                                handleSelectPayroll(payroll.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            <div>
                              <div className="font-medium">
                                {payroll.employee
                                  ? getTranslatedName(
                                      payroll.employee.full_name ||
                                        `${payroll.employee.first_name} ${payroll.employee.last_name}`,
                                      isRTL,
                                      translatedNames,
                                      setTranslatedNames
                                    ) || t('payroll:unknownEmployee')
                                  : t('payroll:unknownEmployee')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payroll.employee
                                  ? `${payroll.employee.department || t('payroll:na')} • ${payroll.employee.designation || t('payroll:na')}`
                                  : t('payroll:noDetails')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            {new Date(payroll.year, payroll.month - 1).toLocaleDateString(
                              isRTL ? 'ar-SA' : 'en-US',
                              {
                                month: 'long',
                                year: 'numeric',
                              }
                            )}
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            {formatCurrency(payroll.base_salary)}
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            {formatCurrency(payroll.overtime_amount)}
                          </TableCell>
                          <TableCell
                            className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}
                          >
                            {formatCurrency(payroll.final_amount)}
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            <Badge
                              variant={
                                payroll.status === 'pending'
                                  ? 'secondary'
                                  : payroll.status === 'approved'
                                    ? 'default'
                                    : payroll.status === 'paid'
                                      ? 'default'
                                      : payroll.status === 'cancelled'
                                        ? 'destructive'
                                        : payroll.status === 'processed'
                                          ? 'default'
                                          : 'secondary'
                              }
                            >
                              {payroll.status === 'pending'
                                ? t('payroll:status.pending')
                                : payroll.status === 'approved'
                                  ? t('payroll:status.approved')
                                  : payroll.status === 'paid'
                                    ? t('payroll:status.paid')
                                    : payroll.status === 'cancelled'
                                      ? t('payroll:status.cancelled')
                                      : payroll.status === 'processed'
                                        ? t('payroll:status.processed')
                                        : payroll.status || t('common.na')}
                            </Badge>
                          </TableCell>
                          <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                            {formatDate(payroll.created_at)}
                          </TableCell>
                          <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                            <div
                              className={`flex gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}
                            >
                              <Link href={`/modules/payroll-management/${payroll.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/modules/payroll-management/${payroll.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPayslip(payroll.id)}
                                title={t('payroll:viewPayslip')}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDirectDownloadPayslip(payroll.id)}
                                disabled={downloadingPayslip === payroll.id}
                                title={t('payroll:downloadPdf')}
                              >
                                {downloadingPayslip === payroll.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                                    <span className="sr-only">{t('payroll:generating')}</span>
                                  </>
                                ) : (
                                  <FileDown className="h-4 w-4" />
                                )}
                              </Button>
                              {payroll.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(payroll.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {payroll.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessPayment(payroll.id)}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              {payroll.status !== 'paid' && payroll.status !== 'cancelled' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(payroll.id)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(payroll.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          <div className="text-muted-foreground">
                            {loading ? (
                              <div className="flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                {t('payroll:loadingPayrolls')}
                              </div>
                            ) : (
                              t('payroll:noPayrollsFound')
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {payrolls && payrolls.last_page > 1 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {t('payroll:showing', {
                          from: (currentPage - 1) * payrolls.per_page + 1,
                          to: Math.min(currentPage * payrolls.per_page, payrolls.total),
                          total: payrolls.total,
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t('payroll:previous')}
                        </Button>

                        <div className="flex items-center gap-1">
                          {/* First page */}
                          {currentPage > 2 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                className="w-8 h-8 p-0"
                              >
                                1
                              </Button>
                              {currentPage > 3 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                            </>
                          )}

                          {/* Current page and surrounding pages */}
                          {(() => {
                            const pages: number[] = [];
                            const startPage = Math.max(1, currentPage - 1);
                            const endPage = Math.min(payrolls.last_page, currentPage + 1);

                            for (let page = startPage; page <= endPage; page++) {
                              pages.push(page);
                            }

                            return pages.map(page => (
                              <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            ));
                          })()}

                          {/* Last page */}
                          {currentPage < payrolls.last_page - 1 && (
                            <>
                              {currentPage < payrolls.last_page - 2 && (
                                <span className="px-2 text-muted-foreground">...</span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(payrolls.last_page)}
                                className="w-8 h-8 p-0"
                              >
                                {payrolls.last_page}
                              </Button>
                            </>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(Math.min(payrolls.last_page, currentPage + 1))
                          }
                          disabled={currentPage === payrolls.last_page}
                        >
                          {t('payroll:next')}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Role-based content example */}
        <RoleContent role="ADMIN">
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll:administration')}</CardTitle>
              <CardDescription>{t('payroll:administrationDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="approve" subject="Payroll">
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('payroll:approveAllPending')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="manage" subject="Payroll">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    {t('payroll:payrollSettings')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="export" subject="Payroll">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('payroll:generateReports')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleContent>
      </div>
    </ProtectedRoute>
  );
}
