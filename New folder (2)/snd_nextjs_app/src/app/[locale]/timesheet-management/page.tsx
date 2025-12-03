'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { ProtectedRoute } from '@/components/protected-route';
import AutoGenerateButton from '@/components/timesheet/AutoGenerateButton';
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
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/use-i18n';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { PermissionBased } from '@/components/PermissionBased';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  batchTranslateNames,
  convertToArabicNumerals,
  getTranslatedName,
} from '@/lib/translation-utils';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { JSX, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';

import { useParams } from 'next/navigation';

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  startTime: string;
  endTime: string;
  status: string;
  projectId?: string;
  rentalId?: string;
  assignmentId?: string;
  description?: string;
  tasksCompleted?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    user?: {
      name: string;
      email: string;
    };
  };
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
  };
  assignment?: {
    id: string;
    name: string;
    type: string;
  };
}

interface PaginatedResponse {
  data: Timesheet[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function TimesheetManagementPage() {
  const { t, isRTL } = useI18n();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { user, hasPermission } = useRBAC();
  const [timesheets, setTimesheets] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoGenerationProgress, setAutoGenerationProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set());
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [month, setMonth] = useState('all');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    notes: string;
  }>({
    open: false,
    action: null,
    notes: '',
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    timesheetId: string | null;
    timesheetData: Timesheet | null;
  }>({
    open: false,
    timesheetId: null,
    timesheetData: null,
  });

  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    timesheets: Timesheet[];
  }>({
    open: false,
    timesheets: [],
  });

  const [monthSelectOpen, setMonthSelectOpen] = useState(false);
  const currentMonthRef = useRef<HTMLDivElement>(null);

  // Get user role from RBAC context
  const userRole = user?.role || 'USER';

