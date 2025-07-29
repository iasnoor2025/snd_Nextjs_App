'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Users, DollarSign, FileText, Clock, Target, Building2, User } from 'lucide-react';
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
  initial_budget?: number;
  current_budget?: number;
  budget_status?: string;
  budget_notes?: string;
  progress: number;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  manager_id?: string;
  team_size?: number;
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

interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  due_date: string;
  status: string;
  completed_date?: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  uploaded_by: string;
  uploaded_at: string;
  size: string;
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
  equipment_name?: string;
  operator_name?: string;
  worker_name?: string;
  position?: string;
  daily_rate?: number;
  days_worked?: number;
  material_name?: string;
  unit?: string;
  liters?: number;
  price_per_liter?: number;
  fuel_type?: string;
  category?: string;
  expense_description?: string;
  notes?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);

        // Fetch project details
        const projectResponse = await apiService.getProject(projectId);
        setProject(projectResponse.data);

        // Fetch related data
        try {
          const tasksResponse = await apiService.getProjectTasks(projectId);
          setTasks(tasksResponse.data || []);
        } catch (error) {
          console.warn('Failed to fetch tasks:', error);
          setTasks([]);
        }

        try {
          const milestonesResponse = await apiService.getProjectMilestones(projectId);
          setMilestones(milestonesResponse.data || []);
        } catch (error) {
          console.warn('Failed to fetch milestones:', error);
          setMilestones([]);
        }

        try {
          const documentsResponse = await apiService.getProjectDocuments(projectId);
          setDocuments(documentsResponse.data || []);
        } catch (error) {
          console.warn('Failed to fetch documents:', error);
          setDocuments([]);
        }

        try {
          const resourcesResponse = await apiService.getProjectResources(projectId);
          setResources(resourcesResponse.data || []);
        } catch (error) {
          console.warn('Failed to fetch resources:', error);
          setResources([]);
        }

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
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{project.name}</CardTitle>
              <CardDescription className="text-lg">{project.description}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(project.status)}>
                {project.status}
              </Badge>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(project.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm text-gray-600">{project.progress}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Budget</p>
                <p className="text-sm text-gray-600">
                  ${project.current_budget?.toLocaleString() || project.budget.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Team Size</p>
                <p className="text-sm text-gray-600">{project.team_size || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Project Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Project Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
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

            {/* Budget Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Budget Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Initial Budget</p>
                    <p className="text-sm text-gray-600">
                      ${project.initial_budget?.toLocaleString() || project.budget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Current Budget</p>
                    <p className="text-sm text-gray-600">
                      ${project.current_budget?.toLocaleString() || project.budget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={getStatusColor(project.budget_status || 'active')}>
                      {project.budget_status || 'On Track'}
                    </Badge>
                  </div>
                  {project.budget_notes && (
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-gray-600">{project.budget_notes}</p>
                    </div>
                  )}
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
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
              <CardDescription>
                {tasks.length} tasks in this project
              </CardDescription>
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

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>
                {milestones.length} milestones in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{milestone.name}</h4>
                        <Badge className={getStatusColor(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                        {milestone.completed_date && (
                          <span>Completed: {new Date(milestone.completed_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No milestones found</p>
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
                        {resource.unit_cost && <span>Unit Cost: ${resource.unit_cost}</span>}
                        {resource.total_cost && <span>Total: ${resource.total_cost}</span>}
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

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Documents</CardTitle>
              <CardDescription>
                {documents.length} documents uploaded for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{document.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Type: {document.type}</span>
                          <span>Size: {document.size}</span>
                          <span>Uploaded by: {document.uploaded_by}</span>
                          <span>Date: {new Date(document.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No documents found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
