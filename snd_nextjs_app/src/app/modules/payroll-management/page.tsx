'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useI18n } from '@/hooks/use-i18n';

import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import { format } from 'date-fns';
import {
  Ban,
  BarChart3,
  Calculator,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  links: { url: string | null; label: string; active: boolean }[];
}

export default function PayrollManagementPage() {
  const { hasPermission } = useRBAC();
  const { t } = useTranslation(['common', 'payroll']);
  const { isRTL } = useI18n();
  const [payrolls, setPayrolls] = useState<PayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState<Date | undefined>(undefined);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [recalculating, setRecalculating] = useState(false);
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({})

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
              (payroll: Payroll) =>
                payroll.employee?.full_name ||
                `${payroll.employee?.first_name} ${payroll.employee?.last_name}`
            )
            .filter((name: string | undefined) => name && name.trim() !== '');

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
    } catch (err) {
      toast.error(t('payroll:error.fetchPayrolls'));
      console.error('Error fetching payrolls:', err);
      
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
      await fetch('/api/employees');
    } catch (err) {
      console.error('Error fetching employees:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.generateApproved'));
      console.error('Error generating approved payrolls:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.approve'));
      console.error('Error approving payroll:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.processPayment'));
      console.error('Error processing payment:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.cancel'));
      console.error('Error canceling payroll:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.delete'));
      console.error('Error deleting payroll:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.bulkDelete'));
      console.error('Error bulk deleting payrolls:', err);
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
    } catch (err) {
      toast.error(t('payroll:error.recalculateOvertime'));
      console.error('Error recalculating overtime:', err);
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
                <DollarSign className="h-4 w-4 mr-2" />
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
                              {hasPermission('update', 'Payroll') && (
                                <Link href={`/modules/payroll-management/${payroll.id}/edit`}>
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                title={t('payroll:viewPayslip')}
                              >
                                <Link href={`/modules/payroll-management/${payroll.id}/payslip`}>
                                  <FileText className="h-4 w-4" />
                                </Link>
                              </Button>
                              {payroll.status === 'pending' && hasPermission('update', 'Payroll') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(payroll.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {payroll.status === 'approved' && hasPermission('update', 'Payroll') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessPayment(payroll.id)}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              {payroll.status !== 'paid' && payroll.status !== 'cancelled' && hasPermission('update', 'Payroll') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(payroll.id)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                              {hasPermission('delete', 'Payroll') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(payroll.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
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