  // Auto-generate timesheets when page loads
  useEffect(() => {
    const autoGenerateOnLoad = async () => {
      // Check if auto-generation was recently executed (within last hour)
      const lastAutoGeneration = localStorage.getItem('lastAutoGeneration');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (lastAutoGeneration && now - parseInt(lastAutoGeneration) < oneHour) {
        
        return;
      }

      setAutoGenerating(true);
      try {
        const response = await fetch('/api/timesheets/auto-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse response as JSON:', jsonError);
          console.error('Response text:', await response.text());
          return;
        }

        if (result && result.success && result.created > 0) {
          toast.success(`${t('timesheet.auto_generated_timesheets', { count: result.created })}`);
          // Store the execution time
          localStorage.setItem('lastAutoGeneration', now.toString());
          // Refresh the timesheets table to show newly created timesheets
          fetchTimesheets();
        } else if (result && result.success && result.created === 0) {
          // No new timesheets created, which is fine
          
          // Store the execution time even if no timesheets were created
          localStorage.setItem('lastAutoGeneration', now.toString());
        } else if (result && result.errors && result.errors.length > 0) {
          
          // Store the execution time even if there were errors
          localStorage.setItem('lastAutoGeneration', now.toString());
        }

        // Update progress if available
        if (result && result.progress) {
          setAutoGenerationProgress(result.progress);
        }
      } catch {
        // Don't show error toast to user as this is a background process
      } finally {
        setAutoGenerating(false);
        // Clear progress after a delay
        setTimeout(() => {
          setAutoGenerationProgress(null);
        }, 3000);
      }
    };

    // Run auto-generation when component mounts
    autoGenerateOnLoad();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const shouldShowInitialLoader = !timesheets;
      if (shouldShowInitialLoader) {
        setLoading(true);
      } else {
        setTableRefreshing(true);
      }
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        page: currentPage.toString(),
      });

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (assignmentFilter && assignmentFilter !== 'all') {
        params.append('assignment', assignmentFilter);
      }
      if (month && month !== 'all') {
        params.append('month', month);
      }

      const response = await fetch(`/api/timesheets?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }

      const data = await response.json();
      setTimesheets(data);

      // Show success message if this was a manual refresh (not from auto-generation)
      if (data.total !== undefined) {
        
      }
    } catch {
      toast.error(t('timesheet.failed_to_fetch_timesheets'));
    } finally {
      setLoading(false);
      setTableRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [currentPage, pageSize, debouncedSearchTerm, statusFilter, assignmentFilter, month]); // Add dependencies

  useEffect(() => {
    setCurrentPage(prev => (prev === 1 ? prev : 1));
  }, [debouncedSearchTerm, statusFilter, assignmentFilter, month]);

  // Trigger batch translation when timesheets data changes
  useEffect(() => {
    if (timesheets?.data && timesheets.data.length > 0 && isRTL) {
      const names = timesheets.data
        .map(timesheet => `${timesheet.employee.firstName} ${timesheet.employee.lastName}`)
        .filter(Boolean) as string[];
      batchTranslateNames(names, isRTL, setTranslatedNames);
    }
  }, [timesheets, isRTL]);

  // Server-side pagination data
  const totalItems = timesheets?.total || 0;
  const totalPages = timesheets?.last_page || 1;
  const currentTimesheets = timesheets?.data || [];


  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Scroll to current month when dropdown opens
  useEffect(() => {
    if (monthSelectOpen && currentMonthRef.current) {
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    }
  }, [monthSelectOpen]);

  // Alternative scroll method using parent container
  const handleMonthSelectOpen = (open: boolean) => {
    setMonthSelectOpen(open);
    if (open) {
      setTimeout(() => {
        // Try multiple selectors to find the current month element
        const selectContent = document.querySelector('[data-radix-select-content]');
        let currentMonthElement: Element | null = null;

        if (selectContent) {
          // Try different attribute selectors
          currentMonthElement =
            selectContent.querySelector(`[data-value="${month}"]`) ||
            selectContent.querySelector(`[value="${month}"]`) ||
            selectContent.querySelector(`[data-state="checked"]`);

          if (currentMonthElement) {
            currentMonthElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          } else {
            // Fallback: scroll to the middle of the list where current month should be
            const allItems = selectContent.querySelectorAll('[role="option"]');
            const currentMonthIndex = monthOptions.findIndex(option => option.value === month);
            if (currentMonthIndex > 0 && allItems[currentMonthIndex + 1]) {
              // +1 for "All Months"
              allItems[currentMonthIndex + 1]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }
        }
      }, 250);
    }
  };

  const handleDelete = async (timesheet: Timesheet) => {
    // Only admin or super admin can delete non-draft timesheets
    if (timesheet.status !== 'draft' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      toast.error(t('timesheet.only_draft_timesheets_can_be_deleted_by_non_admin_users'));
      return;
    }

    setDeleteDialog({
      open: true,
      timesheetId: timesheet.id,
      timesheetData: timesheet,
    });
  };

  const executeDelete = async () => {
    if (!deleteDialog.timesheetId) return;

    try {
      const response = await fetch(`/api/timesheets/${deleteDialog.timesheetId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': userRole,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete timesheet');
      }

      toast.success(t('timesheet.timesheet_deleted_successfully'));
      setDeleteDialog({ open: false, timesheetId: null, timesheetData: null });
      fetchTimesheets(); // Refresh the list
    } catch (_error) {
      toast.error(_error instanceof Error ? _error.message : 'Failed to delete timesheet');
    }
  };

  const handleBulkDelete = () => {
    const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.has(t.id)) || [];

    // Only admin or super admin can delete non-draft timesheets
    if (
      selectedTimesheetsData.filter(t => t.status !== 'draft').length > 0 &&
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      toast.error(
        t('timesheet.cannot_delete_timesheets_only_draft_can_be_deleted_by_non_admin_users', {
          count: selectedTimesheetsData.filter(t => t.status !== 'draft').length.toString(),
        })
      );
      return;
    }

    if (
      selectedTimesheetsData.filter(t => t.status === 'draft').length === 0 &&
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      toast.error(t('timesheet.no_draft_timesheets_selected_for_deletion'));
      return;
    }

    if (selectedTimesheetsData.length === 0) {
      toast.error(t('timesheet.no_timesheets_selected_for_deletion'));
      return;
    }

    setBulkDeleteDialog({
      open: true,
      timesheets: selectedTimesheetsData,
    });
  };

  const executeBulkDelete = async () => {
    try {
      const response = await fetch('/api/timesheets/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetIds: bulkDeleteDialog.timesheets.map(t => t.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete timesheets');
      }

      toast.success(data.message);
      setSelectedTimesheets(new Set());
      setBulkDeleteDialog({ open: false, timesheets: [] });
      fetchTimesheets(); // Refresh the list
    } catch (_error) {
      toast.error(_error instanceof Error ? _error.message : 'Failed to delete timesheets');
    }
  };

  const handleApprove = async () => {
    // Implementation for individual approve functionality
    toast.info(t('timesheet.individual_approve_functionality_to_be_implemented'));
  };

  const handleReject = async () => {
    // Implementation for individual reject functionality
    toast.info(t('timesheet.individual_reject_functionality_to_be_implemented'));
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTimesheets.size === 0) {
      toast.error(t('timesheet.please_select_timesheets_to_process'));
      return;
    }

    setBulkActionDialog({
      open: true,
      action,
      notes: '',
    });
  };


  const executeBulkAction = async () => {
    if (!bulkActionDialog.action || selectedTimesheets.size === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/timesheets/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetIds: Array.from(selectedTimesheets),
          action: bulkActionDialog.action,
          notes: bulkActionDialog.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process timesheets');
      }

      toast.success(data.message);
      setSelectedTimesheets(new Set());
      setBulkActionDialog({ open: false, action: null, notes: '' });
      fetchTimesheets(); // Refresh the list
    } catch (_error) {
      
      toast.error(_error instanceof Error ? _error.message : 'Failed to process timesheets');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(new Set(timesheets?.data.map(t => t.id) || []));
    } else {
      setSelectedTimesheets(new Set());
    }
  };

  const handleSelectTimesheet = (timesheetId: string, checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(prev => new Set([...prev, timesheetId]));
    } else {
      setSelectedTimesheets(prev => new Set([...prev].filter(id => id !== timesheetId)));
    }
  };

  const canApproveTimesheet = (timesheet: Timesheet) => {
    // Check if timesheet is in a state that can be approved
    // Include 'pending' status which is the default in database
    const canProcess = [
      'pending',
      'draft',
      'submitted',
      'foreman_approved',
      'incharge_approved',
      'checking_approved',
    ].includes(timesheet.status);
    if (!canProcess) {
      return false;
    }

    // For draft timesheets, check submission permissions
    if (timesheet.status === 'draft') {
      return hasPermission('create', 'Timesheet');
    }

    // Check stage-specific approval permissions
    switch (timesheet.status) {
      case 'pending':
      case 'submitted':
        return hasPermission('approve', 'Timesheet.Foreman') || hasPermission('approve', 'Timesheet');
      case 'foreman_approved':
        return hasPermission('approve', 'Timesheet.Incharge') || hasPermission('approve', 'Timesheet');
      case 'incharge_approved':
        return hasPermission('approve', 'Timesheet.Checking') || hasPermission('approve', 'Timesheet');
      case 'checking_approved':
        return hasPermission('approve', 'Timesheet.Manager') || hasPermission('approve', 'Timesheet');
      default:
        return hasPermission('approve', 'Timesheet');
    }
  };

  const canRejectTimesheet = (timesheet: Timesheet) => {
    // Check if timesheet is in a state that can be rejected
    // Include 'pending' status which is the default in database
    const canProcess = [
      'pending',
      'submitted',
      'foreman_approved',
      'incharge_approved',
      'checking_approved',
    ].includes(timesheet.status);
    if (!canProcess) return false;

    // Check stage-specific rejection permissions
    switch (timesheet.status) {
      case 'pending':
      case 'submitted':
        return hasPermission('reject', 'Timesheet.Foreman') || hasPermission('reject', 'Timesheet');
      case 'foreman_approved':
        return hasPermission('reject', 'Timesheet.Incharge') || hasPermission('reject', 'Timesheet');
      case 'incharge_approved':
        return hasPermission('reject', 'Timesheet.Checking') || hasPermission('reject', 'Timesheet');
      case 'checking_approved':
        return hasPermission('reject', 'Timesheet.Manager') || hasPermission('reject', 'Timesheet');
      default:
        return hasPermission('reject', 'Timesheet');
    }
  };

  // Helper function for approval workflow - currently unused but kept for future functionality
  const _getNextApprovalStage = (currentStatus: string) => {
    const stageProgression = {
      draft: t('timesheet.submit_for_approval'),
      submitted: t('timesheet.foreman_approval'),
      foreman_approved: t('timesheet.incharge_approval'),
      incharge_approved: t('timesheet.checking_approval'),
      checking_approved: t('timesheet.manager_approval'),
      manager_approved: t('timesheet.completed'),
    };

    return stageProgression[currentStatus as keyof typeof stageProgression] || 'Unknown';
  };

  const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.has(t.id)) || [];
  const canApproveSelected = selectedTimesheetsData.some(t => canApproveTimesheet(t));
  const canRejectSelected = selectedTimesheetsData.some(t => canRejectTimesheet(t));

  // Extract unique assignments for filter
  const assignments = useMemo(() => {
    if (!currentTimesheets) return [];
    const assignmentSet = new Set<string>();
    currentTimesheets.forEach(timesheet => {
      if (timesheet.assignment?.name) {
        assignmentSet.add(timesheet.assignment.name);
      } else if (timesheet.project?.name) {
        assignmentSet.add(timesheet.project.name);
      } else if (timesheet.rental?.rentalNumber) {
        assignmentSet.add(timesheet.rental.rentalNumber);
      }
    });
    return Array.from(assignmentSet).sort();
  }, [currentTimesheets]);

  // Generate month options for the last 2 years and next 2 years
  type MonthOption = { value: string; label: string };
  const monthOptions = useMemo<MonthOption[]>(() => {
    const options: MonthOption[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const yearMonth = `${year}-${monthStr}`;
        const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        options.push({ value: yearMonth, label: monthName });
      }
    }

    return options;
  }, []);

  // Get current month for default selection
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${monthStr}`;
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">{t('timesheet.draft')}</Badge>;
      case 'submitted':
        return <Badge variant="default">{t('timesheet.submitted')}</Badge>;
      case 'foreman_approved':
        return <Badge className="bg-blue-100 text-blue-800">{t('timesheet.foreman_approved')}</Badge>;
      case 'incharge_approved':
        return <Badge className="bg-purple-100 text-purple-800">{t('timesheet.incharge_approved')}</Badge>;
      case 'checking_approved':
        return <Badge className="bg-orange-100 text-orange-800">{t('timesheet.checking_approved')}</Badge>;
      case 'manager_approved':
        return <Badge className="bg-green-100 text-green-800">{t('timesheet.manager_approved')}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">{t('timesheet.rejected')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('timesheet.loading_timesheets')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">{t('timesheet.timesheet_management')}</h1>
            {autoGenerating && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Auto-generating timesheets...</span>
                {autoGenerationProgress && (
                  <span className="text-xs">
                    ({autoGenerationProgress.current}/{autoGenerationProgress.total} -{' '}
                    {autoGenerationProgress.percentage}%)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <PermissionContent action="export" subject="Timesheet">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('timesheet.export')}
              </Button>
            </PermissionContent>

            <PermissionContent action="sync" subject="Timesheet">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTimesheets}
                disabled={loading || tableRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${tableRefreshing ? 'animate-spin' : ''}`} />
                {tableRefreshing ? t('timesheet.loading_timesheets') : t('timesheet.sync_timesheets')}
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Timesheet">
              <AutoGenerateButton
                isAutoGenerating={autoGenerating}
                onAutoGenerateComplete={fetchTimesheets}
              />
            </PermissionContent>

            <PermissionContent action="create" subject="Timesheet">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/init-cron', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });

                    const result = await response.json();
                    if (result.success) {
                      toast.success('Cron service initialized successfully!');
                    } else {
                      toast.error('Failed to initialize cron service: ' + result.error);
                    }
                  } catch {
                    toast.error('Failed to initialize cron service');
                  }
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Init Cron
              </Button>
            </PermissionContent>

            <PermissionContent action="create" subject="Timesheet">
              <Link href={`/${locale}/timesheet-management/bulk-submit`}>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Submit
                </Button>
              </Link>
            </PermissionContent>

            <PermissionContent action="create" subject="Timesheet">
              <Link href={`/${locale}/timesheet-management/create`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('timesheet.create_timesheet')}
                </Button>
              </Link>
            </PermissionContent>

            <PermissionContent action="read" subject="Timesheet">
              <Link href={`/${locale}/timesheet-management/monthly`}>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('timesheet.monthly_report')}
                </Button>
              </Link>
            </PermissionContent>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTimesheets.size > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">
                    {selectedTimesheets.size}{' '}
                    {t('timesheet.timesheet_selected', { count: selectedTimesheets.size.toString() })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTimesheets(new Set())}
                  >
                    {t('timesheet.clear_selection')}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  {canApproveSelected && (
                    <PermissionBased action="approve" subject="Timesheet.Foreman">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('approve')}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('timesheet.bulk_approve')}
                      </Button>
                    </PermissionBased>
                  )}
                  {canRejectSelected && (
                    <PermissionBased action="reject" subject="Timesheet.Foreman">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('reject')}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('timesheet.bulk_reject')}
                      </Button>
                    </PermissionBased>
                  )}
                  <PermissionBased action="delete" subject="Timesheet">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('timesheet.bulk_delete')}
                    </Button>
                  </PermissionBased>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 mb-6">
          {tableRefreshing && (
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('timesheet.loading_timesheets')}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('timesheet.search_timesheets')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('timesheet.filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('timesheet.all_status')}</SelectItem>
                <SelectItem value="draft">{t('timesheet.draft')}</SelectItem>
                <SelectItem value="submitted">{t('timesheet.submitted')}</SelectItem>
                <SelectItem value="foreman_approved">{t('timesheet.foreman_approved')}</SelectItem>
                <SelectItem value="incharge_approved">{t('timesheet.incharge_approved')}</SelectItem>
                <SelectItem value="checking_approved">{t('timesheet.checking_approved')}</SelectItem>
                <SelectItem value="manager_approved">{t('timesheet.manager_approved')}</SelectItem>
                <SelectItem value="rejected">{t('timesheet.rejected')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('timesheet.filter_by_assignment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('timesheet.all_assignments')}</SelectItem>
                {assignments.map(assignment => (
                  <SelectItem key={assignment} value={assignment}>
                    {assignment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={month}
              onValueChange={setMonth}
              open={monthSelectOpen}
              onOpenChange={handleMonthSelectOpen}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('timesheet.filter_by_month')} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">{t('timesheet.all_months')}</SelectItem>
                {monthOptions.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={option.value === currentMonth ? 'bg-blue-50 font-medium' : ''}
                    ref={option.value === currentMonth ? currentMonthRef : null}
                  >
                    {option.label}
                    {option.value === currentMonth && ` (${t('timesheet.current_month')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonth(currentMonth)}
              title={t('timesheet.filter_by_current_month')}
            >
              {t('timesheet.current_month')}
            </Button>
            <Select
              value={pageSize.toString()}
              onValueChange={value => handlePageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={t('timesheet.page_size')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">{t('timesheet.5_per_page')}</SelectItem>
                <SelectItem value="10">{t('timesheet.10_per_page')}</SelectItem>
                <SelectItem value="20">{t('timesheet.20_per_page')}</SelectItem>
                <SelectItem value="50">{t('timesheet.50_per_page')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('timesheet.timesheets')}</CardTitle>
                <CardDescription>{t('timesheet.manage_employee_timesheets_and_approvals')}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {timesheets?.total || 0} {t('timesheet.timesheets', { count: (timesheets?.total || 0).toString() })}
                </span>
                {totalPages > 1 && (
                  <span className="text-sm text-gray-500">
                    {t('timesheet.page')} {currentPage} {t('timesheet.of')} {totalPages}
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedTimesheets.size === timesheets?.data.length &&
                        timesheets.data.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t('timesheet.employee')}</TableHead>
                  <TableHead>{t('timesheet.assignment')}</TableHead>
                  <TableHead>{t('timesheet.date')}</TableHead>
                  <TableHead>{t('timesheet.hours')}</TableHead>
                  <TableHead>{t('timesheet.status')}</TableHead>
                  <TableHead>{t('timesheet.submitted')}</TableHead>
                  <TableHead>{t('timesheet.approved_by')}</TableHead>
                  <TableHead className="text-right">{t('timesheet.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTimesheets.length > 0 ? (
                  currentTimesheets.map(timesheet => (
                    <TableRow key={timesheet.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTimesheets.has(timesheet.id)}
                          onCheckedChange={checked =>
                            handleSelectTimesheet(timesheet.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {getTranslatedName(
                                  `${timesheet.employee.firstName} ${timesheet.employee.lastName}`,
                                  isRTL,
                                  translatedNames,
                                  setTranslatedNames
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {getTranslatedName(
                                `${timesheet.employee.firstName} ${timesheet.employee.lastName}`,
                                isRTL,
                                translatedNames,
                                setTranslatedNames
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {timesheet.employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {timesheet.assignment ? (
                          <div className="text-sm">
                            <div className="font-medium capitalize">
                              {timesheet.assignment.type}
                            </div>
                            <div className="text-muted-foreground">
                              {timesheet.assignment.name ||
                                (timesheet.project
                                  ? timesheet.project.name
                                  : timesheet.rental
                                    ? timesheet.rental.rentalNumber
                                    : t('timesheet.no_name'))}
                            </div>
                          </div>
                        ) : timesheet.project ? (
                          <div className="text-sm">
                            <div className="font-medium">{t('timesheet.project')}</div>
                            <div className="text-muted-foreground">{timesheet.project.name}</div>
                          </div>
                        ) : timesheet.rental ? (
                          <div className="text-sm">
                            <div className="font-medium">{t('timesheet.rental')}</div>
                            <div className="text-muted-foreground">
                              {timesheet.rental.rentalNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(timesheet.date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {convertToArabicNumerals(timesheet.hoursWorked.toString(), isRTL)}h
                          </div>
                          {timesheet.overtimeHours > 0 && (
                            <div className="text-sm text-orange-600">
                              +{convertToArabicNumerals(timesheet.overtimeHours.toString(), isRTL)}h{' '}
                              {t('timesheet.overtime')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                      <TableCell>
                        {timesheet.submittedAt
                          ? new Date(timesheet.submittedAt).toLocaleDateString()
                          : t('timesheet.not_submitted')}
                      </TableCell>
                      <TableCell>{timesheet.approvedBy || t('timesheet.not_approved')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/${locale}/timesheet-management/${timesheet.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {hasPermission('update', 'Timesheet') && (
                            <Link href={`/${locale}/timesheet-management/${timesheet.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}

                          {timesheet.status === 'pending' && (
                            <>
                              <PermissionBased action="approve" subject="Timesheet.Foreman">
                                <Button variant="ghost" size="sm" onClick={handleApprove}>
                                  <Badge className="bg-green-100 text-green-800">
                                    {t('timesheet.approve')}
                                  </Badge>
                                </Button>
                              </PermissionBased>
                              <PermissionBased action="reject" subject="Timesheet.Foreman">
                                <Button variant="ghost" size="sm" onClick={handleReject}>
                                  <Badge className="bg-red-100 text-red-800">{t('timesheet.reject')}</Badge>
                                </Button>
                              </PermissionBased>
                            </>
                          )}
                          <PermissionBased action="delete" subject="Timesheet">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(timesheet)}
                              disabled={timesheet.status !== 'draft' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN'}
                              title={
                                timesheet.status !== 'draft' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN'
                                  ? t('timesheet.only_draft_timesheets_can_be_deleted_by_non_admin_users')
                                  : t('timesheet.delete_timesheet')
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionBased>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">{t('timesheet.no_timesheets_found')}</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bulk Action Dialog */}
        <Dialog
          open={bulkActionDialog.open}
          onOpenChange={open => setBulkActionDialog(prev => ({ ...prev, open }))}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {bulkActionDialog.action === 'approve'
                  ? t('timesheet.bulk_approve_timesheets')
                  : t('timesheet.bulk_reject_timesheets')}
              </DialogTitle>
              <DialogDescription>
                {bulkActionDialog.action === 'approve'
                  ? t('timesheet.bulk_approve_description')
                  : t('timesheet.bulk_reject_description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">{t('timesheet.notes_optional')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('timesheet.add_any_notes_about_this_action')}
                  value={bulkActionDialog.notes}
                  onChange={e => setBulkActionDialog(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Approval Workflow Information */}
              {bulkActionDialog.action === 'approve' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">{t('timesheet.automatic_approval_workflow')}</span>
                  </div>
                  <div className="text-sm text-blue-700 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{t('timesheet.current_status_next_stage')}</p>
                        <div className="space-y-1 mt-1">
                          <p>
                            • {t('timesheet.draft')} → {t('timesheet.foreman_approval')}
                          </p>
                          <p>
                            • {t('timesheet.submitted')} → {t('timesheet.foreman_approval')}
                          </p>
                          <p>
                            • {t('timesheet.foreman_approved')} → {t('timesheet.incharge_approval')}
                          </p>
                          <p>
                            • {t('timesheet.incharge_approved')} → {t('timesheet.checking_approval')}
                          </p>
                          <p>
                            • {t('timesheet.checking_approved')} → {t('timesheet.manager_approval')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{t('timesheet.system_behavior')}</p>
                        <div className="space-y-1 mt-1">
                          <p>• {t('timesheet.automatically_determines_next_stage')}</p>
                          <p>• {t('timesheet.moves_to_next_approval_level')}</p>
                          <p>• {t('timesheet.no_manual_stage_selection_needed')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{t('timesheet.summary')}</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    • {selectedTimesheets.size}{' '}
                    {t('timesheet.timesheet_selected', { count: selectedTimesheets.size.toString() })}
                  </p>
                  <p>
                    • {t('timesheet.action')}:{' '}
                    {bulkActionDialog.action === 'approve' ? t('timesheet.approve') : t('timesheet.reject')}
                  </p>
                  {bulkActionDialog.action === 'approve' && (
                    <p>
                      • {t('timesheet.approval_workflow')}: {t('timesheet.automatic_stage_determination')}
                    </p>
                  )}
                  <p>• {t('timesheet.employees')}:</p>
                  <ul className="ml-4 space-y-1">
                    {selectedTimesheetsData.slice(0, 3).map(timesheet => (
                      <li key={timesheet.id} className="text-xs">
                        {getTranslatedName(
                          `${timesheet.employee.firstName} ${timesheet.employee.lastName}`,
                          isRTL,
                          translatedNames,
                          setTranslatedNames
                        )}{' '}
                        - {new Date(timesheet.date).toLocaleDateString()} -{' '}
                        {convertToArabicNumerals(timesheet.hoursWorked.toString(), isRTL)}h
                      </li>
                    ))}
                    {selectedTimesheetsData.length > 3 && (
                      <li className="text-xs text-gray-500">
                        ... and {selectedTimesheetsData.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkActionDialog({ open: false, action: null, notes: '' })}
              >
                {t('timesheet.cancel')}
              </Button>
              <Button
                onClick={executeBulkAction}
                disabled={bulkActionLoading}
                className={
                  bulkActionDialog.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {bulkActionLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('timesheet.processing')}...
                  </>
                ) : (
                  <>
                    {bulkActionDialog.action === 'approve' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {bulkActionDialog.action === 'approve' ? t('timesheet.approve') : t('timesheet.reject')} {t('timesheet.all')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('timesheet.delete_timesheet')}</DialogTitle>
              <DialogDescription>
                {t('timesheet.are_you_sure_you_want_to_delete_this_timesheet')}
              </DialogDescription>
            </DialogHeader>
            {deleteDialog.timesheetData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('timesheet.employee')}:</span>{' '}
                    {deleteDialog.timesheetData.employee.firstName}{' '}
                    {deleteDialog.timesheetData.employee.lastName}
                  </div>
                  <div>
                    <span className="font-medium">{t('timesheet.date')}:</span>{' '}
                    {new Date(deleteDialog.timesheetData.date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">{t('timesheet.hours')}:</span>{' '}
                    {deleteDialog.timesheetData.hoursWorked}h
                    {deleteDialog.timesheetData.overtimeHours > 0 &&
                      ` + ${deleteDialog.timesheetData.overtimeHours}h {t('timesheet.ot')}`}
                  </div>
                  <div>
                    <span className="font-medium">{t('timesheet.status')}:</span>{' '}
                    {getStatusBadge(deleteDialog.timesheetData.status)}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setDeleteDialog({ open: false, timesheetId: null, timesheetData: null })
                }
              >
                {t('timesheet.cancel')}
              </Button>
              <Button variant="destructive" onClick={executeDelete}>
                {t('timesheet.delete_timesheet')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog
          open={bulkDeleteDialog.open}
          onOpenChange={open => setBulkDeleteDialog(prev => ({ ...prev, open }))}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('timesheet.delete_multiple_timesheets')}</DialogTitle>
              <DialogDescription>
                {t('timesheet.are_you_sure_you_want_to_delete', {
                  count: bulkDeleteDialog.timesheets.length.toString(),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="font-medium">{t('timesheets_to_be_deleted')}:</div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {bulkDeleteDialog.timesheets.map(timesheet => (
                    <div
                      key={timesheet.id}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <div>
                        <div className="font-medium">
                          {timesheet.employee.firstName} {timesheet.employee.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(timesheet.date).toLocaleDateString()} - {timesheet.hoursWorked}h
                          {timesheet.overtimeHours > 0 &&
                            ` + ${timesheet.overtimeHours}h {t('timesheet.ot')}`}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {timesheet.project?.name ||
                          timesheet.rental?.rentalNumber ||
                          t('timesheet.no_project_rental')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteDialog({ open: false, timesheets: [] })}
              >
                {t('timesheet.cancel')}
              </Button>
              <Button variant="destructive" onClick={executeBulkDelete}>
                {t('timesheet.delete', { count: bulkDeleteDialog.timesheets.length.toString() })} {t('timesheet.timesheet_s')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          {/* Left side - Showing results info */}
          <div className="text-sm text-gray-600">
            {t('timesheet.showing_results', {
              start: ((currentPage - 1) * pageSize + 1).toString(),
              end: Math.min(currentPage * pageSize, totalItems).toString(),
              total: totalItems.toString(),
            })}
          </div>

          {/* Right side - Pagination controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              &lt; {t('timesheet.previous')}
            </Button>

            {/* Page numbers */}
            {(() => {
              const pages: JSX.Element[] = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

              // Adjust start page if we're near the end
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              // First page
              if (startPage > 1) {
                pages.push(
                  <Button
                    key={1}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className="h-8 w-8 p-0"
                  >
                    1
                  </Button>
                );

                // Ellipsis after first page
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
              }

              // Visible pages
              for (let page = startPage; page <= endPage; page++) {
                pages.push(
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                );
              }

              // Ellipsis before last page
              if (endPage < totalPages - 1) {
                pages.push(
                  <span key="ellipsis2" className="px-2 text-gray-500">
                    ...
                  </span>
                );
              }

              // Last page
              if (endPage < totalPages) {
                pages.push(
                  <Button
                    key={totalPages}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-8 w-8 p-0"
                  >
                    {totalPages}
                  </Button>
                );
              }

              return pages;
            })()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              {t('timesheet.next')} &gt;
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
