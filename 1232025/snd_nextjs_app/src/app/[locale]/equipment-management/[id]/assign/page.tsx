
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ApiService from '@/lib/api-service';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useI18n } from '@/hooks/use-i18n';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  Loader2,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AssignmentDialog } from './components/AssignmentDialog';

interface Equipment {
  id: number;
  name: string;
  model_number?: string;
  status: string;
  door_number?: string;
  current_assignment?: {
    id: number;
    type: string;
    name: string;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    notes: string | null;
    project?: {
      id: number;
      name: string;
      location: string | null;
    } | null;
    rental?: {
      id: number;
      rental_number: string;
      project?: {
        id: number;
        name: string;
      } | null;
    } | null;
    employee?: {
      id: number;
      name: string;
      file_number: string;
    } | null;
  } | null;
}

interface Assignment {
  id: number;
  assignment_type: string;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  location?: string;
  daily_rate?: number;
  total_amount?: number;
  project?: {
    id: number;
    name: string;
    location: string | null;
  } | null;
  rental?: {
    id: number;
    rental_number: string;
    project?: {
      id: number;
      name: string;
    } | null;
  } | null;
  employee?: {
    id: number;
    name: string;
    file_number: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function EquipmentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { t, isRTL: _isRTL } = useI18n();
  const locale = params?.locale as string || 'en';
  const { user: _user, hasPermission, getAllowedActions } = useRBAC();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [editAssignmentDialogOpen, setEditAssignmentDialogOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [editFormData, setEditFormData] = useState({
    assignment_type: '',
    employee_id: '',
    project_id: '',
    start_date: '',
    end_date: '',
    daily_rate: '',
    total_amount: '',
    notes: '',
    status: '',
  });

  const equipmentId = params.id as string;

  // Get allowed actions for equipment management
  const _allowedActions = getAllowedActions('Equipment');

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (assignment: Assignment) => {
    setAssignmentToEdit(assignment);
    setEditFormData({
      assignment_type: assignment.assignment_type,
      employee_id: assignment.employee?.id?.toString() || '',
      project_id: assignment.project?.id?.toString() || '',
      start_date: assignment.start_date ? assignment.start_date.split('T')[0] : '',
      end_date: assignment.end_date ? assignment.end_date.split('T')[0] : '',
      daily_rate: assignment.daily_rate?.toString() || '',
      total_amount: assignment.total_amount?.toString() || '',
      notes: assignment.notes || '',
      status: assignment.status,
    });
    setEditAssignmentDialogOpen(true);
  };

  const handleCompleteAssignment = async (assignment: Assignment) => {
    try {
      const response = await fetch(`/api/equipment/assignments/${assignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_type: assignment.assignment_type,
          employee_id: assignment.employee?.id,
          project_id: assignment.project?.id,
          start_date: assignment.start_date,
          end_date: new Date().toISOString().split('T')[0], // Set end date to today
          daily_rate: assignment.daily_rate,
          total_amount: assignment.total_amount,
          notes: assignment.notes,
          status: 'completed',
        }),
      });

      if (response.ok) {
        toast.success(t('equipment.messages.assignmentCompleted'));
        await fetchAssignments();
      } else {
        const error = await response.json();
        toast.error(error.error || t('equipment.messages.completeAssignmentError'));
      }
    } catch (error) {
      console.error('Error completing assignment:', error);
      toast.error(t('equipment.messages.completeAssignmentError'));
    }
  };

  const handleUpdateAssignment = async () => {
    if (!assignmentToEdit) return;

    try {
      const response = await fetch(`/api/equipment/assignments/${assignmentToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success(t('equipment.messages.assignmentUpdated'));
        setEditAssignmentDialogOpen(false);
        setAssignmentToEdit(null);
        // Refresh assignments instead of full page reload
        await fetchAssignments();
      } else {
        const error = await response.json();
        toast.error(error.error || t('equipment.messages.updateAssignmentError'));
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error(t('equipment.messages.updateAssignmentError'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assignmentToDelete) return;
    
    try {
      await ApiService.deleteEquipmentAssignment(assignmentToDelete.id);
      toast.success(t('equipment.messages.assignmentDeletedSuccess'));
      setDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      // Refresh assignments instead of full page reload
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(t('equipment.messages.deleteAssignmentError'));
    }
  };

  useEffect(() => {
    if (equipmentId) {
      // Only fetch if data doesn't exist
      if (!equipment) {
        fetchEquipment();
      }
      if (assignments.length === 0) {
        fetchAssignments();
      }
    }
  }, [equipmentId]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      // Fetch equipment details
      const equipmentResponse = await ApiService.getEquipmentItem(parseInt(equipmentId));
      if (equipmentResponse.success) {
        setEquipment(equipmentResponse.data);
      }

      // Fetch assignment history
      const historyResponse = await ApiService.getEquipmentRentalHistory(parseInt(equipmentId));
      if (historyResponse.success) {
        setAssignments(historyResponse.data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error(t('equipment.messages.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const historyResponse = await ApiService.getEquipmentRentalHistory(parseInt(equipmentId));
      if (historyResponse.success) {
        setAssignments(historyResponse.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error(t('equipment.messages.loadAssignmentHistoryError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('status.active'),
      },
      completed: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('status.completed'),
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        label: t('status.pending'),
      },
      cancelled: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('status.cancelled'),
      },
      assigned: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('status.assigned'),
      },
      available: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('status.available'),
      },
      rented: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: t('status.rented'),
      },
      maintenance: {
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
        label: t('status.maintenance'),
      },
      out_of_service: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('status.out_of_service'),
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: status,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getAssignmentTypeBadge = (type: string) => {
    const typeConfig = {
      project: {
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
        label: t('equipment.assignmentHistory.type.project'),
      },
      rental: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: t('equipment.assignmentHistory.type.rental'),
      },
      manual: {
        className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
        label: t('equipment.assignmentHistory.type.manual'),
      },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: type,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('equipment.messages.loadingAssignmentHistory')}</span>
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <span className="ml-2">{t('equipment.messages.notFound')}</span>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/${locale}/equipment-management/${equipmentId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('equipment.actions.back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('equipment.assignmentHistory.title')}</h1>
              <p className="text-muted-foreground">{t('equipment.assignmentHistory.description')}</p>
            </div>
          </div>
          {hasPermission('create', 'Equipment') && (
            <Button onClick={() => setShowAssignmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('equipment.actions.addManualAssignment')}
            </Button>
          )}
        </div>

        {/* Equipment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>{t('equipment.equipmentDetails')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('equipment.equipment_management.name')}</Label>
                <p className="text-sm font-medium">{equipment.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('equipment.equipment_management.door_number')}</Label>
                <p className="text-sm">{equipment.door_number || t('equipment.messages.notSpecified')}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('equipment.equipment_management.status')}</Label>
                <div className="mt-1">{getStatusBadge(equipment.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <AssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          equipmentId={equipmentId}
          onSuccess={() => {
            fetchEquipment();
            setShowAssignmentDialog(false);
          }}
        />

        {/* Current Assignment */}
        {equipment?.current_assignment && (
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>{t('equipment.assignmentHistory.currentAssignment')}</span>
            </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.table.type')}</Label>
                  <div className="mt-1">
                    {getAssignmentTypeBadge(equipment.current_assignment.type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.table.status')}</Label>
                  <div className="mt-1">{getStatusBadge(equipment.current_assignment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.equipment_management.name')}</Label>
                  <p className="text-sm">{equipment.current_assignment.name}</p>
                </div>
                {equipment.current_assignment.employee && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t('equipment.assignmentHistory.table.customerProjectEmployee')}
                    </Label>
                    <p className="text-sm">
                      👤 {equipment.current_assignment.employee.name} (
                      {equipment.current_assignment.employee.file_number})
                    </p>
                  </div>
                )}
                {equipment.current_assignment.location && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.location')}</Label>
                    <p className="text-sm">📍 {equipment.current_assignment.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.table.period')}</Label>
                  <p className="text-sm">
                    {equipment.current_assignment.start_date
                      ? new Date(equipment.current_assignment.start_date).toLocaleDateString()
                      : t('equipment.messages.notSet')}
                  </p>
                </div>
                {equipment.current_assignment.notes && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">{t('equipment.fields.notes')}</Label>
                    <p className="text-sm">{equipment.current_assignment.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('equipment.assignmentHistory.title')}</span>
            </CardTitle>
            <CardDescription>All assignments for this equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('equipment.assignmentHistory.table.type')}</TableHead>
                    <TableHead>{t('equipment.assignmentHistory.table.equipment')}</TableHead>
                    <TableHead>{t('equipment.assignmentHistory.table.customerProjectEmployee')}</TableHead>
                    <TableHead>{t('equipment.assignmentHistory.table.status')}</TableHead>
                    <TableHead>{t('equipment.assignmentHistory.table.period')}</TableHead>
                    <TableHead>{t('equipment.assignmentHistory.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('equipment.assignmentHistory.noAssignmentHistoryFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>{getAssignmentTypeBadge(assignment.assignment_type)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {assignment.assignment_type === 'project' && assignment.project
                                ? assignment.project.name
                                : assignment.assignment_type === 'rental' && assignment.rental
                                  ? `${assignment.rental.project?.name || 'Unknown Project'} - ${assignment.rental.rental_number}`
                                  : assignment.assignment_type === 'manual'
                                    ? `Manual Assignment${assignment.employee ? ` - ${assignment.employee.name}` : ''}`
                                    : assignment.assignment_type}
                            </div>
                            {assignment.location && (
                              <div className="text-xs text-muted-foreground">
                                📍 {assignment.location}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.employee ? (
                            <div>
                              <div className="font-medium">{assignment.employee.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.employee.file_number}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">{t('equipment.messages.notAssigned')}</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>{new Date(assignment.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {assignment.end_date
                            ? new Date(assignment.end_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {hasPermission('update', 'Equipment') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(assignment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {assignment.status === 'active' && hasPermission('update', 'Equipment') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompleteAssignment(assignment)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {hasPermission('delete', 'Equipment') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(assignment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Assignment Dialog */}
        <Dialog open={editAssignmentDialogOpen} onOpenChange={setEditAssignmentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Equipment Assignment</DialogTitle>
              <DialogDescription>
                Update the assignment details for {equipment?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-assignment-type">Assignment Type</Label>
                <select
                  id="edit-assignment-type"
                  value={editFormData.assignment_type}
                  onChange={(e) => setEditFormData({ ...editFormData, assignment_type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="rental">Rental</option>
                  <option value="project">Project</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-start-date">Start Date</Label>
                <input
                  id="edit-start-date"
                  type="date"
                  value={editFormData.start_date}
                  onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">End Date</Label>
                <input
                  id="edit-end-date"
                  type="date"
                  value={editFormData.end_date}
                  onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <Label htmlFor="edit-daily-rate">Daily Rate</Label>
                <input
                  id="edit-daily-rate"
                  type="number"
                  step="0.01"
                  value={editFormData.daily_rate}
                  onChange={(e) => setEditFormData({ ...editFormData, daily_rate: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <Label htmlFor="edit-total-amount">Total Amount</Label>
                <input
                  id="edit-total-amount"
                  type="number"
                  step="0.01"
                  value={editFormData.total_amount}
                  onChange={(e) => setEditFormData({ ...editFormData, total_amount: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAssignmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAssignment}>
                Update Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('equipment.messages.confirmDeleteAssignment')}</DialogTitle>
              <DialogDescription>
                {assignmentToDelete && (
                  <>
                    {t('equipment.messages.confirmDeleteAssignment')}
                    <br />
                    <strong>
                      {assignmentToDelete.assignment_type}: {
                        assignmentToDelete.project?.name || 
                        assignmentToDelete.rental?.rental_number || 
                        'Unknown'
                      }
                    </strong>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                {t('equipment.actions.cancel')}
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                {t('equipment.actions.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
