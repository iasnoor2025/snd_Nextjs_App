'use client';

import { RoleBased } from '@/components/RoleBased';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/hooks/use-i18n';
import { ActiveProject } from '@/lib/services/dashboard-service';
import {
  Calendar,
  CheckCircle,
  Eye,
  Plus,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';



interface ProjectOverviewSectionProps {
  projectData: ActiveProject[];
  onUpdateProject: (project: ActiveProject) => void;
  onHideSection: () => void;
}

export function ProjectOverviewSection({
  projectData,
  onUpdateProject,
  onHideSection,
}: ProjectOverviewSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('all');


  // Ensure projectData is always an array
  const safeProjectData = projectData || [];

  // Filter projects based on status only (priority not available in real data)
  const filteredProjects = safeProjectData.filter(project => {
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesStatus;
  });

  // Calculate summary statistics
  const totalProjects = safeProjectData.length;
  const activeProjects = safeProjectData.filter(p => p.status === 'active').length;
  const completedProjects = safeProjectData.filter(p => p.status === 'completed').length;
  const totalBudget = safeProjectData.reduce((sum, p) => sum + (p.budget ? Number(p.budget) : 0), 0);
  const totalSpent = safeProjectData.reduce((sum, p) => sum + p.spent, 0);
  const averageProgress = totalProjects > 0 ? safeProjectData.reduce((sum, p) => sum + p.progress, 0) / totalProjects : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-4 w-4" />;
      case 'on-hold':
        return <X className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" /> 
              </div>
              {t('dashboard.projectOverview.title') || 'Project Overview'}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {t('dashboard.projectOverview.description') ||
                'Monitor project progress, budgets, and team performance'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
              <Button
                variant="default"
                size="lg"
                onClick={() => router.push('/modules/project-management')}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('dashboard.projectOverview.manageProjects') || 'Manage Projects'}
              </Button>
            </RoleBased>
            <Button
              variant="outline"
              size="lg"
              onClick={onHideSection}
              className="border-2 border-gray-300 hover:border-gray-400"
            >
              {t('dashboard.hideSection') || 'Hide Section'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Summary Cards with Different Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Projects
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {totalProjects}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Target className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Active Projects
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {activeProjects}
                  </p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Completion Rate
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {Math.round(averageProgress)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Budget Used
                  </p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-orange-200 dark:bg-orange-800 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>


        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300 dark:hover:border-blue-700"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {project.teamSize} members
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-gray-600 dark:text-gray-400">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-medium">{project.customer || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">Team Size</p>
                    <p className="font-medium">{project.teamSize} members</p>
                  </div>
                </div>

                {/* Budget Information */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Budget</span>
                    <span className="font-medium">
                      {project.budget ? `SAR ${Number(project.budget).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">Spent</span>
                    <span className="font-medium">SAR {project.spent.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateProject(project)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/modules/project-management/${project.id}`)}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Target className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter !== 'all'
                ? 'Try adjusting your filters to see more projects.'
                : 'Get started by creating your first project.'}
            </p>
            <Button
              onClick={() => router.push('/modules/project-management')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
