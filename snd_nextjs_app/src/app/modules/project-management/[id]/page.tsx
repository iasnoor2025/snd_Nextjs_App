'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  FileText, 
  Clock, 
  Target, 
  Building2, 
  User, 
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  BarChart2,
  CheckSquare,
  ClipboardList,
  Package,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/lib/api';
import Link from 'next/link';

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

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Fetch project details
        const projectResponse = await apiService.get<{ data: Project }>(`/projects/${projectId}`);
        setProject(projectResponse.data);

        // Fetch project resources
        const resourcesResponse = await apiService.get<{ data: ProjectResource[] }>(`/projects/${projectId}/resources`);
        setResources(resourcesResponse.data);

        // Fetch tasks
        const tasksResponse = await apiService.get<{ data: ProjectTask[] }>(`/projects/${projectId}/tasks`);
        setTasks(tasksResponse.data);

      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

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
    return resources.reduce((total, resource) => {
      return total + (resource.total_cost || 0);
    }, 0);
  };

  const generateReport = async () => {
    try {
      setIsGeneratingReport(true);

      const response = await apiService.post(`/projects/${projectId}/report`, {
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
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await apiService.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      router.push('/modules/project-management');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const grandTotal = calculateGrandTotal();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Project not found</p>
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
            <p className="text-sm text-muted-foreground">
              Project ID: {project.id}
            </p>
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
                  {tasks.filter((t) => t.status === 'completed').length} completed
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
                  {resources.filter(r => r.type === 'manpower').length} manpower
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
                      `${Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                    ) : (
                      <span className="text-blue-600">Ongoing</span>
                    )
                  ) : (
                    'Not started'
                  )}
                </span>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">days</span>
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
                <span className="text-xl font-bold text-red-700">
                  {tasks.filter((t) => t.status === 'pending' && new Date(t.due_date) < new Date()).length}
                </span>
                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs text-red-800">tasks</span>
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
                <span className="text-sm font-semibold">
                  {(() => {
                    const today = new Date();
                    const endDate = new Date(project.end_date);
                    const startDate = new Date(project.start_date);

                    // Calculate total project duration in days
                    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Calculate days elapsed
                    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                    // Calculate time progress percentage
                    const timeProgress = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;

                    return `${timeProgress}%`;
                  })()}
                </span>
              </div>
              <Progress
                value={(() => {
                  const today = new Date();
                  const endDate = new Date(project.end_date);
                  const startDate = new Date(project.start_date);
                  // Calculate total project duration in days
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  // Calculate days elapsed
                  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  // Calculate time progress percentage
                  return totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
                })()}
                className="h-3 bg-gray-100"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5 text-gray-500" />
                  <span>
                    {(() => {
                      const today = new Date();
                      const endDate = new Date(project.end_date);
                      const startDate = new Date(project.start_date);

                      // Calculate days remaining
                      const daysRemaining = Math.max(
                        0,
                        Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
                      );

                      if (daysRemaining === 0) {
                        return 'Deadline reached';
                      } else {
                        return `${daysRemaining} days remaining`;
                      }
                    })()}
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
                  <span className="text-sm font-medium">
                    SAR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Budget</span>
                  <span className="text-sm font-medium">
                    SAR{' '}
                    {Number(project.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {(() => {
                  const balance = Number(project.budget) - grandTotal;
                  const isProfitable = balance >= 0;
                  return (
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Balance</span>
                      <span className={`text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        SAR {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    ? Math.round((Math.abs(Number(project.budget) - grandTotal) / Number(project.budget)) * 100)
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

        {/* Resource Type Cards */}
        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              Manpower
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-medium">{resources.filter(r => r.type === 'manpower').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="text-sm font-medium">
                  SAR {resources.filter(r => r.type === 'manpower').reduce((sum, r) => sum + (r.total_cost || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <Building2 className="mr-2 h-4 w-4 text-green-600" />
              Equipment
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-medium">{resources.filter(r => r.type === 'equipment').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="text-sm font-medium">
                  SAR {resources.filter(r => r.type === 'equipment').reduce((sum, r) => sum + (r.total_cost || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center text-base font-medium">
              <Package className="mr-2 h-4 w-4 text-amber-600" />
              Materials
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-medium">{resources.filter(r => r.type === 'material').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Cost</span>
                <span className="text-sm font-medium">
                  SAR {resources.filter(r => r.type === 'material').reduce((sum, r) => sum + (r.total_cost || 0), 0).toLocaleString()}
                </span>
              </div>
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
                { name: 'Manpower', color: 'bg-blue-500', cost: resources.filter(r => r.type === 'manpower').reduce((sum, r) => sum + (r.total_cost || 0), 0) },
                { name: 'Equipment', color: 'bg-green-500', cost: resources.filter(r => r.type === 'equipment').reduce((sum, r) => sum + (r.total_cost || 0), 0) },
                { name: 'Materials', color: 'bg-amber-500', cost: resources.filter(r => r.type === 'material').reduce((sum, r) => sum + (r.total_cost || 0), 0) },
                { name: 'Fuel', color: 'bg-purple-500', cost: resources.filter(r => r.type === 'fuel').reduce((sum, r) => sum + (r.total_cost || 0), 0) },
                { name: 'Expenses', color: 'bg-red-500', cost: resources.filter(r => r.type === 'expense').reduce((sum, r) => sum + (r.total_cost || 0), 0) },
              ].map((category, index) => {
                const percentage = grandTotal ? Math.round((category.cost / grandTotal) * 100) : 0;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{category.name}</span>
                      <span>
                        SAR{' '}
                        {category.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        ({percentage}%)
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
                <div className="text-2xl font-semibold text-blue-600">{resources.filter(r => r.type === 'manpower').length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Manpower</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-green-600">{resources.filter(r => r.type === 'equipment').length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Equipment</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-amber-600">{resources.filter(r => r.type === 'material').length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Materials</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-purple-600">{resources.filter(r => r.type === 'fuel').length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Fuel</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-md bg-gray-50 p-3 text-center">
                <div className="text-2xl font-semibold text-red-600">{resources.filter(r => r.type === 'expense').length}</div>
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
                  {tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0}%
                </span>
              </div>
              <Progress 
                value={tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0} 
                className="h-2" 
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tasks.filter((t) => t.status === 'completed').length}</div>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tasks.filter((t) => t.status === 'in_progress').length}</div>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{tasks.filter((t) => t.status === 'pending').length}</div>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{tasks.filter((t) => t.status === 'pending' && new Date(t.due_date) < new Date()).length}</div>
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
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-500">Project Overview</h3>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Description and timeline details</p>
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
                <p className="text-base font-medium">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-gray-500">End Date</p>
                <p className="text-base font-medium">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not set'}
                </p>
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
                    {project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 'Date not set'}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <h4 className="text-sm font-medium text-blue-700">Project Started</h4>
                </div>
                <p className="pl-5 text-xs text-gray-600">Project was initiated with initial requirements and planning.</p>
              </div>

              {/* Current Status Milestone */}
              <div className="flex-1 rounded-lg bg-green-50/50 p-4">
                <div className="mb-2 flex justify-end">
                  <span className="text-xs text-green-700">{new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <h4 className="text-sm font-medium text-green-700">Current Status: Active</h4>
                </div>
                <p className="pl-5 text-xs text-gray-600">Project is {(() => {
                  const today = new Date();
                  const endDate = project.end_date ? new Date(project.end_date) : new Date();
                  const startDate = new Date(project.start_date);
                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  return totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
                })()}% complete based on timeline.</p>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-green-100">
                  <div className="h-full bg-green-500" style={{ width: `${(() => {
                    const today = new Date();
                    const endDate = project.end_date ? new Date(project.end_date) : new Date();
                    const startDate = new Date(project.start_date);
                    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    return totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
                  })()}%` }}></div>
                </div>
              </div>

              {/* Completion Milestone */}
              {project.end_date && (
                <div className="flex-1 rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex justify-end">
                    <span className="text-xs text-gray-700">{new Date(project.end_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
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
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
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
                        {project.manager.name.split(' ').map(n => n[0]).join('')}
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
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
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
                  <CardDescription>
                    {tasks.length} tasks in this project
                  </CardDescription>
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
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
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

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Resources</CardTitle>
                  <CardDescription>
                    {resources.length} resources allocated to this project
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/modules/project-management/${projectId}/resources`}>
                    Manage Resources
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.slice(0, 5).map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getResourceTypeIcon(resource.type)}
                        <h4 className="font-medium">{resource.name}</h4>
                        <Badge variant="outline">{resource.type}</Badge>
                        {resource.status && (
                          <Badge className={getStatusColor(resource.status)}>
                            {resource.status}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {resource.quantity && <span>Qty: {resource.quantity}</span>}
                        {resource.unit_cost && <span>Unit Cost: SAR {resource.unit_cost}</span>}
                        {resource.total_cost && <span>Total: SAR {resource.total_cost}</span>}
                        {resource.date && <span>Date: {new Date(resource.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {resources.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No resources found</p>
                )}
                {resources.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <Link href={`/modules/project-management/${projectId}/resources`}>
                        View All Resources ({resources.length})
                      </Link>
                    </Button>
                  </div>
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
              <CardDescription>
                No milestones found
              </CardDescription>
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
              <CardDescription>
                No documents found
              </CardDescription>
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
                  <span className="text-sm font-medium">SAR {Number(project.budget).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Spent</span>
                  <span className="text-sm font-medium">SAR {grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Remaining</span>
                  <span className={`text-sm font-medium ${Number(project.budget) - grandTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    SAR {(Number(project.budget) - grandTotal).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className={`h-full ${grandTotal <= Number(project.budget) ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (grandTotal / Number(project.budget)) * 100)}%` }}
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
                  <Badge variant="destructive" className="text-xs">1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Medium Risk</span>
                  <Badge variant="secondary" className="text-xs">2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Low Risk</span>
                  <Badge variant="outline" className="text-xs">3</Badge>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Risk monitoring active
                </div>
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
