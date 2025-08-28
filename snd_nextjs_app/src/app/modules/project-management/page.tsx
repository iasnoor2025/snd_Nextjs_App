'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Pagination components removed as they are not used in this component
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
// Tabs components removed as they are not used in this component
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { PermissionBased } from '@/components/PermissionBased';
import { useRBAC } from '@/lib/rbac/rbac-context';
import ApiService from '@/lib/api-service';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// i18n refactor: All user-facing strings now use useI18n
import { useI18n } from '@/hooks/use-i18n';

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
  team_size?: number;
  location?: string;
  // Project team roles
  project_manager_id?: number;
  project_engineer_id?: number;
  project_foreman_id?: number;
  supervisor_id?: number;
  // Team member names for display
  project_manager?: { id: number; name: string };
  project_engineer?: { id: number; name: string };
  project_foreman?: { id: number; name: string };
  supervisor?: { id: number; name: string };
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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [creatingSample, setCreatingSample] = useState(false);
  const { t } = useI18n();

  // Get allowed actions for project management
  const allowedActions = getAllowedActions('Project');

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

        const response = await ApiService.get(`/projects?${params}`);
        if (response.success) {
          setProjects(response.data);
        } else {
          console.error('Failed to fetch projects:', response);
          toast.error('Failed to fetch projects');
          setProjects(null);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Error fetching projects from database');
        setProjects(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Add event listener for refetch (used by sync function)
    const handleRefetch = () => {
      fetchProjects();
    };

    window.addEventListener('refetch', handleRefetch);
    return () => {
      window.removeEventListener('refetch', handleRefetch);
    };
  }, [search, status, priority, currentPage]);

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      toast.loading('Deleting project...');
      
      const response = await ApiService.delete(`/projects/${projectId}`);
      if (response.success) {
        toast.success('Project deleted successfully');
        
        // Remove from local state
        if (projects) {
          setProjects({
            ...projects,
            data: projects.data.filter(p => p.id !== projectId),
            total: projects.total - 1,
          });
        }
      } else {
        throw new Error(response.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Exporting projects...');
      
      const response = await ApiService.get('/projects/export');
      if (response.success) {
        toast.success('Projects exported successfully');
        // Handle file download if response includes file data
        if (response.data?.downloadUrl) {
          window.open(response.data.downloadUrl, '_blank');
        }
      } else {
        throw new Error(response.message || 'Failed to export projects');
      }
    } catch (error) {
      console.error('Error exporting projects:', error);
      toast.error('Failed to export projects');
    }
  };

  const handleCreateSampleData = async () => {
    try {
      setCreatingSample(true);
      toast.loading('Creating sample project data...');
      
      const response = await ApiService.post('/projects/sample');
      if (response.success) {
        toast.success('Sample project data created successfully');
        // Refresh the projects list
        setCurrentPage(1);
        // Trigger a refetch
        const event = new Event('refetch');
        window.dispatchEvent(event);
      } else {
        throw new Error(response.message || 'Failed to create sample data');
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    } finally {
      setCreatingSample(false);
    }
  };

  const handleSync = async () => {
    try {
      toast.loading('Syncing projects...');
      
      const response = await ApiService.post('/projects/sync');
      if (response.success) {
        toast.success('Projects synced successfully');
        // Refresh the projects list after sync
        setCurrentPage(1);
        // Trigger a refetch
        const event = new Event('refetch');
        window.dispatchEvent(event);
      } else {
        throw new Error(response.message || 'Failed to sync projects');
      }
    } catch (error) {
      console.error('Error syncing projects:', error);
      toast.error('Failed to sync projects');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge className="bg-blue-100 text-blue-800">{t('status_options.planning')}</Badge>;
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">{t('status_options.in_progress')}</Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">{t('status_options.completed')}</Badge>
        );
      case 'on_hold':
        return <Badge className="bg-gray-100 text-gray-800">{t('status_options.on_hold')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">{t('status_options.cancelled')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">{t('priority_options.high')}</Badge>;
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">{t('priority_options.medium')}</Badge>
        );
      case 'low':
        return <Badge className="bg-green-100 text-green-800">{t('priority_options.low')}</Badge>;
      case 'critical':
        return (
          <Badge className="bg-purple-100 text-purple-800">{t('priority_options.critical')}</Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const priorities = ['high', 'medium', 'low', 'critical'];

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
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex space-x-2">
            <PermissionContent action="export" subject="Project">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {t('export')}
              </Button>
            </PermissionContent>

            <PermissionContent action="sync" subject="Project">
              <Button variant="outline" size="sm" onClick={handleSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('sync_projects')}
              </Button>
            </PermissionContent>

            <PermissionContent action="read" subject="Project">
              <Link href="/modules/project-management/templates">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {t('templates')}
                </Button>
              </Link>
            </PermissionContent>

            <PermissionContent action="create" subject="Project">
              <Link href="/modules/project-management/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add_project')}
                </Button>
              </Link>
            </PermissionContent>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_projects')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{t('all_project_types')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('active_projects')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">{t('currently_in_progress')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">{t('successfully_delivered')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('delayed')}</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
              <p className="text-xs text-muted-foreground">{t('behind_schedule')}</p>
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
                  placeholder={t('search_projects')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('filter_by_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_status')}</SelectItem>
                <SelectItem value="planning">{t('planning')}</SelectItem>
                <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="on_hold">{t('on_hold')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('filter_by_priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_priorities')}</SelectItem>
                {priorities.map(priority => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              {t('table_view')}
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              {t('card_view')}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {projects?.total || 0} {t('projects')}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Loading projects...</h3>
              <p className="text-muted-foreground">Please wait while we fetch your projects from the database</p>
            </CardContent>
          </Card>
        )}

        {/* Projects Display */}
        {!loading && viewMode === 'table' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('projects')}</CardTitle>
                  <CardDescription>{t('manage_projects_description')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('project_name')}</TableHead>
                    <TableHead>{t('client')}</TableHead>
                    <TableHead>{t('project_team')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead>{t('priority')}</TableHead>
                    <TableHead>{t('progress')}</TableHead>
                    <TableHead>{t('budget')}</TableHead>
                    <TableHead>{t('timeline')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects?.data.map(project => (
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
                      <TableCell>
                        <div className="space-y-1">
                          {project.project_manager_id && (
                            <div className="text-xs text-muted-foreground">
                              PM: {project.project_manager?.name || '—'}
                            </div>
                          )}
                          {project.project_engineer_id && (
                            <div className="text-xs text-muted-foreground">
                              PE: {project.project_engineer?.name || '—'}
                            </div>
                          )}
                          {project.project_foreman_id && (
                            <div className="text-xs text-muted-foreground">
                              PF: {project.project_foreman?.name || '—'}
                            </div>
                          )}
                          {project.supervisor_id && (
                            <div className="text-xs text-muted-foreground">
                              SP: {project.supervisor?.name || '—'}
                            </div>
                          )}
                          {!project.project_manager_id && !project.project_engineer_id && 
                           !project.project_foreman_id && !project.supervisor_id && (
                            <div className="text-xs text-muted-foreground">No team assigned</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>{getPriorityBadge(project.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={project.progress} className="w-20" />
                          <span className="text-sm">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>SAR {project.budget.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {new Date(project.start_date).toLocaleDateString()} -{' '}
                            {new Date(project.end_date).toLocaleDateString()}
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
        ) : !loading && viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.data.map(project => (
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
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
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
                      <span className="text-muted-foreground">{t('client')}</span>
                      <span className="font-medium">{project.client}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('progress')}</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('budget')}</span>
                      <span className="font-medium">SAR {project.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('timeline')}</span>
                      <span className="font-medium">
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Error State */}
        {!loading && !projects && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-red-600">Failed to load projects</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading your projects from the database. This could be due to a connection issue or database problem.
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentPage(1);
                    const event = new Event('refetch');
                    window.dispatchEvent(event);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCreateSampleData}
                  disabled={creatingSample}
                >
                  {creatingSample ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sample Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Projects State */}
        {!loading && projects && projects.data.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {search || status !== 'all' || priority !== 'all'
                  ? 'No projects match your current filters'
                  : 'No projects found in the database'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || status !== 'all' || priority !== 'all'
                  ? `No projects found matching "${search || 'any search term'}" with status "${status !== 'all' ? status : 'any status'}" and priority "${priority !== 'all' ? priority : 'any priority'}". Try adjusting your search criteria or filters.`
                  : 'The database is empty. Get started by creating your first project or generate some sample data to explore the system.'}
              </p>
              {!search && status === 'all' && priority === 'all' && (
                <div className="flex gap-3 justify-center">
                  <Link href="/modules/project-management/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('create_project')}
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleCreateSampleData}
                    disabled={creatingSample}
                  >
                    {creatingSample ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sample Data
                      </>
                    )}
                  </Button>
                </div>
              )}
              {(search || status !== 'all' || priority !== 'all') && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearch('');
                      setStatus('all');
                      setPriority('all');
                      setCurrentPage(1);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                {t('previous')}
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
                  const pages: number[] = [];
                  const startPage = Math.max(1, projects.current_page - 1);
                  const endPage = Math.min(projects.last_page, projects.current_page + 1);

                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(page);
                  }

                  return pages.map(page => (
                    <Button
                      key={page}
                      variant={projects.current_page === page ? 'default' : 'outline'}
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
                onClick={() =>
                  setCurrentPage(Math.min(projects.last_page, projects.current_page + 1))
                }
                disabled={projects.current_page === projects.last_page}
              >
                {t('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}



        {/* permission-based content example */} 
        <PermissionBased action="manage" subject="Project">
          <Card>
            <CardHeader>
              <CardTitle>{t('project_administration')}</CardTitle>
              <CardDescription>{t('advanced_project_management_features')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <PermissionContent action="manage" subject="Project">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('project_settings')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="export" subject="Project">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('generate_reports')}
                  </Button>
                </PermissionContent>

                <PermissionContent action="import" subject="Project">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('import_projects')}
                  </Button>
                </PermissionContent>
              </div>
            </CardContent>
          </Card>
        </PermissionBased>
      </div>
    </ProtectedRoute>
  );
}
