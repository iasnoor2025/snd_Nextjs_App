"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Settings,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AutoGenerateButton from "@/components/timesheet/AutoGenerateButton";
import { ProtectedRoute } from "@/components/protected-route";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';
import { 
  convertToArabicNumerals, 
  getTranslatedName, 
  batchTranslateNames 
} from '@/lib/translation-utils';

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
  const { t } = useTranslation('timesheet');
  const { isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [timesheets, setTimesheets] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    notes: ''
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    timesheetId: string | null;
    timesheetData: Timesheet | null;
  }>({
    open: false,
    timesheetId: null,
    timesheetData: null
  });

  const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
    open: boolean;
    timesheets: Timesheet[];
  }>({
    open: false,
    timesheets: []
  });

  const [monthSelectOpen, setMonthSelectOpen] = useState(false);
  const currentMonthRef = useRef<HTMLDivElement>(null);

  // Auto-generate timesheets when page loads
  useEffect(() => {
    const autoGenerateOnLoad = async () => {
      setAutoGenerating(true);
      try {
        const response = await fetch('/api/timesheets/auto-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success && result.created > 0) {
          toast.success(`${t('auto_generated_timesheets', { count: result.created })}`);
        } else if (result.success && result.created === 0) {
          // No new timesheets created, which is fine
          console.log('No new timesheets needed to be generated for the last 3 months');
        } else if (result.errors && result.errors.length > 0) {
          console.warn('Auto-generation completed with some errors:', result.errors);
        }
      } catch (error) {
        console.error('Error during auto-generation on page load:', error);
        // Don't show error toast to user as this is a background process
      } finally {
        setAutoGenerating(false);
      }
    };

    // Run auto-generation when component mounts
    autoGenerateOnLoad();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        page: currentPage.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
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
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error(t('failed_to_fetch_timesheets'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [currentPage, pageSize, searchTerm, statusFilter, assignmentFilter, month]); // Add dependencies

  // Trigger batch translation when timesheets data changes
  useEffect(() => {
    if (timesheets?.data && timesheets.data.length > 0 && isRTL) {
      const names = timesheets.data.map(timesheet => 
        `${timesheet.employee.firstName} ${timesheet.employee.lastName}`
      ).filter(Boolean) as string[];
      batchTranslateNames(names, isRTL, setTranslatedNames);
    }
  }, [timesheets, isRTL]);

  // Server-side pagination data
  const totalItems = timesheets?.total || 0;
  const totalPages = timesheets?.last_page || 1;
  const currentTimesheets = timesheets?.data || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          block: 'center'
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
        let currentMonthElement = null;

        if (selectContent) {
          // Try different attribute selectors
          currentMonthElement = selectContent.querySelector(`[data-value="${month}"]`) ||
            selectContent.querySelector(`[value="${month}"]`) ||
            selectContent.querySelector(`[data-state="checked"]`);

          if (currentMonthElement) {
            currentMonthElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          } else {
            // Fallback: scroll to the middle of the list where current month should be
            const allItems = selectContent.querySelectorAll('[role="option"]');
            const currentMonthIndex = monthOptions.findIndex(option => option.value === month);
            if (currentMonthIndex > 0 && allItems[currentMonthIndex + 1]) { // +1 for "All Months"
              allItems[currentMonthIndex + 1].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }
      }, 250);
    }
  };

  const handleDelete = async (timesheet: Timesheet) => {
    // Get user role from session or context
    const userRole = 'USER' as string; // This should come from your auth context/session

    // Only admin can delete non-draft timesheets
    if (timesheet.status !== 'draft' && userRole !== 'ADMIN') {
      toast.error(t('only_draft_timesheets_can_be_deleted_by_non_admin_users'));
      return;
    }

    setDeleteDialog({
      open: true,
      timesheetId: timesheet.id,
      timesheetData: timesheet
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

      toast.success(t('timesheet_deleted_successfully'));
      setDeleteDialog({ open: false, timesheetId: null, timesheetData: null });
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete timesheet');
    }
  };

  const handleBulkDelete = () => {
    const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.has(t.id)) || [];

    // Get user role from session or context
    const userRole = 'USER' as string; // This should come from your auth context/session

    const draftTimesheets = selectedTimesheetsData.filter(t => t.status === 'draft');
    const nonDraftTimesheets = selectedTimesheetsData.filter(t => t.status !== 'draft');

    // Only admin can delete non-draft timesheets
    if (nonDraftTimesheets.length > 0 && userRole !== 'ADMIN') {
      toast.error(t('cannot_delete_timesheets_only_draft_can_be_deleted_by_non_admin_users', { count: nonDraftTimesheets.length }));
      return;
    }

    if (draftTimesheets.length === 0 && userRole !== 'ADMIN') {
      toast.error(t('no_draft_timesheets_selected_for_deletion'));
      return;
    }

    if (selectedTimesheetsData.length === 0) {
      toast.error(t('no_timesheets_selected_for_deletion'));
      return;
    }

    setBulkDeleteDialog({
      open: true,
      timesheets: selectedTimesheetsData
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
          timesheetIds: bulkDeleteDialog.timesheets.map(t => t.id)
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete timesheets');
    }
  };

  const handleApprove = async () => {
    // Implementation for individual approve functionality
    toast.info(t('individual_approve_functionality_to_be_implemented'));
  };

  const handleReject = async () => {
    // Implementation for individual reject functionality
    toast.info(t('individual_reject_functionality_to_be_implemented'));
  };



  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTimesheets.size === 0) {
      toast.error(t('please_select_timesheets_to_process'));
      return;
    }

    setBulkActionDialog({
      open: true,
      action,
      notes: ''
    });
  };

  const handleAllPendingAction = async (action: 'approve' | 'reject') => {
    // Get all pending timesheets from the current server data
    const pendingTimesheets = currentTimesheets.filter(timesheet => {
      const canProcess = ['pending', 'draft', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);
      return canProcess;
    });

    if (pendingTimesheets.length === 0) {
      toast.error(t('no_pending_timesheets_found_to_process'));
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/timesheets/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          timesheetIds: pendingTimesheets.map(t => t.id),
          action: action,
          notes: `${t('bulk_action_notes', { action: action.charAt(0).toUpperCase() + action.slice(1) })} ${t('all_pending_timesheets')}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process timesheets');
      }

      toast.success(data.message);
      setSelectedTimesheets(new Set());
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      console.error('🔍 ALL PENDING ACTION - Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process timesheets');
    } finally {
      setBulkActionLoading(false);
    }
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
          notes: bulkActionDialog.notes
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
    } catch (error) {
      console.error('🔍 BULK ACTION - Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process timesheets');
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
    const canProcess = ['pending', 'draft', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);
    if (!canProcess) {

      return false;
    }

    // Get user role from RBAC context
    const userRole = user?.role || 'USER';

    // For draft timesheets, check submission permissions
    if (timesheet.status === 'draft') {
      const canSubmit = ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);

      return canSubmit;
    }

    // Define approval workflow stages and who can approve at each stage
    // Include 'pending' as equivalent to 'submitted' for approval purposes
    const approvalWorkflow = {
      pending: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      submitted: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      checking_approved: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
    };

    const allowedRoles = approvalWorkflow[timesheet.status as keyof typeof approvalWorkflow];
    if (!allowedRoles) {

      return false;
    }

    const canApprove = allowedRoles.includes(userRole);

    return canApprove;
  };

  const canRejectTimesheet = (timesheet: Timesheet) => {
    // Check if timesheet is in a state that can be rejected
    // Include 'pending' status which is the default in database
    const canProcess = ['pending', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);
    if (!canProcess) return false;

    // Get user role from RBAC context
    const userRole = user?.role || 'USER';

    // Any role that can approve can also reject
    const approvalWorkflow = {
      pending: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      submitted: ['FOREMAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      checking_approved: ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
    };

    const allowedRoles = approvalWorkflow[timesheet.status as keyof typeof approvalWorkflow];
    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole);
  };

  const getNextApprovalStage = (currentStatus: string) => {
    const stageProgression = {
      draft: t('submit_for_approval'),
      submitted: t('foreman_approval'),
      foreman_approved: t('incharge_approval'),
      incharge_approved: t('checking_approval'),
      checking_approved: t('manager_approval'),
      manager_approved: t('completed')
    };

    return stageProgression[currentStatus as keyof typeof stageProgression] || 'Unknown';
  };

  const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.has(t.id)) || [];
  const canApproveSelected = selectedTimesheetsData.some(t => canApproveTimesheet(t));
  const canRejectSelected = selectedTimesheetsData.some(t => canRejectTimesheet(t));

  // Get user role from RBAC context
  const userRole = user?.role || 'USER';

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
  const monthOptions = useMemo(() => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const yearMonth = `${year}-${monthStr}`;
        const monthName = new Date(year, month - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
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
      case "draft":
        return <Badge variant="secondary">{t('draft')}</Badge>;
      case "submitted":
        return <Badge variant="default">{t('submitted')}</Badge>;
      case "foreman_approved":
        return <Badge className="bg-blue-100 text-blue-800">{t('foreman_approved')}</Badge>;
      case "incharge_approved":
        return <Badge className="bg-purple-100 text-purple-800">{t('incharge_approved')}</Badge>;
      case "checking_approved":
        return <Badge className="bg-orange-100 text-orange-800">{t('checking_approved')}</Badge>;
      case "manager_approved":
        return <Badge className="bg-green-100 text-green-800">{t('manager_approved')}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">{t('rejected')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading_timesheets')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">{t('timesheet_management')}</h1>
          {autoGenerating && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{t('auto_generating_timesheets')}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <PermissionContent action="export" subject="Timesheet">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('export')}
            </Button>
          </PermissionContent>

          <PermissionContent action="sync" subject="Timesheet">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('sync_timesheets')}
            </Button>
          </PermissionContent>

          <PermissionContent action="create" subject="Timesheet">
            <AutoGenerateButton isAutoGenerating={autoGenerating} />
          </PermissionContent>

          <PermissionContent action="create" subject="Timesheet">
            <Link href="/modules/timesheet-management/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('create_timesheet')}
              </Button>
            </Link>
          </PermissionContent>

          <PermissionContent action="read" subject="Timesheet">
            <Link href="/modules/timesheet-management/monthly">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {t('monthly_report')}
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
                  {selectedTimesheets.size} {t('timesheet_selected', { count: selectedTimesheets.size })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTimesheets(new Set())}
                >
                  {t('clear_selection')}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {canApproveSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('bulk_approve')}
                  </Button>
                )}
                {canRejectSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('reject')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('bulk_reject')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('bulk_delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('search_timesheets')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('filter_by_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_status')}</SelectItem>
              <SelectItem value="draft">{t('draft')}</SelectItem>
              <SelectItem value="submitted">{t('submitted')}</SelectItem>
              <SelectItem value="foreman_approved">{t('foreman_approved')}</SelectItem>
              <SelectItem value="incharge_approved">{t('incharge_approved')}</SelectItem>
              <SelectItem value="checking_approved">{t('checking_approved')}</SelectItem>
              <SelectItem value="manager_approved">{t('manager_approved')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('filter_by_assignment')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_assignments')}</SelectItem>
              {assignments.map(assignment => (
                <SelectItem key={assignment} value={assignment}>{assignment}</SelectItem>
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
              <SelectValue placeholder={t('filter_by_month')} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">{t('all_months')}</SelectItem>
              {monthOptions.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={option.value === currentMonth ? "bg-blue-50 font-medium" : ""}
                  ref={option.value === currentMonth ? currentMonthRef : null}
                >
                  {option.label}
                  {option.value === currentMonth && ` (${t('current_month')})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(currentMonth)}
            title={t('filter_by_current_month')}
          >
            {t('current_month')}
          </Button>
          <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder={t('page_size')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">{t('5_per_page')}</SelectItem>
              <SelectItem value="10">{t('10_per_page')}</SelectItem>
              <SelectItem value="20">{t('20_per_page')}</SelectItem>
              <SelectItem value="50">{t('50_per_page')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('timesheets')}</CardTitle>
              <CardDescription>
                {t('manage_employee_timesheets_and_approvals')}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {timesheets?.total || 0} {t('timesheets', { count: timesheets?.total || 0 })}
              </span>
              {totalPages > 1 && (
                <span className="text-sm text-gray-500">
                  {t('page')} {currentPage} {t('of')} {totalPages}
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
                    checked={selectedTimesheets.size === timesheets?.data.length && timesheets.data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('employee')}</TableHead>
                <TableHead>{t('assignment')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('hours')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('submitted')}</TableHead>
                <TableHead>{t('approved_by')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTimesheets.length > 0 ? (
                currentTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTimesheets.has(timesheet.id)}
                        onCheckedChange={(checked) => handleSelectTimesheet(timesheet.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {getTranslatedName(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, isRTL, translatedNames, setTranslatedNames).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">
                            {getTranslatedName(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, isRTL, translatedNames, setTranslatedNames)}
                          </div>
                          <div className="text-sm text-gray-500">{timesheet.employee.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {timesheet.assignment ? (
                        <div className="text-sm">
                          <div className="font-medium capitalize">{timesheet.assignment.type}</div>
                          <div className="text-muted-foreground">
                            {timesheet.assignment.name ||
                              (timesheet.project ? timesheet.project.name :
                                timesheet.rental ? timesheet.rental.rentalNumber : t('no_name'))}
                          </div>
                        </div>
                      ) : timesheet.project ? (
                        <div className="text-sm">
                          <div className="font-medium">{t('project')}</div>
                          <div className="text-muted-foreground">{timesheet.project.name}</div>
                        </div>
                      ) : timesheet.rental ? (
                        <div className="text-sm">
                          <div className="font-medium">{t('rental')}</div>
                          <div className="text-muted-foreground">{timesheet.rental.rentalNumber}</div>
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
                        <div>{convertToArabicNumerals(timesheet.hoursWorked.toString(), isRTL)}h</div>
                        {timesheet.overtimeHours > 0 && (
                          <div className="text-sm text-orange-600">
                            +{convertToArabicNumerals(timesheet.overtimeHours.toString(), isRTL)}h {t('overtime')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                    <TableCell>
                      {timesheet.submittedAt ? new Date(timesheet.submittedAt).toLocaleDateString() : t('not_submitted')}
                    </TableCell>
                    <TableCell>{timesheet.approvedBy || t('not_approved')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/modules/timesheet-management/${timesheet.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/modules/timesheet-management/${timesheet.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {timesheet.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" onClick={handleApprove}>
                              <Badge className="bg-green-100 text-green-800">{t('approve')}</Badge>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleReject}>
                              <Badge className="bg-red-100 text-red-800">{t('reject')}</Badge>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(timesheet)}
                          disabled={timesheet.status !== 'draft' && userRole !== 'ADMIN'}
                          title={timesheet.status !== 'draft' && userRole !== 'ADMIN' ? t('only_draft_timesheets_can_be_deleted_by_non_admin_users') : t('delete_timesheet')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-gray-500">
                      {t('no_timesheets_found')}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {bulkActionDialog.action === 'approve' ? t('bulk_approve_timesheets') : t('bulk_reject_timesheets')}
            </DialogTitle>
            <DialogDescription>
              {bulkActionDialog.action === 'approve'
                ? t('bulk_approve_description')
                : t('bulk_reject_description')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">{t('notes_optional')}</Label>
              <Textarea
                id="notes"
                placeholder={t('add_any_notes_about_this_action')}
                value={bulkActionDialog.notes}
                onChange={(e) => setBulkActionDialog(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Approval Workflow Information */}
            {bulkActionDialog.action === 'approve' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800 mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{t('approval_workflow')}</span>
                </div>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">{t('current_status_next_stage')}</p>
                      <div className="space-y-1 mt-1">
                        <p>• {t('draft')} → {t('submit_for_approval')}</p>
                        <p>• {t('submitted')} → {t('foreman_approval')}</p>
                        <p>• {t('foreman_approved')} → {t('incharge_approval')}</p>
                        <p>• {t('incharge_approved')} → {t('checking_approval')}</p>
                        <p>• {t('checking_approved')} → {t('manager_approval')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{t('required_roles')}</p>
                      <div className="space-y-1 mt-1">
                        <p>• {t('submit_draft')}: ADMIN, MANAGER</p>
                        <p>• {t('foreman')}: FOREMAN, MANAGER, ADMIN</p>
                        <p>• {t('incharge')}: INCHARGE, MANAGER, ADMIN</p>
                        <p>• {t('checking')}: CHECKING, MANAGER, ADMIN</p>
                        <p>• {t('manager')}: MANAGER, ADMIN</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{t('summary')}</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• {selectedTimesheets.size} {t('timesheet_selected', { count: selectedTimesheets.size })}</p>
                <p>• {t('action')}: {bulkActionDialog.action === 'approve' ? t('approve') : t('reject')}</p>
                {bulkActionDialog.action === 'approve' && (
                  <p>• {t('next_approval_stage')}: {getNextApprovalStage('pending')}</p>
                )}
                <p>• {t('employees')}:</p>
                <ul className="ml-4 space-y-1">
                  {selectedTimesheetsData.slice(0, 3).map(timesheet => (
                    <li key={timesheet.id} className="text-xs">
                      {getTranslatedName(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, isRTL, translatedNames, setTranslatedNames)} - {new Date(timesheet.date).toLocaleDateString()} - {convertToArabicNumerals(timesheet.hoursWorked.toString(), isRTL)}h
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
              {t('cancel')}
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={bulkActionLoading}
              className={bulkActionDialog.action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {bulkActionLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('processing')}...
                </>
              ) : (
                <>
                  {bulkActionDialog.action === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {bulkActionDialog.action === 'approve' ? t('approve') : t('reject')} {t('all')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('delete_timesheet')}</DialogTitle>
            <DialogDescription>
              {t('are_you_sure_you_want_to_delete_this_timesheet')}
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.timesheetData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">{t('employee')}:</span> {deleteDialog.timesheetData.employee.firstName} {deleteDialog.timesheetData.employee.lastName}
                </div>
                <div>
                  <span className="font-medium">{t('date')}:</span> {new Date(deleteDialog.timesheetData.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">{t('hours')}:</span> {deleteDialog.timesheetData.hoursWorked}h
                  {deleteDialog.timesheetData.overtimeHours > 0 && ` + ${deleteDialog.timesheetData.overtimeHours}h {t('ot')}`}
                </div>
                <div>
                  <span className="font-medium">{t('status')}:</span> {getStatusBadge(deleteDialog.timesheetData.status)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, timesheetId: null, timesheetData: null })}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
            >
              {t('delete_timesheet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog.open} onOpenChange={(open) => setBulkDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('delete_multiple_timesheets')}</DialogTitle>
            <DialogDescription>
              {t('are_you_sure_you_want_to_delete', { count: bulkDeleteDialog.timesheets.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="font-medium">{t('timesheets_to_be_deleted')}:</div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {bulkDeleteDialog.timesheets.map((timesheet) => (
                  <div key={timesheet.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <div className="font-medium">
                        {timesheet.employee.firstName} {timesheet.employee.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(timesheet.date).toLocaleDateString()} - {timesheet.hoursWorked}h
                        {timesheet.overtimeHours > 0 && ` + ${timesheet.overtimeHours}h {t('ot')}`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {timesheet.project?.name || timesheet.rental?.rentalNumber || t('no_project_rental')}
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
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={executeBulkDelete}
            >
              {t('delete', { count: bulkDeleteDialog.timesheets.length })} {t('timesheet_s')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        {/* Left side - Showing results info */}
        <div className="text-sm text-gray-600">
          {t('showing_results', { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, totalItems), total: totalItems })}
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
            &lt; {t('previous')}
          </Button>

          {/* Page numbers */}
          {(() => {
            const pages = [];
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

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
                  variant={currentPage === page ? "default" : "outline"}
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
            {t('next')} &gt;
          </Button>
        </div>
      </div>
      {/* Role-based content example */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{t('timesheet_administration')}</CardTitle>
            <CardDescription>
              {t('advanced_timesheet_management_features_for_supervisors_and_managers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => handleAllPendingAction('approve')}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {t('approve_all_pending')}
              </Button>

              <Button 
                variant="outline"
                onClick={() => handleAllPendingAction('reject')}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {t('reject_all_pending')}
              </Button>

              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                {t('timesheet_settings')}
              </Button>

              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                {t('generate_reports')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedRoute>
  );
}
