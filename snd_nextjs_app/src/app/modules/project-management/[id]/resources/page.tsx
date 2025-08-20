'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Filter,
  Fuel,
  Package,
  Plus,
  Receipt,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  EquipmentDialog,
  ExpenseDialog,
  FuelDialog,
  ManpowerDialog,
  MaterialDialog,
  TaskDialog,
  TaskList,
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
  employee_name?: string;
  employee_file_number?: string;
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

  // Delete confirmation state
  const [deleteResource, setDeleteResource] = useState<ProjectResource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectResponse = await ApiService.get<{ data: Project }>(`/projects/${projectId}`);
      setProject(projectResponse.data);

      // Fetch all resource types using new specific endpoints
      const [manpowerResponse, equipmentResponse, materialsResponse, fuelResponse, expensesResponse, tasksResponse] = await Promise.all([
        ApiService.getProjectManpower(Number(projectId)),
        ApiService.getProjectEquipment(Number(projectId)),
        ApiService.getProjectMaterials(Number(projectId)),
        ApiService.getProjectFuel(Number(projectId)),
        ApiService.getProjectExpenses(Number(projectId)),
        ApiService.getProjectTasks(Number(projectId)),
      ]);

      // Combine all resources with their types
      const allResources = [
        ...(manpowerResponse.data || []).map((resource: any) => ({ ...resource, type: 'manpower' })),
        ...(equipmentResponse.data || []).map((resource: any) => ({ ...resource, type: 'equipment' })),
        ...(materialsResponse.data || []).map((resource: any) => ({ ...resource, type: 'material' })),
        ...(fuelResponse.data || []).map((resource: any) => ({ ...resource, type: 'fuel' })),
        ...(expensesResponse.data || []).map((resource: any) => ({ ...resource, type: 'expense' })),
        ...(tasksResponse.data || []).map((resource: any) => ({ ...resource, type: 'tasks' })),
      ];

      // Transform the API response to match our frontend structure
      const transformedResources = allResources.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name:
          resource.name ||
          resource.title ||
          resource.workerName ||
          resource.equipmentName ||
          resource.materialName ||
          resource.jobTitle ||
          resource.companyName ||
          'Unnamed Resource',
        description: resource.description,
        quantity: resource.quantity,
        unit_cost: resource.unitCost ? parseFloat(resource.unitCost) : resource.hourlyRate ? parseFloat(resource.hourlyRate) : resource.dailyRate ? parseFloat(resource.dailyRate) : undefined,
        total_cost: resource.totalCost ? parseFloat(resource.totalCost) : undefined,
        date: resource.date || resource.startDate || resource.purchaseDate || resource.expenseDate,
        status: resource.status,
        notes: resource.notes,

        // Manpower specific fields
        employee_id: resource.employeeId?.toString(),
        employee: resource.employee
          ? {
              id: resource.employee.id.toString(),
              first_name: resource.employee.first_name,
              last_name: resource.employee.last_name,
              full_name: `${resource.employee.first_name} ${resource.employee.last_name}`,
            }
          : undefined,
        employee_name: resource.employeeName,
        employee_file_number: resource.employeeFileNumber,
        worker_name: resource.workerName,
        job_title: resource.jobTitle,
        daily_rate: resource.dailyRate ? parseFloat(resource.dailyRate) : undefined,
        days_worked: resource.daysWorked,
        start_date: resource.startDate,
        end_date: resource.endDate,
        total_days: resource.totalDays,

        // Equipment specific fields
        equipment_id: resource.equipmentId?.toString(),
        equipment_name: resource.equipmentName,
        operator_name: resource.operatorName,
        hourly_rate: resource.hourlyRate ? parseFloat(resource.hourlyRate) : undefined,
        hours_worked: resource.hoursWorked ? parseFloat(resource.hoursWorked) : undefined,
        usage_hours: resource.usageHours ? parseFloat(resource.usageHours) : undefined,
        maintenance_cost: resource.maintenanceCost
          ? parseFloat(resource.maintenanceCost)
          : undefined,

        // Material specific fields
        material_name: resource.name,
        unit: resource.unit,
        unit_price: resource.unitPrice ? parseFloat(resource.unitPrice) : undefined,
        material_id: resource.id?.toString(),

        // Fuel specific fields
        fuel_type: resource.fuelType,
        liters: resource.quantity,
        price_per_liter: resource.unitPrice ? parseFloat(resource.unitPrice) : undefined,

        // Expense specific fields
        category: resource.category,
        expense_description: resource.description,
        amount: resource.amount ? parseFloat(resource.amount) : undefined,

        // Task specific fields
        title: resource.name || resource.title, // API returns 'name', fallback to 'title'
        priority: resource.priority,
        due_date: resource.dueDate,
        completion_percentage: resource.completionPercentage,
        assigned_to: resource.assignedToId
          ? {
              id: resource.assignedToId.toString(),
              name: `${resource.assignedToName || ''} ${resource.assignedToLastName || ''}`.trim() || 'Unassigned',
            }
          : undefined,
        assigned_to_id: resource.assignedToId?.toString(),

        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      setResources(transformedResources);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load project data');
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

  const handleDeleteResource = (resource: ProjectResource) => {
    setDeleteResource(resource);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteResource) return;

    try {
      setLoading(true);
      
      // Use appropriate delete endpoint based on resource type
      switch (deleteResource.type) {
        case 'manpower':
          await ApiService.delete(`/projects/${projectId}/manpower/${deleteResource.id}`);
          break;
        case 'equipment':
          await ApiService.delete(`/projects/${projectId}/equipment/${deleteResource.id}`);
          break;
        case 'material':
          await ApiService.delete(`/projects/${projectId}/materials/${deleteResource.id}`);
          break;
        case 'fuel':
          await ApiService.delete(`/projects/${projectId}/fuel/${deleteResource.id}`);
          break;
        case 'expense':
          await ApiService.delete(`/projects/${projectId}/expenses/${deleteResource.id}`);
          break;
        default:
          throw new Error(`Unknown resource type: ${deleteResource.type}`);
      }
      
             toast.success('Resource deleted successfully');
       // Use targeted update if possible, otherwise refresh all data
       if (deleteResource.type === 'tasks') {
         await updateTasksData();
       } else if (deleteResource.type === 'manpower') {
         await updateManpowerData();
       } else if (deleteResource.type === 'equipment') {
         await updateEquipmentData();
       } else {
         fetchData();
       }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setDeleteResource(null);
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

  const handleResourceSuccess = (resourceType?: ResourceType) => {
    // Use targeted update based on resource type, fallback to full refresh
    if (resourceType === 'tasks') {
      updateTasksData();
    } else if (resourceType === 'manpower') {
      updateManpowerData();
    } else if (resourceType === 'equipment') {
      updateEquipmentData();
    } else {
      // For other resource types, refresh all data
      fetchData();
    }
    handleDialogClose();
  };

  // Function to update only tasks data
  const updateTasksData = async () => {
    try {
      const tasksResponse = await ApiService.getProjectTasks(Number(projectId));
      const tasksData = (tasksResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'tasks' 
      }));

      // Transform tasks data to match frontend structure
      const transformedTasks = tasksData.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name: resource.name || resource.title || 'Unnamed Task',
        description: resource.description,
        quantity: resource.quantity,
        unit_cost: resource.unitCost ? parseFloat(resource.unitCost) : undefined,
        total_cost: resource.totalCost ? parseFloat(resource.totalCost) : undefined,
        date: resource.date || resource.startDate || resource.purchaseDate || resource.expenseDate,
        status: resource.status,
        notes: resource.notes,
        title: resource.name || resource.title,
        priority: resource.priority,
        due_date: resource.dueDate,
        completion_percentage: resource.completionPercentage,
        assigned_to: resource.assignedToId
          ? {
              id: resource.assignedToId.toString(),
              name: `${resource.assignedToName || ''} ${resource.assignedToLastName || ''}`.trim() || 'Unassigned',
            }
          : undefined,
        assigned_to_id: resource.assignedToId?.toString(),
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      // Update only tasks in the resources state
      setResources(prevResources => {
        const nonTaskResources = prevResources.filter(r => r.type !== 'tasks');
        return [...nonTaskResources, ...transformedTasks];
      });
      
      // Update statistics
      updateStatistics();
    } catch (error) {
      console.error('Error updating tasks data:', error);
    }
  };

  // Function to update only manpower data
  const updateManpowerData = async () => {
    try {
      const manpowerResponse = await ApiService.getProjectManpower(Number(projectId));
      const manpowerData = (manpowerResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'manpower' 
      }));

      // Transform manpower data to match frontend structure
      const transformedManpower = manpowerData.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name: resource.name || resource.title || resource.workerName || resource.jobTitle || 'Unnamed Resource',
        description: resource.description,
        quantity: resource.quantity,
        unit_cost: resource.dailyRate ? parseFloat(resource.dailyRate) : undefined,
        total_cost: resource.totalCost ? parseFloat(resource.totalCost) : undefined,
        date: resource.startDate,
        status: resource.status,
        notes: resource.notes,
        employee_id: resource.employeeId?.toString(),
        employee: resource.employee
          ? {
              id: resource.employee.id.toString(),
              first_name: resource.employee.first_name,
              last_name: resource.employee.last_name,
              full_name: `${resource.employee.first_name} ${resource.employee.last_name}`,
            }
          : undefined,
        employee_name: resource.employeeName,
        employee_file_number: resource.employeeFileNumber,
        worker_name: resource.workerName,
        job_title: resource.jobTitle,
        daily_rate: resource.dailyRate ? parseFloat(resource.dailyRate) : undefined,
        days_worked: resource.daysWorked,
        start_date: resource.startDate,
        end_date: resource.endDate,
        total_days: resource.totalDays,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      // Update only manpower in the resources state
      setResources(prevResources => {
        const nonManpowerResources = prevResources.filter(r => r.type !== 'manpower');
        return [...nonManpowerResources, ...transformedManpower];
      });
      
      // Update statistics
      updateStatistics();
    } catch (error) {
      console.error('Error updating manpower data:', error);
    }
  };

  // Function to update only equipment data
  const updateEquipmentData = async () => {
    try {
      const equipmentResponse = await ApiService.getProjectEquipment(Number(projectId));
      const equipmentData = (equipmentResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'equipment' 
      }));

      // Transform equipment data to match frontend structure
      const transformedEquipment = equipmentData.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name: resource.name || resource.title || resource.equipmentName || 'Unnamed Equipment',
        description: resource.description,
        quantity: resource.quantity,
        unit_cost: resource.hourlyRate ? parseFloat(resource.hourlyRate) : undefined,
        total_cost: resource.totalCost ? parseFloat(resource.totalCost) : undefined,
        date: resource.startDate,
        status: resource.status,
        notes: resource.notes,
        equipment_id: resource.equipmentId?.toString(),
        equipment_name: resource.equipmentName,
        operator_name: resource.operatorName,
        hourly_rate: resource.hourlyRate ? parseFloat(resource.hourlyRate) : undefined,
        hours_worked: resource.hoursWorked ? parseFloat(resource.hoursWorked) : undefined,
        usage_hours: resource.usageHours ? parseFloat(resource.usageHours) : undefined,
        maintenance_cost: resource.maintenanceCost ? parseFloat(resource.maintenanceCost) : undefined,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      // Update only equipment in the resources state
      setResources(prevResources => {
        const nonEquipmentResources = prevResources.filter(r => r.type !== 'equipment');
        return [...nonEquipmentResources, ...transformedEquipment];
      });
      
      // Update statistics
      updateStatistics();
    } catch (error) {
      console.error('Error updating equipment data:', error);
    }
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
    return filterResourcesByType(type).reduce(
      (sum, resource) => sum + (resource.total_cost || 0),
      0
    );
  };

  // Function to update statistics without full page refresh
  const updateStatistics = () => {
    // This will trigger a re-render of the statistics cards
    // The existing filterResourcesByType and calculateTotalCost functions
    // will automatically use the updated resources state
    setResources(prevResources => [...prevResources]);
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
              SAR {calculateTotalCost('manpower').toLocaleString()}
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
              SAR {calculateTotalCost('equipment').toLocaleString()}
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
              SAR {calculateTotalCost('material').toLocaleString()}
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
              SAR {calculateTotalCost('fuel').toLocaleString()}
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
              SAR {calculateTotalCost('expense').toLocaleString()}
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
              {filterResourcesByType('tasks').filter(t => t.status === 'completed').length}{' '}
              completed
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

        {(['manpower', 'equipment', 'material', 'fuel', 'expense'] as ResourceType[]).map(type => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getResourceTypeIcon(type)}
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </CardTitle>
                    <CardDescription>Manage {type} resources for this project</CardDescription>
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
                      {type === 'manpower' ? (
                        <>
                          <TableHead>File #</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Job</TableHead>
                          <TableHead>Rates</TableHead>
                          <TableHead>Joining Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Cost</TableHead>
                        </>
                      ) : type === 'equipment' ? (
                        <>
                          <TableHead>Equipment</TableHead>
                          <TableHead>Operator</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Usage Hours</TableHead>
                          <TableHead>Hourly Rate</TableHead>
                          <TableHead>Cost</TableHead>
                        </>
                      ) : type === 'material' ? (
                        <>
                          <TableHead>Material</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Cost</TableHead>
                        </>
                      ) : type === 'fuel' ? (
                        <>
                          <TableHead>Fuel Type</TableHead>
                          <TableHead>Liters</TableHead>
                          <TableHead>Price/Liter</TableHead>
                          <TableHead>Total Cost</TableHead>
                        </>
                      ) : type === 'expense' ? (
                        <>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Cost</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterResourcesByType(type).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={
                            type === 'manpower'
                              ? 8
                              : type === 'equipment'
                                ? 8
                                : type === 'material'
                                  ? 6
                                  : type === 'fuel'
                                    ? 5
                                    : type === 'expense'
                                      ? 4
                                      : 4
                          }
                          className="text-center py-8"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            {getResourceTypeIcon(type)}
                            <p className="text-muted-foreground">No {type} resources found</p>
                            <Button size="sm" onClick={() => handleAddResource(type)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterResourcesByType(type).map(resource => (
                        <TableRow key={resource.id}>
                          {type === 'manpower' ? (
                            <>
                              {/* File # Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.employee_file_number || '-'}
                                </div>
                              </TableCell>

                              {/* Employee Name Column */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">
                                    {resource.employee_name
                                      ? resource.employee_name
                                      : resource.name || resource.title}
                                  </div>
                                  {resource.employee_id ||
                                  resource.employee_name ||
                                  resource.employee_file_number ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-blue-100 text-blue-800"
                                    >
                                      Internal
                                    </Badge>
                                  ) : resource.worker_name ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-orange-100 text-orange-800"
                                    >
                                      External
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>

                              {/* Job Column */}
                              <TableCell>
                                <div className="text-sm">{resource.job_title || '-'}</div>
                              </TableCell>

                              {/* Rates Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.daily_rate ? `SAR ${resource.daily_rate}/day` : '-'}
                                </div>
                              </TableCell>

                              {/* Joining Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.start_date
                                    ? new Date(resource.start_date).toLocaleDateString()
                                    : '-'}
                                </div>
                              </TableCell>

                              {/* Days Column */}
                              <TableCell>
                                <div className="text-sm">{resource.total_days || '-'}</div>
                              </TableCell>
                            </>
                          ) : type === 'equipment' ? (
                            <>
                              {/* Equipment Column */}
                              <TableCell>
                                <div className="font-medium">
                                  {resource.equipment_name || resource.name || '-'}
                                </div>
                              </TableCell>

                              {/* Operator Column */}
                              <TableCell>
                                <div className="text-sm">{resource.operator_name || '-'}</div>
                              </TableCell>

                              {/* Start Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.start_date
                                    ? new Date(resource.start_date).toLocaleDateString()
                                    : '-'}
                                </div>
                              </TableCell>

                              {/* End Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.end_date
                                    ? new Date(resource.end_date).toLocaleDateString()
                                    : '-'}
                                </div>
                              </TableCell>

                              {/* Usage Hours Column */}
                              <TableCell>
                                <div className="text-sm">{resource.usage_hours || '-'}</div>
                              </TableCell>

                              {/* Hourly Rate Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.hourly_rate ? `SAR ${resource.hourly_rate}/hr` : '-'}
                                </div>
                              </TableCell>
                            </>
                          ) : type === 'material' ? (
                            <>
                              {/* Material Column */}
                              <TableCell>
                                <div className="font-medium">
                                  {resource.material_name || resource.name || '-'}
                                </div>
                              </TableCell>

                              {/* Unit Column */}
                              <TableCell>
                                <div className="text-sm">{resource.unit || '-'}</div>
                              </TableCell>

                              {/* Quantity Column */}
                              <TableCell>
                                <div className="text-sm">{resource.quantity || '-'}</div>
                              </TableCell>

                              {/* Unit Price Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.unit_price ? `SAR ${resource.unit_price}` : '-'}
                                </div>
                              </TableCell>
                            </>
                          ) : type === 'fuel' ? (
                            <>
                              {/* Fuel Type Column */}
                              <TableCell>
                                <div className="font-medium">{resource.fuel_type || '-'}</div>
                              </TableCell>

                              {/* Liters Column */}
                              <TableCell>
                                <div className="text-sm">{resource.liters || '-'}</div>
                              </TableCell>

                              {/* Price Per Liter Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.price_per_liter
                                    ? `SAR ${resource.price_per_liter}`
                                    : '-'}
                                </div>
                              </TableCell>
                            </>
                          ) : type === 'expense' ? (
                            <>
                              {/* Category Column */}
                              <TableCell>
                                <div className="font-medium">{resource.category || '-'}</div>
                              </TableCell>

                              {/* Description Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {resource.expense_description || resource.description || '-'}
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              {/* Name Column */}
                              <TableCell>
                                <div className="font-medium">
                                  {resource.name || resource.title || '-'}
                                </div>
                              </TableCell>

                              {/* Description Column */}
                              <TableCell>
                                <div className="text-sm">{resource.description || '-'}</div>
                              </TableCell>
                            </>
                          )}

                          {/* Cost Column - Common for all types */}
                          <TableCell>
                            <div className="text-sm font-medium">
                              SAR {(resource.total_cost || 0).toLocaleString()}
                            </div>
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
                      ))
                    )}
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
                  <CardDescription>Manage tasks for this project</CardDescription>
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
                  updated_at: resource.updated_at,
                }))}
                onEdit={task => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    handleEditResource(resource);
                  }
                }}
                onDelete={task => {
                  const resource = resources.find(r => r.id === task.id);
                  if (resource) {
                    handleDeleteResource(resource);
                  }
                }}
                                 onStatusChange={async (task, status) => {
                   try {
                     const response = await ApiService.put(`/projects/${projectId}/tasks/${task.id}`, {
                       status
                     });
                     
                     if (response.success) {
                       toast.success('Task status updated successfully');
                       // Update only tasks data instead of entire page
                       await updateTasksData();
                     } else {
                       toast.error(response.message || 'Failed to update task status');
                     }
                   } catch (error) {
                     console.error('Error updating task status:', error);
                     toast.error('Failed to update task status');
                   }
                 }}
                                 onCompletionChange={async (task, percentage) => {
                   try {
                     const response = await ApiService.put(`/projects/${projectId}/tasks/${task.id}`, {
                       completionPercentage: percentage
                     });
                     
                     if (response.success) {
                       toast.success('Task completion updated successfully');
                       // Update only tasks data instead of entire page
                       await updateTasksData();
                     } else {
                       toast.error(response.message || 'Failed to update task completion');
                     }
                   } catch (error) {
                     console.error('Error updating task completion:', error);
                     toast.error('Failed to update task completion');
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
         onSuccess={() => handleResourceSuccess('manpower')}
       />

       <EquipmentDialog
         open={equipmentDialogOpen}
         onOpenChange={setEquipmentDialogOpen}
         projectId={projectId}
         initialData={editingResource}
         onSuccess={() => handleResourceSuccess('equipment')}
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
         onSuccess={() => handleResourceSuccess('tasks')}
       />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteResource?.name || 'this resource'}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
