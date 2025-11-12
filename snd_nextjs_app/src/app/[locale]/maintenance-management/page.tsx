'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EquipmentDropdown } from '@/components/ui/equipment-dropdown';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { MaintenanceItemsManager, MaintenanceItem } from '@/components/maintenance/MaintenanceItemsManager';
import { MaintenanceWorkflow } from '@/components/maintenance/MaintenanceWorkflow';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Calendar, Plus, Search, Wrench, AlertTriangle, Clock } from 'lucide-react';
import ApiService from '@/lib/api-service';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { useRouter , useParams } from 'next/navigation';

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
  const { hasPermission } = useRBAC();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useI18n();
  const router = useRouter();
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    type: 'corrective' as 'scheduled' | 'corrective' | 'emergency' | 'inspection',
    title: 'Maintenance',
    description: '',
    scheduled_date: '',
    due_date: '',
    assigned_to_employee_id: '',
    cost: '',
  });
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);

  // Get allowed actions for maintenance management
  // const allowedActions = getAllowedActions('Maintenance');

  useEffect(() => {
    fetchMaintenanceRecords();
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


  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.equipment_id || !formData.description || !formData.scheduled_date) {
      toast.error(t('maintenance.validation.validationError'));
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.post('/maintenance', {
        ...formData,
        equipment_id: parseInt(formData.equipment_id),
        assigned_to_employee_id: formData.assigned_to_employee_id ? parseInt(formData.assigned_to_employee_id) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        items: maintenanceItems,
      });
      
      if (response.success) {
        toast.success(t('maintenance.messages.createSuccess'));
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
        toast.error(response.message || t('maintenance.messages.createError'));
      }
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      toast.error(t('maintenance.messages.createError'));
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
    router.push(`/${locale}/maintenance-management/${id}`);
  };

  const handleEditMaintenance = (id: number) => {
    router.push(`/${locale}/maintenance-management/${id}/edit`);
  };

  const handleDeleteMaintenance = async (id: number) => {
      if (confirm(t('common.messages.deleteConfirm'))) {
      try {
        setLoading(true);
        console.log(`Attempting to delete maintenance record with ID: ${id}`);
        
        const response = await ApiService.delete(`/maintenance/${id}`);
        console.log('Delete response:', response);
        
        if (response.success) {
          toast.success(t('maintenance.messages.deleteSuccess'));
          fetchMaintenanceRecords();
        } else {
          toast.error(response.message || t('maintenance.messages.deleteError'));
        }
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('403')) {
            toast.error(t('maintenance.messages.accessDenied'));
          } else if (error.message.includes('404')) {
            toast.error(t('maintenance.messages.maintenanceNotFound'));
          } else if (error.message.includes('500')) {
            toast.error(t('maintenance.messages.errorGeneral'));
          } else {
            toast.error(t('maintenance.messages.deleteError'));
          }
        } else {
          toast.error(t('maintenance.messages.deleteError'));
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
      toast.error(t('maintenance.validation.validationError'));
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
        toast.success(t('maintenance.messages.updateSuccess'));
        setIsEditDialogOpen(false);
        setSelectedMaintenance(null);
        fetchMaintenanceRecords();
      } else {
        toast.error(response.message || t('maintenance.messages.updateError'));
      }
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast.error(t('maintenance.messages.updateError'));
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('maintenance.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('maintenance.subtitle')}</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t('maintenance.actions.scheduleMaintenance')} +
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('maintenance.actions.scheduleMaintenance')}</DialogTitle>
                <DialogDescription>
                  {t('maintenance.create.description')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <EquipmentDropdown
                      key={`create-equipment-${isCreateDialogOpen}`}
                      value={formData.equipment_id}
                      onValueChange={(value: string) => setFormData({ ...formData, equipment_id: value })}
                      label={t('maintenance.fields.equipment')}
                      placeholder={t('maintenance.fields.selectEquipment')}
                      required={true}
                      showSearch={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">{t('maintenance.fields.type')} *</Label>
                    <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as 'scheduled' | 'corrective' | 'emergency' | 'inspection' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">{t('maintenance.types.scheduled')}</SelectItem>
                        <SelectItem value="corrective">{t('maintenance.types.corrective')}</SelectItem>
                        <SelectItem value="emergency">{t('maintenance.types.emergency')}</SelectItem>
                        <SelectItem value="inspection">{t('maintenance.types.inspection')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="title">{t('maintenance.fields.title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('maintenance.fields.titlePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('maintenance.fields.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('maintenance.fields.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled_date">{t('maintenance.fields.scheduledDate')} *</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">{t('maintenance.fields.dueDate')}</Label>
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
                      key={`create-employee-${isCreateDialogOpen}`}
                      value={formData.assigned_to_employee_id}
                      onValueChange={(value: string) => setFormData({ ...formData, assigned_to_employee_id: value })}
                      label={t('maintenance.fields.assignedTo')}
                      placeholder={t('maintenance.fields.selectEmployee')}
                      required={false}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">{t('maintenance.fields.estimatedCost')}</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder={t('maintenance.fields.costPlaceholder')}
                    />
                  </div>
                </div>

                {/* Maintenance Items Manager */}
                <MaintenanceItemsManager
                  items={maintenanceItems}
                  onItemsChange={setMaintenanceItems}
                />

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

        {/* View/Edit dialogs removed; navigation-based details/edit pages are used now */}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.totalRecords')}</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.scheduled')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduled}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.inProgress')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('maintenance.dashboard.overdue')}</CardTitle>
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
            <CardTitle>{t('maintenance.dashboard.title')}</CardTitle>
            <CardDescription>{t('maintenance.dashboard.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('maintenance.dashboard.searchPlaceholder')}
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
                  <SelectItem value="all">{t('maintenance.dashboard.allTypes')}</SelectItem>
                  <SelectItem value="scheduled">{t('maintenance.types.scheduled')}</SelectItem>
                  <SelectItem value="corrective">{t('maintenance.types.corrective')}</SelectItem>
                  <SelectItem value="emergency">{t('maintenance.types.emergency')}</SelectItem>
                  <SelectItem value="inspection">{t('maintenance.types.inspection')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('maintenance.dashboard.allStatuses')}</SelectItem>
                  <SelectItem value="open">{t('maintenance.status.open')}</SelectItem>
                  <SelectItem value="in_progress">{t('maintenance.status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('maintenance.status.completed')}</SelectItem>
                  <SelectItem value="overdue">{t('maintenance.status.overdue')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">{t('maintenance.messages.loading')}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('maintenance.dashboard.equipment')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.type')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.description')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.status')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.scheduledDate')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.technician')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.cost')}</TableHead>
                    <TableHead>{t('maintenance.dashboard.actions')}</TableHead>
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
                            {t('maintenance.actions.viewMaintenance')}
                          </Button>
                          {hasPermission('update', 'Maintenance') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditMaintenance(record.id)}
                            >
                              {t('maintenance.actions.editMaintenance')}
                            </Button>
                          )}
                          {hasPermission('delete', 'Maintenance') && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMaintenance(record.id)}
                            >
                              {t('maintenance.actions.deleteMaintenance')}
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
                {t('maintenance.dashboard.noRecordsFound')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
