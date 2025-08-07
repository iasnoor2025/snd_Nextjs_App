'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { salaryIncrementService, type SalaryIncrement, type SalaryIncrementFilters, type SalaryIncrementStatistics } from '@/lib/services/salary-increment-service';
import { format } from 'date-fns';
import { Plus, Filter, BarChart3, Eye, Edit, Trash2, Check, X, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SalaryIncrementsPage() {
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

  const router = useRouter();
  const { data: session, status } = useSession();

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
      const [incrementsResponse, statsResponse] = await Promise.all([
        salaryIncrementService.getSalaryIncrements(filters),
        salaryIncrementService.getStatistics(),
      ]);
      
      setIncrements(incrementsResponse?.data || []);
      setPagination(incrementsResponse?.pagination || { page: 1, limit: 15, total: 0, pages: 0 });
      setStatistics(statsResponse);
    } catch (error) {
      console.error('Error loading salary increments:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Please log in to access salary increments');
        router.push('/login');
        return;
      }
      
      toast.error('Failed to load salary increments');
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
      console.error('Error approving salary increment:', error);
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
      console.error('Error rejecting salary increment:', error);
      toast.error('Failed to reject salary increment');
    }
  };

  const handleApply = async (increment: SalaryIncrement) => {
    try {
      await salaryIncrementService.applySalaryIncrement(increment.id);
      toast.success('Salary increment applied successfully');
      loadData();
    } catch (error) {
      console.error('Error applying salary increment:', error);
      toast.error('Failed to apply salary increment');
    }
  };

  const handleDelete = async (increment: SalaryIncrement) => {
    const isApplied = increment.status === 'applied';
    const confirmMessage = isApplied 
      ? 'Are you sure you want to delete this applied salary increment? This will also revert the employee\'s salary to the original amount.'
      : 'Are you sure you want to delete this salary increment?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await salaryIncrementService.deleteSalaryIncrement(increment.id);
      const successMessage = isApplied 
        ? 'Applied salary increment deleted and employee salary reverted successfully'
        : 'Salary increment deleted successfully';
      toast.success(successMessage);
      loadData();
    } catch (error) {
      console.error('Error deleting salary increment:', error);
      toast.error('Failed to delete salary increment');
    }
  };

  const canApprove = (increment: SalaryIncrement) => {
    // Super admin and admin can approve any increment
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin') {
      return true;
    }
    // Other users can only approve pending increments
    return increment.status === 'pending';
  };

  const canReject = (increment: SalaryIncrement) => {
    // Super admin and admin can reject any increment
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin') {
      return true;
    }
    // Other users can only reject pending increments
    return increment.status === 'pending';
  };

  const canApply = (increment: SalaryIncrement) => {
    // Super admin and admin can apply any approved increment
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin') {
      return increment.status === 'approved';
    }
    // Other users can only apply if approved and effective date has passed
    return increment.status === 'approved' && new Date(increment.effective_date) <= new Date();
  };

  const canDelete = (increment: SalaryIncrement) => {
    // Super admin and admin can delete any increment
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin') {
      return true;
    }
    // Other users can only delete if not applied
    return increment.status !== 'applied';
  };

  const canEdit = (increment: SalaryIncrement) => {
    // Super admin and admin can edit any increment
    const userRole = session?.user?.role?.toLowerCase();
    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'superadmin') {
      return true;
    }
    // Other users can only edit if not applied
    return increment.status !== 'applied';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Salary Increments</h1>
        <Button onClick={() => router.push('/modules/salary-increments/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Increment
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending_increments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <Badge variant="secondary">{statistics.applied_increments}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.applied_increments}</div>
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
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
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
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
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
                  onValueChange={(value) => handleFilterChange('increment_type', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
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
                  onChange={(e) => handleFilterChange('effective_date_from', e.target.value || undefined)}
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
                  {increments?.map((increment) => (
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
                        SAR {salaryIncrementService.getCurrentTotalSalary(increment).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        SAR {salaryIncrementService.getNewTotalSalary(increment).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {increment.increment_type === 'percentage' && increment.increment_percentage && (
                            <div>{parseFloat(String(increment.increment_percentage))}%</div>
                          )}
                          {increment.increment_type === 'amount' && increment.increment_amount && (
                            <div>SAR {parseFloat(String(increment.increment_amount)).toLocaleString()}</div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            +SAR {salaryIncrementService.getTotalIncrementAmount(increment).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(increment.effective_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={salaryIncrementService.getStatusColor(increment.status) as any}>
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
                              onClick={() => router.push(`/modules/salary-increments/edit/${increment.id}`)}
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
                              onClick={() => handleDelete(increment)}
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
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
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
                  <div>{salaryIncrementService.getIncrementTypeLabel(selectedIncrement.increment_type)}</div>
                </div>
                <div>
                  <Label className="font-semibold">Current Salary</Label>
                  <div>SAR {salaryIncrementService.getCurrentTotalSalary(selectedIncrement).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="font-semibold">New Salary</Label>
                  <div>SAR {salaryIncrementService.getNewTotalSalary(selectedIncrement).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="font-semibold">Increment Amount</Label>
                  <div>SAR {salaryIncrementService.getTotalIncrementAmount(selectedIncrement).toLocaleString()}</div>
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
                onChange={(e) => setRejectionReason(e.target.value)}
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
    </div>
  );
}
