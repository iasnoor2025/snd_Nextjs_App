'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Save,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { ControllerRenderProps, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

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
}

// Form validation schema
const leaveRequestSchema = z.object({
  leave_type: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  days_requested: z.number().min(1, 'Days requested must be at least 1'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  status: z.string().min(1, 'Status is required'),
  comments: z.string().optional(),
  notify_employee: z.boolean(),
  send_approval_notification: z.boolean(),
});

type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;

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
              We encountered an error while loading the edit form.
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
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EditLeaveRequestPage() {
  const { t } = useI18n();
  const { hasPermission, user } = useRBAC();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
  const leaveId = params.id as string;

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type: '',
      start_date: '',
      end_date: '',
      days_requested: 0,
      reason: '',
      status: '',
      comments: '',
      notify_employee: false,
      send_approval_notification: false,
    },
  });

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

      const leaveRequestData = data.data;

      // Transform the API response to match our interface
      const transformedLeaveRequest: LeaveRequest = {
        id: leaveRequestData.id,
        employee_name: leaveRequestData.employee_name,
        employee_id: leaveRequestData.employee_id,
        employee_avatar: leaveRequestData.employee_avatar,
        leave_type: leaveRequestData.leave_type,
        start_date: leaveRequestData.start_date,
        end_date: leaveRequestData.end_date,
        days_requested: leaveRequestData.days_requested,
        reason: leaveRequestData.reason,
        status: leaveRequestData.status,
        submitted_date: leaveRequestData.submitted_date,
        approved_by: leaveRequestData.approved_by,
        approved_date: leaveRequestData.approved_date,
        comments: leaveRequestData.comments,
        created_at: leaveRequestData.created_at,
        updated_at: leaveRequestData.updated_at,
        department: leaveRequestData.department,
        position: leaveRequestData.position,
        total_leave_balance: leaveRequestData.total_leave_balance,
        leave_taken_this_year: leaveRequestData.leave_taken_this_year,
        attachments: leaveRequestData.attachments || [],
      };

      setLeaveRequest(transformedLeaveRequest);

      // Set form values
      form.reset({
        leave_type: transformedLeaveRequest.leave_type,
        start_date: transformedLeaveRequest.start_date,
        end_date: transformedLeaveRequest.end_date,
        days_requested: transformedLeaveRequest.days_requested,
        reason: transformedLeaveRequest.reason,
        status: transformedLeaveRequest.status,
        comments: transformedLeaveRequest.comments || '',
        notify_employee: false,
        send_approval_notification: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load leave request';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [leaveId, form]);

  useEffect(() => {
    if (leaveId) {
      fetchLeaveRequest();
    }
  }, [leaveId, fetchLeaveRequest]);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const calculateDays = useCallback(
    (startDate: string, endDate: string) => {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        form.setValue('days_requested', diffDays);
      }
    },
    [form]
  );

  const handleDateChange = useCallback(
    (field: 'start_date' | 'end_date', value: string) => {
      form.setValue(field, value);
      const startDate = field === 'start_date' ? value : form.getValues('start_date');
      const endDate = field === 'end_date' ? value : form.getValues('end_date');
      calculateDays(startDate, endDate);
    },
    [form, calculateDays]
  );

  const onSubmit = useCallback(
    async (data: any) => {
      if (!hasPermission('leave-requests.edit', 'leave-request')) {
        toast.error('You do not have permission to edit leave requests');
        return;
      }

      setSaving(true);
      try {
        // Validate business rules
        if (data.start_date > data.end_date) {
          toast.error('Start date cannot be after end date');
          return;
        }

        if (data.days_requested < 1) {
          toast.error('Days requested must be at least 1');
          return;
        }

        // Check leave balance
        const remainingBalance =
          (leaveRequest?.total_leave_balance || 0) - (leaveRequest?.leave_taken_this_year || 0);
        if (data.days_requested > remainingBalance) {
          toast.error(`Insufficient leave balance. Available: ${remainingBalance} days`);
          return;
        }

        // Send update request to API
        const response = await fetch(`/api/leave-by-id?id=${leaveId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leave_type: data.leave_type,
            start_date: data.start_date,
            end_date: data.end_date,
            days: data.days_requested,
            reason: data.reason,
            status: data.status,
            comments: data.comments,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update leave request');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to update leave request');
        }

        toast.success('Leave request updated successfully');
        setHasUnsavedChanges(false);
        router.push(`/${locale}/leave-management/${leaveId}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update leave request';
        toast.error(errorMessage);
      } finally {
        setSaving(false);
      }
    },
    [hasPermission, leaveRequest, leaveId, router, locale]
  );

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      router.push(`/${locale}/leave-management/${leaveId}`);
    }
  }, [hasUnsavedChanges, router, locale, leaveId]);

  const handleConfirmCancel = useCallback(() => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    router.push(`/${locale}/leave-management/${leaveId}`);
  }, [router, locale, leaveId]);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      Pending: {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
      },
      Approved: {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
      },
      Rejected: {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}. Please try refreshing the page or contact support if the problem persists.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={fetchLeaveRequest} variant="outline">
            Retry
          </Button>
          <Button onClick={() => router.push(`/${locale}/leave-management`)}>
            Back to Leave Management
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
          <h2 className="text-2xl font-bold">Leave Request Not Found</h2>
          <p className="text-muted-foreground">
            The leave request you're trying to edit doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push(`/${locale}/leave-management`)}>
            Back to Leave Management
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
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
                          <h1 className="text-3xl font-bold">{t('leave.edit_leave_request')}</h1>
            <p className="text-muted-foreground">ID: {leaveRequest.id}</p>
            </div>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('leave.unsaved_changes')}
            </Badge>
          )}
        </div>

        {/* Employee Information Banner */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={leaveRequest.employee_avatar} />
                <AvatarFallback>
                  {leaveRequest.employee_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">{leaveRequest.employee_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {leaveRequest.employee_id} • {leaveRequest.department} • {leaveRequest.position}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('leave.leave_balance')}</p>
                <p className="font-semibold">
                  {(leaveRequest.total_leave_balance || 0) -
                    (leaveRequest.leave_taken_this_year || 0)}{' '}
                  {t('leave.days_remaining')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leave Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t('leave.leave_details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leave_type"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<LeaveRequestFormData, 'leave_type'>;
                    }) => (
                      <FormItem>
                        <FormLabel>{t('leave.leave_type_required')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('leave.select_leave_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                            <SelectItem value="Personal Leave">Personal Leave</SelectItem>
                            <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                            <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                            <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                            <SelectItem value="Study Leave">Study Leave</SelectItem>
                            <SelectItem value="Bereavement Leave">Bereavement Leave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<LeaveRequestFormData, 'start_date'>;
                      }) => (
                        <FormItem>
                          <FormLabel>{t('leave.start_date_required')}</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              onChange={e => handleDateChange('start_date', e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<LeaveRequestFormData, 'end_date'>;
                      }) => (
                        <FormItem>
                          <FormLabel>{t('leave.end_date_required')}</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              onChange={e => handleDateChange('end_date', e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="days_requested"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<LeaveRequestFormData, 'days_requested'>;
                    }) => (
                      <FormItem>
                        <FormLabel>{t('leave.days_requested')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            min="1"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('leave.days_requested_description')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status and Approval */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('leave.status_approval')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<LeaveRequestFormData, 'status'>;
                    }) => (
                      <FormItem>
                        <FormLabel>{t('leave.status')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('leave.select_status')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notify_employee"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<LeaveRequestFormData, 'notify_employee'>;
                    }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t('leave.notify_employee')}</FormLabel>
                          <FormDescription>
                            {t('leave.notify_employee_description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="send_approval_notification"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<
                        LeaveRequestFormData,
                        'send_approval_notification'
                      >;
                    }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t('leave.send_approval_notification')}</FormLabel>
                          <FormDescription>
                            {t('leave.send_approval_notification_description')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Reason and Comments */}
            <Card>
              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('leave.reason_comments')}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<LeaveRequestFormData, 'reason'>;
                  }) => (
                    <FormItem>
                      <FormLabel>{t('leave.reason_for_leave')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('leave.provide_detailed_reason')}
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('leave.provide_detailed_reason')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({
                    field,
                  }: {
                    field: ControllerRenderProps<LeaveRequestFormData, 'comments'>;
                  }) => (
                    <FormItem>
                      <FormLabel>{t('leave.additional_comments')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('leave.additional_comments_placeholder')}
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('leave.additional_comments_description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                {t('leave.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? t('leave.saving_changes') : t('leave.save_changes')}
              </Button>
            </div>
          </div>
        </Form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Are you sure you want to leave? All changes will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Continue Editing
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                Discard Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default function EditLeaveRequestPageWrapper() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EditLeaveRequestPage />
    </Suspense>
  );
}
