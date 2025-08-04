"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { Can, RoleBased } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  RefreshCw,
  Filter,
  BarChart3,
  FileText,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// i18n refactor: All user-facing strings now use useTranslation('project')
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  description?: string;
  client: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  budget: number;
  progress: number;
  manager?: string;
  team_size?: number;
  location?: string;
}

interface PaginatedResponse {
  data: Project[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export default function ProjectManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const [projects, setProjects] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const { t } = useTranslation('project');

  // Get allowed actions for project management
  const allowedActions = getAllowedActions('Project');

  const mockProjects = [
    {
      id: "1",
      name: "Office Building Construction",
      description: "Modern office complex with 20 floors and underground parking",
      client: "ABC Corporation",
      status: "in_progress",
      priority: "high",
      start_date: "2024-01-01",
      end_date: "2024-06-30",
      budget: 500000,
      progress: 65,
      manager: "John Smith",
      team_size: 45,
      location: "Downtown Business District"
    },
    {
      id: "2",
      name: "Residential Complex",
      description: "Luxury residential development with 150 units",
      client: "XYZ Developers",
      status: "planning",
      priority: "medium",
      start_date: "2024-03-01",
      end_date: "2024-12-31",
      budget: 800000,
      progress: 25,
      manager: "Sarah Johnson",
      team_size: 32,
      location: "Suburban Area"
    },
    {
      id: "3",
      name: "Highway Bridge Repair",
      description: "Critical infrastructure maintenance and repair",
      client: "City Council",
      status: "completed",
      priority: "high",
      start_date: "2023-10-01",
      end_date: "2024-02-28",
      budget: 300000,
      progress: 100,
      manager: "Mike Wilson",
      team_size: 18,
      location: "Main Highway"
    },
    {
      id: "4",
      name: "Shopping Mall Renovation",
      description: "Complete renovation of existing shopping center",
      client: "Retail Properties Inc",
      status: "on_hold",
      priority: "medium",
      start_date: "2024-02-15",
      end_date: "2024-08-15",
      budget: 1200000,
      progress: 15,
      manager: "Lisa Chen",
      team_size: 28,
      location: "Commercial District"
    },
    {
      id: "5",
      name: "Industrial Warehouse",
      description: "Large-scale warehouse facility for logistics",
      client: "Logistics Solutions Ltd",
      status: "in_progress",
      priority: "low",
      start_date: "2024-01-15",
      end_date: "2024-05-15",
      budget: 400000,
      progress: 80,
      manager: "David Brown",
      team_size: 22,
      location: "Industrial Zone"
    }
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          ...(search && { search }),
          ...(status && status !== 'all' && { status }),
          ...(priority && priority !== 'all' && { priority }),
        });

