'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
import { PermissionContent, RoleContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// i18n refactor: All user-facing strings now use useTranslation('leave')
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useI18n } from '@/hooks/use-i18n';
import { getTranslatedName } from '@/lib/translation-utils';

interface LeaveRequest {
  id: string;
  employee_name: string;
  employee_id: string;
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
}

interface LeaveRequestResponse {
  data: LeaveRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function LeaveManagementPage() {
  const { t } = useI18n();
  const { isRTL } = useI18n();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [leaveType, setLeaveType] = useState('all');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [translatedNames, setTranslatedNames] = useState<{ [key: string]: string }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Get allowed actions for leave management
  const allowedActions = getAllowedActions('Leave');

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: perPage.toString(),
      });

      if (status !== 'all') {
        params.append('status', status);
      }

      if (leaveType !== 'all') {
        params.append('leaveType', leaveType);
      }

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/leave-requests/public?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();

      if (data.success) {
        // Transform the API response to match our expected format
        const transformedData: LeaveRequestResponse = {
          data: data.leaves.map((leave: any) => ({
            id: leave.id.toString(),
            employee_name: leave.employee.name,
            employee_id: leave.employee.employee_id,
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            days_requested: leave.days,
            reason: leave.reason || '',
            status: leave.status,
            submitted_date: leave.created_at,
            approved_by: null, // Not available in current API
            approved_date: null, // Not available in current API
            comments: null, // Not available in current API
            created_at: leave.created_at,
            updated_at: leave.updated_at,
          })),
          current_page: data.page,
          last_page: Math.ceil(data.total / data.limit),
          per_page: data.limit,
          total: data.total,
          next_page_url:
            data.page < Math.ceil(data.total / data.limit)
              ? `/api/employees/leaves?page=${data.page + 1}`
              : null,
          prev_page_url: data.page > 1 ? `/api/employees/leaves?page=${data.page - 1}` : null,
        };

        setLeaveRequests(transformedData);
      } else {
        throw new Error(data.message || 'Failed to fetch leave requests');
      }
    } catch (error) {
      
      toast.error(t('error_fetching_leave_requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [search, status, leaveType, perPage, currentPage]);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/leave-requests/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(t('leave_request_deleted_successfully'));
        fetchLeaveRequests(); // Refresh the data
      } else {
        throw new Error('Failed to delete leave request');
      }
    } catch (error) {
      
      toast.error(t('error_deleting_leave_request'));
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(t('leave_request_approved_successfully'));
        fetchLeaveRequests(); // Refresh the data
      } else {
        throw new Error('Failed to approve leave request');
      }
    } catch (error) {
      
      toast.error(t('error_approving_leave_request'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: 'Rejected by manager',
        }),
      });

      if (response.ok) {
        toast.success(t('leave_request_rejected'));
        fetchLeaveRequests(); // Refresh the data
      } else {
        throw new Error('Failed to reject leave request');
      }
    } catch (error) {
      
      toast.error(t('error_rejecting_leave_request'));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge
        className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
      >
        {status}
      </Badge>
    );
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeColors = {
      'Annual Leave': 'bg-blue-100 text-blue-800',
      'Sick Leave': 'bg-red-100 text-red-800',
      'Personal Leave': 'bg-purple-100 text-purple-800',
      'Maternity Leave': 'bg-pink-100 text-pink-800',
      'Study Leave': 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={typeColors[type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('loading_leave_requests')}</div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Leave' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t('leave_management')}</h1>
          </div>
          <PermissionContent action="create" subject="Leave">
            <Link href="/modules/leave-management/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('request_leave')}
              </Button>
            </Link>
          </PermissionContent>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('leave_requests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder={t('search_leave_requests')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_status')}</SelectItem>
                    <SelectItem value="Pending">{t('pending')}</SelectItem>
                    <SelectItem value="Approved">{t('approved')}</SelectItem>
                    <SelectItem value="Rejected">{t('rejected')}</SelectItem>
                    <SelectItem value="Cancelled">{t('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_types')}</SelectItem>
                    <SelectItem value="Annual Leave">{t('annual_leave')}</SelectItem>
                    <SelectItem value="Sick Leave">{t('sick_leave')}</SelectItem>
                    <SelectItem value="Personal Leave">{t('personal_leave')}</SelectItem>
                    <SelectItem value="Maternity Leave">{t('maternity_leave')}</SelectItem>
                    <SelectItem value="Study Leave">{t('study_leave')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employee')}</TableHead>
                    <TableHead>{t('leave_type')}</TableHead>
                    <TableHead>{t('dates')}</TableHead>
                    <TableHead>{t('days')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('submitted')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          <span className="ml-2">{t('loading')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : leaveRequests?.data && leaveRequests.data.length > 0 ? (
                    leaveRequests.data.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {getTranslatedName(
                                request.employee_name,
                                isRTL,
                                translatedNames,
                                setTranslatedNames
                              ) || request.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">{request.employee_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getLeaveTypeBadge(request.leave_type)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {formatDate(request.start_date)} - {formatDate(request.end_date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.days_requested} {t('days')}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.submitted_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <PermissionContent action="read" subject="Leave">
                              <Link href={`/modules/leave-management/${request.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </PermissionContent>
                            {(request.status === 'Pending' || request.status === 'pending') && (
                              <>
                                <PermissionContent action="approve" subject="Leave">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </PermissionContent>
                                <PermissionContent action="reject" subject="Leave">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReject(request.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </PermissionContent>
                              </>
                            )}
                            <PermissionContent action="update" subject="Leave">
                              <Link href={`/modules/leave-management/${request.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </PermissionContent>
                            <PermissionContent action="delete" subject="Leave">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(request.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionContent>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-gray-500">{t('no_leave_requests_found')}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {t('no_leave_requests_description')}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {leaveRequests && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  {leaveRequests.total > 0
                    ? t('showing_results', {
                        start: (leaveRequests.current_page - 1) * leaveRequests.per_page + 1,
                        end: Math.min(
                          leaveRequests.current_page * leaveRequests.per_page,
                          leaveRequests.total
                        ),
                        total: leaveRequests.total,
                      })
                    : t('no_results_found')}
                </div>
                {leaveRequests.last_page > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, leaveRequests.current_page - 1))}
                      disabled={leaveRequests.current_page === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t('previous')}
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {leaveRequests.current_page > 2 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                          >
                            1
                          </Button>
                          {leaveRequests.current_page > 3 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                        </>
                      )}

                      {/* Current page and surrounding pages */}
                      {(() => {
                        const pages: number[] = [];
                        const startPage = Math.max(1, leaveRequests.current_page - 1);
                        const endPage = Math.min(
                          leaveRequests.last_page,
                          leaveRequests.current_page + 1
                        );

                        for (let page = startPage; page <= endPage; page++) {
                          pages.push(page);
                        }

                        return pages.map(page => (
                          <Button
                            key={page}
                            variant={leaveRequests.current_page === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ));
                      })()}

                      {/* Last page */}
                      {leaveRequests.current_page < leaveRequests.last_page - 1 && (
                        <>
                          {leaveRequests.current_page < leaveRequests.last_page - 2 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(leaveRequests.last_page)}
                            className="w-8 h-8 p-0"
                          >
                            {leaveRequests.last_page}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(
                          Math.min(leaveRequests.last_page, leaveRequests.current_page + 1)
                        )
                      }
                      disabled={leaveRequests.current_page === leaveRequests.last_page}
                    >
                      {t('next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-based content for HR managers and administrators */}
        <RoleContent role="ADMIN">
          <Card>
            <CardHeader>
              <CardTitle>{t('leave_administration')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="manage" subject="Leave">
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('approve_all_pending')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Leave">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('leave_settings')}
                  </Button>
                </PermissionContent>
                <PermissionContent action="manage" subject="Leave">
                  <Button variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    {t('leave_policies')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </RoleContent>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={t('delete_leave_request')}
        description={t('confirm_delete_leave_request')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </ProtectedRoute>
  );
}
