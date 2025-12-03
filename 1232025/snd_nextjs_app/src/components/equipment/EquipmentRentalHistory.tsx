'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  FileText,
  History,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/use-translations';

interface AssignmentHistoryItem {
  id: number;
  rental_id?: number;
  rental_number?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  project_id?: number;
  project_name?: string;
  project_description?: string;
  project_status?: string;
  employee_id?: number;
  employee_name?: string;
  employee_id_number?: string;
  employee_email?: string;
  employee_phone?: string;
  assignment_type: string;
  equipment_name: string;
  equipment_door_number?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  rate_type: string;
  days?: number;
  status: string;
  notes?: string;
  start_date?: string;
  expected_end_date?: string;
  actual_end_date?: string;
  rental_start_date?: string;
  rental_expected_end_date?: string;
  rental_actual_end_date?: string;
  rental_status?: string;
  duration_days?: number;
  operator_count?: number;
  created_at: string;
  updated_at: string;
}

interface EquipmentAssignmentHistoryProps {
  equipmentId: number;
}

export default function EquipmentAssignmentHistory({
  equipmentId,
}: EquipmentAssignmentHistoryProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useTranslations();
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentHistoryItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showManualAssignmentDialog, setShowManualAssignmentDialog] = useState(false);
  const [showEditAssignmentDialog, setShowEditAssignmentDialog] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [manualAssignmentForm, setManualAssignmentForm] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    totalAmount: '',
    notes: '',
  });
  const [editAssignmentForm, setEditAssignmentForm] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    totalAmount: '',
    notes: '',
  });
  const [submittingManualAssignment, setSubmittingManualAssignment] = useState(false);
  const [submittingEditAssignment, setSubmittingEditAssignment] = useState(false);

  useEffect(() => {
    fetchAssignmentHistory();
  }, [equipmentId]);

  const fetchAssignmentHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getEquipmentRentalHistory(equipmentId);
      if (response.success) {
        setAssignmentHistory(response.data || []);
      } else {
        setError(response.message || t('equipment.messages.loadAssignmentHistoryError'));
      }
    } catch (error) {
      
      setError(t('equipment.messages.loadAssignmentHistoryError'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: t('equipment.status.active'),
      },
      completed: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: t('equipment.status.completed'),
      },
      cancelled: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: t('equipment.status.cancelled'),
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        label: t('equipment.status.pending'),
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: status,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRentalStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: 'Active',
      },
      completed: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: 'Completed',
      },
      cancelled: {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
        label: 'Cancelled',
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
        label: 'Pending',
      },
      approved: {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
        label: 'Approved',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: status,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRateTypeBadge = (rateType: string) => {
    const typeConfig = {
      daily: {
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
        label: 'Daily',
      },
      weekly: {
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
        label: 'Weekly',
      },
      monthly: {
        className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
        label: 'Monthly',
      },
    };

    const config = typeConfig[rateType as keyof typeof typeConfig] || {
      className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
      label: rateType,
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const openDetailsDialog = (assignment: AssignmentHistoryItem) => {
    setSelectedAssignment(assignment);
    setShowDetailsDialog(true);
  };

  const getCurrentAssignment = () => {
    return assignmentHistory.find(
      assignment => assignment.status === 'active'
    );
  };

  const getCompletedAssignments = () => {
    return assignmentHistory.filter(
      assignment => assignment.status === 'completed'
    );
  };

  const getTotalRevenue = () => {
    return assignmentHistory.reduce(
      (total, assignment) => total + (Number(assignment.total_price) || 0),
      0
    );
  };

  // Format number with thousand separators
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const fetchEmployees = async () => {
    try {
      const response = await ApiService.getEmployees();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      
    }
  };

  const handleManualAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingManualAssignment(true);

    try {
      const assignmentData = {
        assignment_type: 'manual' as const,
        start_date: manualAssignmentForm.startDate,
        end_date: manualAssignmentForm.endDate || undefined,
        daily_rate: manualAssignmentForm.dailyRate
          ? parseFloat(manualAssignmentForm.dailyRate)
          : undefined,
        total_amount: manualAssignmentForm.totalAmount
          ? parseFloat(manualAssignmentForm.totalAmount)
          : undefined,
        notes: manualAssignmentForm.notes || undefined,
        status: 'active',
        employee_id: parseInt(manualAssignmentForm.employeeId),
      };

      const response = await ApiService.createEquipmentAssignment(equipmentId, assignmentData);

      if (response.success) {
        toast.success(t('equipment.messages.assignmentCreatedSuccess'));
        setShowManualAssignmentDialog(false);
        setManualAssignmentForm({
          employeeId: '',
          startDate: '',
          endDate: '',
          dailyRate: '',
          totalAmount: '',
          notes: '',
        });
        fetchAssignmentHistory(); // Refresh the history
      } else {
        toast.error(response.message || t('equipment.messages.createManualAssignmentError'));
      }
    } catch (error) {
      toast.error(t('equipment.messages.createManualAssignmentError'));
    } finally {
      setSubmittingManualAssignment(false);
    }
  };

  const handleEditAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmittingEditAssignment(true);

    try {
      const assignmentData = {
        start_date: editAssignmentForm.startDate,
        end_date: editAssignmentForm.endDate || undefined,
        daily_rate: editAssignmentForm.dailyRate
          ? parseFloat(editAssignmentForm.dailyRate)
          : undefined,
        total_amount: editAssignmentForm.totalAmount
          ? parseFloat(editAssignmentForm.totalAmount)
          : undefined,
        notes: editAssignmentForm.notes || undefined,
        employee_id: parseInt(editAssignmentForm.employeeId),
      };

      const response = await ApiService.updateEquipmentAssignment(
        selectedAssignment.id,
        assignmentData
      );

      if (response.success) {
        toast.success(t('equipment.messages.assignmentUpdatedSuccess'));
        setShowEditAssignmentDialog(false);
        setEditAssignmentForm({
          employeeId: '',
          startDate: '',
          endDate: '',
          dailyRate: '',
          totalAmount: '',
          notes: '',
        });
        setSelectedAssignment(null);
        fetchAssignmentHistory(); // Refresh the history
      } else {
        toast.error(response.message || t('equipment.messages.updateAssignmentError'));
      }
    } catch (error) {
      toast.error(t('equipment.messages.updateAssignmentError'));
    } finally {
      setSubmittingEditAssignment(false);
    }
  };

  const openManualAssignmentDialog = () => {
    fetchEmployees();
    setShowManualAssignmentDialog(true);
  };

  const handleEditAssignment = (assignment: AssignmentHistoryItem) => {
    // Only allow editing manual assignments for now
    if (assignment.assignment_type !== 'manual') {
      toast.error(t('equipment.messages.onlyManualAssignmentsCanBeEdited'));
      return;
    }

    // Populate the edit form with current assignment data
    setEditAssignmentForm({
      employeeId: assignment.employee_id?.toString() || '',
      startDate: assignment.start_date
        ? new Date(assignment.start_date).toISOString().split('T')[0]
        : '',
      endDate: assignment.expected_end_date
        ? new Date(assignment.expected_end_date).toISOString().split('T')[0]
        : '',
      dailyRate: assignment.unit_price?.toString() || '',
      totalAmount: assignment.total_price?.toString() || '',
      notes: assignment.notes || '',
    });

    setSelectedAssignment(assignment);
    fetchEmployees(); // Load employees for the dropdown
    setShowEditAssignmentDialog(true);
  };

  const handleCompleteAssignment = async (assignment: AssignmentHistoryItem) => {
    if (!confirm(t('equipment.messages.confirmCompleteAssignment'))) {
      return;
    }

    try {
      const response = await ApiService.updateEquipmentAssignment(assignment.id, {
        status: 'completed',
      });

      if (response.success) {
        toast.success(t('messages.assignmentCompletedSuccess'));
        fetchAssignmentHistory();
      } else {
        toast.error(response.message || t('messages.completeAssignmentError'));
      }
    } catch (error) {
      toast.error(t('messages.completeAssignmentError'));
    }
  };

  const handleDeleteAssignment = async (assignment: AssignmentHistoryItem) => {
    if (
      !confirm(t('messages.confirmDeleteAssignment'))
    ) {
      return;
    }

    try {
      const response = await ApiService.deleteEquipmentAssignment(assignment.id);

      if (response.success) {
        toast.success(t('messages.assignmentDeletedSuccess'));
        fetchAssignmentHistory();
      } else {
        toast.error(response.message || t('messages.deleteAssignmentError'));
      }
    } catch (error) {
      toast.error(t('messages.deleteAssignmentError'));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>{t('equipment.assignmentHistory.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('equipment.messages.loadingAssignmentHistory')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>{t('equipment.assignmentHistory.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="ml-2">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchAssignmentHistory} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('equipment.actions.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = getTotalRevenue();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>{t('equipment.assignmentHistory.title')}</span>
          </CardTitle>
          <CardDescription>
            {t('equipment.assignmentHistory.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.totalAssignments')}</span>
              </div>
              <div className="text-2xl font-bold">{assignmentHistory.length}</div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.totalRevenue')}</span>
              </div>
              <div className="text-2xl font-bold">SAR {formatNumber(totalRevenue)}</div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.completed')}</span>
              </div>
              <div className="text-2xl font-bold">{getCompletedAssignments().length}</div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{t('equipment.assignmentHistory.currentStatus')}</span>
              </div>
              <div className="text-2xl font-bold">
                {getCurrentAssignment() ? t('equipment.status.assigned') : t('equipment.status.available')}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Assignment */}
          {getCurrentAssignment() && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('equipment.assignmentHistory.currentAssignment')}</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {getCurrentAssignment()?.assignment_type === 'rental'
                            ? `Rental #${getCurrentAssignment()?.rental_number}`
                            : getCurrentAssignment()?.assignment_type === 'project'
                              ? `Project: ${getCurrentAssignment()?.project_name}`
                              : `Manual: ${getCurrentAssignment()?.employee_name}`}
                        </span>
                        {getCurrentAssignment()?.status &&
                          getStatusBadge(getCurrentAssignment()!.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getCurrentAssignment()?.assignment_type === 'rental' &&
                          `Customer: ${getCurrentAssignment()?.customer_name}`}
                        {getCurrentAssignment()?.assignment_type === 'project' &&
                          `Project: ${getCurrentAssignment()?.project_name}`}
                        {getCurrentAssignment()?.assignment_type === 'manual' &&
                          `Employee: ${getCurrentAssignment()?.employee_name}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Start Date:{' '}
                        {getCurrentAssignment()?.rental_start_date ||
                        getCurrentAssignment()?.start_date
                          ? format(
                              new Date(
                                getCurrentAssignment()!.rental_start_date ||
                                  getCurrentAssignment()!.start_date!
                              ),
                              'MMM dd, yyyy'
                            )
                          : 'Not specified'}
                        {getCurrentAssignment()?.duration_days && getCurrentAssignment()!.duration_days > 0 && (
                          <span className="ml-2">
                            ({getCurrentAssignment()!.duration_days} {getCurrentAssignment()!.duration_days === 1 ? 'day' : 'days'}
                            {getCurrentAssignment()?.status === 'active' && ' ongoing'})
                          </span>
                        )}
                      </div>
                      {getCurrentAssignment()?.assignment_type === 'rental' && getCurrentAssignment()?.operator_count !== undefined && (
                        <div className="text-sm text-blue-600 font-medium">
                          {getCurrentAssignment()!.operator_count === 0
                            ? 'No operators assigned'
                            : getCurrentAssignment()!.operator_count === 1
                              ? '1 operator assigned'
                              : `${getCurrentAssignment()!.operator_count} operators assigned`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        SAR {formatNumber(Number(getCurrentAssignment()!.total_price) || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getCurrentAssignment()!.quantity} × SAR{' '}
                        {formatNumber(Number(getCurrentAssignment()!.unit_price) || 0)}{' '}
                        {getCurrentAssignment()!.rate_type}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* Assignment History Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('equipment.assignmentHistory.title')}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchAssignmentHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('equipment.actions.refresh')}
                </Button>
                <Button variant="default" size="sm" onClick={openManualAssignmentDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('equipment.actions.addManualAssignment')}
                </Button>
              </div>
            </div>

            {assignmentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>{t('equipment.messages.noAssignmentHistoryFound')}</p>
                <p className="text-sm">{t('equipment.messages.equipmentNotAssignedYet')}</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('equipment.assignmentHistory.table.equipment')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.type')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.reference')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.customerProjectEmployee')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.period')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.amount')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.status')}</TableHead>
                      <TableHead>{t('equipment.assignmentHistory.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentHistory.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.equipment_name}</div>
                            {assignment.equipment_door_number && (
                              <div className="text-xs text-muted-foreground">
                                Door: {assignment.equipment_door_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.assignment_type === 'rental' ? 'default' : 'secondary'
                            }
                          >
                            {assignment.assignment_type === 'rental'
                              ? t('equipment.assignmentHistory.type.rental')
                              : assignment.assignment_type === 'project'
                                ? t('equipment.assignmentHistory.type.project')
                                : t('equipment.assignmentHistory.type.manual')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {assignment.assignment_type === 'rental' ? (
                            <Link
                              href={`/${locale}/rental-management/${assignment.rental_id}`}
                              className="hover:underline text-blue-600"
                            >
                              {assignment.rental_number}
                            </Link>
                          ) : assignment.assignment_type === 'project' ? (
                            <Link
                              href={`/${locale}/project-management/${assignment.project_id}`}
                              className="hover:underline text-green-600"
                            >
                              Project #{assignment.project_id}
                            </Link>
                          ) : (
                            <span className="text-orange-600">Manual Assignment</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            {assignment.assignment_type === 'rental' && (
                              <>
                                <div className="font-medium">{assignment.customer_name}</div>
                                {assignment.customer_email && (
                                  <div className="text-sm text-muted-foreground">
                                    {assignment.customer_email}
                                  </div>
                                )}
                              </>
                            )}
                            {assignment.assignment_type === 'project' && (
                              <>
                                <div className="font-medium">{assignment.project_name}</div>
                                {assignment.project_description && (
                                  <div className="text-sm text-muted-foreground">
                                    {assignment.project_description}
                                  </div>
                                )}
                              </>
                            )}
                            {assignment.assignment_type === 'manual' && (
                              <>
                                <div className="font-medium">{assignment.employee_name}</div>
                                {assignment.employee_id_number && (
                                  <div className="text-sm text-muted-foreground">
                                    ID: {assignment.employee_id_number}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {assignment.rental_start_date || assignment.start_date
                                ? format(
                                    new Date(
                                      assignment.rental_start_date || assignment.start_date!
                                    ),
                                    'MMM dd, yyyy'
                                  )
                                : 'Not specified'}
                            </div>
                            {(assignment.rental_expected_end_date ||
                              assignment.expected_end_date) && (
                              <div className="text-muted-foreground">
                                to{' '}
                                {format(
                                  new Date(
                                    assignment.rental_expected_end_date ||
                                      assignment.expected_end_date!
                                  ),
                                  'MMM dd, yyyy'
                                )}
                              </div>
                            )}
                            {assignment.duration_days && assignment.duration_days > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {assignment.duration_days} {assignment.duration_days === 1 ? 'day' : 'days'}
                                {assignment.status === 'active' && ' (ongoing)'}
                              </div>
                            )}
                            {assignment.assignment_type === 'rental' && assignment.operator_count !== undefined && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">
                                {assignment.operator_count === 0
                                  ? 'No operators'
                                  : assignment.operator_count === 1
                                    ? '1 operator'
                                    : `${assignment.operator_count} operators`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              SAR {formatNumber(Number(assignment.total_price) || 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.quantity} × SAR{' '}
                              {formatNumber(Number(assignment.unit_price) || 0)}{' '}
                              {getRateTypeBadge(assignment.rate_type)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(assignment.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetailsDialog(assignment)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              {assignment.status === 'active' &&
                                assignment.assignment_type === 'manual' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleEditAssignment(assignment)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Assignment
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}

                              {assignment.status === 'active' && (
                                <DropdownMenuItem
                                  onClick={() => handleCompleteAssignment(assignment)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete Assignment
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleDeleteAssignment(assignment)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>Detailed information about this assignment</DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Assignment Type
                  </Label>
                  <Badge
                    variant={
                      selectedAssignment.assignment_type === 'rental' ? 'default' : 'secondary'
                    }
                  >
                    {selectedAssignment.assignment_type === 'rental'
                      ? 'Rental'
                      : selectedAssignment.assignment_type === 'project'
                        ? 'Project'
                        : 'Manual'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedAssignment.status)}
                  </div>
                </div>
              </div>

              <Separator />

              {selectedAssignment.assignment_type === 'rental' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Rental Information
                    </Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">Rental #{selectedAssignment.rental_number}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Customer Information
                    </Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.customer_name}</p>
                      {selectedAssignment.customer_email && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.customer_email}
                        </p>
                      )}
                      {selectedAssignment.customer_phone && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.customer_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedAssignment.assignment_type === 'project' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Project Information
                    </Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.project_name}</p>
                      {selectedAssignment.project_description && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.project_description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Project ID: {selectedAssignment.project_id}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {selectedAssignment.assignment_type === 'manual' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Employee Information
                    </Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.employee_name}</p>
                      {selectedAssignment.employee_id_number && (
                        <p className="text-sm text-muted-foreground">
                          ID: {selectedAssignment.employee_id_number}
                        </p>
                      )}
                      {selectedAssignment.employee_email && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.employee_email}
                        </p>
                      )}
                      {selectedAssignment.employee_phone && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.employee_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <p>
                    {selectedAssignment.rental_start_date || selectedAssignment.start_date
                      ? format(
                          new Date(
                            selectedAssignment.rental_start_date || selectedAssignment.start_date!
                          ),
                          'MMM dd, yyyy'
                        )
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Expected End Date
                  </Label>
                  <p>
                    {selectedAssignment.rental_expected_end_date ||
                    selectedAssignment.expected_end_date
                      ? format(
                          new Date(
                            selectedAssignment.rental_expected_end_date ||
                              selectedAssignment.expected_end_date!
                          ),
                          'MMM dd, yyyy'
                        )
                      : 'Not specified'}
                  </p>
                </div>
                {(selectedAssignment.rental_actual_end_date ||
                  selectedAssignment.actual_end_date) && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Actual End Date
                    </Label>
                    <p>
                      {selectedAssignment.rental_actual_end_date ||
                      selectedAssignment.actual_end_date
                        ? format(
                            new Date(
                              selectedAssignment.rental_actual_end_date ||
                                selectedAssignment.actual_end_date!
                            ),
                            'MMM dd, yyyy'
                          )
                        : 'Not specified'}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Days</Label>
                  <p>{selectedAssignment.days || 'Not specified'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p>{selectedAssignment.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rate Type</Label>
                  <div>{getRateTypeBadge(selectedAssignment.rate_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                  <p>SAR {formatNumber(Number(selectedAssignment.unit_price) || 0)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Price</Label>
                  <p className="font-bold">
                    SAR {formatNumber(Number(selectedAssignment.total_price) || 0)}
                  </p>
                </div>
              </div>

              {selectedAssignment.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="mt-1">{selectedAssignment.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <p>{format(new Date(selectedAssignment.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <p>{format(new Date(selectedAssignment.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Assignment Dialog */}
      <Dialog open={showManualAssignmentDialog} onOpenChange={setShowManualAssignmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Manual Assignment</DialogTitle>
            <DialogDescription>Assign this equipment to an employee manually</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualAssignmentSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <EmployeeDropdown
                value={manualAssignmentForm.employeeId}
                onValueChange={value =>
                  setManualAssignmentForm(prev => ({ ...prev, employeeId: value }))
                }
                label="Employee"
                placeholder="Select an employee"
                required={true}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={manualAssignmentForm.startDate}
                  onChange={e =>
                    setManualAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={manualAssignmentForm.endDate}
                  onChange={e =>
                    setManualAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))
                  }
                  min={manualAssignmentForm.startDate}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-rate">Daily Rate</Label>
                <Input
                  id="daily-rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualAssignmentForm.dailyRate}
                  onChange={e =>
                    setManualAssignmentForm(prev => ({ ...prev, dailyRate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-amount">Total Amount (Optional)</Label>
                <Input
                  id="total-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={manualAssignmentForm.totalAmount}
                  onChange={e =>
                    setManualAssignmentForm(prev => ({ ...prev, totalAmount: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this assignment..."
                value={manualAssignmentForm.notes}
                onChange={e =>
                  setManualAssignmentForm(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualAssignmentDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingManualAssignment}>
                {submittingManualAssignment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Manual Assignment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={showEditAssignmentDialog} onOpenChange={setShowEditAssignmentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Modify the details of this manual assignment</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditAssignmentSubmit} className="space-y-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <EmployeeDropdown
                value={editAssignmentForm.employeeId}
                onValueChange={value =>
                  setEditAssignmentForm(prev => ({ ...prev, employeeId: value }))
                }
                label="Employee"
                placeholder="Select an employee"
                required={true}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date *</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={editAssignmentForm.startDate}
                  onChange={e =>
                    setEditAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editAssignmentForm.endDate}
                  onChange={e =>
                    setEditAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))
                  }
                  min={editAssignmentForm.startDate}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-daily-rate">Daily Rate</Label>
                <Input
                  id="edit-daily-rate"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editAssignmentForm.dailyRate}
                  onChange={e =>
                    setEditAssignmentForm(prev => ({ ...prev, dailyRate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total-amount">Total Amount (Optional)</Label>
                <Input
                  id="edit-total-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editAssignmentForm.totalAmount}
                  onChange={e =>
                    setEditAssignmentForm(prev => ({ ...prev, totalAmount: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any additional notes about this assignment..."
                value={editAssignmentForm.notes}
                onChange={e => setEditAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditAssignmentDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingEditAssignment}>
                {submittingEditAssignment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4 mr-2" />
                )}
                Update Assignment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
