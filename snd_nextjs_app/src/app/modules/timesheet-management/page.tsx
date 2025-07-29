"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
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
  Users
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Pagination,
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
import { ProtectedRoute as OriginalProtectedRoute } from "@/components/protected-route";

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
  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <TimesheetManagementContent />
    </ProtectedRoute>
  );
}

function TimesheetManagementContent() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [timesheets, setTimesheets] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${monthStr}`;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([]);
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

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(projectFilter && projectFilter !== 'all' && { project: projectFilter }),
        ...(month && month !== 'all' && { month }),
      });

      const response = await fetch(`/api/timesheets?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets');
      }

      const data = await response.json();
      setTimesheets(data);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [searchTerm, statusFilter, projectFilter, month, currentPage]);

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
      toast.error('Only draft timesheets can be deleted by non-admin users');
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete timesheet');
      }

      toast.success('Timesheet deleted successfully');
      setDeleteDialog({ open: false, timesheetId: null, timesheetData: null });
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete timesheet');
    }
  };

    const handleBulkDelete = () => {
    const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.includes(t.id)) || [];

    // Get user role from session or context
    const userRole = 'USER' as string; // This should come from your auth context/session

    const draftTimesheets = selectedTimesheetsData.filter(t => t.status === 'draft');
    const nonDraftTimesheets = selectedTimesheetsData.filter(t => t.status !== 'draft');

    // Only admin can delete non-draft timesheets
    if (nonDraftTimesheets.length > 0 && userRole !== 'ADMIN') {
      toast.error(`Cannot delete ${nonDraftTimesheets.length} timesheet(s) - only draft timesheets can be deleted by non-admin users`);
      return;
    }

    if (draftTimesheets.length === 0 && userRole !== 'ADMIN') {
      toast.error('No draft timesheets selected for deletion');
      return;
    }

    if (selectedTimesheetsData.length === 0) {
      toast.error('No timesheets selected for deletion');
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
        body: JSON.stringify({
          timesheetIds: bulkDeleteDialog.timesheets.map(t => t.id)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete timesheets');
      }

      toast.success(data.message);
      setSelectedTimesheets([]);
      setBulkDeleteDialog({ open: false, timesheets: [] });
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete timesheets');
    }
  };

  const handleApprove = async () => {
    // Implementation for individual approve functionality
    toast.info('Individual approve functionality to be implemented');
  };

  const handleReject = async () => {
    // Implementation for individual reject functionality
    toast.info('Individual reject functionality to be implemented');
  };



  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTimesheets.length === 0) {
      toast.error('Please select timesheets to process');
      return;
    }

    setBulkActionDialog({
      open: true,
      action,
      notes: ''
    });
  };

  const executeBulkAction = async () => {
    if (!bulkActionDialog.action || selectedTimesheets.length === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/timesheets/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timesheetIds: selectedTimesheets,
          action: bulkActionDialog.action,
          notes: bulkActionDialog.notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process timesheets');
      }

      toast.success(data.message);
      setSelectedTimesheets([]);
      setBulkActionDialog({ open: false, action: null, notes: '' });
      fetchTimesheets(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process timesheets');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(timesheets?.data.map(t => t.id) || []);
    } else {
      setSelectedTimesheets([]);
    }
  };

  const handleSelectTimesheet = (timesheetId: string, checked: boolean) => {
    if (checked) {
      setSelectedTimesheets(prev => [...prev, timesheetId]);
    } else {
      setSelectedTimesheets(prev => prev.filter(id => id !== timesheetId));
    }
  };

  const canApproveTimesheet = (timesheet: Timesheet) => {
    // Check if timesheet is in a state that can be approved
    const canProcess = ['draft', 'submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);
    if (!canProcess) return false;

    // For draft timesheets, check submission permissions
    if (timesheet.status === 'draft') {
      // For now, we'll use a simple role check - in a real app, you'd get the user's role from session
      const userRole = 'ADMIN'; // This should come from your auth context
      return ['ADMIN', 'MANAGER'].includes(userRole);
    }

    // Define approval workflow stages and who can approve at each stage
    const approvalWorkflow = {
      submitted: ['FOREMAN', 'MANAGER', 'ADMIN'],
      foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN'],
      incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN'],
      checking_approved: ['MANAGER', 'ADMIN']
    };

    const allowedRoles = approvalWorkflow[timesheet.status as keyof typeof approvalWorkflow];
    if (!allowedRoles) return false;

    // For now, we'll use a simple role check - in a real app, you'd get the user's role from session
    const userRole = 'ADMIN'; // This should come from your auth context
    return allowedRoles.includes(userRole);
  };

  const canRejectTimesheet = (timesheet: Timesheet) => {
    // Check if timesheet is in a state that can be rejected
    const canProcess = ['submitted', 'foreman_approved', 'incharge_approved', 'checking_approved'].includes(timesheet.status);
    if (!canProcess) return false;

    // Any role that can approve can also reject
    const approvalWorkflow = {
      submitted: ['FOREMAN', 'MANAGER', 'ADMIN'],
      foreman_approved: ['INCHARGE', 'MANAGER', 'ADMIN'],
      incharge_approved: ['CHECKING', 'MANAGER', 'ADMIN'],
      checking_approved: ['MANAGER', 'ADMIN']
    };

    const allowedRoles = approvalWorkflow[timesheet.status as keyof typeof approvalWorkflow];
    if (!allowedRoles) return false;

    // For now, we'll use a simple role check - in a real app, you'd get the user's role from session
    const userRole = 'ADMIN'; // This should come from your auth context
    return allowedRoles.includes(userRole);
  };

  const getNextApprovalStage = (currentStatus: string) => {
    const stageProgression = {
      draft: 'Submit for Approval',
      submitted: 'Foreman Approval',
      foreman_approved: 'Incharge Approval',
      incharge_approved: 'Checking Approval',
      checking_approved: 'Manager Approval',
      manager_approved: 'Completed'
    };

    return stageProgression[currentStatus as keyof typeof stageProgression] || 'Unknown';
  };

  const selectedTimesheetsData = timesheets?.data.filter(t => selectedTimesheets.includes(t.id)) || [];
  const canApproveSelected = selectedTimesheetsData.some(t => canApproveTimesheet(t));
  const canRejectSelected = selectedTimesheetsData.some(t => canRejectTimesheet(t));

  // Get user role from session or context
  const userRole = 'USER' as string; // This should come from your auth context/session

  // Extract unique projects for filter
  const projects = useMemo(() => {
    if (!timesheets?.data) return [];
    const projectSet = new Set<string>();
    timesheets.data.forEach(timesheet => {
      if (timesheet.project?.name) {
        projectSet.add(timesheet.project.name);
      }
    });
    return Array.from(projectSet).sort();
  }, [timesheets?.data]);

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
        return <Badge variant="secondary">Draft</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      case "foreman_approved":
        return <Badge className="bg-blue-100 text-blue-800">Foreman Approved</Badge>;
      case "incharge_approved":
        return <Badge className="bg-purple-100 text-purple-800">Incharge Approved</Badge>;
      case "checking_approved":
        return <Badge className="bg-orange-100 text-orange-800">Checking Approved</Badge>;
      case "manager_approved":
        return <Badge className="bg-green-100 text-green-800">Manager Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading timesheets...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Timesheet Management</h1>
          <div className="flex space-x-2">
            <Can action="export" subject="Timesheet">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </Can>

            <Can action="sync" subject="Timesheet">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Timesheets
              </Button>
            </Can>

            <Can action="create" subject="Timesheet">
              <Link href="/modules/timesheet-management/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Timesheet
                </Button>
              </Link>
            </Can>
          </div>
        </div>

      {/* Bulk Actions */}
      {selectedTimesheets.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedTimesheets.length} timesheet(s) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTimesheets([])}
                >
                  Clear Selection
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
                    Bulk Approve
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
                    Bulk Reject
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Bulk Delete
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
                placeholder="Search timesheets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="foreman_approved">Foreman Approved</SelectItem>
              <SelectItem value="incharge_approved">Incharge Approved</SelectItem>
              <SelectItem value="checking_approved">Checking Approved</SelectItem>
              <SelectItem value="manager_approved">Manager Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
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
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
                        <SelectContent className="max-h-60">
              <SelectItem value="all">All Months</SelectItem>
              {monthOptions.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={option.value === currentMonth ? "bg-blue-50 font-medium" : ""}
                  ref={option.value === currentMonth ? currentMonthRef : null}
                >
                  {option.label}
                  {option.value === currentMonth && " (Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timesheets</CardTitle>
              <CardDescription>
                Manage employee timesheets and approvals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {timesheets?.total || 0} timesheets
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTimesheets.length === timesheets?.data.length && timesheets.data.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets?.data.map((timesheet) => (
                <TableRow key={timesheet.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTimesheets.includes(timesheet.id)}
                      onCheckedChange={(checked) => handleSelectTimesheet(timesheet.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {timesheet.employee.firstName} {timesheet.employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {timesheet.employee.employeeId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {timesheet.project ? (
                      <div className="text-sm">
                        <div className="font-medium">Project</div>
                        <div className="text-muted-foreground">{timesheet.project.name}</div>
                      </div>
                    ) : timesheet.rental ? (
                      <div className="text-sm">
                        <div className="font-medium">Rental</div>
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
                      <div>{timesheet.hoursWorked}h</div>
                      {timesheet.overtimeHours > 0 && (
                        <div className="text-sm text-muted-foreground">
                          +{timesheet.overtimeHours}h OT
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                  <TableCell>
                    {timesheet.submittedAt ? new Date(timesheet.submittedAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>{timesheet.approvedBy || "-"}</TableCell>
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
                            <Badge className="bg-green-100 text-green-800">Approve</Badge>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={handleReject}>
                            <Badge className="bg-red-100 text-red-800">Reject</Badge>
                          </Button>
                        </>
                      )}
                                                                  <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(timesheet)}
                        disabled={timesheet.status !== 'draft' && userRole !== 'ADMIN'}
                        title={timesheet.status !== 'draft' && userRole !== 'ADMIN' ? 'Only draft timesheets can be deleted by non-admin users' : 'Delete timesheet'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkActionDialog.action === 'approve' ? 'Approve' : 'Reject'} Timesheets
            </DialogTitle>
            <DialogDescription>
              {bulkActionDialog.action === 'approve'
                ? 'Approve the selected timesheets according to the approval workflow. Each timesheet will move to the next approval stage based on its current status.'
                : 'Reject the selected timesheets. They will be marked as rejected and returned to draft status.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this action..."
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
                  <span className="font-medium">Approval Workflow</span>
                </div>
                <div className="text-sm text-blue-700 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Current Status → Next Stage</p>
                      <div className="space-y-1 mt-1">
                        <p>• Draft → Submit for Approval</p>
                        <p>• Submitted → Foreman Approval</p>
                        <p>• Foreman Approved → Incharge Approval</p>
                        <p>• Incharge Approved → Checking Approval</p>
                        <p>• Checking Approved → Manager Approval</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Required Roles</p>
                      <div className="space-y-1 mt-1">
                        <p>• Submit Draft: ADMIN, MANAGER</p>
                        <p>• Foreman: FOREMAN, MANAGER, ADMIN</p>
                        <p>• Incharge: INCHARGE, MANAGER, ADMIN</p>
                        <p>• Checking: CHECKING, MANAGER, ADMIN</p>
                        <p>• Manager: MANAGER, ADMIN</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Summary</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>• {selectedTimesheets.length} timesheet(s) selected</p>
                <p>• Action: {bulkActionDialog.action === 'approve' ? 'Approve' : 'Reject'}</p>
                {bulkActionDialog.action === 'approve' && (
                  <div>
                    <p>• Workflow: Following approval stages</p>
                    {selectedTimesheetsData.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Status Breakdown:</p>
                        <div className="space-y-1 mt-1">
                          {Object.entries(
                            selectedTimesheetsData.reduce((acc, t) => {
                              acc[t.status] = (acc[t.status] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([status, count]) => (
                            <p key={status}>• {status}: {count} timesheet(s)</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {bulkActionDialog.notes && (
                  <p>• Notes: {bulkActionDialog.notes}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog({ open: false, action: null, notes: '' })}
            >
              Cancel
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
                  Processing...
                </>
              ) : (
                <>
                  {bulkActionDialog.action === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {bulkActionDialog.action === 'approve' ? 'Approve' : 'Reject'} All
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
            <DialogTitle>Delete Timesheet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this timesheet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog.timesheetData && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Employee:</span> {deleteDialog.timesheetData.employee.firstName} {deleteDialog.timesheetData.employee.lastName}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {new Date(deleteDialog.timesheetData.date).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Hours:</span> {deleteDialog.timesheetData.hoursWorked}h
                  {deleteDialog.timesheetData.overtimeHours > 0 && ` + ${deleteDialog.timesheetData.overtimeHours}h OT`}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(deleteDialog.timesheetData.status)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, timesheetId: null, timesheetData: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
            >
              Delete Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialog.open} onOpenChange={(open) => setBulkDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delete Multiple Timesheets</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {bulkDeleteDialog.timesheets.length} timesheet(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="font-medium">Timesheets to be deleted:</div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {bulkDeleteDialog.timesheets.map((timesheet) => (
                  <div key={timesheet.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <div className="font-medium">
                        {timesheet.employee.firstName} {timesheet.employee.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(timesheet.date).toLocaleDateString()} - {timesheet.hoursWorked}h
                        {timesheet.overtimeHours > 0 && ` + ${timesheet.overtimeHours}h OT`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {timesheet.project?.name || timesheet.rental?.rentalNumber || 'No project/rental'}
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeBulkDelete}
            >
              Delete {bulkDeleteDialog.timesheets.length} Timesheet(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {timesheets && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            {timesheets.prev_page_url && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(timesheets.current_page - 1);
                  }}
                />
              </PaginationItem>
            )}
            {Array.from({ length: timesheets.last_page }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                  isActive={page === timesheets.current_page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            {timesheets.next_page_url && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(timesheets.current_page + 1);
                  }}
                />
              </PaginationItem>
            )}
          </Pagination>
        </div>
      )}

      {/* Role-based content example */}
      <RoleBased roles={['ADMIN', 'MANAGER', 'SUPERVISOR']}>
        <Card>
          <CardHeader>
            <CardTitle>Timesheet Administration</CardTitle>
            <CardDescription>
              Advanced timesheet management features for supervisors and managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Can action="approve" subject="Timesheet">
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All Pending
                </Button>
              </Can>

              <Can action="reject" subject="Timesheet">
                <Button variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject All Pending
                </Button>
              </Can>

              <Can action="manage" subject="Timesheet">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Timesheet Settings
                </Button>
              </Can>

              <Can action="export" subject="Timesheet">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>
      </RoleBased>
    </div>
  </ProtectedRoute>
  );
}
