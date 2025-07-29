'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  FileText,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  Wrench,
  Package,
  Fuel,
  Receipt,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import apiService from '@/lib/api';
import {
  ManpowerDialog,
  EquipmentDialog,
  MaterialDialog,
  FuelDialog,
  ExpenseDialog,
  TaskDialog,
  TaskList
} from './components';
import { ProjectTask } from './components/TaskList';

type ResourceType = 'manpower' | 'equipment' | 'material' | 'fuel' | 'expense' | 'tasks';

interface ProjectResource {
  id: string;
  type: ResourceType;
  name: string;
  description?: string;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;

  // Manpower specific fields
  employee_id?: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  worker_name?: string;
  job_title?: string;
  daily_rate?: number;
  days_worked?: number;
  start_date?: string;
  end_date?: string;
  total_days?: number;

  // Equipment specific fields
  equipment_id?: string;
  equipment_name?: string;
  operator_name?: string;
  hourly_rate?: number;
  hours_worked?: number;
  usage_hours?: number;
  maintenance_cost?: number;

  // Material specific fields
  material_name?: string;
  unit?: string;
  unit_price?: number;
  material_id?: string;

  // Fuel specific fields
  fuel_type?: string;
  liters?: number;
  price_per_liter?: number;

  // Expense specific fields
  category?: string;
  expense_description?: string;
  amount?: number;

  // Task specific fields
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  completion_percentage?: number;
  assigned_to?: {
    id: string;
    name: string;
  };
  assigned_to_id?: string;

  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  budget?: number;
}

interface ResourceFilters {
  search?: string;
  status?: string;
  dateRange?: { start: Date | null; end: Date | null };
  employeeId?: string;
  equipmentId?: string;
  minRate?: number;
  maxRate?: number;
  category?: string;
  priority?: string;
}

