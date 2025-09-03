'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  Edit,
  FileBox,
  FileText,
  History,
  Loader2,
  Lock,
  Receipt,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

import TimesheetSummary from '@/components/employee/timesheets/TimesheetSummary';
import { useConfirmationDialog } from '@/components/providers/confirmation-provider';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { ExpiryStatusDisplay, getExpiryStatus } from '@/lib/utils/expiry-utils';

import AssignmentsTab from '@/components/employee/AssignmentsTab';
import DocumentsTab from '@/components/employee/DocumentsTab';
import PersonalPhotosSection from '@/components/employee/PersonalPhotosSection';

import {
  salaryIncrementService,
  type SalaryIncrement,
} from '@/lib/services/salary-increment-service';

interface Employee {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone: string;
  employee_id: string;
  file_number: string;
  status: string;
  hire_date: string;
  date_of_birth?: string;
  nationality: string;
  current_location?: string;
  hourly_rate?: number;
  basic_salary?: number;
  food_allowance?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  overtime_rate_multiplier?: number;
  overtime_fixed_rate?: number;
  contract_days_per_month?: number;
  contract_hours_per_day?: number;
  department?: { id: number; name: string };
  designation?: { id: number; name: string };
  supervisor?: string;
  supervisor_details?: {
    id: number;
    name: string;
    file_number: string;
  } | null;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  notes?: string;
  iqama_number?: string;
  iqama_expiry?: string;
  iqama_file?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_file?: string;
  driving_license_number?: string;
  driving_license_expiry?: string;
  driving_license_file?: string;
  operator_license_number?: string;
  operator_license_expiry?: string;
  operator_license_file?: string;
  tuv_certification_number?: string;
  tuv_certification_expiry?: string;
  tuv_certification_file?: string;
  spsp_license_number?: string;
  spsp_license_expiry?: string;
  spsp_license_file?: string;
  access_start_date?: string;
  access_end_date?: string;
  access_restriction_reason?: string;
}

