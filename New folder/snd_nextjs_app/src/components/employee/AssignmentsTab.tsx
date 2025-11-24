'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { format } from 'date-fns';
import {
  Briefcase,
  Calendar,
  Edit,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';


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
  const { hasPermission } = useRBAC();
  const { t } = useI18n();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form state - moved up before any conditional returns
  const [formData, setFormData] = useState({
    name: '',
    type: 'manual',
    location: '',
    start_date: '',
    end_date: '',
    status: 'active',
    notes: '',
  });

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
        setError(errorData.error || t('assignment.messages.loadingError'));
      }
    } catch {
      setError(t('assignment.messages.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [employeeId]);

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
      toast.error(t('assignment.validation.assignmentNameRequired'));
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
        toast.error(errorData.error || t('assignment.messages.saveError'));
      }
    } catch {
      toast.error(t('assignment.messages.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAssignment || !formData.name || !formData.start_date) {
      toast.error(t('assignment.validation.assignmentNameRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // If status is being changed to completed and no end date is provided,
      // set it to one day before the assignment start date
      let endDate = formData.end_date;
      if (formData.status === 'completed' && !endDate) {
        const d = new Date(formData.start_date);
        d.setDate(d.getDate() - 1);
        endDate = d.toISOString().split('T')[0];
      }

      const response = await fetch(`/api/employees/${employeeId}/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          location: formData.location,
          startDate: formData.start_date,
          endDate: endDate,
          status: formData.status,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        toast.success('Assignment updated successfully');
        setShowEditDialog(false);
        setSelectedAssignment(null);
        resetForm();
        fetchAssignments();
      } else {
        const errorData = await response.json();

        toast.error(errorData.error || t('assignment.messages.updateError'));
      }
    } catch {
      toast.error(t('assignment.messages.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    setDeletingId(selectedAssignment.id);
    try {
      const response = await fetch(
        `/api/employees/${employeeId}/assignments/${selectedAssignment.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        // If this was an active assignment, find and activate the next completed assignment
        if (selectedAssignment.status === 'active') {
          // Find the most recent completed assignment for this employee
          const completedAssignments = assignments.filter(a => 
            a.status === 'completed' && 
            a.id !== selectedAssignment.id
          );

          if (completedAssignments.length > 0) {
            // Sort by creation date to get the most recent
            const mostRecentCompleted = completedAssignments.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            // Update the most recent completed assignment to active and remove end date
            if (mostRecentCompleted) {
              try {
                await fetch(`/api/employees/${employeeId}/assignments/${mostRecentCompleted.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: mostRecentCompleted.name,
                    type: mostRecentCompleted.type,
                    location: mostRecentCompleted.location,
                    startDate: mostRecentCompleted.start_date,
                    endDate: null, // Remove end date
                    status: 'active',
                    notes: mostRecentCompleted.notes,
                  }),
                });
              } catch (updateError) {
                console.warn('Failed to activate previous assignment:', updateError);
              }
            }
          }
        }

        toast.success('Assignment deleted successfully');
        setShowDeleteDialog(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('assignment.messages.deleteError'));
      }
    } catch {
      toast.error(t('assignment.messages.deleteError'));
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
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={statusColors[status] || statusColors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      manual: 'bg-gray-100 text-gray-800',
      project: 'bg-blue-100 text-blue-800',
      rental: 'bg-purple-100 text-purple-800',
      rental_item: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={typeColors[type] || typeColors.manual}>
        {type === 'rental_item' ? 'Rental' : type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getAssignmentDetails = (assignment: Assignment) => {
    const details: string[] = [];

    if (assignment.project) {
      details.push(`Project: ${assignment.project.name}`);
    }

    if (assignment.rental) {
      details.push(`Rental: ${assignment.rental.rental_number}`);
    }

    return details.join(' • ');
  };

  const getCurrentAssignment = () => {
    if (assignments.length === 0) return null;

    // Sort assignments by start_date (newest first)
    const sortedAssignments = [...assignments].sort((a, b) => {
      const aDate = a.start_date ? new Date(a.start_date) : new Date(0);
      const bDate = b.start_date ? new Date(b.start_date) : new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

    // Return the assignment with the latest start_date
    return sortedAssignments[0] || null;
  };

  const getAssignmentHistory = () => {
    const currentAssignment = getCurrentAssignment();

    // All assignments except the current one go to history
    const history = assignments.filter(a => !currentAssignment || a.id !== currentAssignment.id);

    return history;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('assignment.messages.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">{t('assignment.messages.loadingError')}</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={fetchAssignments} className="bg-white">
              <RefreshCw className="mr-2 h-4 w-4" /> {t('assignment.actions.refresh')}
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
          <h3 className="text-lg font-semibold">{t('assignment.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('assignment.subtitle')}
          </p>
        </div>
        {!currentAssignment && hasPermission('create', 'employee-assignment') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                {t('assignment.form.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('assignment.form.create')}</DialogTitle>
                <DialogDescription>{t('assignment.form.create')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('assignment.form.assignmentName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('assignment.form.assignmentNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="type">{t('assignment.form.assignmentType')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('assignment.form.selectAssignmentType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">{t('assignment.types.manual')}</SelectItem>
                      <SelectItem value="project">{t('assignment.types.project')}</SelectItem>
                      <SelectItem value="rental">{t('assignment.types.rental')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">{t('assignment.form.location')}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t('assignment.form.locationPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">{t('assignment.form.startDate')}</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">{t('assignment.form.endDate')}</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">{t('assignment.form.status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('assignment.form.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('assignment.status.active')}</SelectItem>
                      <SelectItem value="completed">{t('assignment.status.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('assignment.status.cancelled')}</SelectItem>
                      <SelectItem value="pending">{t('assignment.status.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">{t('assignment.form.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('assignment.form.notesPlaceholder')}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('assignment.form.cancel')}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={submitting || !formData.name || !formData.start_date}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {t('assignment.form.creating')}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('assignment.form.create')}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Assignment */}
      {currentAssignment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {t('assignment.currentAssignment.title')}
              </div>
              <div className="flex gap-2">
                {hasPermission('update', 'employee-assignment') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(currentAssignment)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    {t('assignment.form.update')}
                  </Button>
                )}
                {hasPermission('delete', 'employee-assignment') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteDialog(currentAssignment)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t('assignment.form.delete')}
                  </Button>
                )}
              </div>
            </CardTitle>
            <CardDescription>{currentAssignment.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t('assignment.currentAssignment.location')}:</strong> {currentAssignment.location || t('assignment.currentAssignment.notSpecified')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{t('assignment.currentAssignment.period')}:</strong>{' '}
                    {format(new Date(currentAssignment.start_date), 'MMM d, yyyy')}
                    {currentAssignment.end_date &&
                      ` - ${format(new Date(currentAssignment.end_date), 'MMM d, yyyy')}`}
                  </span>
                </div>
                {getAssignmentDetails(currentAssignment) && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{t('assignment.currentAssignment.details')}:</strong> {getAssignmentDetails(currentAssignment)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {getTypeBadge(currentAssignment.type)}
                <Badge
                  className={
                    currentAssignment.status === 'active'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-400 text-white'
                  }
                >
                  {currentAssignment.status || 'active'}
                </Badge>
                {currentAssignment.notes && (
                  <div className="text-sm text-muted-foreground">
                    <strong>{t('assignment.currentAssignment.notes')}:</strong> {currentAssignment.notes}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignment History */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{t('assignment.assignmentHistory.title')}</h3>
        {assignmentHistory.length === 0 ? (
          <div className="rounded-lg bg-muted/30 p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-medium">{t('assignment.assignmentHistory.noHistory')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('assignment.assignmentHistory.noHistoryDescription')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('assignment.table.assignmentName')}</TableHead>
                  <TableHead>{t('assignment.table.type')}</TableHead>
                  <TableHead>{t('assignment.table.details')}</TableHead>
                  <TableHead>{t('assignment.table.location')}</TableHead>
                  <TableHead>{t('assignment.table.startDate')}</TableHead>
                  <TableHead>{t('assignment.table.endDate')}</TableHead>
                  <TableHead>{t('assignment.table.status')}</TableHead>
                  <TableHead className="text-right">{t('assignment.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentHistory.map(assignment => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.name}</TableCell>
                    <TableCell>{getTypeBadge(assignment.type)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {getAssignmentDetails(assignment) || '-'}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.location || '-'}</TableCell>
                    <TableCell>{format(new Date(assignment.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {assignment.end_date
                        ? format(new Date(assignment.end_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission('update', 'employee-assignment') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(assignment)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {hasPermission('delete', 'employee-assignment') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(assignment)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
            <DialogTitle>{t('assignment.form.editAssignment')}</DialogTitle>
            <DialogDescription>{t('assignment.form.updateAssignmentDetails')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Assignment Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter assignment name"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Assignment Type</Label>
              <Select
                value={formData.type}
                onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{t('assignment.types.manual')}</SelectItem>
                  <SelectItem value="project">{t('assignment.types.project')}</SelectItem>
                  <SelectItem value="rental">{t('assignment.types.rental')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                  onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('assignment.status.active')}</SelectItem>
                  <SelectItem value="completed">{t('assignment.status.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('assignment.status.cancelled')}</SelectItem>
                  <SelectItem value="pending">{t('assignment.status.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter notes (optional)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('assignment.form.cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={submitting || !formData.name || !formData.start_date}
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('assignment.form.updating')}
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('assignment.form.update')}
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
            <DialogTitle>{t('assignment.form.deleteAssignment')}</DialogTitle>
            <DialogDescription>
              {t('assignment.form.deleteConfirmation')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('assignment.form.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
              {deletingId !== null ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('assignment.form.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('assignment.form.delete')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