export default function ProjectResourcesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ResourceFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Separate dialog states for each resource type
  const [manpowerDialogOpen, setManpowerDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Track the resource being edited
  const [editingResource, setEditingResource] = useState<ProjectResource | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = await apiService.getProject(projectId);
      setProject(projectResponse.data);

      // Fetch resources
      const resourcesResponse = await apiService.getProjectResources(projectId);
      setResources(resourcesResponse.data || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data when API fails
      setProject({
        id: projectId,
        name: 'Office Building Construction',
        budget: 2500000
      });

      // Mock resources with proper type structure
      const mockResources: ProjectResource[] = [
        {
          id: '1',
          type: 'manpower',
          name: 'John Doe',
          description: 'Site Engineer',
          daily_rate: 250,
          total_days: 30,
          total_cost: 7500,
          status: 'in_progress',
          date: '2024-01-15',
          worker_name: 'John Doe',
          job_title: 'Site Engineer',
          start_date: '2024-01-15',
          end_date: '2024-02-15',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          type: 'equipment',
          name: 'Excavator',
          description: 'CAT-320 Excavator',
          hourly_rate: 100,
          usage_hours: 160,
          total_cost: 16000,
          status: 'completed',
          date: '2024-01-10',
          equipment_name: 'CAT-320',
          operator_name: 'Mike Johnson',
          start_date: '2024-01-10',
          end_date: '2024-01-20',
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z'
        }
      ];

      setResources(mockResources);
      toast.info('Using demo data - backend not available');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource: ProjectResource) => {
    setEditingResource(resource);

    // Open the appropriate dialog based on resource type
    switch (resource.type) {
      case 'manpower':
        setManpowerDialogOpen(true);
        break;
      case 'equipment':
        setEquipmentDialogOpen(true);
        break;
      case 'material':
        setMaterialDialogOpen(true);
        break;
      case 'fuel':
        setFuelDialogOpen(true);
        break;
      case 'expense':
        setExpenseDialogOpen(true);
        break;
      case 'tasks':
        setTaskDialogOpen(true);
        break;
    }
  };

  const handleDeleteResource = async (resource: ProjectResource) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      setLoading(true);
      await apiService.deleteProjectResource(projectId, resource.id);
      toast.success('Resource deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = (type: ResourceType) => {
    setEditingResource(null);

    // Open the appropriate dialog based on resource type
    switch (type) {
      case 'manpower':
        setManpowerDialogOpen(true);
        break;
      case 'equipment':
        setEquipmentDialogOpen(true);
        break;
      case 'material':
        setMaterialDialogOpen(true);
        break;
      case 'fuel':
        setFuelDialogOpen(true);
        break;
      case 'expense':
        setExpenseDialogOpen(true);
        break;
      case 'tasks':
        setTaskDialogOpen(true);
        break;
    }
  };

  const handleDialogClose = () => {
    setManpowerDialogOpen(false);
    setEquipmentDialogOpen(false);
    setMaterialDialogOpen(false);
    setFuelDialogOpen(false);
    setExpenseDialogOpen(false);
    setTaskDialogOpen(false);
    setEditingResource(null);
  };

  const handleResourceSuccess = () => {
    fetchData();
    handleDialogClose();
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'manpower':
        return <Users className="h-4 w-4" />;
      case 'equipment':
        return <Wrench className="h-4 w-4" />;
      case 'material':
        return <Package className="h-4 w-4" />;
      case 'fuel':
        return <Fuel className="h-4 w-4" />;
      case 'expense':
        return <Receipt className="h-4 w-4" />;
      case 'tasks':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterResourcesByType = (type: ResourceType) => {
    return resources.filter(resource => resource.type === type);
  };

  const getResourceCount = (type: ResourceType) => {
    return filterResourcesByType(type).length;
  };

  const calculateTotalCost = (type: ResourceType) => {
    return filterResourcesByType(type).reduce((sum, resource) => sum + (resource.total_cost || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/modules/project-management/${projectId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Project Resources</h1>
            <p className="text-muted-foreground">{project?.name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Resource Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manpower</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('manpower')}</div>
            <p className="text-xs text-muted-foreground">
              ${calculateTotalCost('manpower').toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('equipment')}</div>
            <p className="text-xs text-muted-foreground">
              ${calculateTotalCost('equipment').toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('material')}</div>
            <p className="text-xs text-muted-foreground">
              ${calculateTotalCost('material').toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('fuel')}</div>
            <p className="text-xs text-muted-foreground">
              ${calculateTotalCost('fuel').toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('expense')}</div>
            <p className="text-xs text-muted-foreground">
              ${calculateTotalCost('expense').toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getResourceCount('tasks')}</div>
            <p className="text-xs text-muted-foreground">
              {filterResourcesByType('tasks').filter(t => t.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resources Tabs */}
      <Tabs defaultValue="manpower" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="manpower" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Manpower</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>Equipment</span>
          </TabsTrigger>
          <TabsTrigger value="material" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Materials</span>
          </TabsTrigger>
          <TabsTrigger value="fuel" className="flex items-center space-x-2">
            <Fuel className="h-4 w-4" />
            <span>Fuel</span>
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Tasks</span>
          </TabsTrigger>
        </TabsList>

        {(['manpower', 'equipment', 'material', 'fuel', 'expense'] as ResourceType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getResourceTypeIcon(type)}
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </CardTitle>
                    <CardDescription>
                      Manage {type} resources for this project
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {getResourceCount(type)} items
                    </span>
                    <Button size="sm" onClick={() => handleAddResource(type)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterResourcesByType(type).map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{resource.name || resource.title}</div>
                            {resource.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {resource.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {type === 'manpower' && (
                              <>
                                {resource.job_title && <div>{resource.job_title}</div>}
                                {resource.daily_rate && <div>Rate: ${resource.daily_rate}/day</div>}
                                {resource.total_days && <div>Days: {resource.total_days}</div>}
                              </>
                            )}
                            {type === 'equipment' && (
                              <>
                                {resource.operator_name && <div>Operator: {resource.operator_name}</div>}
                                {resource.hourly_rate && <div>Rate: ${resource.hourly_rate}/hr</div>}
                                {resource.usage_hours && <div>Hours: {resource.usage_hours}</div>}
                              </>
                            )}
                            {type === 'material' && (
                              <>
                                {resource.quantity && <div>Qty: {resource.quantity}</div>}
                                {resource.unit && <div>Unit: {resource.unit}</div>}
                                {resource.unit_price && <div>Price: ${resource.unit_price}</div>}
                              </>
                            )}
                            {type === 'fuel' && (
                              <>
                                {resource.liters && <div>Liters: {resource.liters}</div>}
                                {resource.price_per_liter && <div>Price: ${resource.price_per_liter}/L</div>}
                              </>
                            )}
                            {type === 'expense' && (
                              <>
                                {resource.category && <div>Category: {resource.category}</div>}
                                {resource.expense_description && <div>{resource.expense_description}</div>}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ${(resource.total_cost || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {resource.date && format(new Date(resource.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditResource(resource)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteResource(resource)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Tasks Tab - Using TaskList Component */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Tasks</span>
                  </CardTitle>
                  <CardDescription>
                    Manage tasks for this project
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {getResourceCount('tasks')} items
                  </span>
                  <Button size="sm" onClick={() => handleAddResource('tasks')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={filterResourcesByType('tasks').map(resource => ({
                  id: resource.id,
                  project_id: projectId,
                  title: resource.title || resource.name || '',
                  description: resource.description || null,
                  status: resource.status,
                  priority: resource.priority || 'medium',
                  due_date: resource.due_date || null,
                  completion_percentage: resource.completion_percentage || 0,
                  assigned_to: resource.assigned_to || null,
                  created_at: resource.created_at,
                  updated_at: resource.updated_at
                }))}
                onEdit={(task) => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    handleEditResource(resource);
                  }
                }}
                onDelete={(task) => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    handleDeleteResource(resource);
                  }
                }}
                onStatusChange={async (task, status) => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    try {
                      await apiService.updateProjectResource(projectId, task.id, {
                        ...resource,
                        status
                      });
                      handleResourceSuccess();
                    } catch (error) {
                      console.error('Error updating task status:', error);
                      toast.error('Failed to update task status');
                    }
                  }
                }}
                onCompletionChange={async (task, percentage) => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    try {
                      await apiService.updateProjectResource(projectId, task.id, {
                        ...resource,
                        completion_percentage: percentage
                      });
                      handleResourceSuccess();
                    } catch (error) {
                      console.error('Error updating task completion:', error);
                      toast.error('Failed to update task completion');
                    }
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Separate Dialogs for each resource type */}
      <ManpowerDialog
        open={manpowerDialogOpen}
        onOpenChange={setManpowerDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />

      <EquipmentDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />

      <MaterialDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />

      <FuelDialog
        open={fuelDialogOpen}
        onOpenChange={setFuelDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={handleResourceSuccess}
      />
    </div>
  );
}
