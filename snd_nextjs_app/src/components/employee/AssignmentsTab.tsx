"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Edit, Trash2, RefreshCw, Briefcase, MapPin, Calendar, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Assignment {
  id: number;
  name: string;
  type: string;
  location?: string;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  project_id?: number;
  rental_id?: number;
  project?: {
    id: number;
    name: string;
  };
  rental?: {
    id: number;
    rental_number: string;
    project_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface AssignmentsTabProps {
  employeeId: number;
}

export default function AssignmentsTab({ employeeId }: AssignmentsTabProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'manual',
    location: '',
    start_date: '',
    end_date: '',
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, [employeeId]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/employees/${employeeId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'manual',
      location: '',
      start_date: '',
      end_date: '',
      status: 'active',
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.start_date) {
      toast.error('Assignment name and start date are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
    if (!selectedAssignment || !formData.name || !formData.start_date) {
      toast.error('Assignment name and start date are required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Assignment updated successfully');
        setShowEditDialog(false);
        setSelectedAssignment(null);
        resetForm();
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

    setDeletingId(selectedAssignment.id);
    try {
      const response = await fetch(`/api/employees/${employeeId}/assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
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
    } finally {
      setDeletingId(null);
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      name: assignment.name,
      type: assignment.type,
      location: assignment.location || '',
      start_date: assignment.start_date,
      end_date: assignment.end_date || '',
      status: assignment.status,
      notes: assignment.notes || '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={statusColors[status] || statusColors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      'manual': 'bg-gray-100 text-gray-800',
      'project': 'bg-blue-100 text-blue-800',
      'rental': 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={typeColors[type] || typeColors.manual}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getCurrentAssignment = () => {
    return assignments.find(a => a.status === 'active') || null;
  };

  const getAssignmentHistory = () => {
    return assignments.filter(a => a.status !== 'active');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading assignments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">Error Loading Assignments</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={fetchAssignments} className="bg-white">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentAssignment = getCurrentAssignment();
  const assignmentHistory = getAssignmentHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Employee Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Manage and view employee project and rental assignments
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Assignment</DialogTitle>
              <DialogDescription>
                Create a new assignment for this employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Assignment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter assignment name"
                />
              </div>
              <div>
                <Label htmlFor="type">Assignment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="rental">Rental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter notes (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting || !formData.name || !formData.start_date}>
                {submitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Assignment */}
      {currentAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Current Assignment
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(currentAssignment)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteDialog(currentAssignment)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {currentAssignment.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Location:</strong> {currentAssignment.location || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Period:</strong> {format(new Date(currentAssignment.start_date), 'MMM d, yyyy')}
                    {currentAssignment.end_date && ` - ${format(new Date(currentAssignment.end_date), 'MMM d, yyyy')}`}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {getTypeBadge(currentAssignment.type)}
                {getStatusBadge(currentAssignment.status)}
                {currentAssignment.notes && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Notes:</strong> {currentAssignment.notes}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment History */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Assignment History</h3>
        {assignmentHistory.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">No Assignment History</h3>
            <p className="text-sm text-muted-foreground">
              This employee has no previous assignments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentHistory.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.name}
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(assignment.type)}
                    </TableCell>
                    <TableCell>
                      {assignment.location || '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {assignment.end_date ? format(new Date(assignment.end_date), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDeleteDialog(assignment)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Assignment Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter assignment name"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Assignment Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="rental">Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Start Date *</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter notes (optional)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !formData.name || !formData.start_date}>
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update
                </>
              )}
            </Button>
          </div>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 