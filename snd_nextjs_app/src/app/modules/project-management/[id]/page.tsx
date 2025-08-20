'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiService from '@/lib/api-service';
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Package,
  Plus,
  Target,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description?: string;
  client_name: string;
  client_contact?: string;
  status: string;
  priority: string;
  start_date: string;
  end_date?: string;
  budget: number;
  progress: number;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  location?: string;
  notes?: string;
}

interface ProjectTask {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  progress: number;
}

interface ProjectResource {
  id: string;
  type: string;
  name: string;
  description?: string;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  date?: string;
  status?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  console.log('Project ID from params:', projectId);
  console.log('Params object:', params);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSample, setCreatingSample] = useState(false);

  // Function to create sample data
  const createSampleData = async () => {
    try {
      setCreatingSample(true);
      const response = await ApiService.post('/projects/sample', {});
      
      if (response.success) {
        toast.success('Sample project created successfully!');
        // Refresh the page to load the new project data
        window.location.reload();
      } else {
        throw new Error(response.error || 'Failed to create sample project');
      }
    } catch (error) {
      console.error('Error creating sample project:', error);
      toast.error('Failed to create sample project');
    } finally {
      setCreatingSample(false);
    }
  };

  // Utility functions to eliminate duplication
  const formatDate = (dateString: string | undefined, format: 'full' | 'short' = 'full') => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return format === 'short'
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateProjectProgress = (project: Project) => {
    if (!project.start_date || !project.end_date) return 0;
    const today = new Date();
    const endDate = new Date(project.end_date);
    const startDate = new Date(project.start_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
  };

  const calculateDaysRemaining = (project: Project) => {
    if (!project.end_date) return 0;
    const today = new Date();
    const endDate = new Date(project.end_date);
    return Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const calculateProjectDuration = (project: Project) => {
    if (!project.start_date || !project.end_date) return 'Not started';
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  const getResourceCountByType = (type: string) => resources.filter(r => r.type === type).length;

  const getResourceCostByType = (type: string) => {
    const cost = resources.filter(r => r.type === type).reduce((sum, r) => {
      const resourceCost = r.total_cost || 0;
      console.log(`Resource ${r.id} (${r.type}): total_cost = ${resourceCost}`);
      return sum + resourceCost;
    }, 0);
    console.log(`Total cost for type ${type}:`, cost);
    return cost;
  };

  const getTaskCountByStatus = (status: string) => tasks.filter(t => t.status === status).length;

  const getOverdueTasksCount = () =>
    tasks.filter(t => t.status === 'pending' && new Date(t.due_date) < new Date()).length;

  const formatCurrency = (amount: number) =>
    `SAR ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'equipment':
        return <Building2 className="h-4 w-4" />;
      case 'manpower':
        return <Users className="h-4 w-4" />;
      case 'material':
        return <FileText className="h-4 w-4" />;
      case 'fuel':
        return <Clock className="h-4 w-4" />;
      case 'expense':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const calculateGrandTotal = () => {
    const total = resources.reduce((total, resource) => {
      const cost = resource.total_cost || 0;
      console.log(`Resource ${resource.id} (${resource.type}): cost = ${cost}`);
      return total + cost;
    }, 0);
    console.log('Grand total calculated:', total);
    return total;
  };

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);

      const response = await ApiService.post<BlobPart>(`/projects/${projectId}/report`, {
        include_resources: true,
        include_tasks: true,
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `project-report-${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report generated successfully');
    } catch (error) {
      
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await ApiService.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      router.push('/modules/project-management');
    } catch (error) {
      
      toast.error('Failed to delete project');
    }
  };

  const grandTotal = calculateGrandTotal();

  // Debug logging
  console.log('Project data:', project);
  console.log('Project budget:', project?.budget);
  console.log('Resources:', resources);
  console.log('Tasks:', tasks);
  console.log('Grand total:', grandTotal);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Fetch project details
        const projectResponse = await ApiService.get<Project>(`/projects/${projectId}`);
        console.log('Project response:', projectResponse);
        setProject(projectResponse.data);

        // Fetch project resources
        const [manpowerRes, equipmentRes, materialsRes, fuelRes, expensesRes] = await Promise.all([
          ApiService.getProjectManpower(Number(projectId)),
          ApiService.getProjectEquipment(Number(projectId)),
          ApiService.getProjectMaterials(Number(projectId)),
          ApiService.getProjectFuel(Number(projectId)),
          ApiService.getProjectExpenses(Number(projectId)),
        ]);

        console.log('Resource responses:', {
          manpower: manpowerRes,
          equipment: equipmentRes,
          materials: materialsRes,
          fuel: fuelRes,
          expenses: expensesRes
        });

        // Combine all resources
        const allResources = [
          ...(manpowerRes.data || []).map((r: any) => ({ ...r, type: 'manpower' })),
          ...(equipmentRes.data || []).map((r: any) => ({ ...r, type: 'equipment' })),
          ...(materialsRes.data || []).map((r: any) => ({ ...r, type: 'material' })),
          ...(fuelRes.data || []).map((r: any) => ({ ...r, type: 'fuel' })),
          ...(expensesRes.data || []).map((r: any) => ({ ...r, type: 'expense' })),
        ];

        console.log('Combined resources:', allResources);
        setResources(allResources);

        // Fetch tasks
        const tasksResponse = await ApiService.getProjectTasks(Number(projectId));
        console.log('Tasks response:', tasksResponse);
        if (tasksResponse.success) {
          setTasks(tasksResponse.data || []);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load project details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Project</h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Not Found</h2>
              <p className="text-gray-500 mb-6">
                Project with ID {projectId} was not found. This could be because:
              </p>
              <ul className="text-left text-gray-500 mb-6 space-y-2">
                <li>• The project doesn't exist in the database</li>
                <li>• There are no projects created yet</li>
                <li>• There's an issue with the database connection</li>
              </ul>
              <div className="flex gap-3 justify-center">
                <Button onClick={createSampleData} disabled={creatingSample}>
                  {creatingSample ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Sample Data
                    </>
                  )}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/modules/project-management/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Project
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4 px-4 py-4 sm:px-6">
      {/* Header Section */}
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Project title and meta information */}
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight dark:text-white">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Project ID: {project.id}</p>
          </div>
          <div className="mt-3 flex items-center space-x-2 md:mt-0">
            <Button variant="outline" size="sm" asChild>
              <Link href="/modules/project-management">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/modules/project-management/${projectId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 mb-6 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm"
            onClick={generateReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="bg-white shadow-sm" asChild>
            <Link href={`/modules/project-management/${projectId}/resources`}>
              <Package className="mr-2 h-4 w-4" />
              Manage Resources
            </Link>
          </Button>
          <Button className="bg-purple-600 shadow-sm hover:bg-purple-700" size="sm" asChild>
            <Link href={`/modules/project-management/${projectId}/resources?tab=tasks`}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Manage Tasks
            </Link>
          </Button>
        </div>

        {/* Project Summary Stats Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex items-center rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="mr-3 rounded-full bg-blue-100 p-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800">Tasks</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-blue-700">{tasks.length}</span>
                <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                  {getTaskCountByStatus('completed')} completed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-green-100 bg-green-50 p-3">
            <div className="mr-3 rounded-full bg-green-100 p-2">
              <BarChart2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-800">Resources</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-700">{resources.length}</span>
                <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                  {getResourceCountByType('manpower')} manpower
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-amber-100 bg-amber-50 p-3">
            <div className="mr-3 rounded-full bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-800">Duration</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-700">
                  {project.start_date ? (
                    project.end_date ? (
                      calculateProjectDuration(project)
                    ) : (
                      <span className="text-blue-600">Ongoing</span>
                    )
                  ) : (
                    'Not started'
                  )}
                </span>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                  days
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-red-100 bg-red-50 p-3">
            <div className="mr-3 rounded-full bg-red-100 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-800">Overdue</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-red-700">{getOverdueTasksCount()}</span>
                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
                  tasks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-800">
          {project.start_date && project.end_date && (
            <>
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm font-semibold">{calculateProjectProgress(project)}%</span>
              </div>
              <Progress value={calculateProjectProgress(project)} className="h-3 bg-gray-100" />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                  <span>
                    {calculateDaysRemaining(project) === 0
                      ? 'Deadline reached'
                      : `${calculateDaysRemaining(project)} days remaining`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resource Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Project Financial Summary */}
        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <DollarSign className="mr-2 h-4 w-4 text-green-600" />
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Cost</span>
                  <span className="text-sm font-medium">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Budget</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(Number(project.budget))}
                  </span>
                </div>

                {(() => {
                  const balance = Number(project.budget) - grandTotal;
                  const isProfitable = balance >= 0;
                  return (
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Balance</span>
                      <span
                        className={`text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const budget = Number(project.budget) || 1;
                const budgetPercentage = Math.min(Math.round((grandTotal / budget) * 100), 100);
                const profitPercentage =
                  Number(project.budget) > 0
                    ? Math.round(
                        (Math.abs(Number(project.budget) - grandTotal) / Number(project.budget)) *
                          100
                      )
                    : 0;
                const isProfitable = Number(project.budget) - grandTotal >= 0;
                return (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Budget Utilization</span>
                        <span>{budgetPercentage}%</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`absolute top-0 left-0 h-full ${isProfitable ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                          style={{ width: `${budgetPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <Badge
                        className={
                          isProfitable
                            ? 'border-green-200 bg-green-100 text-green-800'
                            : 'border-red-200 bg-red-100 text-red-800'
                        }
                      >
                        {isProfitable ? 'Profit' : 'Loss'}: {profitPercentage}%
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Cost Distribution */}
        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <BarChart2 className="mr-2 h-4 w-4 text-blue-600" />
              Cost Distribution
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Manpower', color: 'bg-blue-500', cost: getResourceCostByType('manpower') },
                {
                  name: 'Equipment',
                  color: 'bg-green-500',
                  cost: getResourceCostByType('equipment'),
                },
                {
                  name: 'Materials',
                  color: 'bg-amber-500',
                  cost: getResourceCostByType('material'),
                },
                { name: 'Fuel', color: 'bg-purple-500', cost: getResourceCostByType('fuel') },
                { name: 'Expenses', color: 'bg-red-500', cost: getResourceCostByType('expense') },
              ].map((category, index) => {
                const percentage = grandTotal ? Math.round((category.cost / grandTotal) * 100) : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{category.name}</span>
                      <span>
                        {formatCurrency(category.cost)} ({percentage}%)
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`absolute top-0 left-0 h-full ${category.color} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resource Count */}
        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <BarChart2 className="mr-2 h-4 w-4 text-indigo-600" />
              Resource Count
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {getResourceCountByType('manpower')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Manpower</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {getResourceCountByType('equipment')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Equipment</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-amber-600">
                  {getResourceCountByType('material')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Materials</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-purple-600">
                  {getResourceCountByType('fuel')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Fuel</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-red-600">
                  {getResourceCountByType('expense')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Progress Card */}
        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <BarChart2 className="mr-2 h-4 w-4 text-indigo-600" />
              Project Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Overall Progress</span>
                <span className="text-sm font-medium">
                  {tasks.length > 0
                    ? Math.round((getTaskCountByStatus('completed') / tasks.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                value={
                  tasks.length > 0
                    ? Math.round((getTaskCountByStatus('completed') / tasks.length) * 100)
                    : 0
                }
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getTaskCountByStatus('completed')}
                  </div>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getTaskCountByStatus('in_progress')}
                  </div>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {getTaskCountByStatus('pending')}
                  </div>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{getOverdueTasksCount()}</div>
                  <p className="text-xs text-gray-500">Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Overview Section */}
      <div>
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-500">
              Project Overview
            </h3>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
              Description and timeline details
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Project Description */}
          <div className="border-b border-gray-100 p-4 dark:border-gray-800">
            <h3 className="mb-2 text-base font-semibold">Project Description</h3>
            {project.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
            ) : (
              <p className="text-sm text-gray-400">No description provided for this project.</p>
            )}
          </div>

          {/* Project Timeline */}
          <div className="border-b border-gray-100 p-4 dark:border-gray-800">
            <h3 className="mb-3 text-base font-semibold">Project Timeline</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <p className="mb-1 text-sm text-gray-500">Start Date</p>
                <p className="text-base font-medium">{formatDate(project.start_date)}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">End Date</p>
                <p className="text-base font-medium">{formatDate(project.end_date)}</p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">Duration</p>
                <p className="text-base font-medium">
                  {project.start_date ? (
                    project.end_date ? (
                      `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                    ) : (
                      <span className="text-blue-600">Ongoing</span>
                    )
                  ) : (
                    'Not started'
                  )}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">Location</p>
                <p className="text-base font-medium">{project.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Project Milestones */}
          <div className="p-4">
            <h3 className="mb-3 text-base font-semibold">Project Milestones</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Start Milestone */}
              <div className="flex-1 rounded-lg bg-blue-50/50 p-4">
                <div className="mb-2 flex justify-end">
                  <span className="text-xs text-blue-700">
                    {formatDate(project.start_date, 'short')}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-sm font-medium text-blue-700">Project Started</h4>
                </div>
                <p className="pl-5 text-xs text-gray-600">
                  Project was initiated with initial requirements and planning.
                </p>
              </div>

              {/* Current Status Milestone */}
              <div className="flex-1 rounded-lg bg-green-50/50 p-4">
                <div className="mb-2 flex justify-end">
                  <span className="text-xs text-green-700">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <h4 className="text-sm font-medium text-green-700">Current Status: Active</h4>
                </div>
                <p className="pl-5 text-xs text-gray-600">
                  Project is {calculateProjectProgress(project)}% complete based on timeline.
                </p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-green-100">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${calculateProjectProgress(project)}%` }}
                  ></div>
                </div>
              </div>

              {/* Completion Milestone */}
              {project.end_date && (
                <div className="flex-1 rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex justify-end">
                    <span className="text-xs text-gray-700">
                      {new Date(project.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <h4 className="text-sm font-medium text-gray-700">Expected Completion</h4>
                  </div>
                  <p className="pl-5 text-xs text-gray-600">Planned project completion date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {/* <TabsTrigger value="tasks">Tasks</TabsTrigger> */}
          {/* <TabsTrigger value="resources">Resources</TabsTrigger> */}
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Client Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Client Name</p>
                    <p className="text-sm text-gray-600">{project.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact</p>
                    <p className="text-sm text-gray-600">{project.client_contact || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-600">{project.location || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Manager */}
            {project.manager && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Project Manager</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {project.manager.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.manager.name}</p>
                      <p className="text-sm text-gray-600">{project.manager.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Notes */}
            {project.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Project Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{project.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Project Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Project Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-gray-600">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : 'Ongoing'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Tasks</CardTitle>
                  <CardDescription>{tasks.length} tasks in this project</CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/modules/project-management/${projectId}/resources?tab=tasks`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Assigned to: {task.assigned_to}</span>
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{task.progress}%</span>
                      <Progress value={task.progress} className="w-20" />
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No tasks found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>No milestones found</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">No milestones found</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>No documents found</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">No documents found</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Project Analytics */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Burndown Chart Placeholder */}
        <div className="col-span-1">
          <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5" />
                <span>Burndown Chart</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-gray-500">
                <p>Chart component will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Velocity Chart Placeholder */}
        <div className="col-span-1">
          <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart2 className="h-5 w-5" />
                <span>Velocity Chart</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-gray-500">
                <p>Chart component will be implemented</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Analysis Card */}
        <div className="col-span-1">
          <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Cost Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Budget</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(Number(project.budget))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Spent</span>
                  <span className="text-sm font-medium">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Remaining</span>
                  <span
                    className={`text-sm font-medium ${Number(project.budget) - grandTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(Number(project.budget) - grandTotal)}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full ${grandTotal <= Number(project.budget) ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: `${Math.min(100, (grandTotal / Number(project.budget)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment Card */}
        <div className="col-span-1">
          <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Risk Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">High Risk</span>
                  <Badge variant="destructive" className="text-xs">
                    1
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Medium Risk</span>
                  <Badge variant="secondary" className="text-xs">
                    2
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Low Risk</span>
                  <Badge variant="outline" className="text-xs">
                    3
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-500">Risk monitoring active</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProject}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
