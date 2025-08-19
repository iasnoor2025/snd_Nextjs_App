'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/lib/api';
import { format } from 'date-fns';
import {
  AlertCircle,
  BarChart3,
  CalendarIcon,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  budget: number;
  status: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completion_percentage: number;
  dependencies: string[];
}

interface Task {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  duration: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

interface Resource {
  id: string;
  name: string;
  type: 'manpower' | 'equipment' | 'material';
  allocated_hours: number;
  total_hours: number;
  cost_per_hour: number;
  total_cost: number;
  availability: number;
}

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  planned_amount: number;
  actual_amount: number;
  variance: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
}

export default function ProjectPlanningPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const projectRes = await apiService.get<{ data: Project }>(`/projects/${projectId}`);
      setProject(projectRes.data);

      // TODO: These endpoints don't exist yet, so we'll set empty arrays
      // Implement these when the endpoints become available
      setMilestones([]);
      setTasks([]);
      setResources([]);
      setBudgetItems([]);
    } catch (error) {
      
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectProgress = () => {
    if (!tasks.length) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  const calculateBudgetVariance = () => {
    if (!budgetItems.length) return 0;
    const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned_amount, 0);
    const totalActual = budgetItems.reduce((sum, item) => sum + item.actual_amount, 0);
    return totalActual - totalPlanned;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
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

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Project not found</h3>
            <p className="text-muted-foreground">The requested project could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectProgress = calculateProjectProgress();
  const budgetVariance = calculateBudgetVariance();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Planning</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectProgress}%</div>
            <Progress value={projectProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.abs(budgetVariance).toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {budgetVariance >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {budgetVariance >= 0 ? 'Over' : 'Under'} budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestones</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {milestones.filter(m => m.status === 'completed').length}/{milestones.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {milestones.filter(m => m.status === 'overdue').length} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resources.filter(r => r.availability < 100).length} over-allocated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Planning Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest task updates and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(task.start_date), 'MMM dd')} -{' '}
                          {format(new Date(task.end_date), 'MMM dd')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-sm font-medium">{task.progress}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Milestones</CardTitle>
                <CardDescription>Next important project milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones
                    .filter(m => m.status !== 'completed')
                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                    .slice(0, 5)
                    .map(milestone => (
                      <div
                        key={milestone.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Due: {format(new Date(milestone.due_date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                          <div className="text-sm font-medium">
                            {milestone.completion_percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                Visual representation of project tasks and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map(task => {
                  const startDate = new Date(task.start_date);
                  const endDate = new Date(task.end_date);
                  const projectStart = new Date(project.start_date);
                  const projectEnd = project.end_date ? new Date(project.end_date) : new Date();
                  const totalDays =
                    (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
                  const taskStartOffset =
                    (startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
                  const taskWidth = (task.duration / totalDays) * 100;
                  const taskLeft = (taskStartOffset / totalDays) * 100;

                  return (
                    <div key={task.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')} (
                            {task.duration} days)
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="absolute h-full bg-blue-500 rounded"
                          style={{
                            left: `${taskLeft}%`,
                            width: `${taskWidth}%`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {task.progress}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Milestones</CardTitle>
                  <CardDescription>Key project milestones and their status</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map(milestone => (
                    <TableRow key={milestone.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {milestone.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(milestone.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={milestone.completion_percentage} className="w-20" />
                          <span className="text-sm">{milestone.completion_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resource Allocation</CardTitle>
                  <CardDescription>Project resources and their allocation status</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map(resource => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="font-medium">{resource.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{resource.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {resource.allocated_hours}/{resource.total_hours} hours
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={resource.availability}
                            className="w-20"
                            style={{
                              backgroundColor: resource.availability < 100 ? '#fef3c7' : '#dcfce7',
                            }}
                          />
                          <span className="text-sm">{resource.availability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>${resource.total_cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Budget Planning</CardTitle>
                  <CardDescription>Project budget breakdown and tracking</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.category}</div>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>${item.planned_amount.toLocaleString()}</TableCell>
                      <TableCell>${item.actual_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center ${item.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {item.variance >= 0 ? '+' : ''}${item.variance.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
      </Tabs>
    </div>
  );
}
