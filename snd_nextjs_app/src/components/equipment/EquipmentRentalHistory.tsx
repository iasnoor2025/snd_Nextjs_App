"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  History, 
  Calendar, 
  User, 
  DollarSign, 
  Package, 
  MapPin, 
  FileText, 
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit,
  CheckCircle,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";
import Link from "next/link";

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
  created_at: string;
  updated_at: string;
}

interface EquipmentAssignmentHistoryProps {
  equipmentId: number;
}

export default function EquipmentAssignmentHistory({ equipmentId }: EquipmentAssignmentHistoryProps) {
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
    notes: ''
  });
  const [editAssignmentForm, setEditAssignmentForm] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    dailyRate: '',
    totalAmount: '',
    notes: ''
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
        setError(response.message || 'Failed to load assignment history');
      }
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      setError('Failed to load assignment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      pending: { variant: 'outline' as const, label: 'Pending' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRentalStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRateTypeBadge = (rateType: string) => {
    const typeConfig = {
      daily: { variant: 'secondary' as const, label: 'Daily' },
      weekly: { variant: 'secondary' as const, label: 'Weekly' },
      monthly: { variant: 'secondary' as const, label: 'Monthly' },
    };
    
    const config = typeConfig[rateType as keyof typeof typeConfig] || { variant: 'outline' as const, label: rateType };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openDetailsDialog = (assignment: AssignmentHistoryItem) => {
    setSelectedAssignment(assignment);
    setShowDetailsDialog(true);
  };

  const getCurrentAssignment = () => {
    return assignmentHistory.find(assignment => 
      assignment.status === 'active' && 
      (assignment.rental_status === 'active' || assignment.rental_status === 'approved' || !assignment.rental_status)
    );
  };

  const getCompletedAssignments = () => {
    return assignmentHistory.filter(assignment => 
      assignment.rental_status === 'completed' || assignment.status === 'completed'
    );
  };

  const getTotalRevenue = () => {
    return assignmentHistory.reduce((total, assignment) => total + Number(assignment.total_price), 0);
  };

  const fetchEmployees = async () => {
    try {
      const response = await ApiService.getEmployees();
      if (response.success) {
        setEmployees(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
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
        daily_rate: manualAssignmentForm.dailyRate ? parseFloat(manualAssignmentForm.dailyRate) : undefined,
        total_amount: manualAssignmentForm.totalAmount ? parseFloat(manualAssignmentForm.totalAmount) : undefined,
        notes: manualAssignmentForm.notes || undefined,
        status: 'active',
        employee_id: parseInt(manualAssignmentForm.employeeId)
      };

      const response = await ApiService.createEquipmentAssignment(equipmentId, assignmentData);
      
      if (response.success) {
        toast.success('Manual assignment created successfully');
        setShowManualAssignmentDialog(false);
        setManualAssignmentForm({
          employeeId: '',
          startDate: '',
          endDate: '',
          dailyRate: '',
          totalAmount: '',
          notes: ''
        });
        fetchAssignmentHistory(); // Refresh the history
      } else {
        toast.error(response.message || 'Failed to create manual assignment');
      }
    } catch (error) {
      toast.error('Failed to create manual assignment');
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
        daily_rate: editAssignmentForm.dailyRate ? parseFloat(editAssignmentForm.dailyRate) : undefined,
        total_amount: editAssignmentForm.totalAmount ? parseFloat(editAssignmentForm.totalAmount) : undefined,
        notes: editAssignmentForm.notes || undefined,
        employee_id: parseInt(editAssignmentForm.employeeId)
      };

      const response = await ApiService.updateEquipmentAssignment(selectedAssignment.id, assignmentData);
      
      if (response.success) {
        toast.success('Assignment updated successfully');
        setShowEditAssignmentDialog(false);
        setEditAssignmentForm({
          employeeId: '',
          startDate: '',
          endDate: '',
          dailyRate: '',
          totalAmount: '',
          notes: ''
        });
        setSelectedAssignment(null);
        fetchAssignmentHistory(); // Refresh the history
      } else {
        toast.error(response.message || 'Failed to update assignment');
      }
    } catch (error) {
      toast.error('Failed to update assignment');
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
      toast.error('Only manual assignments can be edited');
      return;
    }

    // Populate the edit form with current assignment data
    setEditAssignmentForm({
      employeeId: assignment.employee_id?.toString() || '',
      startDate: assignment.start_date ? new Date(assignment.start_date).toISOString().split('T')[0] : '',
      endDate: assignment.expected_end_date ? new Date(assignment.expected_end_date).toISOString().split('T')[0] : '',
      dailyRate: assignment.unit_price?.toString() || '',
      totalAmount: assignment.total_price?.toString() || '',
      notes: assignment.notes || ''
    });

    setSelectedAssignment(assignment);
    fetchEmployees(); // Load employees for the dropdown
    setShowEditAssignmentDialog(true);
  };

  const handleCompleteAssignment = async (assignment: AssignmentHistoryItem) => {
    if (!confirm(`Are you sure you want to complete this assignment?`)) {
      return;
    }

    try {
      const response = await ApiService.updateEquipmentAssignment(assignment.id, {
        status: 'completed'
      });
      
      if (response.success) {
        toast.success('Assignment completed successfully');
        fetchAssignmentHistory();
      } else {
        toast.error(response.message || 'Failed to complete assignment');
      }
    } catch (error) {
      toast.error('Failed to complete assignment');
    }
  };

  const handleDeleteAssignment = async (assignment: AssignmentHistoryItem) => {
    if (!confirm(`Are you sure you want to delete this assignment? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await ApiService.deleteEquipmentAssignment(assignment.id);
      
      if (response.success) {
        toast.success('Assignment deleted successfully');
        fetchAssignmentHistory();
      } else {
        toast.error(response.message || 'Failed to delete assignment');
      }
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Rental History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading assignment history...</span>
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
            <span>Assignment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="ml-2">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAssignmentHistory}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
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
            <span>Assignment History</span>
          </CardTitle>
          <CardDescription>
            Track all assignments (rental, project, manual) and revenue for this equipment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Assignments</span>
              </div>
              <div className="text-2xl font-bold">{assignmentHistory.length}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
              </div>
              <div className="text-2xl font-bold">{getCompletedAssignments().length}</div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Current Status</span>
              </div>
              <div className="text-2xl font-bold">
                {getCurrentAssignment() ? 'Assigned' : 'Available'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Assignment */}
          {getCurrentAssignment() && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Current Assignment</h3>
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
                            : `Manual: ${getCurrentAssignment()?.employee_name}`
                          }
                        </span>
                        {getCurrentAssignment()?.rental_status && getRentalStatusBadge(getCurrentAssignment()!.rental_status!)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getCurrentAssignment()?.assignment_type === 'rental' && `Customer: ${getCurrentAssignment()?.customer_name}`}
                        {getCurrentAssignment()?.assignment_type === 'project' && `Project: ${getCurrentAssignment()?.project_name}`}
                        {getCurrentAssignment()?.assignment_type === 'manual' && `Employee: ${getCurrentAssignment()?.employee_name}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Start Date: {getCurrentAssignment()?.rental_start_date || getCurrentAssignment()?.start_date ? 
                          format(new Date(getCurrentAssignment()!.rental_start_date || getCurrentAssignment()!.start_date!), 'MMM dd, yyyy') : 
                          'Not specified'
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${getCurrentAssignment()!.total_price.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getCurrentAssignment()!.quantity} × ${getCurrentAssignment()!.unit_price.toFixed(2)} {getCurrentAssignment()!.rate_type}
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
               <h3 className="text-lg font-semibold">Assignment History</h3>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={fetchAssignmentHistory}>
                   <RefreshCw className="h-4 w-4 mr-2" />
                   Refresh
                 </Button>
                 <Button variant="default" size="sm" onClick={openManualAssignmentDialog}>
                   <Plus className="h-4 w-4 mr-2" />
                   Add Manual Assignment
                 </Button>
               </div>
             </div>
            
            {assignmentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>No assignment history found</p>
                <p className="text-sm">This equipment hasn't been assigned yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer/Project/Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentHistory.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <Badge variant={assignment.assignment_type === 'rental' ? 'default' : 'secondary'}>
                            {assignment.assignment_type === 'rental' ? 'Rental' : 
                             assignment.assignment_type === 'project' ? 'Project' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {assignment.assignment_type === 'rental' ? (
                            <Link 
                              href={`/modules/rental-management/${assignment.rental_id}`}
                              className="hover:underline text-blue-600"
                            >
                              {assignment.rental_number}
                            </Link>
                          ) : assignment.assignment_type === 'project' ? (
                            <Link 
                              href={`/modules/project-management/${assignment.project_id}`}
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
                                  <div className="text-sm text-muted-foreground">{assignment.customer_email}</div>
                                )}
                              </>
                            )}
                            {assignment.assignment_type === 'project' && (
                              <>
                                <div className="font-medium">{assignment.project_name}</div>
                                {assignment.project_description && (
                                  <div className="text-sm text-muted-foreground">{assignment.project_description}</div>
                                )}
                              </>
                            )}
                            {assignment.assignment_type === 'manual' && (
                              <>
                                <div className="font-medium">{assignment.employee_name}</div>
                                {assignment.employee_id_number && (
                                  <div className="text-sm text-muted-foreground">ID: {assignment.employee_id_number}</div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{assignment.rental_start_date || assignment.start_date ? 
                              format(new Date(assignment.rental_start_date || assignment.start_date!), 'MMM dd, yyyy') : 
                              'Not specified'
                            }</div>
                            {(assignment.rental_expected_end_date || assignment.expected_end_date) && (
                              <div className="text-muted-foreground">
                                to {format(new Date(assignment.rental_expected_end_date || assignment.expected_end_date!), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${assignment.total_price.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.quantity} × ${assignment.unit_price.toFixed(2)} {getRateTypeBadge(assignment.rate_type)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(assignment.status)}
                            {assignment.rental_status && getRentalStatusBadge(assignment.rental_status)}
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
                              
                              {assignment.status === 'active' && assignment.assignment_type === 'manual' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Assignment
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              
                              {assignment.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleCompleteAssignment(assignment)}>
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
            <DialogDescription>
              Detailed information about this assignment
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assignment Type</Label>
                  <Badge variant={selectedAssignment.assignment_type === 'rental' ? 'default' : 'secondary'}>
                    {selectedAssignment.assignment_type === 'rental' ? 'Rental' : 
                     selectedAssignment.assignment_type === 'project' ? 'Project' : 'Manual'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedAssignment.status)}
                    {selectedAssignment.rental_status && getRentalStatusBadge(selectedAssignment.rental_status)}
                  </div>
                </div>
              </div>

              <Separator />

              {selectedAssignment.assignment_type === 'rental' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Rental Information</Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">Rental #{selectedAssignment.rental_number}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Customer Information</Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.customer_name}</p>
                      {selectedAssignment.customer_email && (
                        <p className="text-sm text-muted-foreground">{selectedAssignment.customer_email}</p>
                      )}
                      {selectedAssignment.customer_phone && (
                        <p className="text-sm text-muted-foreground">{selectedAssignment.customer_phone}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedAssignment.assignment_type === 'project' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project Information</Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.project_name}</p>
                      {selectedAssignment.project_description && (
                        <p className="text-sm text-muted-foreground">{selectedAssignment.project_description}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Project ID: {selectedAssignment.project_id}</p>
                    </div>
                  </div>
                </>
              )}

              {selectedAssignment.assignment_type === 'manual' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee Information</Label>
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">{selectedAssignment.employee_name}</p>
                      {selectedAssignment.employee_id_number && (
                        <p className="text-sm text-muted-foreground">ID: {selectedAssignment.employee_id_number}</p>
                      )}
                      {selectedAssignment.employee_email && (
                        <p className="text-sm text-muted-foreground">{selectedAssignment.employee_email}</p>
                      )}
                      {selectedAssignment.employee_phone && (
                        <p className="text-sm text-muted-foreground">{selectedAssignment.employee_phone}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

                             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                   <p>{selectedAssignment.rental_start_date || selectedAssignment.start_date ? 
                    format(new Date(selectedAssignment.rental_start_date || selectedAssignment.start_date!), 'MMM dd, yyyy') : 
                    'Not specified'
                  }</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-muted-foreground">Expected End Date</Label>
                   <p>
                     {(selectedAssignment.rental_expected_end_date || selectedAssignment.expected_end_date)
                       ? format(new Date(selectedAssignment.rental_expected_end_date || selectedAssignment.expected_end_date!), 'MMM dd, yyyy')
                       : 'Not specified'
                     }
                   </p>
                 </div>
                 {(selectedAssignment.rental_actual_end_date || selectedAssignment.actual_end_date) && (
                   <div>
                     <Label className="text-sm font-medium text-muted-foreground">Actual End Date</Label>
                     <p>{selectedAssignment.rental_actual_end_date || selectedAssignment.actual_end_date ? 
                      format(new Date(selectedAssignment.rental_actual_end_date || selectedAssignment.actual_end_date!), 'MMM dd, yyyy') : 
                      'Not specified'
                    }</p>
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
                  <p>${selectedAssignment.unit_price.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total Price</Label>
                  <p className="font-bold">${selectedAssignment.total_price.toFixed(2)}</p>
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
             <DialogDescription>
               Assign this equipment to an employee manually
             </DialogDescription>
           </DialogHeader>
           
           <form onSubmit={handleManualAssignmentSubmit} className="space-y-4">
             {/* Employee Selection */}
             <div className="space-y-2">
               <Label htmlFor="employee">Employee *</Label>
               <Select 
                 value={manualAssignmentForm.employeeId} 
                 onValueChange={(value) => setManualAssignmentForm(prev => ({ ...prev, employeeId: value }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select an employee" />
                 </SelectTrigger>
                 <SelectContent>
                   {employees.map((employee) => (
                     <SelectItem key={employee.id} value={employee.id.toString()}>
                       <div className="flex flex-col">
                         <span className="font-medium">
                           {employee.first_name} {employee.last_name}
                         </span>
                         <span className="text-sm text-muted-foreground">
                           ID: {employee.employee_id}
                         </span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* Date Range */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="start-date">Start Date *</Label>
                 <Input
                   id="start-date"
                   type="date"
                   value={manualAssignmentForm.startDate}
                   onChange={(e) => setManualAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="end-date">End Date (Optional)</Label>
                 <Input
                   id="end-date"
                   type="date"
                   value={manualAssignmentForm.endDate}
                   onChange={(e) => setManualAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))}
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
                   onChange={(e) => setManualAssignmentForm(prev => ({ ...prev, dailyRate: e.target.value }))}
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
                   onChange={(e) => setManualAssignmentForm(prev => ({ ...prev, totalAmount: e.target.value }))}
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
                 onChange={(e) => setManualAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
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
             <DialogDescription>
               Modify the details of this manual assignment
             </DialogDescription>
           </DialogHeader>
           
           <form onSubmit={handleEditAssignmentSubmit} className="space-y-4">
             {/* Employee Selection */}
             <div className="space-y-2">
               <Label htmlFor="edit-employee">Employee *</Label>
               <Select 
                 value={editAssignmentForm.employeeId} 
                 onValueChange={(value) => setEditAssignmentForm(prev => ({ ...prev, employeeId: value }))}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select an employee" />
                 </SelectTrigger>
                 <SelectContent>
                   {employees.map((employee) => (
                     <SelectItem key={employee.id} value={employee.id.toString()}>
                       <div className="flex flex-col">
                         <span className="font-medium">
                           {employee.first_name} {employee.last_name}
                         </span>
                         <span className="text-sm text-muted-foreground">
                           ID: {employee.employee_id}
                         </span>
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* Date Range */}
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="edit-start-date">Start Date *</Label>
                 <Input
                   id="edit-start-date"
                   type="date"
                   value={editAssignmentForm.startDate}
                   onChange={(e) => setEditAssignmentForm(prev => ({ ...prev, startDate: e.target.value }))}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="edit-end-date">End Date (Optional)</Label>
                 <Input
                   id="edit-end-date"
                   type="date"
                   value={editAssignmentForm.endDate}
                   onChange={(e) => setEditAssignmentForm(prev => ({ ...prev, endDate: e.target.value }))}
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
                   onChange={(e) => setEditAssignmentForm(prev => ({ ...prev, dailyRate: e.target.value }))}
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
                   onChange={(e) => setEditAssignmentForm(prev => ({ ...prev, totalAmount: e.target.value }))}
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
                 onChange={(e) => setEditAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
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