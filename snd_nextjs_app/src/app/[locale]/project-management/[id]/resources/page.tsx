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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
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
import { ProjectResourcesReportService, ProjectResourceReportData } from '@/lib/services/project-resources-report-service';

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
    middle_name?: string;
    last_name: string;
    full_name?: string;
  };
  employee_name?: string;
  employee_middle_name?: string;
  employee_file_number?: string;
  worker_name?: string;
  job_title?: string;
  daily_rate?: number;
  effective_daily_rate?: number;
  is_assigned_to_equipment?: boolean;
  days_worked?: number;
  start_date?: string;
  end_date?: string;
  total_days?: number;

  // Equipment specific fields
  equipment_id?: string;
  equipment_name?: string;
  door_number?: string;
  operator_id?: string;
  operator_name?: string;
  operator_middle_name?: string;
  operator_file_number?: string;
  hourly_rate?: number;
  hours_worked?: number;
  usage_hours?: number;
  maintenance_cost?: number;
  start_date?: string;
  end_date?: string;

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
  const locale = params?.locale as string || 'en';
  
  // Pagination state for each tab
  const [currentPages, setCurrentPages] = useState<Record<ResourceType, number>>({
    manpower: 1,
    equipment: 1,
    material: 1,
    fuel: 1,
    expense: 1,
    tasks: 1,
  });
  const itemsPerPage = 10;

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
      const projectData = (projectResponse.data as any)?.data || projectResponse.data;
      setProject(projectData as Project);

      // Fetch all resource types using new specific endpoints
      const [manpowerResponse, equipmentResponse, materialsResponse, fuelResponse, expensesResponse, tasksResponse] = await Promise.all([
        ApiService.getProjectManpower(Number(projectId)).catch(() => ({ data: [] })),
        ApiService.getProjectEquipment(Number(projectId)).catch(() => ({ data: [] })),
        ApiService.getProjectMaterials(Number(projectId)).catch(() => ({ data: [] })),
        ApiService.getProjectFuel(Number(projectId)).catch(() => ({ data: [] })),
        ApiService.getProjectExpenses(Number(projectId)).catch(() => ({ data: [] })),
        ApiService.getProjectTasks(Number(projectId)).catch(() => ({ data: [] })),
      ]);

      // Combine all resources with their types - ensure we have valid data arrays
      const allResources = [
        ...(Array.isArray(manpowerResponse?.data) ? manpowerResponse.data : []).map((resource: any) => ({ ...resource, type: 'manpower' })),
        ...(Array.isArray(equipmentResponse?.data) ? equipmentResponse.data : []).map((resource: any) => ({ ...resource, type: 'equipment' })),
        ...(Array.isArray(materialsResponse?.data) ? materialsResponse.data : []).map((resource: any) => ({ ...resource, type: 'material' })),
        ...(Array.isArray(fuelResponse?.data) ? fuelResponse.data : []).map((resource: any) => ({ ...resource, type: 'fuel' })),
        ...(Array.isArray(expensesResponse?.data) ? expensesResponse.data : []).map((resource: any) => ({ ...resource, type: 'expense' })),
        ...(Array.isArray(tasksResponse?.data) ? tasksResponse.data : []).map((resource: any) => ({ ...resource, type: 'tasks' })),
      ];

      // Debug: Log the raw API responses

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
        unit_cost: resource.unitCost 
          ? parseFloat(resource.unitCost) 
          : resource.hourlyRate 
            ? parseFloat(resource.hourlyRate) 
            : resource.effectiveDailyRate !== undefined
              ? parseFloat(resource.effectiveDailyRate)
              : resource.dailyRate 
                ? parseFloat(resource.dailyRate) 
                : undefined,
        date: resource.date || resource.startDate || resource.purchaseDate || resource.expenseDate,
        status: resource.status,
        notes: resource.notes,

        // Manpower specific fields
        employee_id: resource.employeeId?.toString(),
        employee: (resource.employeeFirstName || resource.employeeLastName)
          ? {
              id: resource.employeeId?.toString() || '',
              first_name: resource.employeeFirstName || '',
              middle_name: resource.employeeMiddleName || undefined,
              last_name: resource.employeeLastName || '',
              full_name: (() => {
                const nameParts = [
                  resource.employeeFirstName,
                  resource.employeeMiddleName,
                  resource.employeeLastName
                ].filter(Boolean);
                return nameParts.join(' ').trim();
              })(),
            }
          : resource.employee || undefined,
        // Handle both employee names (from JOIN) and worker names
        // Combine firstName, middleName, and lastName if they exist
        employee_name: (() => {
          if (resource.employeeFirstName && resource.employeeLastName) {
            const nameParts = [
              resource.employeeFirstName,
              resource.employeeMiddleName,
              resource.employeeLastName
            ].filter(Boolean);
            return nameParts.join(' ').trim();
          }
          return resource.employeeFirstName || resource.employeeLastName || resource.employeeName || resource.workerName || `Employee ${resource.employeeId || 'Unknown'}`;
        })(),
        employee_middle_name: resource.employeeMiddleName || undefined,
        employee_file_number: resource.employeeFileNumber || '-',
        worker_name: resource.workerName,
        job_title: resource.jobTitle,
        daily_rate: resource.dailyRate ? parseFloat(resource.dailyRate) : undefined,
        effective_daily_rate: resource.effectiveDailyRate !== undefined 
          ? parseFloat(resource.effectiveDailyRate) 
          : (resource.dailyRate ? parseFloat(resource.dailyRate) : undefined),
        is_assigned_to_equipment: resource.isAssignedToEquipment || false,
        days_worked: resource.daysWorked,
        start_date: resource.startDate,
        end_date: resource.endDate,
        // Calculate total days from dates (auto-updates as days pass)
        total_days: (() => {
          if (resource.startDate) {
            const parseLocalDate = (dateString: string): Date => {
              const dateStr = dateString.split('T')[0];
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day);
            };
            
            try {
              const start = parseLocalDate(resource.startDate);
              if (isNaN(start.getTime())) return resource.totalDays ? resource.totalDays : undefined;
              
              let end: Date;
              if (resource.endDate) {
                const parsedEnd = parseLocalDate(resource.endDate);
                if (!isNaN(parsedEnd.getTime())) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  end = parsedEnd > today ? today : parsedEnd;
                } else {
                  end = new Date();
                  end.setHours(0, 0, 0, 0);
                }
              } else {
                end = new Date();
                end.setHours(0, 0, 0, 0);
              }
              
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return diffDays;
            } catch (e) {
              return resource.totalDays ? resource.totalDays : undefined;
            }
          }
          return resource.totalDays ? resource.totalDays : undefined;
        })(),
         // Calculate total cost based on resource type
         total_cost: (() => {
           if (resource.type === 'manpower') {
             // For manpower, calculate total days from dates first, then calculate cost
             const calculatedTotalDays = (() => {
               if (resource.startDate) {
                 const parseLocalDate = (dateString: string): Date => {
                   const dateStr = dateString.split('T')[0];
                   const [year, month, day] = dateStr.split('-').map(Number);
                   return new Date(year, month - 1, day);
                 };
                 
                 try {
                   const start = parseLocalDate(resource.startDate);
                   if (isNaN(start.getTime())) return resource.totalDays ? resource.totalDays : 0;
                   
                   let end: Date;
                   if (resource.endDate) {
                     const parsedEnd = parseLocalDate(resource.endDate);
                     if (!isNaN(parsedEnd.getTime())) {
                       const today = new Date();
                       today.setHours(0, 0, 0, 0);
                       end = parsedEnd > today ? today : parsedEnd;
                     } else {
                       end = new Date();
                       end.setHours(0, 0, 0, 0);
                     }
                   } else {
                     end = new Date();
                     end.setHours(0, 0, 0, 0);
                   }
                   
                   const diffTime = Math.abs(end.getTime() - start.getTime());
                   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                   return diffDays;
                 } catch (e) {
                   return resource.totalDays ? resource.totalDays : 0;
                 }
               }
               return resource.totalDays ? resource.totalDays : 0;
             })();
             
             // Use effective daily rate if available (0 if assigned to equipment), otherwise use dailyRate
             const effectiveDailyRate = resource.effectiveDailyRate !== undefined 
               ? parseFloat(resource.effectiveDailyRate) 
               : (resource.dailyRate ? parseFloat(resource.dailyRate) : 0);
             
             // Calculate total cost: effective daily rate * calculated total days
             // If assigned to equipment, cost is 0 (included in equipment rate)
             return effectiveDailyRate * calculatedTotalDays;
           } else if (resource.type === 'equipment') {
             // For equipment, calculate usage hours from dates first, then calculate cost
             const calculatedUsageHours = (() => {
               if (resource.startDate) {
                 const parseLocalDate = (dateString: string): Date => {
                   const dateStr = dateString.split('T')[0];
                   const [year, month, day] = dateStr.split('-').map(Number);
                   return new Date(year, month - 1, day);
                 };
                 
                 try {
                   const start = parseLocalDate(resource.startDate);
                   if (isNaN(start.getTime())) return resource.estimatedHours ? parseFloat(resource.estimatedHours) : 0;
                   
                   let end: Date;
                   if (resource.endDate) {
                     const parsedEnd = parseLocalDate(resource.endDate);
                     if (!isNaN(parsedEnd.getTime())) {
                       const today = new Date();
                       today.setHours(0, 0, 0, 0);
                       end = parsedEnd > today ? today : parsedEnd;
                     } else {
                       end = new Date();
                       end.setHours(0, 0, 0, 0);
                     }
                   } else {
                     end = new Date();
                     end.setHours(0, 0, 0, 0);
                   }
                   
                   const diffTime = Math.abs(end.getTime() - start.getTime());
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                   return diffDays * 10; // 10 hours per day
                 } catch (e) {
                   return resource.estimatedHours ? parseFloat(resource.estimatedHours) : 0;
                 }
               }
               return resource.estimatedHours ? parseFloat(resource.estimatedHours) : 0;
             })();
             
             const hourlyRate = resource.hourlyRate ? parseFloat(resource.hourlyRate) : 0;
             const maintenanceCost = resource.maintenanceCost ? parseFloat(resource.maintenanceCost) : 0;
             
             // Calculate total cost: (hourly rate * calculated usage hours) + maintenance cost
             return hourlyRate * calculatedUsageHours + maintenanceCost;
           } else if (resource.type === 'material' && resource.unitPrice && resource.quantity) {
             return parseFloat(resource.unitPrice) * parseFloat(resource.quantity);
           } else if (resource.type === 'fuel' && resource.unitPrice && resource.quantity) {
             return parseFloat(resource.unitPrice) * parseFloat(resource.quantity);
           } else if (resource.type === 'expense' && resource.amount) {
             return parseFloat(resource.amount);
           }
           return undefined;
         })(),

        // Equipment specific fields
        equipment_id: resource.equipmentId?.toString(),
        equipment_name: resource.equipmentName,
        door_number: resource.doorNumber || resource.door_number || extractDoorNumberFromName(resource.equipmentName),
        operator_id: resource.operatorId?.toString(),
        operator_name: (() => {
          // Build full name: first + middle + last
          if (resource.operatorName && resource.operatorLastName) {
            const nameParts = [
              resource.operatorName,
              resource.operatorMiddleName,
              resource.operatorLastName
            ].filter(Boolean);
            return nameParts.join(' ').trim();
          }
          return resource.operatorWorkerName || undefined;
        })(),
        operator_middle_name: resource.operatorMiddleName || undefined,
        operator_file_number: resource.operatorFileNumber || undefined,
        hourly_rate: resource.hourlyRate !== undefined && resource.hourlyRate !== null 
          ? parseFloat(resource.hourlyRate) 
          : undefined,
        hours_worked: resource.hoursWorked !== undefined && resource.hoursWorked !== null 
          ? parseFloat(resource.hoursWorked) 
          : undefined,
        // Calculate usage hours from dates (auto-updates as days pass)
        usage_hours: (() => {
          if (resource.startDate) {
            // Use end date if provided and not in the future, otherwise use today
            const parseLocalDate = (dateString: string): Date => {
              const dateStr = dateString.split('T')[0];
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day);
            };
            
            try {
              const start = parseLocalDate(resource.startDate);
              if (isNaN(start.getTime())) return resource.estimatedHours ? parseFloat(resource.estimatedHours) : undefined;
              
              let end: Date;
              if (resource.endDate) {
                const parsedEnd = parseLocalDate(resource.endDate);
                if (!isNaN(parsedEnd.getTime())) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  end = parsedEnd > today ? today : parsedEnd;
                } else {
                  end = new Date();
                  end.setHours(0, 0, 0, 0);
                }
              } else {
                end = new Date();
                end.setHours(0, 0, 0, 0);
              }
              
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              return diffDays * 10; // 10 hours per day
            } catch (e) {
              return resource.estimatedHours ? parseFloat(resource.estimatedHours) : undefined;
            }
          }
          return resource.estimatedHours ? parseFloat(resource.estimatedHours) : undefined;
        })(),
        maintenance_cost: resource.maintenanceCost
          ? parseFloat(resource.maintenanceCost)
          : undefined,
        start_date: resource.startDate,
        end_date: resource.endDate,
        notes: resource.notes,

        // Material specific fields
        material_name: resource.name,
        unit: resource.unit,
        unit_price: resource.unitPrice !== undefined && resource.unitPrice !== null ? parseFloat(resource.unitPrice) : undefined,
        material_id: resource.id?.toString(),
        date_used: resource.orderDate || resource.date || resource.dateUsed || resource.date_used,
        orderDate: resource.orderDate || resource.date || resource.dateUsed || resource.date_used,

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

      // Debug: Log the transformed resources

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
      // Don't set loading state - we want to update only the specific tab
      const resourceType = deleteResource.type;
      
      // Use appropriate delete endpoint based on resource type
      switch (resourceType) {
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
        case 'tasks':
          await ApiService.delete(`/projects/${projectId}/tasks/${deleteResource.id}`);
          break;
        default:
          throw new Error(`Unknown resource type: ${resourceType}`);
      }
      
      toast.success('Resource deleted successfully');
      
      // Update only the specific tab that was deleted, not the entire page
      if (resourceType === 'tasks') {
        await updateTasksData();
      } else if (resourceType === 'manpower') {
        await updateManpowerData();
      } else if (resourceType === 'equipment') {
        await updateEquipmentData();
      } else if (resourceType === 'material') {
        await updateMaterialsData();
      } else if (resourceType === 'fuel') {
        await updateFuelData();
      } else if (resourceType === 'expense') {
        await updateExpensesData();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      // Close dialog without setting loading state
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

  // Handler for when dialog is closed (via onOpenChange)
  const handleDialogOpenChange = (type: ResourceType, open: boolean) => {
    if (!open) {
      // When dialog closes, clear editing state
      setEditingResource(null);
    }
    
    // Update the appropriate dialog state
    switch (type) {
      case 'manpower':
        setManpowerDialogOpen(open);
        break;
      case 'equipment':
        setEquipmentDialogOpen(open);
        break;
      case 'material':
        setMaterialDialogOpen(open);
        break;
      case 'fuel':
        setFuelDialogOpen(open);
        break;
      case 'expense':
        setExpenseDialogOpen(open);
        break;
      case 'tasks':
        setTaskDialogOpen(open);
        break;
    }
  };

  const handleResourceSuccess = async (resourceType?: ResourceType) => {
    // Use targeted update based on resource type, fallback to full refresh
    // Only update the specific tab that was modified, not the entire page
    try {
      if (resourceType === 'tasks') {
        await updateTasksData();
      } else if (resourceType === 'manpower') {
        await updateManpowerData();
      } else if (resourceType === 'equipment') {
        await updateEquipmentData();
      } else if (resourceType === 'material') {
        await updateMaterialsData();
      } else if (resourceType === 'fuel') {
        await updateFuelData();
      } else if (resourceType === 'expense') {
        await updateExpensesData();
      } else {
        // For other resource types, refresh all data
        await fetchData();
      }
    } catch (error) {
      console.error('Error refreshing data after resource update:', error);
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
      
      // Statistics will update automatically from the resources state
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
      const transformedManpower = manpowerData.map((resource: any) => {
        // Always calculate total days from dates if dates are available
        // This ensures the table shows the correct days that update automatically as days pass
        const calculatedTotalDays = calculateTotalDaysFromDates(resource.startDate, resource.endDate);
        
        // Use calculated days if dates are present, otherwise fall back to stored totalDays
        const totalDays = (resource.startDate && calculatedTotalDays > 0) 
          ? calculatedTotalDays 
          : (resource.totalDays ? resource.totalDays : 0);
        
        // Use effectiveDailyRate if available (0 if assigned to equipment), otherwise use dailyRate
        const effectiveDailyRate = resource.effectiveDailyRate !== undefined 
          ? parseFloat(resource.effectiveDailyRate) 
          : (resource.dailyRate ? parseFloat(resource.dailyRate) : 0);
        const originalDailyRate = resource.dailyRate ? parseFloat(resource.dailyRate) : 0;
        const isAssignedToEquipment = resource.isAssignedToEquipment || false;
        
        // Calculate total cost: effective daily rate * calculated total days
        // If assigned to equipment, cost is 0 (included in equipment rate)
        const totalCost = effectiveDailyRate * totalDays;
        
        // Handle employee data - check for employeeFirstName/employeeLastName from JOIN (same as initial fetchData)
        const employee = (resource.employeeFirstName || resource.employeeLastName)
          ? {
              id: resource.employeeId?.toString() || '',
              first_name: resource.employeeFirstName || '',
              middle_name: resource.employeeMiddleName || undefined,
              last_name: resource.employeeLastName || '',
              full_name: (() => {
                const nameParts = [
                  resource.employeeFirstName,
                  resource.employeeMiddleName,
                  resource.employeeLastName
                ].filter(Boolean);
                return nameParts.join(' ').trim();
              })(),
            }
          : resource.employee || undefined;
        
        // Handle both employee names (from JOIN) and worker names
        // Combine firstName, middleName, and lastName if they exist
        const employeeName = (() => {
          if (resource.employeeFirstName && resource.employeeLastName) {
            const nameParts = [
              resource.employeeFirstName,
              resource.employeeMiddleName,
              resource.employeeLastName
            ].filter(Boolean);
            return nameParts.join(' ').trim();
          }
          return resource.employeeFirstName || resource.employeeLastName || resource.employeeName || resource.workerName || `Employee ${resource.employeeId || 'Unknown'}`;
        })();
        
        return {
          id: resource.id.toString(),
          type: resource.type,
          name: resource.name || resource.title || resource.workerName || resource.equipmentName || resource.materialName || resource.jobTitle || resource.companyName || 'Unnamed Resource',
          description: resource.description,
          quantity: resource.quantity,
          unit_cost: originalDailyRate || undefined,
          total_cost: totalCost > 0 ? totalCost : undefined,
          date: resource.startDate,
          status: resource.status,
          notes: resource.notes,
          employee_id: resource.employeeId?.toString(),
          employee: employee,
          employee_name: employeeName,
          employee_middle_name: resource.employeeMiddleName || undefined,
          employee_file_number: resource.employeeFileNumber || '-',
          worker_name: resource.workerName,
          job_title: resource.jobTitle,
          daily_rate: originalDailyRate || undefined,
          effective_daily_rate: effectiveDailyRate || undefined,
          is_assigned_to_equipment: isAssignedToEquipment,
          days_worked: resource.daysWorked,
          start_date: resource.startDate,
          end_date: resource.endDate,
          total_days: totalDays, // This will now show the calculated days from dates
          created_at: resource.createdAt,
          updated_at: resource.updatedAt,
        };
      });

      // Update only manpower in the resources state
      setResources(prevResources => {
        const nonManpowerResources = prevResources.filter(r => r.type !== 'manpower');
        return [...nonManpowerResources, ...transformedManpower];
      });
      
      // Statistics will update automatically from the resources state
    } catch (error) {
      console.error('Error updating manpower data:', error);
    }
  };

  // Helper function to calculate total days from dates for manpower (same logic as ManpowerDialog)
  const calculateTotalDaysFromDates = (startDate: string | null | undefined, endDate: string | null | undefined): number => {
    if (!startDate) return 0;
    
    try {
      // Parse dates as local dates (avoid timezone issues)
      const parseLocalDate = (dateString: string): Date => {
        const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const start = parseLocalDate(startDate);
      if (isNaN(start.getTime())) return 0;
      
      // Use end date if provided and not in the future, otherwise use today
      let end: Date;
      if (endDate) {
        const parsedEnd = parseLocalDate(endDate);
        if (!isNaN(parsedEnd.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          // Use the earlier of end date or today
          end = parsedEnd > today ? today : parsedEnd;
        } else {
          end = new Date();
          end.setHours(0, 0, 0, 0);
        }
      } else {
        // No end date, use today
        end = new Date();
        end.setHours(0, 0, 0, 0);
      }
      
      // Calculate difference in days (inclusive of both start and end dates)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      return diffDays;
    } catch (error) {
      console.error('Error calculating total days from dates:', error);
      return 0;
    }
  };

  // Helper function to calculate usage hours from dates (same logic as EquipmentDialog)
  const calculateUsageHoursFromDates = (startDate: string | null | undefined, endDate: string | null | undefined): number => {
    if (!startDate) return 0;
    
    try {
      // Parse dates as local dates (avoid timezone issues)
      const parseLocalDate = (dateString: string): Date => {
        const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      const start = parseLocalDate(startDate);
      if (isNaN(start.getTime())) return 0;
      
      // Use end date if provided and not in the future, otherwise use today
      let end: Date;
      if (endDate) {
        const parsedEnd = parseLocalDate(endDate);
        if (!isNaN(parsedEnd.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          // Use the earlier of end date or today
          end = parsedEnd > today ? today : parsedEnd;
        } else {
          end = new Date();
          end.setHours(0, 0, 0, 0);
        }
      } else {
        // No end date, use today
        end = new Date();
        end.setHours(0, 0, 0, 0);
      }
      
      // Calculate difference in days (inclusive of both start and end dates)
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      // 10 hours per day (same as EquipmentDialog)
      const usageHours = diffDays * 10;
      
      return usageHours;
    } catch (error) {
      console.error('Error calculating usage hours from dates:', error);
      return 0;
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
      const transformedEquipment = equipmentData.map((resource: any) => {
        // Always calculate usage hours from dates if dates are available
        // This ensures the table shows the correct hours that update automatically as days pass
        const calculatedUsageHours = calculateUsageHoursFromDates(resource.startDate, resource.endDate);
        
        // Use calculated hours if dates are present, otherwise fall back to stored estimatedHours
        const usageHours = (resource.startDate && calculatedUsageHours > 0) 
          ? calculatedUsageHours 
          : (resource.estimatedHours ? parseFloat(resource.estimatedHours) : 0);
        
        const hourlyRate = resource.hourlyRate ? parseFloat(resource.hourlyRate) : 0;
        const maintenanceCost = resource.maintenanceCost ? parseFloat(resource.maintenanceCost) : 0;
        
        // Calculate total cost: (hourly rate * usage hours) + maintenance cost
        const totalCost = hourlyRate * usageHours + maintenanceCost;
        
        return {
          id: resource.id.toString(),
          type: resource.type,
          name: resource.name || resource.title || resource.equipmentName || 'Unnamed Equipment',
          description: resource.description,
          quantity: resource.quantity,
          unit_cost: hourlyRate || undefined,
          total_cost: totalCost > 0 ? totalCost : undefined,
          date: resource.startDate,
          status: resource.status,
          notes: resource.notes,
          equipment_id: resource.equipmentId?.toString(),
          equipment_name: resource.equipmentName,
          door_number: resource.doorNumber || resource.door_number || extractDoorNumberFromName(resource.equipmentName),
          operator_id: resource.operatorId?.toString(), // Include operator_id so it's available when editing
          operator_name: (() => {
            // Build full name: first + middle + last
            if (resource.operatorName && resource.operatorLastName) {
              const nameParts = [
                resource.operatorName,
                resource.operatorMiddleName,
                resource.operatorLastName
              ].filter(Boolean);
              return nameParts.join(' ').trim();
            }
            return resource.operatorWorkerName || undefined;
          })(),
          operator_middle_name: resource.operatorMiddleName || undefined,
          operator_file_number: resource.operatorFileNumber || undefined,
          hourly_rate: hourlyRate || undefined,
          hours_worked: resource.hoursWorked ? parseFloat(resource.hoursWorked) : undefined,
          usage_hours: usageHours, // This will now show the calculated hours from dates
          maintenance_cost: maintenanceCost || undefined,
          start_date: resource.startDate,
          end_date: resource.endDate,
          created_at: resource.createdAt,
          updated_at: resource.updatedAt,
        };
      });

      // Update only equipment in the resources state
      setResources(prevResources => {
        const nonEquipmentResources = prevResources.filter(r => r.type !== 'equipment');
        return [...nonEquipmentResources, ...transformedEquipment];
      });
      
      // Statistics will update automatically from the resources state
    } catch (error) {
      console.error('Error updating equipment data:', error);
    }
  };

  // Function to update only materials data
  const updateMaterialsData = async () => {
    try {
      const materialsResponse = await ApiService.getProjectMaterials(Number(projectId));
      const materialsData = (materialsResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'material' 
      }));

      // Transform materials data to match frontend structure
      const transformedMaterials = materialsData.map((resource: any) => {
        // Get date from all possible field names
        const materialDate = resource.orderDate 
          || resource.date 
          || resource.dateUsed 
          || resource.date_used
          || resource.order_date
          || resource.dateUsed
          || '';
        
        return {
          id: resource.id.toString(),
          type: resource.type,
          name: resource.name || resource.title || 'Unnamed Material',
          description: resource.description,
          quantity: resource.quantity,
          unit_cost: resource.unitPrice ? parseFloat(resource.unitPrice) : undefined,
          total_cost: resource.unitPrice && resource.quantity ? 
            parseFloat(resource.unitPrice) * parseFloat(resource.quantity) : undefined,
          date: materialDate,
          orderDate: materialDate,
          date_used: materialDate,
          status: resource.status,
          notes: resource.notes,
          material_id: resource.materialId?.toString(),
          material_name: resource.name,
          unit: resource.unit,
          supplier: resource.supplier,
          created_at: resource.createdAt,
          updated_at: resource.updatedAt,
        };
      });

      // Update only materials in the resources state
      setResources(prevResources => {
        const nonMaterialResources = prevResources.filter(r => r.type !== 'material');
        return [...nonMaterialResources, ...transformedMaterials];
      });
      
      // Statistics will update automatically from the resources state
    } catch (error) {
      console.error('Error updating materials data:', error);
    }
  };

  // Function to update only fuel data
  const updateFuelData = async () => {
    try {
      const fuelResponse = await ApiService.getProjectFuel(Number(projectId));
      const fuelData = (fuelResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'fuel' 
      }));

      // Transform fuel data to match frontend structure
      const transformedFuel = fuelData.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name: resource.fuelType || 'Fuel',
        description: resource.usageNotes,
        quantity: resource.quantity,
        unit_cost: resource.unitPrice ? parseFloat(resource.unitPrice) : undefined,
        total_cost: resource.unitPrice && resource.quantity ? 
          parseFloat(resource.unitPrice) * parseFloat(resource.quantity) : undefined,
        date: resource.purchaseDate || resource.date,
        status: resource.status,
        notes: resource.usageNotes,
        fuel_type: resource.fuelType,
        liters: resource.quantity,
        price_per_liter: resource.unitPrice,
        equipment_id: resource.equipmentId?.toString(),
        equipment_name: resource.equipmentName,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      // Update only fuel in the resources state
      setResources(prevResources => {
        const nonFuelResources = prevResources.filter(r => r.type !== 'fuel');
        return [...nonFuelResources, ...transformedFuel];
      });
      
      // Statistics will update automatically from the resources state
    } catch (error) {
      console.error('Error updating fuel data:', error);
    }
  };

  // Function to update only expenses data
  const updateExpensesData = async () => {
    try {
      const expensesResponse = await ApiService.getProjectExpenses(Number(projectId));
      const expensesData = (expensesResponse.data || []).map((resource: any) => ({ 
        ...resource, 
        type: 'expense' 
      }));

      // Transform expenses data to match frontend structure
      const transformedExpenses = expensesData.map((resource: any) => ({
        id: resource.id.toString(),
        type: resource.type,
        name: resource.title || resource.name || 'Unnamed Expense',
        description: resource.description,
        quantity: 1, // Expenses are typically single items
        unit_cost: resource.amount ? parseFloat(resource.amount) : undefined,
        total_cost: resource.amount ? parseFloat(resource.amount) : undefined,
        date: resource.expenseDate || resource.date,
        status: resource.status,
        notes: resource.notes,
        category: resource.category,
        amount: resource.amount,
        receipt_number: resource.receiptNumber,
        payment_method: resource.paymentMethod,
        vendor: resource.vendor,
        assigned_to: resource.assignedTo,
        created_at: resource.createdAt,
        updated_at: resource.updatedAt,
      }));

      // Update only expenses in the resources state
      setResources(prevResources => {
        const nonExpenseResources = prevResources.filter(r => r.type !== 'expense');
        return [...nonExpenseResources, ...transformedExpenses];
      });
      
      // Statistics will update automatically from the resources state
    } catch (error) {
      console.error('Error updating expenses data:', error);
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

  // Helper function to extract door number from equipment name
  const extractDoorNumberFromName = (equipmentName: string | undefined): string | undefined => {
    if (!equipmentName) return undefined;
    
    // Try to extract numeric prefix (e.g., "1404-DOZER" -> "1404")
    const match = equipmentName.match(/^(\d+)/);
    if (match) {
      return match[1];
    }
    
    return undefined;
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

  // Pagination helper functions
  const getPaginatedResources = (type: ResourceType) => {
    let allResources = filterResourcesByType(type);
    
    // Sort manpower by file number
    if (type === 'manpower') {
      allResources = [...allResources].sort((a, b) => {
        const fileA = a.employee_file_number || '-';
        const fileB = b.employee_file_number || '-';
        
        // Handle numeric file numbers
        const numA = parseInt(fileA);
        const numB = parseInt(fileB);
        
        // If both are numeric, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // If one is numeric and the other is not, numeric comes first
        if (!isNaN(numA) && isNaN(numB)) {
          return -1;
        }
        if (isNaN(numA) && !isNaN(numB)) {
          return 1;
        }
        
        // Both are non-numeric (e.g., "-", "EXT-S-14"), sort alphabetically
        return fileA.localeCompare(fileB);
      });
    }
    
    // Sort equipment by door number
    if (type === 'equipment') {
      allResources = [...allResources].sort((a, b) => {
        const doorA = a.door_number || '';
        const doorB = b.door_number || '';
        
        // Handle numeric door numbers
        const numA = parseInt(doorA);
        const numB = parseInt(doorB);
        
        // If both are numeric, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // If one is numeric and the other is not, numeric comes first
        if (!isNaN(numA) && isNaN(numB)) {
          return -1;
        }
        if (isNaN(numA) && !isNaN(numB)) {
          return 1;
        }
        
        // Both are non-numeric or empty, sort alphabetically
        return doorA.localeCompare(doorB);
      });
    }
    
    const currentPage = currentPages[type];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allResources.slice(startIndex, endIndex);
  };

  const getTotalPages = (type: ResourceType) => {
    const totalItems = getResourceCount(type);
    return Math.ceil(totalItems / itemsPerPage);
  };

  const handlePageChange = (type: ResourceType, page: number) => {
    setCurrentPages(prev => ({
      ...prev,
      [type]: page,
    }));
  };

  const handleGenerateReport = async (type: ResourceType) => {
    try {
      const filteredResources = filterResourcesByType(type);
      const totalCost = calculateTotalCost(type);
      
      const reportData: ProjectResourceReportData = {
        project: {
          id: projectId,
          name: project?.name || 'Unknown Project',
        },
        resourceType: type,
        resources: filteredResources,
        summary: {
          totalCount: filteredResources.length,
          totalCost: totalCost,
        },
      };

      const loadingToastId = toast.loading('Generating report...');
      
      await ProjectResourcesReportService.downloadPDFReport(
        reportData,
        `${type}-report-${project?.name?.replace(/\s+/g, '-') || projectId}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      );

      toast.dismiss(loadingToastId);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
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
          <Link href={`/${locale}/project-management/${projectId}`}>
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleGenerateReport(type)}
                      disabled={getResourceCount(type) === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
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
                          <TableHead>Date</TableHead>
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
                          <TableHead>Date</TableHead>
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
                                  ? 7
                                  : type === 'fuel'
                                    ? 5
                                    : type === 'expense'
                                      ? 5
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
                      getPaginatedResources(type).map(resource => (
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
                                    {resource.employee?.full_name || resource.employee_name
                                      ? (resource.employee?.full_name || resource.employee_name)
                                      : resource.name || resource.title}
                                  </div>
                                  {resource.employee_id ? (
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
                                  {resource.is_assigned_to_equipment ? (
                                    <div className="flex flex-col">
                                      <span className="text-muted-foreground line-through">
                                        {resource.daily_rate ? `SAR ${resource.daily_rate}/day` : '-'}
                                      </span>
                                      <span className="text-xs text-blue-600 font-medium">
                                        Included in Equipment
                                      </span>
                                    </div>
                                  ) : (
                                    resource.daily_rate ? `SAR ${resource.daily_rate}/day` : '-'
                                  )}
                                </div>
                              </TableCell>

                              {/* Joining Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {(() => {
                                    const startDate = resource.start_date || (resource as any).startDate;
                                    if (startDate) {
                                      try {
                                        const date = new Date(startDate);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString();
                                        }
                                      } catch (e) {
                                        console.error('Invalid start date:', startDate, e);
                                      }
                                    }
                                    return '-';
                                  })()}
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
                                <div className="text-sm">
                                  {resource.operator_name || resource.operator_file_number ? (
                                    <div>
                                      <div className="font-medium">{resource.operator_name || '-'}</div>
                                      {resource.operator_file_number && (
                                        <div className="text-xs text-muted-foreground">
                                          File #: {resource.operator_file_number}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </div>
                              </TableCell>

                              {/* Start Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {(() => {
                                    const startDate = resource.start_date || (resource as any).startDate;
                                    if (startDate) {
                                      try {
                                        const date = new Date(startDate);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString();
                                        }
                                      } catch (e) {
                                        console.error('Invalid start date:', startDate, e);
                                      }
                                    }
                                    return '-';
                                  })()}
                                </div>
                              </TableCell>

                              {/* End Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {(() => {
                                    const endDate = resource.end_date || (resource as any).endDate;
                                    if (endDate) {
                                      try {
                                        const date = new Date(endDate);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString();
                                        }
                                      } catch (e) {
                                        console.error('Invalid end date:', endDate, e);
                                      }
                                    }
                                    return '-';
                                  })()}
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
                                  {resource.unit_price !== undefined && resource.unit_price !== null 
                                    ? `SAR ${resource.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                    : '-'}
                                </div>
                              </TableCell>

                              {/* Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {(() => {
                                    // Check all possible date field names
                                    const materialDate = resource.date 
                                      || resource.orderDate 
                                      || resource.date_used 
                                      || (resource as any).dateUsed
                                      || (resource as any).order_date;
                                    
                                    if (materialDate) {
                                      try {
                                        // Handle both string and Date object
                                        const date = typeof materialDate === 'string' 
                                          ? new Date(materialDate) 
                                          : materialDate;
                                        
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString();
                                        }
                                      } catch (e) {
                                        console.error('Invalid date:', materialDate, e);
                                      }
                                    }
                                    return '-';
                                  })()}
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

                              {/* Amount Column */}
                              <TableCell>
                                <div className="text-sm font-medium">
                                  SAR {(resource.amount || resource.total_cost || 0).toLocaleString()}
                                </div>
                              </TableCell>

                              {/* Date Column */}
                              <TableCell>
                                <div className="text-sm">
                                  {(() => {
                                    const expenseDate = resource.date || resource.expenseDate || resource.expense_date;
                                    if (expenseDate) {
                                      try {
                                        const date = new Date(expenseDate);
                                        if (!isNaN(date.getTime())) {
                                          return date.toLocaleDateString();
                                        }
                                      } catch (e) {
                                        console.error('Invalid date:', expenseDate, e);
                                      }
                                    }
                                    return '-';
                                  })()}
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

                          {/* Cost Column - Common for all types (except expenses, which already show Amount) */}
                          {type !== 'expense' && (
                            <TableCell>
                              {type === 'manpower' && resource.is_assigned_to_equipment ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-muted-foreground line-through">
                                    SAR {(resource.daily_rate && resource.total_days ? (resource.daily_rate * resource.total_days).toLocaleString() : '0')}
                                  </span>
                                  <span className="text-xs text-blue-600 font-medium">
                                    Included in Equipment
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm font-medium">
                                  SAR {(resource.total_cost || 0).toLocaleString()}
                                </div>
                              )}
                            </TableCell>
                          )}

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
                
                {/* Pagination Controls */}
                {getTotalPages(type) > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPages[type] - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPages[type] * itemsPerPage, getResourceCount(type))} of{' '}
                      {getResourceCount(type)} items
                    </div>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(type, Math.max(1, currentPages[type] - 1))}
                            className={currentPages[type] === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: getTotalPages(type) }, (_, i) => i + 1).map(page => {
                          const totalPages = getTotalPages(type);
                          const currentPage = currentPages[type];
                          
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(type, page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              handlePageChange(type, Math.min(getTotalPages(type), currentPages[type] + 1))
                            }
                            className={
                              currentPages[type] === getTotalPages(type)
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleGenerateReport('tasks')}
                    disabled={getResourceCount('tasks') === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
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
                  const resource = resources.find(r => r.id === task.id && r.type === 'tasks');
                  if (resource) {
                    handleEditResource(resource);
                  }
                }}
                onDelete={task => {
                  const resource = resources.find(r => r.id === task.id && r.type === 'tasks');
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
         onOpenChange={(open) => handleDialogOpenChange('manpower', open)}
         projectId={projectId}
         initialData={editingResource}
         onSuccess={() => handleResourceSuccess('manpower')}
       />

       <EquipmentDialog
         open={equipmentDialogOpen}
         onOpenChange={(open) => handleDialogOpenChange('equipment', open)}
         projectId={projectId}
         initialData={editingResource}
         onSuccess={() => handleResourceSuccess('equipment')}
       />

      <MaterialDialog
        open={materialDialogOpen}
        onOpenChange={(open) => handleDialogOpenChange('material', open)}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={() => handleResourceSuccess('material')}
      />

      <FuelDialog
        open={fuelDialogOpen}
        onOpenChange={(open) => handleDialogOpenChange('fuel', open)}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={() => handleResourceSuccess('fuel')}
      />

      <ExpenseDialog
        open={expenseDialogOpen}
        onOpenChange={(open) => handleDialogOpenChange('expense', open)}
        projectId={projectId}
        initialData={editingResource}
        onSuccess={() => handleResourceSuccess('expense')}
      />

             <TaskDialog
         open={taskDialogOpen}
         onOpenChange={(open) => handleDialogOpenChange('tasks', open)}
         projectId={projectId}
         initialData={editingResource && editingResource.type === 'tasks' ? {
           id: editingResource.id,
           title: editingResource.title || editingResource.name || '',
           description: editingResource.description || '',
           status: editingResource.status,
           priority: editingResource.priority || 'medium',
           due_date: editingResource.due_date || '',
           completion_percentage: editingResource.completion_percentage || 0,
           assigned_to_id: editingResource.assigned_to_id || 'none',
           assigned_to: editingResource.assigned_to,
           notes: editingResource.notes || '',
         } : null}
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
