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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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
import { Textarea } from '@/components/ui/textarea';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  employeeId: number;
  projectId?: number;
  assignmentType: string;
  status: string;
  startDate: string;
  endDate?: string;
  name: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    fileNumber: string;
    userId: number;
  };
  project?: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface PaginatedResponse {
  data: Assignment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function AssignmentsManagementPage() {
  const { hasPermission } = useRBAC();
  const [assignments, setAssignments] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    projectId: '',
    assignmentType: 'manual',
    startDate: '',
    endDate: '',
    status: 'active',
    name: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, [currentPage, pageSize, searchTerm, statusFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/assignments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.employeeId || !formData.startDate || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: parseInt(formData.employeeId),
          projectId: formData.projectId ? parseInt(formData.projectId) : null,
          assignmentType: formData.assignmentType,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        toast.success('Assignment created successfully');
        setShowCreateDialog(false);
        resetForm();
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAssignment.id,
          employeeId: selectedAssignment.employeeId,
          projectId: selectedAssignment.projectId,
          assignmentType: selectedAssignment.assignmentType,
          startDate: selectedAssignment.startDate,
          endDate: selectedAssignment.endDate,
          status: selectedAssignment.status,
          notes: selectedAssignment.notes,
        }),
      });

      if (response.ok) {
        toast.success('Assignment updated successfully');
        setShowEditDialog(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedAssignment.id }),
      });

      if (response.ok) {
        toast.success('Assignment deleted successfully');
        setShowDeleteDialog(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      projectId: '',
      assignmentType: 'manual',
      startDate: '',
      endDate: '',
      status: 'active',
      name: '',
      location: '',
      notes: '',
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && assignments) {
      setSelectedAssignments(new Set(assignments.data.map(a => a.id)));
    } else {
      setSelectedAssignments(new Set());
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      active: { label: 'Active', variant: 'default' },
      pending: { label: 'Pending', variant: 'secondary' },
      completed: { label: 'Completed', variant: 'outline' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'outline' } } = {
      manual: { label: 'Manual', variant: 'default' },
      project: { label: 'Project', variant: 'secondary' },
      rental: { label: 'Rental', variant: 'outline' },
    };

    const config = typeConfig[type] || { label: type, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!hasPermission('assignments', 'read')) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view assignments.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">Manage employee assignments and projects</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchAssignments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>
              {assignments ? `${assignments.total} Assignments Page ${assignments.current_page} of ${assignments.last_page}` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            assignments &&
                            selectedAssignments.size === assignments.data.length &&
                            assignments.data.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments?.data.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedAssignments.has(assignment.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedAssignments);
                                if (checked) {
                                  newSelected.add(assignment.id);
                                } else {
                                  newSelected.delete(assignment.id);
                                }
                                setSelectedAssignments(newSelected);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {assignment.employee.firstName} {assignment.employee.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  #{assignment.employee.fileNumber}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{assignment.name}</TableCell>
                          <TableCell>{getTypeBadge(assignment.assignmentType)}</TableCell>
                          <TableCell>
                            {assignment.project ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{assignment.project.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(assignment.startDate), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {assignment.endDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(assignment.endDate), 'MMM d, yyyy')}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                          <TableCell>
                            {assignment.location || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {assignments && assignments.last_page > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, assignments.last_page) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        {assignments.last_page > 5 && (
                          <>
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(assignments.last_page)}
                                isActive={currentPage === assignments.last_page}
                                className="cursor-pointer"
                              >
                                {assignments.last_page}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(Math.min(assignments.last_page, currentPage + 1))}
                            className={currentPage === assignments.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Assignment Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Add a new assignment for an employee</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Assignment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter assignment name"
                />
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  type="number"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  type="number"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  placeholder="Enter project ID (optional)"
                />
              </div>
              <div>
                <Label htmlFor="assignmentType">Type</Label>
                <Select value={formData.assignmentType} onValueChange={(value) => setFormData({ ...formData, assignmentType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location (optional)"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter notes (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
              <DialogDescription>Update assignment details</DialogDescription>
            </DialogHeader>
            {selectedAssignment && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-name">Assignment Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedAssignment.name}
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={selectedAssignment.assignmentType}
                    onValueChange={(value) => setSelectedAssignment({ ...selectedAssignment, assignmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="rental">Rental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedAssignment.status}
                    onValueChange={(value) => setSelectedAssignment({ ...selectedAssignment, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={selectedAssignment.startDate.split('T')[0]}
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={selectedAssignment.endDate ? selectedAssignment.endDate.split('T')[0] : ''}
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, endDate: e.target.value || undefined })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedAssignment.location || ''}
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, location: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={selectedAssignment.notes || ''}
                    onChange={(e) => setSelectedAssignment({ ...selectedAssignment, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Assignment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this assignment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
