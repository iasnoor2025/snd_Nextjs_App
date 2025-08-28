'use client';

import ActionDialogs from '@/components/employee/ActionDialogs';
import TimesheetCalendar from '@/components/timesheet/TimesheetCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  Building,
  Calendar,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface EmployeeDashboardData {
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    hire_date: string;
    basic_salary: number;
    status: string;
    department: {
      id: number;
      name: string;
      code: string;
    };
    designation: {
      id: number;
      name: string;
      description: string;
    };
    user: {
      id: number;
      name: string;
      email: string;
      roleId: number;
    };
  };
  statistics: {
    totalTimesheets: number;
    pendingLeaves: number;
    approvedLeaves: number;
    activeProjects: number;
    totalAssignments: number;
    totalDocuments: number;
    totalAdvances: number;

  };
  recentTimesheets: Array<{
    id: string;
    date: string;
    hours_worked: string;
    overtime_hours: string;
    status: string;
    created_at: string;
    start_time: string;
    end_time: string;
  }>;
  recentLeaves: Array<{
    id: string;
    start_date: string;
    end_date: string;
    leave_type: string;
    status: string;
    created_at: string;
    reason: string;
    days: number;
  }>;
  currentProjects: Array<{
    id: number;
    name: string;
    description?: string;
    status: string;
    assignmentStatus: string;
  }>;
  documents: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>;
  assignments: Array<{
    id: number;
    name: string;
    type: string;
    location?: string;
    start_date: string;
    end_date?: string;
    status: string;
    notes?: string;
    project_id?: number;
    rental_id?: number;
    project?: {
      id: number;
      name: string;
    };
    rental?: {
      id: number;
      name: string;
    };
    created_at: string;
    updated_at: string;
  }>;
  advances: Array<{
    id: string;
    amount: number;
    reason?: string;
    status: string;
    created_at: string;
  }>;

}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchEmployeeDashboardData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchEmployeeDashboardData = async () => {
    try {
      const response = await fetch('/api/employee-dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch {
      // Silently handle errors for dashboard loading
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/employee/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('dashboard.documentDeletedSuccessfully'));
        // Refresh dashboard data
        fetchEmployeeDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.message || t('dashboard.failedToDeleteDocument'));
      }
    } catch {
      toast.error(t('dashboard.errorDeletingDocument'));
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="h-full w-full bg-background">
      <div className="w-full p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t('dashboard.employeeDashboard')}</h1>
              <p className="text-muted-foreground">
                {t('dashboard.welcomeBackEmployee', { 
                  name: dashboardData?.employee ? `${dashboardData.employee.first_name} ${dashboardData.employee.last_name}` : session?.user?.name || t('dashboard.employee')
                })}
              </p>
            </div>
            <Badge variant="default">{t('dashboard.active')}</Badge>
          </div>
        </div>

        {/* Quick Actions - First Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('dashboard.quickActions')}
              </CardTitle>
              <CardDescription>{t('dashboard.quickActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {dashboardData?.employee?.id && (
                  <ActionDialogs
                    employeeId={dashboardData.employee.id}
                    documentDialogOpen={documentDialogOpen}
                    setDocumentDialogOpen={setDocumentDialogOpen}
                    onDocumentUploaded={fetchEmployeeDashboardData}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards - Second Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.overview')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalTimesheets')}</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.statistics?.totalTimesheets || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.thisMonth')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.pendingLeaves')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.statistics?.pendingLeaves || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.awaitingApproval')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.activeProjects')}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.assignments?.filter(a => a.type === 'project' && a.status === 'active').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.currentAssignments')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalAssignments')}</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.assignments?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.allAssignments')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalAdvances')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData?.statistics?.totalAdvances || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.advancePayments')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Timesheet Calendar - Third Section */}
        {dashboardData?.employee?.id && (
          <div className="mb-8">
            <TimesheetCalendar employeeId={dashboardData.employee.id} />
          </div>
        )}

        {/* Recent Activities & Projects - Fourth Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Recent Timesheets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('dashboard.recentTimesheets')}
              </CardTitle>
              <CardDescription>{t('dashboard.latestTimesheetEntries')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentTimesheets?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {dashboardData?.recentTimesheets?.[0]?.date
                          ? new Date(dashboardData.recentTimesheets[0].date).toLocaleDateString()
                          : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData?.recentTimesheets?.[0]?.hours_worked} {t('dashboard.hours')} +{' '}
                        {dashboardData?.recentTimesheets?.[0]?.overtime_hours} {t('dashboard.overtime')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData?.recentTimesheets?.[0]?.start_time?.slice(0, 5)} -{' '}
                        {dashboardData?.recentTimesheets?.[0]?.end_time?.slice(0, 5)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        dashboardData?.recentTimesheets?.[0]?.status === 'manager_approved'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {dashboardData?.recentTimesheets?.[0]?.status === 'manager_approved'
                        ? t('dashboard.approved')
                        : dashboardData?.recentTimesheets?.[0]?.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noRecentTimesheets')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('dashboard.recentLeaveRequests')}
              </CardTitle>
              <CardDescription>{t('dashboard.latestLeaveApplications')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentLeaves?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {dashboardData.recentLeaves[0]?.leave_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.recentLeaves[0]?.start_date
                          ? new Date(dashboardData.recentLeaves[0].start_date).toLocaleDateString()
                          : 'N/A'}{' '}
                        -{' '}
                        {dashboardData.recentLeaves[0]?.end_date
                          ? new Date(dashboardData.recentLeaves[0].end_date).toLocaleDateString()
                          : 'N/A'}{' '}
                        ({dashboardData.recentLeaves[0]?.days || 0} {t('dashboard.days')})
                      </p>
                      {dashboardData.recentLeaves[0]?.reason && (
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.reason')}: {dashboardData.recentLeaves[0]?.reason}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        dashboardData.recentLeaves[0]?.status === 'approved'
                          ? 'default'
                          : dashboardData.recentLeaves[0]?.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {dashboardData.recentLeaves[0]?.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noRecentLeaveRequests')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('dashboard.currentProjects')}
              </CardTitle>
              <CardDescription>{t('dashboard.projectsCurrentlyAssigned')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.assignments?.filter(a => a.type === 'project' && a.status === 'active').length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {dashboardData.assignments.filter(a => a.type === 'project' && a.status === 'active')[0]?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.assignments.filter(a => a.type === 'project' && a.status === 'active')[0]?.project?.name || t('dashboard.projectAssignment')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        dashboardData.assignments.filter(a => a.type === 'project' && a.status === 'active')[0]?.status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {dashboardData.assignments.filter(a => a.type === 'project' && a.status === 'active')[0]?.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noCurrentProjects')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Advances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('dashboard.recentAdvances')}
              </CardTitle>
              <CardDescription>{t('dashboard.latestAdvanceRequests')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.advances?.length ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        ${dashboardData.advances[0]?.amount?.toLocaleString() || '0'}
                      </p>
                      {dashboardData.advances[0]?.reason && (
                        <p className="text-xs text-muted-foreground">
                          {dashboardData.advances[0]?.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {dashboardData.advances[0]?.created_at
                          ? new Date(dashboardData.advances[0].created_at).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        dashboardData.advances[0]?.status === 'approved'
                          ? 'default'
                          : dashboardData.advances[0]?.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {dashboardData.advances[0]?.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('dashboard.noRecentAdvances')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Profile - Compact Professional Design */}
        <div className="mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {dashboardData?.employee?.first_name?.charAt(0) || 'E'}
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {dashboardData?.employee ? `${dashboardData.employee.first_name} ${dashboardData.employee.last_name}` : t('dashboard.employeeName')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {dashboardData?.employee?.designation?.name || t('dashboard.designation')} •{' '}
                    {dashboardData?.employee?.department?.name || t('dashboard.department')}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Personal & Contact Info */}
                <div className="p-6 border-r border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('dashboard.personalInformation')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.email')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.email || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.phone')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.nationality')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.nationality || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.hireDate')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.hire_date
                          ? new Date(dashboardData.employee.hire_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">{t('dashboard.supervisor')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.supervisor || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Employment & Address */}
                <div className="p-6 border-r border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t('dashboard.employmentAndLocation')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.location')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.location || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.contractHours')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.contract_hours_per_day || 'N/A'} {t('dashboard.hrsPerDay')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.contractDays')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.contract_days_per_month || 'N/A'} {t('dashboard.daysPerMonth')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.address')}</span>
                      <span
                        className="text-sm font-medium text-gray-900 max-w-[150px] truncate"
                        title={dashboardData?.employee?.address || 'N/A'}
                      >
                        {dashboardData?.employee?.address || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.city')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.city || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">{t('dashboard.country')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.country || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('dashboard.financialDetails')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.basicSalary')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.basic_salary
                          ? `$${dashboardData.employee.basic_salary.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.hourlyRate')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.hourly_rate
                          ? `$${dashboardData.employee.hourly_rate}/hr`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.foodAllowance')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.food_allowance
                          ? `$${dashboardData.employee.food_allowance}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.housingAllowance')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.housing_allowance
                          ? `$${dashboardData.employee.housing_allowance}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{t('dashboard.transportAllowance')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.transport_allowance
                          ? `$${dashboardData.employee.transport_allowance}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">{t('dashboard.bank')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.bank_name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information - Collapsible Sections */}
              <div className="border-t border-gray-100">
                {/* Emergency Contact */}
                <div className="p-6 border-b border-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('dashboard.emergencyContact')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">{t('dashboard.contactName')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.emergency_contact_name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">{t('dashboard.contactPhone')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData?.employee?.emergency_contact_phone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conditional Sections */}
                {/* Documents Section - Always Show */}
                <div className="p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('dashboard.documents')} ({dashboardData?.documents?.length || 0})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentDialogOpen(true)}
                      className="text-xs"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {t('dashboard.uploadNew')}
                    </Button>
                  </div>

                  {dashboardData?.documents?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboardData.documents.slice(0, 3).map(doc => (
                        <div
                          key={doc.id}
                          className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105"
                        >
                          {/* Document Preview - Larger Size */}
                          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                            {/* Thumbnail Image or File Icon */}
                            {doc.file_name
                              .toLowerCase()
                              .match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ? (
                              // Show image thumbnail
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={doc.file_path}
                                  alt={doc.file_name}
                                  className="max-w-full max-h-full object-cover rounded-lg shadow-md"
                                  onError={e => {
                                    // Fallback to icon if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                {/* Fallback icon (hidden by default) */}
                                <div className="hidden text-center">
                                  <div className="w-20 h-24 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <FileText className="h-10 w-10 text-white" />
                                  </div>
                                  <p className="text-sm text-gray-700 font-semibold">
                                    {doc.document_type}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {doc.file_name.split('.').pop()?.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              // Show file icon for non-image files
                              <div className="text-center">
                                <div className="w-20 h-24 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                  <FileText className="h-10 w-10 text-white" />
                                </div>
                                <p className="text-sm text-gray-700 font-semibold">
                                  {doc.document_type}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.file_name.split('.').pop()?.toUpperCase()}
                                </p>
                              </div>
                            )}

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-2 group-hover:translate-y-0 flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(doc.file_path, '_blank')}
                                  className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  {t('dashboard.view')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="shadow-lg"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {t('dashboard.delete')}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Document Info */}
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-semibold text-gray-900 truncate"
                                  title={doc.file_name}
                                >
                                  {doc.file_name}
                                </p>
                                {doc.description && (
                                  <p
                                    className="text-xs text-gray-600 mt-2 line-clamp-2"
                                    title={doc.description}
                                  >
                                    {doc.description}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dashboardData.documents.length > 3 && (
                        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 font-medium">
                              +{dashboardData.documents.length - 3} {t('dashboard.moreDocuments')}
                            </p>
                            <p className="text-xs text-gray-500">{t('dashboard.clickToViewAll')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Empty State - Show when no documents */
                    <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 font-medium mb-2">
                          {t('dashboard.noDocumentsUploadedYet')}
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          {t('dashboard.uploadFirstDocumentToGetStarted')}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDocumentDialogOpen(true)}
                          className="text-xs"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {t('dashboard.uploadDocument')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>



                {dashboardData?.advances?.length ? (
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {t('dashboard.recentAdvances')}
                    </h3>
                    <div className="space-y-2">
                      {dashboardData.advances.slice(0, 2).map(advance => (
                        <div
                          key={advance.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              ${advance.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(advance.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              advance.status === 'approved'
                                ? 'default'
                                : advance.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {advance.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
