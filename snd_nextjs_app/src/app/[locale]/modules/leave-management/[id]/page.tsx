'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  History,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Trash2,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_id: string;
  employee_avatar?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  submitted_date: string;
  approved_by: string | null;
  approved_date: string | null;
  return_date?: string | null;
  returned_by?: string | null;
  return_reason?: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  department?: string;
  position?: string;
  total_leave_balance?: number;
  leave_taken_this_year?: number;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  approval_history?: Array<{
    id: string;
    action: string;
    approver: string;
    date: string;
    comments: string;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<object>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">
              We encountered an error while loading the leave request details.
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LeaveRequestDetailPage() {
  const { t } = useI18n();
  const { hasPermission, user } = useRBAC();
  const params = useParams();
  const router = useRouter();
  const leaveId = params.id as string;

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  const fetchLeaveRequest = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leave-by-id?id=${leaveId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Leave request not found');
        } else if (response.status === 401) {
          throw new Error('Not authenticated');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load leave request');
      }

      setLeaveRequest(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leave request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leaveId]);

  useEffect(() => {
    if (leaveId) {
      fetchLeaveRequest();
    }
  }, [leaveId, fetchLeaveRequest]);

  const handleEdit = useCallback(() => {
    router.push(`/modules/leave-management/${leaveId}/edit`);
  }, [router, leaveId]);

  const handleDelete = useCallback(async () => {
    if (!leaveRequest) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/leave-by-id?id=${leaveId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete leave request');
      }

      toast.success(t('leave.leave_request_deleted_successfully'));
      router.push('/modules/leave-management');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('leave.failed_to_delete_leave_request');
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [leaveRequest, leaveId, router]);

  const handleApprove = useCallback(async () => {
    if (!leaveRequest) return;

    try {
      const response = await fetch(`/api/leave-requests/${leaveId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve leave request');
      }

      toast.success(t('leave.leave_request_approved_successfully'));
      // Refresh the leave request data
      await fetchLeaveRequest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('leave.failed_to_approve_leave_request');
      toast.error(errorMessage);
    }
  }, [leaveRequest, leaveId, fetchLeaveRequest]);

  const handleReject = useCallback(async () => {
    if (!leaveRequest) return;

    const reason = prompt(t('leave.please_provide_rejection_reason'));
    if (!reason) return;

    try {
      const response = await fetch(`/api/leave-requests/${leaveId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject leave request');
      }

      toast.success(t('leave.leave_request_rejected_successfully'));
      // Refresh the leave request data
      await fetchLeaveRequest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('leave.failed_to_reject_leave_request');
      toast.error(errorMessage);
    }
  }, [leaveRequest, leaveId, fetchLeaveRequest]);

  const handleReturn = useCallback(async () => {
    if (!leaveRequest || !returnDate || !returnReason) return;

    setReturning(true);
    try {
      const response = await fetch(`/api/leave-requests/${leaveId}/return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          return_date: returnDate,
          return_reason: returnReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to return employee');
      }

      toast.success(t('leave.employee_returned_successfully'));
      setShowReturnDialog(false);
      setReturnDate('');
      setReturnReason('');
      // Refresh the leave request data
      await fetchLeaveRequest();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('leave.failed_to_return_employee');
      toast.error(errorMessage);
    } finally {
      setReturning(false);
    }
  }, [leaveRequest, leaveId, returnDate, returnReason, fetchLeaveRequest]);

  const getStatusBadge = useCallback((status: string) => {
    // Normalize status to handle both uppercase and lowercase
    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const statusConfig = {
      Pending: {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        text: t('leave.pending'),
      },
      Approved: {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: t('leave.approved'),
      },
      Rejected: {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        text: t('leave.rejected'),
      },
      Returned: {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-800',
        text: t('leave.returned'),
      },
      Active: {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: t('leave.active'),
      },
    };

    const config =
      statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  }, [t]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const calculateLeaveProgress = useCallback(() => {
    if (!leaveRequest?.total_leave_balance || !leaveRequest?.leave_taken_this_year) return 0;
    return (leaveRequest.leave_taken_this_year / leaveRequest.total_leave_balance) * 100;
  }, [leaveRequest]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}. {t('leave.please_try_refreshing')}
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={fetchLeaveRequest} variant="outline">
            {t('leave.retry')}
          </Button>
          <Button onClick={() => router.push('/modules/leave-management')}>
            {t('leave.back_to_leave_management')}
          </Button>
        </div>
      </div>
    );
  }

  if (!leaveRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold">{t('leave.leave_request_not_found_title')}</h2>
          <p className="text-muted-foreground">
            {t('leave.leave_request_not_found_description')}
          </p>
          <Button onClick={() => router.push('/modules/leave-management')}>
            {t('leave.back_to_leave_management')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/modules/leave-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('leave.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('leave.leave_request_details')}</h1>
              <p className="text-muted-foreground">{t('leave.id')}: {leaveRequest.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('update', 'Leave') && (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                {t('leave.edit')}
              </Button>
            )}
            {hasPermission('update', 'Leave') && leaveRequest.status === 'approved' && (
              <Button onClick={() => setShowReturnDialog(true)} variant="outline">
                <User className="h-4 w-4 mr-2" />
                {t('leave.return_employee')}
              </Button>
            )}
            {hasPermission('delete', 'Leave') && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? t('leave.deleting') : t('leave.delete')}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  {t('leave.export_details')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('leave.share')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <History className="h-4 w-4 mr-2" />
                  {t('leave.view_history')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Banner */}
        {(() => {
          const normalizedStatus =
            leaveRequest.status.charAt(0).toUpperCase() +
            leaveRequest.status.slice(1).toLowerCase();
          return (
            <Alert
              className={`border-l-4 ${
                normalizedStatus === 'Approved'
                  ? 'border-green-500 bg-green-50'
                  : normalizedStatus === 'Rejected'
                    ? 'border-red-500 bg-red-50'
                    : 'border-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {normalizedStatus === 'Approved' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : normalizedStatus === 'Rejected' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">
                    {normalizedStatus === 'Approved'
                      ? t('leave.leave_request_approved')
                      : normalizedStatus === 'Rejected'
                        ? t('leave.leave_request_rejected')
                        : normalizedStatus === 'Pending'
                          ? t('leave.leave_request_pending_approval')
                          : `${t('leave.leave_request_details')} ${normalizedStatus}`}
                  </span>
                </div>
                {normalizedStatus === 'Pending' && hasPermission('approve', 'Leave') && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleApprove}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('leave.approve')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleReject}>
                      <XCircle className="h-4 w-4 mr-2" />
                      {t('leave.reject')}
                    </Button>
                  </div>
                )}
              </div>
            </Alert>
          );
        })()}

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('leave.overview')}</TabsTrigger>
            <TabsTrigger value="details">{t('leave.details')}</TabsTrigger>
            <TabsTrigger value="attachments">{t('leave.attachments')}</TabsTrigger>
            <TabsTrigger value="history">{t('leave.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Employee Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('leave.employee_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={leaveRequest.employee_avatar} />
                      <AvatarFallback>
                        {leaveRequest.employee_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{leaveRequest.employee_name}</p>
                      <p className="text-sm text-muted-foreground">{leaveRequest.employee_id}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.department')}</span>
                      <span className="text-sm font-medium">{leaveRequest.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.position')}</span>
                      <span className="text-sm font-medium">{leaveRequest.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.status')}</span>
                      {getStatusBadge(leaveRequest.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t('leave.leave_details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.leave_type')}</span>
                      <span className="text-sm font-medium">{leaveRequest.leave_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.days_requested')}</span>
                      <span className="text-sm font-medium">
                        {leaveRequest.days_requested} {t('leave.days')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.start_date')}</span>
                      <span className="text-sm font-medium">
                        {formatDate(leaveRequest.start_date)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.end_date')}</span>
                      <span className="text-sm font-medium">
                        {formatDate(leaveRequest.end_date)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {t('leave.leave_balance')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.total_balance')}</span>
                      <span className="text-sm font-medium">
                        {leaveRequest.total_leave_balance || 0} {t('leave.days')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.used_this_year')}</span>
                      <span className="text-sm font-medium">
                        {leaveRequest.leave_taken_this_year || 0} {t('leave.days')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.remaining')}</span>
                      <span className="text-sm font-medium">
                        {Math.max(
                          0,
                          (leaveRequest.total_leave_balance || 0) -
                            (leaveRequest.leave_taken_this_year || 0)
                        )}{' '}
                        {t('leave.days')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('leave.usage')}</span>
                        <span>{Math.round(calculateLeaveProgress())}%</span>
                      </div>
                      <Progress value={calculateLeaveProgress()} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('leave.reason_for_leave')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{leaveRequest.reason}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approval Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    {t('leave.approval_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.submitted_date')}</span>
                      <span className="text-sm font-medium">
                        {formatDateTime(leaveRequest.submitted_date)}
                      </span>
                    </div>
                    {leaveRequest.approved_by && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('leave.approved_by')}</span>
                        <span className="text-sm font-medium">{leaveRequest.approved_by}</span>
                      </div>
                    )}
                    {leaveRequest.approved_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('leave.approved_date')}</span>
                        <span className="text-sm font-medium">
                          {formatDateTime(leaveRequest.approved_date)}
                        </span>
                      </div>
                    )}
                    {leaveRequest.return_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('leave.return_date')}</span>
                        <span className="text-sm font-medium">
                          {formatDateTime(leaveRequest.return_date)}
                        </span>
                      </div>
                    )}
                    {leaveRequest.returned_by && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('leave.returned_by')}</span>
                        <span className="text-sm font-medium">{leaveRequest.returned_by}</span>
                      </div>
                    )}
                    {leaveRequest.return_reason && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t('leave.return_reason')}</span>
                        <span className="text-sm font-medium">{leaveRequest.return_reason}</span>
                      </div>
                    )}
                    {leaveRequest.comments && (
                      <div className="pt-2 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium mb-1">{t('leave.comments')}</p>
                            <p className="text-sm text-muted-foreground">{leaveRequest.comments}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t('leave.system_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.created')}</span>
                      <span className="text-sm font-medium">
                        {formatDateTime(leaveRequest.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.last_updated')}</span>
                      <span className="text-sm font-medium">
                        {formatDateTime(leaveRequest.updated_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('leave.request_id')}</span>
                      <span className="text-sm font-medium font-mono">{leaveRequest.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('leave.attachments')}</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequest.attachments && leaveRequest.attachments.length > 0 ? (
                  <div className="space-y-3">
                    {leaveRequest.attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-sm text-muted-foreground">{attachment.type}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          {t('leave.download')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('leave.no_attachments_uploaded')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('leave.approval_history')}</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRequest.approval_history && leaveRequest.approval_history.length > 0 ? (
                  <div className="space-y-4">
                    {leaveRequest.approval_history.map(history => (
                      <div
                        key={history.id}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium">{history.action}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(history.date)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">by {history.approver}</p>
                          {history.comments && <p className="text-sm mt-2">{history.comments}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('leave.no_approval_history_available')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('leave.delete_leave_request_title')}
        description={t('leave.delete_leave_request_description')}
        confirmText={t('leave.delete_leave_request_confirm')}
        cancelText={t('leave.delete_leave_request_cancel')}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('leave.return_employee')}</DialogTitle>
            <DialogDescription>{t('leave.return_employee_description')}</DialogDescription>
          </DialogHeader>
                     <div className="space-y-4">
             <div>
               <label className="text-sm font-medium">{t('leave.return_date_required')}</label>
               <input
                 type="date"
                 value={returnDate}
                 onChange={(e) => setReturnDate(e.target.value)}
                 className="w-full mt-1 p-2 border rounded-md"
                 min={leaveRequest?.start_date}
               />
               <p className="text-xs text-gray-500 mt-1">
                 {t('leave.return_date_will_be_end_date')}
               </p>
             </div>
            <div>
              <label className="text-sm font-medium">{t('leave.return_reason_required')}</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                placeholder={t('leave.return_reason_placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReturnDialog(false);
                setReturnDate('');
                setReturnReason('');
              }}
            >
              {t('leave.cancel')}
            </Button>
            <Button
              onClick={handleReturn}
              disabled={returning || !returnDate || !returnReason}
            >
              {returning ? t('leave.submitting') : t('leave.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}

export default function LeaveRequestDetailPageWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LeaveRequestDetailPage />
    </Suspense>
  );
}
