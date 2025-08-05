"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Save,
  X,
  Clock,
  User,
  Building,
  FileText,
  Download,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';
import { convertToArabicNumerals } from '@/lib/translation-utils';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  hoursWorked: number;
  overtimeHours: number;
  status: string;
  projectId?: string;
  rentalId?: string;
  assignmentId?: string;
  description?: string;
  tasksCompleted?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  project?: {
    id: string;
    name: string;
  };
  rental?: {
    id: string;
    rentalNumber: string;
  };
  assignment?: {
    id: string;
    name: string;
    type: string;
  };
}

interface CalendarDay {
  date: string;
  day_of_week: number;
  day_name: string;
  regular_hours: number;
  overtime_hours: number;
  timesheets: Timesheet[];
}

interface MonthlyData {
  calendar: { [key: string]: CalendarDay };
  summary: {
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
    totalDays: number;
    projects: Array<{
      id: string;
      name: string;
      hours: number;
      overtime: number;
      days: number;
    }>;
    month: string;
  };
  filters: {
    month: string;
    employeeId: string;
  };
}

export default function MonthlyTimesheetPage() {
  const { t } = useTranslation('timesheet');
  const { isRTL } = useI18n();
  const { user, hasPermission } = useRBAC();
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; employeeId: string }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    hoursWorked: 0,
    overtimeHours: 0,
  });

  // Fetch monthly data
  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: currentMonth,
        ...(selectedEmployee && selectedEmployee !== "all" && { employeeId: selectedEmployee }),
      });

      console.log('Fetching monthly data with params:', params.toString());
      const response = await fetch(`/api/timesheets/monthly?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

             const data = await response.json();
       console.log('Monthly data received:', data);
       console.log('Summary data:', data.summary);
       console.log('Regular hours:', data.summary?.regularHours, typeof data.summary?.regularHours);
       console.log('Overtime hours:', data.summary?.overtimeHours, typeof data.summary?.overtimeHours);
       
       if (!data.summary) {
         console.warn('No summary data received from API');
       }
       
       setMonthlyData(data);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error(t('failed_to_fetch_monthly_data'));
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees for filter
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch('/api/employees?limit=100');
      if (response.ok) {
        const data = await response.json();
        console.log('Employees fetched:', data.data?.length || 0);
        setEmployees(data.data || []);
      } else {
        console.error('Failed to fetch employees:', response.status);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [currentMonth, selectedEmployee]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle month navigation
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    if (direction === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  // Handle overtime edit
  const handleEditOvertime = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    setEditForm({
      hoursWorked: timesheet.hoursWorked,
      overtimeHours: timesheet.overtimeHours,
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTimesheet) return;

    try {
      const response = await fetch(`/api/timesheets/${editingTimesheet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingTimesheet,
          hoursWorked: editForm.hoursWorked,
          overtimeHours: editForm.overtimeHours,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update timesheet');
      }

      toast.success(t('timesheet_updated_successfully'));
      setEditDialog(false);
      setEditingTimesheet(null);
      fetchMonthlyData(); // Refresh data
    } catch (error) {
      console.error('Error updating timesheet:', error);
      toast.error(t('failed_to_update_timesheet'));
    }
  };

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    if (!monthlyData?.calendar) return [];

    const [year, month] = currentMonth.split('-');
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    console.log('Frontend calendar debug:', {
      year,
      month,
      firstDay: firstDay.toISOString().split('T')[0],
      lastDay: lastDay.toISOString().split('T')[0],
      startDate: startDate.toISOString().split('T')[0]
    });

    const grid = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = monthlyData.calendar[dateStr] || {
        date: dateStr,
        day_of_week: currentDate.getDay(),
        day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        regular_hours: 0,
        overtime_hours: 0,
        timesheets: [],
      };

      grid.push({
        ...dayData,
        isCurrentMonth: currentDate.getMonth() === parseInt(month) - 1,
        isToday: dateStr === new Date().toISOString().split('T')[0],
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('Frontend grid dates:', grid.map(day => ({
      date: day.date,
      isCurrentMonth: day.isCurrentMonth,
      hasTimesheets: day.timesheets.length > 0
    })));

    return grid;
  }, [monthlyData, currentMonth]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">{t('draft')}</Badge>;
      case "submitted":
        return <Badge variant="default">{t('submitted')}</Badge>;
      case "foreman_approved":
        return <Badge className="bg-blue-100 text-blue-800">{t('foreman_approved')}</Badge>;
      case "incharge_approved":
        return <Badge className="bg-purple-100 text-purple-800">{t('incharge_approved')}</Badge>;
      case "checking_approved":
        return <Badge className="bg-orange-100 text-orange-800">{t('checking_approved')}</Badge>;
      case "manager_approved":
        return <Badge className="bg-green-100 text-green-800">{t('manager_approved')}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">{t('rejected')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading_monthly_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <div className="p-6">
                 <div className="flex items-center justify-between mb-6">
           <div className="flex items-center space-x-4">
             <Link href="/modules/timesheet-management">
               <Button variant="outline" size="sm">
                 <ArrowLeft className="h-4 w-4 mr-2" />
                 {t('back')}
               </Button>
             </Link>
             <div>
               <h1 className="text-2xl font-bold">{t('monthly_timesheet_view')}</h1>
               <p className="text-muted-foreground">{t('view_and_edit_monthly_timesheets')}</p>
             </div>
           </div>
          <div className="flex space-x-2">
            <PermissionContent action="export" subject="Timesheet">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t('export_monthly_report')}
              </Button>
            </PermissionContent>
            <Button variant="outline" size="sm" onClick={fetchMonthlyData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                                 <div className="text-center min-w-[120px]">
                   <div className="font-medium">
                     {monthlyData?.summary.month || currentMonth}
                   </div>
                   {selectedEmployee && selectedEmployee !== "all" && (
                     <div className="text-xs text-muted-foreground">
                       {employees.find(emp => emp.id === selectedEmployee)?.firstName} {employees.find(emp => emp.id === selectedEmployee)?.lastName}
                     </div>
                   )}
                 </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Select value={selectedEmployee || "all"} onValueChange={(value) => setSelectedEmployee(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder={loadingEmployees ? t('loading_employees') : t('filter_by_employee')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_employees')}</SelectItem>
                    {loadingEmployees ? (
                      <SelectItem value="loading" disabled>
                        {t('loading_employees')}...
                      </SelectItem>
                    ) : (
                      employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                            <span className="text-xs text-muted-foreground">{employee.employeeId}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEmployees}
                  disabled={loadingEmployees}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEmployees ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

                 {/* Summary */}
         {(monthlyData?.summary || !monthlyData) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('monthly_summary')}</CardTitle>
            </CardHeader>
                         <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="text-center">
                   <div className="text-2xl font-bold text-blue-600">
                     {convertToArabicNumerals((Number(monthlyData?.summary?.regularHours || 0)).toFixed(1), isRTL)}
                   </div>
                   <div className="text-sm text-muted-foreground">{t('regular_hours')}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-orange-600">
                     {convertToArabicNumerals((Number(monthlyData?.summary?.overtimeHours || 0)).toFixed(1), isRTL)}
                   </div>
                   <div className="text-sm text-muted-foreground">{t('overtime_hours')}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-green-600">
                     {convertToArabicNumerals((Number(monthlyData?.summary?.totalHours || 0)).toFixed(1), isRTL)}
                   </div>
                   <div className="text-sm text-muted-foreground">{t('total_hours')}</div>
                 </div>
                 <div className="text-center">
                   <div className="text-2xl font-bold text-purple-600">
                     {convertToArabicNumerals((Number(monthlyData?.summary?.totalDays || 0)).toString(), isRTL)}
                   </div>
                   <div className="text-sm text-muted-foreground">{t('days_worked')}</div>
                 </div>
               </div>

                                            {/* Projects Summary */}
               {monthlyData?.summary?.projects?.length > 0 ? (
                 <div className="mt-6">
                   <h3 className="text-lg font-semibold mb-3">{t('projects_summary')}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {monthlyData?.summary?.projects?.map((project) => (
                       <div key={project.id} className="border rounded-lg p-3">
                         <div className="font-medium">{project.name}</div>
                         <div className="text-sm text-muted-foreground mt-1">
                           <div>{t('hours')}: {convertToArabicNumerals((Number(project.hours) || 0).toFixed(1), isRTL)}h</div>
                           <div>{t('overtime')}: {convertToArabicNumerals((Number(project.overtime) || 0).toFixed(1), isRTL)}h</div>
                           <div>{t('days')}: {convertToArabicNumerals((Number(project.days) || 0).toString(), isRTL)}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="mt-6">
                   <div className="text-center text-muted-foreground py-4">
                     {t('no_timesheet_data_found')}
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        )}

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>{t('monthly_calendar')}</CardTitle>
            <CardDescription>{t('click_on_timesheet_to_edit_overtime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-medium text-sm bg-gray-50 rounded">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarGrid.map((day, index) => (
                <div
                  key={day.date}
                  className={`p-2 border rounded min-h-[100px] ${
                    !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                  } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="text-sm font-medium mb-1">
                    {new Date(day.date).getDate()}
                  </div>
                  
                  {day.timesheets.length > 0 ? (
                    <div className="space-y-1">
                      {day.timesheets.map((timesheet) => (
                        <div
                          key={timesheet.id}
                          className="text-xs p-1 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                          onClick={() => handleEditOvertime(timesheet)}
                          title={t('click_to_edit_overtime')}
                        >
                          <div className="font-medium truncate">
                            {timesheet.employee.firstName} {timesheet.employee.lastName}
                          </div>
                                                     <div className="text-gray-600">
                             {convertToArabicNumerals((Number(timesheet.hoursWorked) || 0).toString(), isRTL)}h
                             {(Number(timesheet.overtimeHours) || 0) > 0 && (
                               <span className="text-orange-600 ml-1">
                                 +{convertToArabicNumerals((Number(timesheet.overtimeHours) || 0).toString(), isRTL)}h
                               </span>
                             )}
                           </div>
                          <div className="text-gray-500 truncate">
                            {timesheet.project?.name || timesheet.assignment?.name || t('no_project')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : day.isCurrentMonth ? (
                    <div className="text-gray-400 text-xs text-center mt-2">
                      {t('no_timesheet')}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('edit_timesheet')}</DialogTitle>
              <DialogDescription>
                {t('edit_timesheet_hours_and_overtime')}
              </DialogDescription>
            </DialogHeader>
            {editingTimesheet && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium">
                    {editingTimesheet.employee.firstName} {editingTimesheet.employee.lastName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(editingTimesheet.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {editingTimesheet.project?.name || editingTimesheet.assignment?.name || t('no_project')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hoursWorked">{t('regular_hours')}</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      step="0.5"
                      min="0"
                      value={editForm.hoursWorked}
                      onChange={(e) => setEditForm(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtimeHours">{t('overtime_hours')}</Label>
                    <Input
                      id="overtimeHours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={editForm.overtimeHours}
                      onChange={(e) => setEditForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <div>{t('total_hours')}: {editForm.hoursWorked + editForm.overtimeHours}h</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                {t('save_changes')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
} 