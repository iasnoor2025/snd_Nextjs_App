'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Calendar, Plus, Search, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';

interface MaintenanceRecord {
  id: number;
  equipment_id: number;
  title: string;
  description: string;
  status: string;
  type: string;
  scheduled_date: string;
  due_date?: string;
  cost: string;
  created_at: string;
  updated_at: string;
  equipment: {
    id: number;
    name: string;
    doorNumber?: string;
  };
  mechanic?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function MaintenanceManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceRecord | null>(null);
  const [equipmentList, setEquipmentList] = useState<Array<{ id: number; name: string; doorNumber?: string }>>([]);
  const [formData, setFormData] = useState({
    equipment_id: '',
    type: 'corrective' as const,
    title: 'Maintenance',
    description: '',
    scheduled_date: '',
    due_date: '',
    assigned_to_employee_id: '',
    cost: '',
  });

  // Get allowed actions for maintenance management
  const allowedActions = getAllowedActions('Maintenance');

  useEffect(() => {
    fetchMaintenanceRecords();
    fetchEquipmentList();
  }, []);

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/maintenance');
      if (response.success) {
        setMaintenanceRecords(response.data || []);
      } else {
        toast.error('Failed to load maintenance records');
      }
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentList = async () => {
    try {
      const response = await ApiService.get('/equipment');
      if (response.success) {
        setEquipmentList(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching equipment list:', error);
    }
  };



  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment_id || !formData.description || !formData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.post('/maintenance', {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
        assigned_to_employee_id: formData.assigned_to_employee_id ? parseInt(formData.assigned_to_employee_id) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
      
      if (response.success) {
        toast.success('Maintenance record created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          equipment_id: '',
          type: 'corrective',
          title: 'Maintenance',
          description: '',
          scheduled_date: '',
          due_date: '',
          assigned_to_employee_id: '',
          cost: '',
        });
        fetchMaintenanceRecords();
      } else {
        toast.error(response.message || 'Failed to create maintenance record');
      }
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast.error('Failed to create maintenance record');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled': return 'default';
      case 'corrective': return 'destructive';
      case 'emergency': return 'destructive';
      case 'inspection': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'default';
    }
  };

  const handleViewMaintenance = (id: number) => {
    const maintenance = maintenanceRecords.find(record => record.id === id);
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditMaintenance = (id: number) => {
    const maintenance = maintenanceRecords.find(record => record.id === id);
    if (maintenance) {
      setSelectedMaintenance(maintenance);
      setFormData({
        equipment_id: maintenance.equipment_id.toString(),
        type: maintenance.type as any,
        title: maintenance.title,
        description: maintenance.description,
        scheduled_date: maintenance.scheduled_date,
        due_date: maintenance.due_date || '',
        assigned_to_employee_id: maintenance.mechanic?.id.toString() || '',
        cost: maintenance.cost || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteMaintenance = async (id: number) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        setLoading(true);
        console.log(`Attempting to delete maintenance record with ID: ${id}`);
        
        const response = await ApiService.delete(`/maintenance/${id}`);
        console.log('Delete response:', response);
        
        if (response.success) {
          toast.success('Maintenance record deleted successfully');
          fetchMaintenanceRecords();
        } else {
          toast.error(response.message || 'Failed to delete maintenance record');
        }
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('403')) {
            toast.error('Access denied: You do not have permission to delete maintenance records');
          } else if (error.message.includes('404')) {
            toast.error('Maintenance record not found');
          } else if (error.message.includes('500')) {
            toast.error('Server error: Please try again later');
          } else {
            toast.error(`Failed to delete maintenance record: ${error.message}`);
          }
        } else {
          toast.error('Failed to delete maintenance record');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMaintenance) return;

    if (!formData.equipment_id || !formData.description || !formData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.put(`/maintenance/${selectedMaintenance.id}`, {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
        assigned_to_employee_id: formData.assigned_to_employee_id ? parseInt(formData.assigned_to_employee_id) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
      
      if (response.success) {
        toast.success('Maintenance record updated successfully');
        setIsEditDialogOpen(false);
        setSelectedMaintenance(null);
        fetchMaintenanceRecords();
      } else {
        toast.error(response.message || 'Failed to update maintenance record');
      }
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast.error('Failed to update maintenance record');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.equipment.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: maintenanceRecords.length,
    scheduled: maintenanceRecords.filter(r => r.status === 'open').length,
    inProgress: maintenanceRecords.filter(r => r.status === 'in_progress').length,
    completed: maintenanceRecords.filter(r => r.status === 'completed').length,
    overdue: maintenanceRecords.filter(r => r.status === 'overdue').length,
    preventive: maintenanceRecords.filter(r => r.type === 'scheduled').length,
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Management</h1>
            <p className="text-muted-foreground">Schedule and track equipment maintenance activities</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
                <DialogDescription>
                  Create a new maintenance record for equipment
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment_id">Equipment *</Label>
                    <Select
                      value={formData.equipment_id}
                      onValueChange={(value: string) => setFormData({ ...formData, equipment_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentList.map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.id.toString()}>
                            {equipment.name}
                            {equipment.doorNumber && ` (Door: ${equipment.doorNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.equipment_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.name}
                        {equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.doorNumber && 
                          ` (Door: ${equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.doorNumber})`}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type">Maintenance Type *</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Maintenance title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the maintenance work needed"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <EmployeeDropdown
                      value={formData.assigned_to_employee_id}
                      onValueChange={(value: string) => setFormData({ ...formData, assigned_to_employee_id: value })}
                      label="Assigned Employee"
                      placeholder="Select employee (optional)"
                      required={false}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Estimated Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="SAR"
                    />
                  </div>
                </div>



                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Schedule Maintenance'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Maintenance Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Maintenance Details</DialogTitle>
              <DialogDescription>
                View maintenance record information
              </DialogDescription>
            </DialogHeader>
            {selectedMaintenance && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Equipment</Label>
                    <p className="text-sm">
                      {selectedMaintenance.equipment.name}
                      {selectedMaintenance.equipment.doorNumber && ` (Door: ${selectedMaintenance.equipment.doorNumber})`}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Maintenance Type</Label>
                    <Badge variant={getTypeColor(selectedMaintenance.type)}>
                      {selectedMaintenance.type}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="text-sm">{selectedMaintenance.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedMaintenance.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                    <p className="text-sm">{new Date(selectedMaintenance.scheduled_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <p className="text-sm">
                      {selectedMaintenance.due_date ? new Date(selectedMaintenance.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assigned Employee</Label>
                    <p className="text-sm">
                      {selectedMaintenance.mechanic 
                        ? `${selectedMaintenance.mechanic.first_name} ${selectedMaintenance.mechanic.last_name}`
                        : 'Not assigned'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Cost</Label>
                    <p className="text-sm">
                      {selectedMaintenance.cost ? `SAR ${Number(selectedMaintenance.cost).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedMaintenance.status)}>
                    {selectedMaintenance.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Maintenance Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Maintenance</DialogTitle>
              <DialogDescription>
                Update maintenance record information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateMaintenance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_equipment_id">Equipment *</Label>
                  <Select
                    value={formData.equipment_id}
                    onValueChange={(value: string) => setFormData({ ...formData, equipment_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentList.map(equipment => (
                        <SelectItem key={equipment.id} value={equipment.id.toString()}>
                          {equipment.name}
                          {equipment.doorNumber && ` (Door: ${equipment.doorNumber})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.equipment_id && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.name}
                      {equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.doorNumber && 
                        ` (Door: ${equipmentList.find(eq => eq.id === parseInt(formData.equipment_id))?.doorNumber})`}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit_type">Maintenance Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_title">Title *</Label>
                <Input
                  id="edit_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Maintenance title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the maintenance work needed"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_scheduled_date">Scheduled Date *</Label>
                  <Input
                    id="edit_scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_due_date">Due Date</Label>
                  <Input
                    id="edit_due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <EmployeeDropdown
                    value={formData.assigned_to_employee_id}
                    onValueChange={(value: string) => setFormData({ ...formData, assigned_to_employee_id: value })}
                    label="Assigned Employee"
                    placeholder="Select employee (optional)"
                    required={false}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_cost">Estimated Cost</Label>
                  <Input
                    id="edit_cost"
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="SAR"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Maintenance'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduled}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Records</CardTitle>
            <CardDescription>View and manage all equipment maintenance activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search maintenance records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading maintenance records...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.equipment.name}
                        {record.equipment.doorNumber && (
                          <div className="text-sm text-muted-foreground">Door: {record.equipment.doorNumber}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(record.type)}>
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(record.status)}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(record.scheduled_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.mechanic ? `${record.mechanic.first_name} ${record.mechanic.last_name}` : '-'}
                      </TableCell>
                      <TableCell>
                        {record.cost ? `SAR ${Number(record.cost).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMaintenance(record.id)}
                          >
                            View
                          </Button>
                          {hasPermission('update', 'Maintenance') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMaintenance(record.id)}
                            >
                              Edit
                            </Button>
                          )}
                          {hasPermission('delete', 'Maintenance') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMaintenance(record.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredRecords.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No maintenance records found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