        const response = await fetch(`/api/projects?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Use mock data for demo
        setProjects({
          data: mockProjects,
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: mockProjects.length,
          next_page_url: null,
          prev_page_url: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [search, status, priority, currentPage]);

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      toast.loading("Deleting project...");
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Project deleted successfully");

      // Remove from local state
      if (projects) {
        setProjects({
          ...projects,
          data: projects.data.filter(p => p.id !== projectId),
          total: projects.total - 1
        });
      }
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planning":
        return <Badge className="bg-blue-100 text-blue-800">{t('project.status.planning')}</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('project.status.in_progress')}</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">{t('project.status.completed')}</Badge>;
      case "on_hold":
        return <Badge className="bg-gray-100 text-gray-800">{t('project.status.on_hold')}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">{t('project.status.cancelled')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">{t('project.priority.high')}</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('project.priority.medium')}</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-800">{t('project.priority.low')}</Badge>;
      case "critical":
        return <Badge className="bg-purple-100 text-purple-800">{t('project.priority.critical')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const priorities = Array.from(new Set(mockProjects.map(p => p.priority).filter(Boolean)));

  const calculateStats = () => {
    if (!projects?.data) return { total: 0, active: 0, completed: 0, delayed: 0 };

    const total = projects.data.length;
    const active = projects.data.filter(p => p.status === 'in_progress').length;
    const completed = projects.data.filter(p => p.status === 'completed').length;
    const delayed = projects.data.filter(p => p.progress < 50 && p.status === 'in_progress').length;

    return { total, active, completed, delayed };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Project' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('project.loading')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Project' }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('project.title')}</h1>
            <p className="text-muted-foreground">{t('project.description')}</p>
          </div>
          <div className="flex space-x-2">
            <Can action="export" subject="Project">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('project.export')}
              </Button>
            </Can>

            <Can action="sync" subject="Project">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('project.sync_projects')}
              </Button>
            </Can>

            <Can action="read" subject="Project">
              <Link href="/modules/project-management/templates">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('project.templates')}
                </Button>
              </Link>
            </Can>

            <Can action="create" subject="Project">
              <Link href="/modules/project-management/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('project.add_project')}
                </Button>
              </Link>
            </Can>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('project.total_projects')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t('project.all_project_types')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('project.active_projects')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {t('project.currently_in_progress')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('project.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {t('project.successfully_delivered')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('project.delayed')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
            <p className="text-xs text-muted-foreground">
              {t('project.behind_schedule')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('project.search_projects')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('project.filter_by_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('project.all_status')}</SelectItem>
              <SelectItem value="planning">{t('project.planning')}</SelectItem>
              <SelectItem value="in_progress">{t('project.in_progress')}</SelectItem>
              <SelectItem value="completed">{t('project.completed')}</SelectItem>
              <SelectItem value="on_hold">{t('project.on_hold')}</SelectItem>
              <SelectItem value="cancelled">{t('project.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('project.filter_by_priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('project.all_priorities')}</SelectItem>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            {t('project.table_view')}
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            {t('project.card_view')}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {projects?.total || 0} {t('project.projects')}
          </span>
        </div>
      </div>

      {/* Projects Display */}
      {viewMode === "table" ? (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('project.projects')}</CardTitle>
              <CardDescription>
                {t('project.manage_projects_description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('project.project_name')}</TableHead>
                <TableHead>{t('project.client')}</TableHead>
                  <TableHead>{t('project.manager')}</TableHead>
                <TableHead>{t('project.status')}</TableHead>
                <TableHead>{t('project.priority')}</TableHead>
                <TableHead>{t('project.progress')}</TableHead>
                <TableHead>{t('project.budget')}</TableHead>
                <TableHead>{t('project.timeline')}</TableHead>
                <TableHead className="text-right">{t('project.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.data.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>{project.client}</TableCell>
                    <TableCell>{project.manager || '—'}</TableCell>
                  <TableCell>{getStatusBadge(project.status)}</TableCell>
                  <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                  <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={project.progress} className="w-20" />
                        <span className="text-sm">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>${project.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/modules/project-management/${project.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/modules/project-management/${project.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.data.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Link href={`/modules/project-management/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/modules/project-management/${project.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('project.client')}</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  {project.manager && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('project.manager')}</span>
                      <span className="font-medium">{project.manager}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('project.progress')}</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('project.budget')}</span>
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('project.timeline')}</span>
                    <span className="font-medium">
                      {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {projects && projects.last_page > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, projects.current_page - 1))}
              disabled={projects.current_page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('project.previous')}
            </Button>

            <div className="flex items-center gap-1">
              {/* First page */}
              {projects.current_page > 2 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className="w-8 h-8 p-0"
                  >
                    1
                  </Button>
                  {projects.current_page > 3 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                </>
              )}

              {/* Current page and surrounding pages */}
              {(() => {
                const pages = [];
                const startPage = Math.max(1, projects.current_page - 1);
                const endPage = Math.min(projects.last_page, projects.current_page + 1);

                for (let page = startPage; page <= endPage; page++) {
                  pages.push(page);
                }

                return pages.map((page) => (
                  <Button
                    key={page}
                    variant={projects.current_page === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ));
              })()}

              {/* Last page */}
              {projects.current_page < projects.last_page - 1 && (
                <>
                  {projects.current_page < projects.last_page - 2 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(projects.last_page)}
                    className="w-8 h-8 p-0"
                  >
                    {projects.last_page}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(projects.last_page, projects.current_page + 1))}
              disabled={projects.current_page === projects.last_page}
            >
              {t('project.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {projects?.data.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('project.no_projects_found')}</h3>
            <p className="text-muted-foreground mb-4">
              {search || status !== 'all' || priority !== 'all'
                ? t('project.no_projects_match_filters')
                : t('project.get_started_by_creating_project')}
            </p>
            {!search && status === 'all' && priority === 'all' && (
              <Link href="/modules/project-management/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('project.create_project')}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Role-based content example */}
      <RoleBased roles={['ADMIN', 'MANAGER']}>
        <Card>
          <CardHeader>
            <CardTitle>{t('project.project_administration')}</CardTitle>
            <CardDescription>
              {t('project.advanced_project_management_features')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Can action="manage" subject="Project">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('project.project_settings')}
                </Button>
              </Can>

              <Can action="export" subject="Project">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('project.generate_reports')}
                </Button>
              </Can>

              <Can action="import" subject="Project">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('project.import_projects')}
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>
      </RoleBased>
    </div>
  </ProtectedRoute>
  );
}
