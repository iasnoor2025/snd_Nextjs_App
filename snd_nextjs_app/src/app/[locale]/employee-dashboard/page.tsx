'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

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
  Mail,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useCurrencyFormat } from '@/lib/translation-utils';

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
    nationality?: string;
    supervisor?: string;
    location?: string;
    contract_hours_per_day?: number;
    contract_days_per_month?: number;
    address?: string;
    city?: string;
    country?: string;
    hourly_rate?: number;
    food_allowance?: number;
    housing_allowance?: number;
    transport_allowance?: number;
    bank_name?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
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
  const { hasPermission } = useRBAC();
  const formatCurrency = useCurrencyFormat();
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);

  // Check if user has permission to view their own dashboard
  const canViewMyDashboard = hasPermission('read', 'mydashboard') || hasPermission('read', 'Employee') || hasPermission('manage', 'Employee');

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user) {
      if (canViewMyDashboard) {
        fetchEmployeeDashboardData();
      } else {
        setLoading(false);
        toast.error(t('dashboard.accessDenied'));
        router.push('/access-denied');
      }
    }
  }, [session, status, router, canViewMyDashboard]);

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
        fetchEmployeeDashboardData();
      } else {
        const error = await response.json();
        toast.error(error.message || t('dashboard.failedToDeleteDocument'));
      }
    } catch {
      toast.error(t('dashboard.errorDeletingDocument'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'manager_approved':
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  const employee = dashboardData?.employee;
  const stats = dashboardData?.statistics;
  const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : session?.user?.name || t('dashboard.employee');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="w-full p-4 md:p-6 lg:p-8 space-y-6">
          {/* Hero Header Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-8 shadow-xl">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('dashboard.employeeDashboard')}</h1>
                  <p className="text-blue-100 text-lg">
                    {t('dashboard.welcomeBackEmployee', { name: employeeName })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                    {employee?.first_name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      {employee?.status || t('dashboard.active')}
                    </Badge>
                    <p className="text-sm text-blue-100 mt-1">{employee?.designation?.name || ''}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-blue-600" />
                {t('dashboard.quickActions')}
              </CardTitle>
              <CardDescription>{t('dashboard.quickActionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.employee?.id && (
                <ActionDialogs
                  employeeId={dashboardData.employee.id.toString()}
                  documentDialogOpen={documentDialogOpen}
                  setDocumentDialogOpen={setDocumentDialogOpen}
                  onDocumentUploaded={fetchEmployeeDashboardData}
                />
              )}
            </CardContent>
          </Card>

          {/* Statistics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalTimesheets')}</CardTitle>
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalTimesheets || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.thisMonth')}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.pendingLeaves')}</CardTitle>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.pendingLeaves || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.awaitingApproval')}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.activeProjects')}</CardTitle>
                <Building className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.activeProjects || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.currentAssignments')}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.totalAdvances')}</CardTitle>
                <DollarSign className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalAdvances || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.advancePayments')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Timesheet Calendar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timesheet Calendar */}
              {dashboardData?.employee?.id && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                      {t('dashboard.timesheetCalendar')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TimesheetCalendar employeeId={dashboardData.employee.id.toString()} />
                  </CardContent>
                </Card>
              )}

              {/* Recent Activities */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Recent Timesheets */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-orange-500" />
                      {t('dashboard.recentTimesheets')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.recentTimesheets?.length ? (
                        dashboardData.recentTimesheets.slice(0, 3).map((timesheet) => (
                          <div key={timesheet.id} className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  {new Date(timesheet.date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {timesheet.hours_worked} {t('dashboard.hours')} + {timesheet.overtime_hours} {t('dashboard.overtime')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {timesheet.start_time?.slice(0, 5)} - {timesheet.end_time?.slice(0, 5)}
                                </p>
                              </div>
                              {getStatusBadge(timesheet.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noRecentTimesheets')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Leave Requests */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      {t('dashboard.recentLeaveRequests')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.recentLeaves?.length ? (
                        dashboardData.recentLeaves.slice(0, 3).map((leave) => (
                          <div key={leave.id} className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{leave.leave_type}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {leave.days} {t('dashboard.days')}
                                </p>
                              </div>
                              {getStatusBadge(leave.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noRecentLeaveRequests')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Current Assignments */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-green-500" />
                    {t('dashboard.currentAssignments')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData?.assignments?.filter(a => a.status === 'active').length ? (
                      dashboardData.assignments.filter(a => a.status === 'active').slice(0, 5).map((assignment) => (
                        <div key={assignment.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{assignment.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {assignment.type === 'project' && assignment.project?.name && (
                                  <span className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {assignment.project.name}
                                  </span>
                                )}
                                {assignment.location && (
                                  <span className="flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {assignment.location}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(assignment.start_date).toLocaleDateString()}
                                {assignment.end_date && ` - ${new Date(assignment.end_date).toLocaleDateString()}`}
                              </p>
                            </div>
                            <Badge variant="default">{assignment.status}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noCurrentProjects')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Employee Info & Documents */}
            <div className="space-y-6">
              {/* Employee Profile Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5 text-blue-600" />
                    {t('dashboard.myProfile')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('dashboard.email')}:</span>
                      <span className="font-medium">{employee?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('dashboard.phone')}:</span>
                      <span className="font-medium">{employee?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('dashboard.department')}:</span>
                      <span className="font-medium">{employee?.department?.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('dashboard.designation')}:</span>
                      <span className="font-medium">{employee?.designation?.name || 'N/A'}</span>
                    </div>
                    {employee?.supervisor && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t('dashboard.supervisor')}:</span>
                        <span className="font-medium">{employee.supervisor}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    {t('dashboard.financialDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee?.basic_salary && employee.basic_salary > 0 && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">{t('dashboard.basicSalary')}</span>
                      <span className="font-semibold">{formatCurrency(employee.basic_salary)}</span>
                    </div>
                  )}
                  {employee?.hourly_rate && employee.hourly_rate > 0 && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">{t('dashboard.hourlyRate')}</span>
                      <span className="font-semibold">{formatCurrency(employee.hourly_rate)}/hr</span>
                    </div>
                  )}
                  {employee?.food_allowance && employee.food_allowance > 0 && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">{t('dashboard.foodAllowance')}</span>
                      <span className="font-semibold">{formatCurrency(employee.food_allowance)}</span>
                    </div>
                  )}
                  {employee?.housing_allowance && employee.housing_allowance > 0 && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">{t('dashboard.housingAllowance')}</span>
                      <span className="font-semibold">{formatCurrency(employee.housing_allowance)}</span>
                    </div>
                  )}
                  {employee?.transport_allowance && employee.transport_allowance > 0 && (
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground">{t('dashboard.transportAllowance')}</span>
                      <span className="font-semibold">{formatCurrency(employee.transport_allowance)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Advances */}
              {dashboardData?.advances?.length > 0 && (
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                      {t('dashboard.recentAdvances')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.advances.slice(0, 3).map((advance) => (
                        <div key={advance.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{formatCurrency(advance.amount)}</p>
                              {advance.reason && (
                                <p className="text-xs text-muted-foreground mt-1">{advance.reason}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(advance.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(advance.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-blue-500" />
                      {t('dashboard.documents')} ({dashboardData?.documents?.length || 0})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocumentDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {t('dashboard.uploadNew')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {dashboardData?.documents?.length ? (
                    <div className="space-y-3">
                      {dashboardData.documents.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className="group relative p-3 border rounded-lg hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{doc.document_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.file_path, '_blank')}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dashboardData.documents.length > 3 && (
                        <Button variant="outline" className="w-full" size="sm">
                          {t('dashboard.viewAllDocuments')} ({dashboardData.documents.length - 3} {t('dashboard.more')})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">{t('dashboard.noDocumentsUploadedYet')}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDocumentDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {t('dashboard.uploadDocument')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