export default function EmployeeShowPage() {
  const { hasPermission } = useRBAC();
  const { confirm } = useConfirmationDialog();
  const { t, isRTL } = useI18n();
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  // Helper function to check if Iqama is expired
  const isIqamaExpired = (expiryDate: string | null | undefined): boolean => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal-info');
  const [salaryHistory, setSalaryHistory] = useState<SalaryIncrement[]>([]);
  const [loadingSalaryHistory, setLoadingSalaryHistory] = useState(false);

  // Advances state
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyDeduction, setMonthlyDeduction] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [isAdvanceRequestDialogOpen, setIsAdvanceRequestDialogOpen] = useState(false);
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [advances, setAdvances] = useState<any[]>([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [selectedAdvanceForReject, setSelectedAdvanceForReject] = useState<any>(null);
  const [selectedAdvanceForRepayment, setSelectedAdvanceForRepayment] = useState<any>(null);

  // Payment history state
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  // Leave data state
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Filter advances for repayment (approved and partially repaid, but not fully repaid)
  const approvedAdvances = advances.filter(
    (advance: any) => advance.status === 'approved' || advance.status === 'partially_repaid'
  );

  // Fetch departments, designations, and employees for edit form
  const fetchEditFormData = async () => {
    try {
      // Fetch departments
      const deptResponse = await fetch('/api/departments');
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        if (deptData.success) {
          setDepartments(deptData.data);
        }
      }

      // Fetch designations
      const desigResponse = await fetch('/api/designations');
      if (desigResponse.ok) {
        const desigData = await desigResponse.json();
        if (desigData.success) {
          setDesignations(desigData.data);
        }
      }

      // Fetch employees for supervisor selection
      const empResponse = await fetch('/api/employees?all=true');
      if (empResponse.ok) {
        const empData = await empResponse.json();
        if (empData.success) {
          setEmployees(empData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching edit form data:', error);
    }
  };

  // Open edit modal
  const openEditModal = () => {
    if (employee) {
      setEditingEmployee({
        ...employee,
        hire_date: employee.hire_date ? employee.hire_date.slice(0, 10) : '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.slice(0, 10) : '',
        iqama_expiry: employee.iqama_expiry ? employee.iqama_expiry.slice(0, 10) : '',
        passport_expiry: employee.passport_expiry ? employee.passport_expiry.slice(0, 10) : '',
        driving_license_expiry: employee.driving_license_expiry ? employee.driving_license_expiry.slice(0, 10) : '',
        operator_license_expiry: employee.operator_license_expiry ? employee.operator_license_expiry.slice(0, 10) : '',
        tuv_certification_expiry: employee.tuv_certification_expiry ? employee.tuv_certification_expiry.slice(0, 10) : '',
        spsp_license_expiry: employee.spsp_license_expiry ? employee.spsp_license_expiry.slice(0, 10) : '',
        access_start_date: employee.access_start_date ? employee.access_start_date.slice(0, 10) : '',
        access_end_date: employee.access_end_date ? employee.access_end_date.slice(0, 10) : '',
      });
      setShowEditModal(true);
      fetchEditFormData();
    }
  };

  // Handle edit form input changes
  const handleEditInputChange = (field: keyof Employee, value: any) => {
    setEditingEmployee(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submit edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEmployee),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Employee updated successfully');
          setShowEditModal(false);
          fetchEmployeeData(); // Refresh employee data
        } else {
          toast.error(result.message || 'Failed to update employee');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update employee');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (employeeId && !isNaN(parseInt(employeeId))) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      const data = await response.json();

      if (response.ok && data.employee) {
        setEmployee(data.employee);
        // Only fetch additional data if employee exists
        fetchAdvances();
        fetchPaymentHistory();
        fetchLeaves();
        // Only fetch salary history if user has permission
        if (hasPermission('read', 'SalaryIncrement')) {
          fetchSalaryHistory();
        }
      } else {
        // Employee not found
        setEmployee(null);
        toast.error(data.error || 'Employee not found');
      }
    } catch (error) {
      
      toast.error('Failed to load employee data');
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async () => {
    if (!employeeId || isNaN(parseInt(employeeId))) {
      
      return;
    }
    setLoadingAdvances(true);
    try {
      const response = await fetch(`/api/employee/advances?employeeId=${employeeId}`);
      const data = await response.json();
      if (data.success) {
        setAdvances(data.advances || []);

        // Calculate current balance from approved advances minus repayments
        const approvedAdvances = data.advances.filter(
          (advance: any) => advance.status === 'approved' || advance.status === 'partially_repaid'
        );
        const totalBalance = approvedAdvances.reduce((sum: number, advance: any) => {
          const advanceAmount = Number(advance.amount);
          const repaidAmount = Number(advance.repaid_amount || 0);
          return sum + (advanceAmount - repaidAmount);
        }, 0);
        setCurrentBalance(totalBalance);

        // Set monthly deduction from the first approved advance if available
        const firstApprovedAdvance = approvedAdvances.find(
          (advance: any) => advance.status === 'approved' || advance.status === 'partially_repaid'
        );
        if (firstApprovedAdvance?.monthly_deduction) {
          setMonthlyDeduction(firstApprovedAdvance.monthly_deduction.toString());
        }
      }
    } catch (error) {
      
      toast.error('Failed to load advances');
    } finally {
      setLoadingAdvances(false);
    }
  };

  const handleApproveAdvance = async (advanceId: number) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Advance approved successfully');
        fetchAdvances(); // Refresh the advances list
      } else {
        toast.error(data.error || 'Failed to approve advance');
      }
    } catch (error) {
      
      toast.error('Failed to approve advance');
    }
  };

  const handleRejectAdvance = async (advanceId: number, reason: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Advance rejected successfully');
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedAdvanceForReject(null);
        fetchAdvances(); // Refresh the advances list
      } else {
        toast.error(data.error || 'Failed to reject advance');
      }
    } catch (error) {
      
      toast.error('Failed to reject advance');
    }
  };

  const handleRepayment = async (advanceId: number, amount: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repaymentAmount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Repayment recorded successfully');
        setIsRepaymentDialogOpen(false);
        setRepaymentAmount('');
        setSelectedAdvanceForRepayment(null);
        // Refresh the advances list
        fetchAdvances();
      } else {
        toast.error(data.error || 'Failed to record repayment');
      }
    } catch (error) {
      
      toast.error('Failed to record repayment');
    }
  };

  const handleUpdateMonthlyDeduction = async (newDeduction: string) => {
    try {
      // Find the first approved advance to update
      const approvedAdvance = advances.find(
        (advance: any) => advance.status === 'approved' || advance.status === 'partially_repaid'
      );

      if (!approvedAdvance) {
        toast.error('No approved advance found to update monthly deduction');
        return;
      }

      const response = await fetch(`/api/employee/advances/${approvedAdvance.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monthly_deduction: newDeduction,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Monthly deduction updated successfully');
        // Refresh the advances list
        fetchAdvances();
      } else {
        toast.error(data.error || 'Failed to update monthly deduction');
      }
    } catch (error) {
      
      toast.error('Failed to update monthly deduction');
    }
  };

  const fetchPaymentHistory = async () => {
    if (!employeeId || isNaN(parseInt(employeeId))) {
      
      return;
    }
    setLoadingPayments(true);
    try {
      const response = await fetch(`/api/employee/${employeeId}/payments`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.data?.payments || data.payments || []);
      }
    } catch (error) {
      
      toast.error('Failed to load payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchLeaves = async () => {
    if (!employeeId || isNaN(parseInt(employeeId))) {
      
      return;
    }
    setLoadingLeaves(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/leaves`);
      const data = await response.json();
       // Debug log
      if (data.success) {
        setLeaves(data.data || []);
      } else {
        
        setLeaves([]);
      }
    } catch (error) {
      
      toast.error('Failed to load leave data');
      setLeaves([]);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchSalaryHistory = async () => {
    if (!employeeId || isNaN(parseInt(employeeId))) {
      
      return;
    }
    setLoadingSalaryHistory(true);
    try {
      const data = await salaryIncrementService.getEmployeeSalaryHistory(parseInt(employeeId));
      setSalaryHistory(data || []);
    } catch (error: any) {
      
      // Check if it's a permission error
      if (error?.message?.includes('403') || error?.status === 403) {
        // Don't show error toast for permission issues, just set empty array
        setSalaryHistory([]);
      } else {
        toast.error('Failed to load salary history');
        setSalaryHistory([]);
      }
    } finally {
      setLoadingSalaryHistory(false);
    }
  };

  const handlePaymentDelete = async (paymentId: number) => {
    setDeletingPaymentId(paymentId);
    try {
      const response = await fetch(`/api/employee/${employeeId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Repayment deleted successfully');

        // Remove the deleted payment from local state
        const updatedPayments = payments.filter(p => p.id !== paymentId);
        setPayments(updatedPayments);

        // Refresh all data to get updated advance payment information
        await fetchPaymentHistory();
        await fetchAdvances();
      } else {
        const data = await response.json();
        toast.error(data?.message || 'Failed to delete repayment');
      }
    } catch (error: any) {
      toast.error('Failed to delete repayment');
    } finally {
      setDeletingPaymentId(null);
      setShowDeletePaymentDialog(false);
    }
  };

  const handleAdvanceDelete = async (advanceId: number) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Advance deleted successfully');
        // Refresh the advances list
        fetchAdvances();
      } else {
        const data = await response.json();
        toast.error(data?.error || 'Failed to delete advance');
      }
    } catch (error) {
      
      toast.error('Failed to delete advance');
    }
  };

  // Check if repayment button should be disabled
  const isRepaymentDisabled = () => {
    // Disable only if no approved advances available for repayment
    return approvedAdvances.length === 0;
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">{t('employee:status.active')}</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">{t('employee:status.inactive')}</Badge>;
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">{t('employee:status.onLeave')}</Badge>;
      case 'terminated':
        return <Badge className="bg-gray-100 text-gray-800">{t('employee:status.terminated')}</Badge>;
      default:
        return <Badge variant="secondary">{status || t('employee:status.unknown')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{t('employee.messages.loading')}</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">{t('employee.messages.employeeNotFound')}</h2>
          <p className="text-gray-600">{t('employee.messages.employeeNotFoundDescription', { id: employeeId })}</p>
          <Button onClick={() => router.push('/modules/employee-management')}>
            {t('employee.actions.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {employee.first_name?.[0] || ''}
              {employee.last_name?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}
              {employee.last_name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{employee.designation?.name || t('employee.fields.noDesignation')}</span>
              <span className="text-xs">•</span>
              <span>{t('employee.fields.fileNumber')}: {employee.file_number || t('employee.na')}</span>
              {employee.status && (
                <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                  {t(`employee.status.${employee.status}`)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/modules/employee-management">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('employee.actions.back')}
            </Link>
          </Button>
          {hasPermission('edit', 'Employee') && (
            <Button size="sm" asChild>
              <Link href={`/modules/employee-management/${employee.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('employee.actions.edit')}
              </Link>
            </Button>
          )}
          {hasPermission('delete', 'Employee') && (
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('employee.actions.delete')}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="personal-info"
        className="w-full"
      >
        <TabsList className="flex w-full justify-between rounded-lg border bg-muted/30 p-1 shadow-sm">
          <TabsTrigger value="personal-info" className="flex items-center gap-2 px-3 py-2">
            <User className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">{t('employee.tabs.personal')}</span>
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2 px-3 py-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden font-medium sm:inline">{t('employee.tabs.employment')}</span>
          </TabsTrigger>
          {hasPermission('read', 'employee-document') && (
            <TabsTrigger value="documents" className="flex items-center gap-2 px-3 py-2">
              <FileBox className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.documents')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'employee-assignment') && (
            <TabsTrigger value="assignments" className="flex items-center gap-2 px-3 py-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.assignments')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'Timesheet') && (
            <TabsTrigger value="timesheets" className="flex items-center gap-2 px-3 py-2">
              <Clock className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.timesheets')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'leave-request') && (
            <TabsTrigger value="leaves" className="flex items-center gap-2 px-3 py-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.leaves')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'advance') && (
            <TabsTrigger value="advances" className="flex items-center gap-2 px-3 py-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.advances')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'resignation') && (
            <TabsTrigger value="resignations" className="flex items-center gap-2 px-3 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.resignations')}</span>
            </TabsTrigger>
          )}
          {hasPermission('read', 'final-settlement') && (
            <TabsTrigger value="final-settlements" className="flex items-center gap-2 px-3 py-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden font-medium sm:inline">{t('employee.tabs.finalSettlements')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal-info" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employee.personalInformation.title')}</CardTitle>
              <CardDescription>{t('employee.personalInformation.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.personalInformation.contactInformation')}
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.name')}</dt>
                        <dd className="text-sm">
                          {employee.first_name}{' '}
                          {employee.middle_name ? `${employee.middle_name} ` : ''}
                          {employee.last_name}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.phone')}</dt>
                        <dd className="text-sm">{employee.phone || t('employee.na')}</dd>
                      </div>
                      {employee.nationality && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.nationality')}</dt>
                          <dd className="text-sm">{employee.nationality}</dd>
                        </div>
                      )}
                      {employee.date_of_birth && (
                        <div className="flex justify-between border-b pb-2">
                                                      <dt className="text-sm font-medium">{t('employee.fields.dateOfBirth')}</dt>
                          <dd className="text-sm">
                            {format(new Date(employee.date_of_birth), 'PPP')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.personalInformation.emergencyContact')}
                    </h3>
                    {employee.emergency_contact_name || employee.emergency_contact_phone ? (
                      <dl className="space-y-2">
                        {employee.emergency_contact_name && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.name')}</dt>
                            <dd className="text-sm">{employee.emergency_contact_name}</dd>
                          </div>
                        )}
                        {employee.emergency_contact_phone && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.phone')}</dt>
                            <dd className="text-sm">{employee.emergency_contact_phone}</dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t('employee.personalInformation.noEmergencyContact')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.personalInformation.identification')}
                    </h3>
                    <dl className="space-y-2">
                      {employee.iqama_number && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.iqamaNumber')}</dt>
                          <dd className="text-sm">
                            <div className={`font-medium ${employee.iqama_expiry ? (getExpiryStatus(employee.iqama_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                              {employee.iqama_number}
                              {employee.iqama_expiry && getExpiryStatus(employee.iqama_expiry).status === 'expired' && (
                                <span className="ml-1 text-xs">⚠️</span>
                              )}
                            </div>
                          </dd>
                        </div>
                      )}
                      {employee.iqama_expiry && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.iqamaExpiry')}</dt>
                          <dd className="text-sm">
                            <ExpiryStatusDisplay 
                              expiryDate={employee.iqama_expiry} 
                              showAutoIndicator={true}
                              className="text-xs"
                            />
                          </dd>
                        </div>
                      )}
                      {employee.passport_number && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.passportNumber')}</dt>
                          <dd className="text-sm">{employee.passport_number}</dd>
                        </div>
                      )}
                      {employee.passport_expiry && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.passportExpiry')}</dt>
                          <dd className="text-sm">
                            <ExpiryStatusDisplay 
                              expiryDate={employee.passport_expiry} 
                              showAutoIndicator={true}
                              className="text-xs"
                            />
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.personalInformation.licensesCertifications')}
                    </h3>
                    {employee.driving_license_number ||
                    employee.operator_license_number ||
                    employee.tuv_certification_number ||
                    employee.spsp_license_number ? (
                      <dl className="space-y-2">
                        {employee.driving_license_number && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.drivingLicense')}</dt>
                            <dd className="text-sm">
                              <div className={`font-medium ${employee.driving_license_expiry ? (getExpiryStatus(employee.driving_license_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                                {employee.driving_license_number}
                                {employee.driving_license_expiry && getExpiryStatus(employee.driving_license_expiry).status === 'expired' && (
                                  <span className="ml-1 text-xs">⚠️</span>
                                )}
                              </div>
                            </dd>
                          </div>
                        )}
                        {employee.driving_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.drivingLicenseExpiry')}</dt>
                            <dd className="text-sm">
                              <ExpiryStatusDisplay 
                                expiryDate={employee.driving_license_expiry} 
                                showAutoIndicator={true}
                                className="text-xs"
                              />
                            </dd>
                          </div>
                        )}
                        {employee.operator_license_number && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.operatorLicense')}</dt>
                            <dd className="text-sm">
                              <div className={`font-medium ${employee.operator_license_expiry ? (getExpiryStatus(employee.operator_license_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                                {employee.operator_license_number}
                                {employee.operator_license_expiry && getExpiryStatus(employee.operator_license_expiry).status === 'expired' && (
                                  <span className="ml-1 text-xs">⚠️</span>
                                )}
                              </div>
                            </dd>
                          </div>
                        )}
                        {employee.operator_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.operatorLicenseExpiry')}</dt>
                            <dd className="text-sm">
                              <ExpiryStatusDisplay 
                                expiryDate={employee.operator_license_expiry} 
                                showAutoIndicator={true}
                                className="text-xs"
                              />
                            </dd>
                          </div>
                        )}
                        {employee.tuv_certification_number && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.tuvCertification')}</dt>
                            <dd className="text-sm">
                              <div className={`font-medium ${employee.tuv_certification_expiry ? (getExpiryStatus(employee.tuv_certification_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                                {employee.tuv_certification_number}
                                {employee.tuv_certification_expiry && getExpiryStatus(employee.tuv_certification_expiry).status === 'expired' && (
                                  <span className="ml-1 text-xs">⚠️</span>
                                )}
                              </div>
                            </dd>
                          </div>
                        )}
                        {employee.tuv_certification_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.tuvCertificationExpiry')}</dt>
                            <dd className="text-sm">
                              <ExpiryStatusDisplay 
                                expiryDate={employee.tuv_certification_expiry} 
                                showAutoIndicator={true}
                                className="text-xs"
                              />
                            </dd>
                          </div>
                        )}
                        {employee.spsp_license_number && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.spspLicense')}</dt>
                            <dd className="text-sm">
                              <div className={`font-medium ${employee.spsp_license_expiry ? (getExpiryStatus(employee.spsp_license_expiry).status === 'expired' ? 'text-red-600' : 'text-green-600') : ''}`}>
                                {employee.spsp_license_number}
                                {employee.spsp_license_expiry && getExpiryStatus(employee.spsp_license_expiry).status === 'expired' && (
                                  <span className="ml-1 text-xs">⚠️</span>
                                )}
                              </div>
                            </dd>
                          </div>
                        )}
                        {employee.spsp_license_expiry && (
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-sm font-medium">{t('employee.fields.spspLicenseExpiry')}</dt>
                            <dd className="text-sm">
                              <ExpiryStatusDisplay 
                                expiryDate={employee.spsp_license_expiry} 
                                showAutoIndicator={true}
                                className="text-xs"
                              />
                            </dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        {t('employee.personalInformation.noLicensesCertifications')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Photos Section */}
          {hasPermission('read', 'employee-document') && (
            <Card>
              <CardHeader>
                <CardTitle>{t('employee.personalInformation.personalPhotosDocuments')}</CardTitle>
                <CardDescription>{t('employee.personalInformation.employeePhotosDocuments')}</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeId && !isNaN(parseInt(employeeId)) && (
                  <PersonalPhotosSection employeeId={parseInt(employeeId)} />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employee.employment.title')}</CardTitle>
              <CardDescription>{t('employee.employment.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.employment.positionInformation')}
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.employeeId')}</dt>
                        <dd className="text-sm">{employee.employee_id}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.fileNumber')}</dt>
                        <dd className="text-sm">{employee.file_number || t('employee.na')}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.designation')}</dt>
                        <dd className="text-sm">{employee.designation?.name || t('employee.na')}</dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.department')}</dt>
                        <dd className="text-sm">{employee.department?.name || t('employee.na')}</dd>
                      </div>
                      {employee.supervisor_details && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.supervisor')}</dt>
                          <dd className="text-sm">
                            {employee.supervisor_details.name} ({t('employee.fields.fileNumber')}: {employee.supervisor_details.file_number})
                          </dd>
                        </div>
                      )}
                      {employee.supervisor && !employee.supervisor_details && (
                        <div className="flex justify-between border-b pb-2">
                          <dt className="text-sm font-medium">{t('employee.fields.supervisor')}</dt>
                          <dd className="text-sm">{employee.supervisor}</dd>
                        </div>
                      )}
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.status')}</dt>
                        <dd className="text-sm">
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {t(`employee.status.${employee.status}`)}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      {t('employee.employment.employmentTimeline')}
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.fields.hireDate')}</dt>
                        <dd className="text-sm">
                          {employee.hire_date
                            ? format(new Date(employee.hire_date), 'PPP')
                            : t('employee.na')}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.employment.servicePeriod')}</dt>
                        <dd className="text-sm">
                          {(() => {
                            const hireDate = employee.hire_date
                              ? new Date(employee.hire_date)
                              : new Date();
                            const today = new Date();

                            let years = today.getFullYear() - hireDate.getFullYear();
                            let months = today.getMonth() - hireDate.getMonth();
                            let days = today.getDate() - hireDate.getDate();

                            if (days < 0) {
                              months--;
                              const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                              days += lastMonth.getDate();
                            }
                            if (months < 0) {
                              years--;
                              months += 12;
                            }

                            const parts: string[] = [];
                            if (years > 0) parts.push(`${years} ${years !== 1 ? t('employee.servicePeriod.years') : t('employee.servicePeriod.year')}`);
                            if (months > 0) parts.push(`${months} ${months !== 1 ? t('employee.servicePeriod.months') : t('employee.servicePeriod.month')}`);
                            if (days > 0) parts.push(`${days} ${days !== 1 ? t('employee.servicePeriod.days') : t('employee.servicePeriod.day')}`);

                            return parts.join(', ') || t('employee.servicePeriod.lessThanDay');
                          })()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {t('employee.salary.title')}
                  </h3>
                  <div className="mb-4 rounded-lg bg-muted/30 p-5">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">{t('employee.salary.basicSalary')}</span>   
                      <span className="text-base font-semibold">
                        {t('employee.currency.symbol')} {Number(employee.basic_salary || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>

                  <dl className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-sm font-medium">{t('employee.salary.hourlyRate')}</dt>
                      <dd className="text-sm">
                        {t('employee.currency.symbol')} {(() => {
                          // Calculate hourly rate if stored rate is 0 or missing
                          if (Number(employee.hourly_rate || 0) > 0) {
                            return Number(employee.hourly_rate).toFixed(2);
                          }
                          // Calculate based on basic salary and actual total days in month
                          if (Number(employee.basic_salary || 0) > 0 && 
                              Number(employee.contract_hours_per_day || 0) > 0) {
                            // Use actual total days in current month
                            const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                            const calculatedRate = Number(employee.basic_salary) / 
                              (currentMonthDays * Number(employee.contract_hours_per_day));
                            return calculatedRate.toFixed(2);
                          }
                          return '0.00';
                        })()}
                      </dd>
                    </div>
                    {Number(employee.food_allowance || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.foodAllowance')}</dt>
                        <dd className="text-sm">
                          {t('employee.currency.symbol')} {Number(employee.food_allowance).toFixed(2)}
                        </dd>
                      </div>
                    )}
                    {Number(employee.housing_allowance || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.housingAllowance')}</dt>
                        <dd className="text-sm">
                          {t('employee.currency.symbol')} {Number(employee.housing_allowance).toFixed(2)}
                        </dd>
                      </div>
                    )}
                    {Number(employee.transport_allowance || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.transportAllowance')}</dt>
                        <dd className="text-sm">
                          {t('employee.currency.symbol')} {Number(employee.transport_allowance).toFixed(2)}
                        </dd>
                      </div>
                    )}
                    {Number(employee.overtime_rate_multiplier || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.overtimeRateMultiplier')}</dt>
                        <dd className="text-sm">
                          {Number(employee.overtime_rate_multiplier).toFixed(2)}x
                        </dd>
                      </div>
                    )}
                    {Number(employee.overtime_fixed_rate || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.overtimeFixedRate')}</dt>
                        <dd className="text-sm">
                          {t('employee.currency.symbol')} {Number(employee.overtime_fixed_rate).toFixed(2)}/hr
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-sm font-medium">{t('employee.salary.contractDaysPerMonth')} (Auto-set)</dt>
                      <dd className="text-sm">
                        {(() => {
                          // Show actual total days in current month
                          const currentMonthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                          return `${currentMonthDays} ${t('employee.salary.days')} (current month)`;
                        })()}
                      </dd>
                    </div>
                    {Number(employee.contract_hours_per_day || 0) > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <dt className="text-sm font-medium">{t('employee.salary.contractHoursPerDay')}</dt>
                        <dd className="text-sm">
                          {employee.contract_hours_per_day} {t('employee.salary.hours')}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary History */}
          {hasPermission('read', 'SalaryIncrement') ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('employee.salary.salaryHistory')}</CardTitle>
                    <CardDescription>{t('employee.salary.salaryHistoryDescription')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.effectiveDate')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.currentSalary')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.newSalary')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.increment')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.type')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.requestedBy')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('employee.salary.approvedBy')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadingSalaryHistory ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-8 text-center text-sm text-muted-foreground"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t('employee:salary.loadingSalaryHistory')}
                            </div>
                          </td>
                        </tr>
                      ) : salaryHistory.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-8 text-center text-sm text-muted-foreground italic"
                          >
                            {t('employee.salary.noSalaryHistory')}
                          </td>
                        </tr>
                      ) : (
                        salaryHistory.map(inc => (
                          <tr key={inc.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(inc.effective_date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {t('employee.currency.symbol')} {salaryIncrementService.getCurrentTotalSalary(inc).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {t('employee.currency.symbol')} {salaryIncrementService.getNewTotalSalary(inc).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              +{t('employee.currency.symbol')}{' '}
                              {salaryIncrementService.getTotalIncrementAmount(inc).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {salaryIncrementService.getIncrementTypeLabel(inc.increment_type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={salaryIncrementService.getStatusColor(inc.status) as any}
                              >
                                {salaryIncrementService.getStatusLabel(inc.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {inc.requested_by_user?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {inc.approved_by_user?.name || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('employee.salary.salaryHistory')}</CardTitle>
                    <CardDescription>{t('employee.salary.salaryHistoryDescription')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-6 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Access Restricted</span>
                  </div>
                  <p className="text-sm">
                    You don't have permission to view salary history. Please contact your administrator for access.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-6">
          {employeeId && !isNaN(parseInt(employeeId)) && (
            <DocumentsTab employeeId={parseInt(employeeId)} />
          )}
        </TabsContent>

        <TabsContent value="assignments" className="mt-6 space-y-6">
          {employeeId && !isNaN(parseInt(employeeId)) && (
            <AssignmentsTab employeeId={parseInt(employeeId)} />
          )}
        </TabsContent>

        {hasPermission('read', 'Timesheet') && (
          <TabsContent value="timesheets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('employee.timesheet.title')}</CardTitle>
                <CardDescription>{t('employee.timesheet.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Timesheet Summary */}
                <div className="mb-4">
                  {employee?.id && <TimesheetSummary employeeId={employee.id} />}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="leaves" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('employee.leave.title')}</CardTitle>
                  <CardDescription>{t('employee.leave.description')}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasPermission('read', 'leave-request') && (
                    <Button variant="outline">
                      <History className="mr-2 h-4 w-4" />
                      {t('employee.leave.viewAll')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Leave Summary */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Total Leaves</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">{leaves.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Approved Leaves</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {leaves.filter(leave => leave.status === 'approved').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {leaves.filter(leave => leave.status === 'pending').length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-medium">Rejected Leaves</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {leaves.filter(leave => leave.status === 'rejected').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Debug Info - Remove this section */}
                {false && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Debug Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs space-y-2">{/* Debug info removed */}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Leave Records */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Leave Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Leave Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {hasPermission('read', 'resignation') && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loadingLeaves ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-8 text-center text-sm text-muted-foreground"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading leave data...
                                </div>
                              </td>
                            </tr>
                          ) : leaves.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-8 text-center text-sm text-muted-foreground"
                              >
                                No leave requests found
                              </td>
                            </tr>
                          ) : (
                            leaves.map(leave => (
                              <tr key={leave.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {leave.leave_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(leave.start_date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {leave.days} day{leave.days !== 1 ? 's' : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                    variant={
                                      leave.status === 'approved'
                                        ? 'default'
                                        : leave.status === 'pending'
                                          ? 'secondary'
                                          : 'destructive'
                                    }
                                  >
                                    {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                  </Badge>
                                </td>
                                {hasPermission('read', 'resignation') && (
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advances" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('employee.advances.title')}</CardTitle>
                  <CardDescription>
                    {t('employee.advances.description')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {hasPermission('create', 'AdvancePayment') && (
                    <Button
                      variant="outline"
                      onClick={() => setIsAdvanceRequestDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      {t('employee.advances.newAdvance')}
                    </Button>
                  )}
                  {hasPermission('update', 'AdvancePayment') && (
                    <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="flex items-center gap-2"
                          disabled={isRepaymentDisabled()}
                          title={
                            approvedAdvances.length === 0
                              ? 'No advances available for repayment'
                              : 'Make repayment on approved and partially repaid advances'
                          }
                        >
                          <CreditCard className="h-4 w-4" />
                          {t('employee.advances.makeRepayment')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('employee.advances.recordRepayment')}</DialogTitle>
                          <DialogDescription>
                            {t('employee.advances.repaymentDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {approvedAdvances.length === 0 ? (
                            <div className="p-6 text-center">
                              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                              <h3 className="mb-2 text-lg font-medium">
                                {t('employee.advances.noAdvancesForRepayment')}
                              </h3>
                              <p className="mb-4 text-sm text-muted-foreground">
                                {t('employee.advances.noAdvancesForRepaymentDescription')}
                              </p>
                              <Button
                                variant="outline"
                                onClick={() => setIsRepaymentDialogOpen(false)}
                              >
                                {t('employee.actions.close')}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid gap-2">
                                <label htmlFor="repaymentAdvance" className="text-sm font-medium">
                                  {t('employee.advances.selectAdvance')}
                                </label>
                                <Select
                                  value={selectedAdvanceForRepayment?.id?.toString() || ''}
                                  onValueChange={value => {
                                    const advance = approvedAdvances.find(
                                      a => a.id.toString() === value
                                    );
                                    setSelectedAdvanceForRepayment(advance);
                                    setRepaymentAmount('');
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('employee.advances.selectAdvancePlaceholder')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {approvedAdvances.map(advance => (
                                      <SelectItem key={advance.id} value={advance.id.toString()}>
                                        {t('employee.currency.symbol')} {Number(advance.amount).toFixed(2)} - {advance.reason} (
                                        {advance.status.replace('_', ' ')})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {selectedAdvanceForRepayment && (
                                <div className="space-y-4">
                                  <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2">Advance Details</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        Amount: SAR{' '}
                                        {Number(selectedAdvanceForRepayment.amount).toFixed(2)}
                                      </div>
                                      <div>
                                        Monthly Deduction: SAR{' '}
                                        {selectedAdvanceForRepayment.monthly_deduction
                                          ? Number(
                                              selectedAdvanceForRepayment.monthly_deduction
                                            ).toFixed(2)
                                          : 'Not set'}
                                      </div>
                                      <div>
                                        Repaid Amount: SAR{' '}
                                        {selectedAdvanceForRepayment.repaid_amount
                                          ? Number(
                                              selectedAdvanceForRepayment.repaid_amount
                                            ).toFixed(2)
                                          : '0.00'}
                                      </div>
                                      <div>
                                        {t('employee:advances.remainingBalance')}: SAR{' '}
                                        {(
                                          Number(selectedAdvanceForRepayment.amount) -
                                          Number(selectedAdvanceForRepayment.repaid_amount || 0)
                                        ).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid gap-2">
                                    <label
                                      htmlFor="repaymentAmount"
                                      className="text-sm font-medium"
                                    >
                                      Repayment Amount (SAR)
                                    </label>
                                    <Input
                                      id="repaymentAmount"
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={repaymentAmount}
                                      onChange={e => setRepaymentAmount(e.target.value)}
                                      placeholder="Enter repayment amount"
                                    />
                                    {selectedAdvanceForRepayment.monthly_deduction && (
                                      <p className="text-xs text-muted-foreground">
                                        Minimum repayment: SAR{' '}
                                        {Number(
                                          selectedAdvanceForRepayment.monthly_deduction
                                        ).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {approvedAdvances.length > 0 && (
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsRepaymentDialogOpen(false);
                                setRepaymentAmount('');
                                setSelectedAdvanceForRepayment(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                if (selectedAdvanceForRepayment && repaymentAmount) {
                                  handleRepayment(selectedAdvanceForRepayment.id, repaymentAmount);
                                } else {
                                  toast.error(
                                    'Please select an advance and enter repayment amount'
                                  );
                                }
                              }}
                              disabled={!selectedAdvanceForRepayment || !repaymentAmount}
                            >
                              Record Repayment
                            </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* Advance Request Dialog */}
            <Dialog open={isAdvanceRequestDialogOpen} onOpenChange={setIsAdvanceRequestDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Advance</DialogTitle>
                  <DialogDescription>Enter advance payment details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="amount" className="text-sm font-medium">
                      Amount (SAR)
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={advanceAmount}
                      onChange={e => setAdvanceAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="monthlyDeduction" className="text-sm font-medium">
                      Monthly Deduction (SAR)
                    </label>
                    <Input
                      id="monthlyDeduction"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyDeduction}
                      onChange={e => setMonthlyDeduction(e.target.value)}
                      placeholder="Enter monthly deduction amount"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="reason" className="text-sm font-medium">
                      Reason
                    </label>
                    <Textarea
                      id="reason"
                      value={advanceReason}
                      onChange={e => setAdvanceReason(e.target.value)}
                      placeholder="Enter reason for advance"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdvanceRequestDialogOpen(false);
                      setAdvanceAmount('');
                      setAdvanceReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        // Validate form
                        if (!advanceAmount || !advanceReason) {
                          toast.error('Please fill in Amount and Reason fields');
                          return;
                        }

                        if (parseFloat(advanceAmount) <= 0) {
                          toast.error('Amount must be greater than 0');
                          return;
                        }

                        // Handle advance request submission
                        const response = await fetch('/api/employee/advances', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            employeeId: employeeId,
                            amount: advanceAmount,
                            monthly_deduction: monthlyDeduction,
                            reason: advanceReason,
                          }),
                        });

                        const data = await response.json();

                        if (response.ok) {
                          setIsAdvanceRequestDialogOpen(false);
                          setAdvanceAmount('');
                          setAdvanceReason('');
                          toast.success('Advance request submitted successfully');
                          // Refresh the advances list
                          fetchAdvances();
                        } else {
                          toast.error(data.error || 'Failed to submit advance request');
                        }
                      } catch (error) {
                        
                        toast.error('Failed to submit advance request');
                      }
                    }}
                  >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Advance Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Advance Request</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for rejecting this advance request.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="rejectionReason" className="text-sm font-medium">
                      Rejection Reason
                    </label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsRejectDialogOpen(false);
                      setRejectionReason('');
                      setSelectedAdvanceForReject(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (selectedAdvanceForReject && rejectionReason.trim()) {
                        handleRejectAdvance(selectedAdvanceForReject.id, rejectionReason);
                      } else {
                        toast.error('Please provide a rejection reason');
                      }
                    }}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Advance
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <CardContent className="p-6">
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Current Balance Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">{t('employee:advances.currentBalance')}</h3>
                    <Badge variant="outline" className="bg-muted/50">
                      {Number(currentBalance) > 0 ? t('employee:advances.active') : t('employee:advances.noBalance')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-destructive">
                      SAR {Number(currentBalance).toFixed(2)}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-destructive transition-all duration-500"
                        style={{
                          width: Number(currentBalance) > 0 ? '100%' : '0%',
                          opacity: Number(currentBalance) > 0 ? 1 : 0.3,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Deduction Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Monthly Deduction</h3>
                    <Badge variant="outline" className="bg-muted/50">
                      Configurable
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="1.00"
                        min="0"
                        value={monthlyDeduction}
                        onChange={e => setMonthlyDeduction(e.target.value)}
                        onBlur={e => {
                          if (e.target.value !== monthlyDeduction) {
                            handleUpdateMonthlyDeduction(e.target.value);
                          }
                        }}
                        className="w-32 text-2xl font-bold text-primary"
                        placeholder="0.00"
                      />
                      <span className="text-2xl font-bold text-primary">{t('employee.currency.symbol')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{t('employee.advances.currentMonthlyDeduction')}</span>
                      <span className="font-medium">
                        {t('employee.currency.symbol')} {Number(monthlyDeduction || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {monthlyDeduction && Number(monthlyDeduction) > 0
                        ? t('employee.advances.companyWillDecide')
                        : t('employee.advances.setMonthlyDeduction')}
                    </p>
                  </div>
                </div>

                {/* Estimated Repayment Card */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {t('employee.advances.estimatedRepayment')}
                    </h3>
                    <Badge variant="outline" className="bg-muted/50">
                      {t('employee.advances.projected')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <p className="text-2xl font-bold text-primary">
                        {monthlyDeduction &&
                        Number(monthlyDeduction) > 0 &&
                        Number(currentBalance) > 0
                          ? Math.ceil(Number(currentBalance) / Number(monthlyDeduction))
                          : 0}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          {t('employee.advances.months')}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {monthlyDeduction &&
                      Number(monthlyDeduction) > 0 &&
                      Number(currentBalance) > 0
                        ? t('employee.advances.basedOnCurrentBalance')
                        : t('employee.advances.setMonthlyDeductionToSeeEstimate')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modern Advance History Card */}
              <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-lg">
                <CardHeader className="bg-muted/50 rounded-t-lg p-4 flex flex-row items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">{t('employee.advances.history')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.amount')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.monthlyDeduction')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.repaidAmount')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.reason')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.date')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.status')}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.type')}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {t('employee.advances.table.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {loadingAdvances ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-muted-foreground">Loading advances...</span>
                              </div>
                            </td>
                          </tr>
                        ) : advances.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-6 py-8 text-center text-muted-foreground italic"
                            >
                              No advance records found.
                            </td>
                          </tr>
                        ) : (
                          advances.map(advance => (
                            <tr key={advance.id} className="hover:bg-muted/50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                                SAR {Number(advance.amount).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                SAR {Number(advance.monthly_deduction || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                SAR {Number(advance.repaid_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-6 py-4 max-w-[200px] truncate">{advance.reason}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(advance.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant={
                                    advance.status === 'approved'
                                      ? 'default'
                                      : advance.status === 'pending'
                                        ? 'secondary'
                                        : advance.status === 'rejected'
                                          ? 'destructive'
                                          : advance.status === 'partially_repaid'
                                            ? 'secondary'
                                            : advance.status === 'fully_repaid'
                                              ? 'default'
                                              : 'outline'
                                  }
                                  className={
                                    advance.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : advance.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : advance.status === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : advance.status === 'partially_repaid'
                                            ? 'bg-blue-100 text-blue-800'
                                            : advance.status === 'fully_repaid'
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-800'
                                  }
                                >
                                  {advance.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 capitalize">
                                {advance.purpose === 'advance'
                                  ? 'Request'
                                  : advance.purpose === 'repayment'
                                    ? 'Repayment'
                                    : Number(advance.amount) < 0
                                      ? 'Repayment'
                                      : 'Payment'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Approve/Reject buttons for pending advances */}
                                  {advance.status === 'pending' && (
                                    <>
                                      {hasPermission('update', 'AdvancePayment') && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleApproveAdvance(advance.id)}
                                        >
                                          Approve
                                        </Button>
                                      )}
                                      {hasPermission('update', 'AdvancePayment') && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedAdvanceForReject(advance);
                                            setIsRejectDialogOpen(true);
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {/* Receipt button for all advances */}
                                  {hasPermission('read', 'AdvancePayment') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                      onClick={() =>
                                        window.open(
                                          `/modules/employee-management/${employeeId}/advances/${advance.id}/receipt`,
                                          '_blank'
                                        )
                                      }
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  )}

                                  {/* View details button */}
                                  {hasPermission('read', 'AdvancePayment') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        // Handle view details
                                        toast.info('View advance details');
                                      }}
                                    >
                                      View
                                    </Button>
                                  )}

                                  {/* Edit button for pending advances */}
                                  {advance.status === 'pending' &&
                                    hasPermission('update', 'AdvancePayment') && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // Handle edit advance
                                          toast.info('Edit advance');
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    )}

                                  {/* Delete button for admin/super admin */}
                                  {(hasPermission('delete', 'AdvancePayment') ||
                                    hasPermission('delete', 'Advance')) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                      onClick={async () => {
                                        const confirmed = await confirm({
                                          title: 'Delete Advance',
                                          description:
                                            'Are you sure you want to delete this advance? This action cannot be undone.',
                                          confirmText: 'Delete',
                                          cancelText: 'Cancel',
                                          variant: 'destructive',
                                        });
                                        if (confirmed) {
                                          handleAdvanceDelete(advance.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Repayment History Section */}
          <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-lg">
            <CardHeader className="bg-muted/50 rounded-t-lg p-4 flex flex-row items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Repayment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {loadingPayments ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground">
                              Loading repayment history...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length > 0 ? (
                      payments.map((payment: any, i: number) => (
                        <tr key={payment.id || i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                            SAR {Number(payment.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{payment.notes || '-'}</td>
                          <td className="px-6 py-4 text-right flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={() =>
                                window.open(
                                  `/modules/employee-management/${employeeId}/payments/${payment.id}/receipt`,
                                  '_blank'
                                )
                              }
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => {
                                setSelectedPaymentId(payment.id);
                                setShowDeletePaymentDialog(true);
                              }}
                              disabled={deletingPaymentId === payment.id}
                            >
                              {deletingPaymentId === payment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-muted-foreground italic"
                        >
                          No repayment history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Delete Payment Dialog */}
          <Dialog open={showDeletePaymentDialog} onOpenChange={setShowDeletePaymentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Repayment</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this repayment? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeletePaymentDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={deletingPaymentId === selectedPaymentId}
                  onClick={async () => {
                    if (selectedPaymentId) {
                      const confirmed = await confirm({
                        title: 'Delete Repayment',
                        description:
                          'Are you sure you want to delete this repayment? This action cannot be undone.',
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        variant: 'destructive',
                      });
                      if (confirmed) {
                        handlePaymentDelete(selectedPaymentId);
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="resignations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resignation History</CardTitle>
              <CardDescription>View and manage resignation requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Working Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted On
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td
                        colSpan={hasPermission('read', 'resignation') ? 5 : 4}
                        className="px-6 py-8 text-center text-sm text-muted-foreground"
                      >
                        No resignation requests found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final-settlements" className="mt-6 space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Final Settlement</h2>
              {hasPermission('create', 'FinalSettlement') && <Button>Create Settlement</Button>}
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Receipt className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No final settlements found for this employee.</p>
                  {hasPermission('create', 'FinalSettlement') && (
                    <Button className="mt-4">Create New Settlement</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
