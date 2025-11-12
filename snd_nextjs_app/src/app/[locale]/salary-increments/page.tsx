'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  salaryIncrementService,
  type SalaryIncrement,
  type SalaryIncrementFilters,
  type SalaryIncrementStatistics,
} from '@/lib/services/salary-increment-service';
import { format } from 'date-fns';
import { BarChart3, Check, Edit, Eye, Filter, Play, Plus, Trash2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter , useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';

export default function SalaryIncrementsPage() {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [increments, setIncrements] = useState<SalaryIncrement[]>([]);
  const [statistics, setStatistics] = useState<SalaryIncrementStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SalaryIncrementFilters>({
    page: 1,
    limit: 15,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState<SalaryIncrement | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [incrementToDelete, setIncrementToDelete] = useState<SalaryIncrement | null>(null);

  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const { hasPermission } = useRBAC();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    loadData();
  }, [filters, session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Debug: Log user session information

      const [incrementsResponse, statsResponse] = await Promise.all([
        salaryIncrementService.getSalaryIncrements(filters),
        salaryIncrementService.getStatistics(),
      ]);

      setIncrements(incrementsResponse?.data || []);
      setPagination(incrementsResponse?.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
      setStatistics(statsResponse);
    } catch (error) {

      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        toast.error(t('common.salaryIncrements.pleaseLogIn'));
        router.push('/login');
        return;
      }

      // Check if it's a permission error
      if (error instanceof Error && error.message.includes('403')) {
        toast.error(t('common.salaryIncrements.permissionDenied'));
        // Set empty data instead of crashing
        setIncrements([]);
        setPagination({ page: 1, limit: 15, total: 0, pages: 0 });
        setStatistics(null);
        return;
      }

              toast.error(t('common.salaryIncrements.failedToLoad'));
      // Set default values on error
      setIncrements([]);
      setPagination({ page: 1, limit: 15, total: 0, pages: 0 });
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SalaryIncrementFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleApprove = async (increment: SalaryIncrement) => {
    try {
      await salaryIncrementService.approveSalaryIncrement(increment.id, approvalNotes);
      toast.success('Salary increment approved successfully');
      setApprovalNotes('');
      loadData();
    } catch (error) {
      
      toast.error('Failed to approve salary increment');
    }
  };

  const handleReject = async (increment: SalaryIncrement) => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await salaryIncrementService.rejectSalaryIncrement(increment.id, rejectionReason);
      toast.success('Salary increment rejected successfully');
      setRejectionReason('');
      setShowRejectDialog(false);
      loadData();
    } catch (error) {
      
      toast.error('Failed to reject salary increment');
    }
  };

  const handleApply = async (increment: SalaryIncrement) => {
    try {
      await salaryIncrementService.applySalaryIncrement(increment.id);
      toast.success('Salary increment applied successfully');
      loadData();
    } catch (error) {
      
      toast.error('Failed to apply salary increment');
    }
  };

  const handleDelete = async (increment: SalaryIncrement) => {
    try {
      await salaryIncrementService.deleteSalaryIncrement(increment.id);
      const successMessage = increment.status === 'applied'
        ? 'Applied salary increment deleted and employee salary reverted successfully'
        : 'Salary increment deleted successfully';
      toast.success(successMessage);
      loadData();
      setShowDeleteDialog(false);
      setIncrementToDelete(null);
    } catch (error) {
      console.error('Error deleting salary increment:', error);
      toast.error('Failed to delete salary increment');
    }
  };

  const canApprove = (increment: SalaryIncrement) => {
    // Use permission-based check instead of hardcoded roles
    return hasPermission('approve', 'SalaryIncrement');
  };

  const canReject = (increment: SalaryIncrement) => {
    // Use permission-based check instead of hardcoded roles
    return hasPermission('reject', 'SalaryIncrement');
  };

  const canApply = (increment: SalaryIncrement) => {
    // Use permission-based check instead of hardcoded roles
    return hasPermission('apply', 'SalaryIncrement');
  };

  const canDelete = (increment: SalaryIncrement) => {
    // Use permission-based check instead of hardcoded roles
    return hasPermission('delete', 'SalaryIncrement');
  };

  const canEdit = (increment: SalaryIncrement) => {
    // Use permission-based check instead of hardcoded roles
    return hasPermission('update', 'SalaryIncrement');
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return null; // Will redirect to login
  }

  // Check if user has basic access to salary increments
  if (!hasPermission('read', 'SalaryIncrement')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">{t('common.salaryIncrements.accessRestricted')}</h1>
          <p className="text-muted-foreground mb-4">
            {t('common.salaryIncrements.permissionDenied')}
          </p>
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p>
              <strong>{t('common.salaryIncrements.currentRole')}</strong> {session?.user?.role || 'Unknown'}
            </p>
            <p>
              <strong>{t('common.salaryIncrements.userId')}</strong> {session?.user?.id}
            </p>
          </div>
          <Button onClick={() => router.push('/')} className="mt-4" variant="outline">
            {t('common.salaryIncrements.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salary Increments</h1>
        <Button onClick={() => router.push(`/${locale}/salary-increments/create`)}>
          <Plus className="w-4 h-4 mr-2" />
          New Increment
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Increments</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_increments}</div>
              </CardContent>
            </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Badge variant="secondary">{statistics.pending_increments}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.pending_increments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <Badge variant="secondary">{statistics.applied_increments}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.applied_increments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Badge variant="secondary">{statistics.approved_increments}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statistics.approved_increments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Badge variant="secondary">{statistics.rejected_increments}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statistics.rejected_increments}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                SAR {statistics.total_increment_amount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={value => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="increment_type">Type</Label>
                <Select
                  value={filters.increment_type || ''}
                  onValueChange={value => handleFilterChange('increment_type', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="annual_review">Annual Review</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="market_adjustment">Market Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="effective_date_from">Effective Date From</Label>
                <Input
                  type="date"
                  value={filters.effective_date_from || ''}
                  onChange={e =>
                    handleFilterChange('effective_date_from', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Increments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !increments || increments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No salary increments found. Create your first increment to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Current Salary</TableHead>
                    <TableHead>New Salary</TableHead>
                    <TableHead>Increment</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {increments?.map(increment => (
                    <TableRow key={increment.id}>
                      <TableCell>
                        {increment.employee?.first_name} {increment.employee?.last_name}
                        <div className="text-sm text-muted-foreground">
                          {increment.employee?.employee_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        {salaryIncrementService.getIncrementTypeLabel(increment.increment_type)}
                      </TableCell>
                      <TableCell>
                        SAR{' '}
                        {salaryIncrementService.getCurrentTotalSalary(increment).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        SAR {salaryIncrementService.getNewTotalSalary(increment).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {increment.increment_type === 'percentage' &&
                            increment.increment_percentage && (
                              <div>{parseFloat(String(increment.increment_percentage))}%</div>
                            )}
                          {increment.increment_type === 'amount' && increment.increment_amount && (
                            <div>
                              SAR {parseFloat(String(increment.increment_amount)).toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            +SAR{' '}
                            {salaryIncrementService
                              .getTotalIncrementAmount(increment)
                              .toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(increment.effective_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={salaryIncrementService.getStatusColor(increment.status) as any}
                        >
                          {salaryIncrementService.getStatusLabel(increment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIncrement(increment);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit(increment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/${locale}/salary-increments/edit/${increment.id}`)
                              }
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {canApprove(increment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(increment)}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {canReject(increment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedIncrement(increment);
                                setShowRejectDialog(true);
                              }}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                          {canApply(increment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApply(increment)}
                            >
                              <Play className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {canDelete(increment) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIncrementToDelete(increment);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Salary Increment Details</DialogTitle>
          </DialogHeader>
          {selectedIncrement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Employee</Label>
                  <div>
                    {selectedIncrement.employee?.first_name} {selectedIncrement.employee?.last_name}
                    <div className="text-sm text-muted-foreground">
                      {selectedIncrement.employee?.employee_id}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Type</Label>
                  <div>
                    {salaryIncrementService.getIncrementTypeLabel(selectedIncrement.increment_type)}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Current Salary</Label>
                  <div>
                    SAR{' '}
                    {salaryIncrementService
                      .getCurrentTotalSalary(selectedIncrement)
                      .toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">New Salary</Label>
                  <div>
                    SAR{' '}
                    {salaryIncrementService.getNewTotalSalary(selectedIncrement).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Increment Amount</Label>
                  <div>
                    SAR{' '}
                    {salaryIncrementService
                      .getTotalIncrementAmount(selectedIncrement)
                      .toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Effective Date</Label>
                  <div>{format(new Date(selectedIncrement.effective_date), 'MMM dd, yyyy')}</div>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Reason</Label>
                <div>{selectedIncrement.reason}</div>
              </div>
              {selectedIncrement.notes && (
                <div>
                  <Label className="font-semibold">Notes</Label>
                  <div>{selectedIncrement.notes}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Requested By</Label>
                  <div>{selectedIncrement.requested_by_user?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedIncrement.requested_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                {selectedIncrement.approved_by_user && (
                  <div>
                    <Label className="font-semibold">Approved By</Label>
                    <div>{selectedIncrement.approved_by_user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedIncrement.approved_at!), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                )}
                {selectedIncrement.rejected_by_user && (
                  <div>
                    <Label className="font-semibold">Rejected By</Label>
                    <div>{selectedIncrement.rejected_by_user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedIncrement.rejected_at!), 'MMM dd, yyyy HH:mm')}
                    </div>
                    {selectedIncrement.rejection_reason && (
                      <div className="text-sm text-red-600 mt-1">
                        Reason: {selectedIncrement.rejection_reason}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Salary Increment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Input
                id="rejection_reason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedIncrement && handleReject(selectedIncrement)}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Salary Increment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this salary increment? This action cannot be undone.
            </p>
            
            {incrementToDelete && (
              <div className="space-y-3 text-sm bg-muted/50 p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Employee:</span>
                  <span className="font-semibold">
                    {incrementToDelete.employee?.first_name} {incrementToDelete.employee?.last_name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <span>{salaryIncrementService.getIncrementTypeLabel(incrementToDelete.increment_type)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Status:</span>
                  <Badge 
                    variant={incrementToDelete.status === 'applied' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {salaryIncrementService.getStatusLabel(incrementToDelete.status)}
                  </Badge>
                </div>
                
                {incrementToDelete.status === 'applied' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start space-x-2">
                      <span className="text-red-600 text-lg">⚠️</span>
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Important Warning</p>
                        <p className="text-red-700 mt-1">
                          This will also revert the employee's salary to the original amount.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setIncrementToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => incrementToDelete && handleDelete(incrementToDelete)}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
