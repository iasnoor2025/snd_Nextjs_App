'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, TrendingUp, Eye, Target, Plus } from 'lucide-react';
import { useRouter , useParams } from 'next/navigation';
import { ActiveProject } from '@/lib/services/dashboard-service';
import { useI18n } from '@/hooks/use-i18n';

interface ProjectOverviewSectionProps {
  projectData: ActiveProject[];
  onUpdateProject: (project: ActiveProject) => void;
  onHideSection?: () => void;
  isLoading?: boolean;
}

export default function ProjectOverviewSection({
  projectData,
  onUpdateProject,
  onHideSection,
  isLoading = false,
}: ProjectOverviewSectionProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
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
  const summaryStats = useMemo(() => {
    const totalProjects = safeProjectData.length;
    const activeProjects = safeProjectData.filter(p => p.status === 'active').length;
    const completedProjects = safeProjectData.filter(p => p.status === 'completed').length;
    const totalBudget = safeProjectData.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      totalBudget,
    };
  }, [safeProjectData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="h-3 w-3" />;
      case 'completed':
        return <div className="h-3 w-3 rounded-full bg-blue-600" />;
      case 'on-hold':
        return <div className="h-3 w-3 rounded-full bg-yellow-600" />;
      case 'cancelled':
        return <div className="h-3 w-3 rounded-full bg-red-600" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('dashboard.projectOverview.title')}
          </CardTitle>
          {onHideSection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="text-xs"
            >
              Hide Section
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.projectOverview.totalProjects')}</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{summaryStats.total}</p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Target className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('dashboard.projectOverview.activeProjects')}</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summaryStats.active}</p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('dashboard.projectOverview.completedProjects')}</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{summaryStats.completed}</p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <div className="h-6 w-6 rounded-full bg-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{t('dashboard.projectOverview.totalBudget')}</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    SAR {summaryStats.totalBudget.toLocaleString()}
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('dashboard.projectOverview.status')}:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="all">{t('dashboard.projectOverview.allStatuses')}</option>
              <option value="active">{t('dashboard.projectOverview.active')}</option>
              <option value="completed">{t('dashboard.projectOverview.completed')}</option>
              <option value="on-hold">{t('dashboard.projectOverview.onHold')}</option>
              <option value="cancelled">{t('dashboard.projectOverview.cancelled')}</option>
            </select>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('dashboard.projectOverview.loadingProjects')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.projectOverview.fetchingProjectData')}
            </p>
          </div>
        ) : (
          <>
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
                        onClick={() => router.push(`/${locale}/project-management/${project.id}`)}
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
            {!isLoading && filteredProjects.length === 0 && (
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
                  onClick={() => router.push(`/${locale}/project-management`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
