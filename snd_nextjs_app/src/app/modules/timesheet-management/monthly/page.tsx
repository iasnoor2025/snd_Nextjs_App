"use client";

import { useState, useEffect, useMemo } from "react";
import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmployeeDropdown } from "@/components/ui/employee-dropdown";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ArrowLeft,
  Plus,
  CalendarDays
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
    fileNumber: string;
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
  const [selectedEmployee, setSelectedEmployee] = useState('all');
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

      const response = await fetch(`/api/timesheets/monthly?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const data = await response.json();
      console.log('Frontend received monthly data:', data);
      console.log('Calendar keys:', Object.keys(data.calendar || {}));
      console.log('Sample calendar day:', data.calendar ? Object.values(data.calendar)[0] : 'No calendar data');
      setMonthlyData(data);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error(t('failed_to_fetch_monthly_data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [currentMonth, selectedEmployee]);

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
      const isNewTimesheet = editingTimesheet.id.startsWith('temp-');
      const url = isNewTimesheet ? '/api/timesheets' : `/api/timesheets/${editingTimesheet.id}`;
      const method = isNewTimesheet ? 'POST' : 'PUT';

      // Prepare the request body with only the necessary fields
      const requestBody = {
        hoursWorked: editForm.hoursWorked,
        overtimeHours: editForm.overtimeHours,
        // Include other fields that might be needed for creation
        ...(isNewTimesheet && {
          employeeId: editingTimesheet.employeeId,
          date: editingTimesheet.date,
          status: 'draft',
          projectId: editingTimesheet.projectId,
          rentalId: editingTimesheet.rentalId,
          assignmentId: editingTimesheet.assignmentId,
          description: editingTimesheet.description,
          tasksCompleted: editingTimesheet.tasksCompleted,
        }),
      };

      console.log('Frontend - handleSaveEdit - Request details:', {
        isNewTimesheet,
        url,
        method,
        editingTimesheetId: editingTimesheet.id,
        editingTimesheetIdType: typeof editingTimesheet.id,
        requestBody
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Frontend - handleSaveEdit - Response status:', response.status);
      console.log('Frontend - handleSaveEdit - Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Frontend - handleSaveEdit - Error response:', errorData);
        console.log('Frontend - handleSaveEdit - Full error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody
        });
        throw new Error(errorData.error || (isNewTimesheet ? 'Failed to create timesheet' : 'Failed to update timesheet'));
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('Frontend - handleSaveEdit - Success response:', responseData);

      toast.success(isNewTimesheet ? t('timesheet_created_successfully') : t('timesheet_updated_successfully'));
      setEditDialog(false);
      setEditingTimesheet(null);
      fetchMonthlyData();
    } catch (error) {
      console.error('Frontend - handleSaveEdit - Error saving timesheet:', error);
      toast.error(error instanceof Error ? error.message : t('failed_to_save_timesheet'));
    }
  };

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    if (!monthlyData?.calendar) return [];

    const [year, month] = currentMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentDay = today.getDate();



    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const dayOfWeek = currentDate.getDay();
      const saturdayStartDayOfWeek = (dayOfWeek + 1) % 7;

      const isFutureDate = parseInt(year) > currentYear || 
                          (parseInt(year) === currentYear && parseInt(month) > currentMonthNum) ||
                          (parseInt(year) === currentYear && parseInt(month) === currentMonthNum && day > currentDay);

      const dayData = monthlyData.calendar[dateStr] || {
        date: dateStr,
        day_of_week: saturdayStartDayOfWeek,
        day_name: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
        regular_hours: 0,
        overtime_hours: 0,
        timesheets: [],
      };



      return {
        ...dayData,
        isCurrentMonth: true,
        // Use local date string to avoid timezone issues
        isToday: dateStr === new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        isFutureDate,
      };
    });
  }, [monthlyData, currentMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t('loading_monthly_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'read', subject: 'Timesheet' }}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/modules/timesheet-management">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('monthly_timesheet_view')}</h1>
              <p className="text-muted-foreground">{t('view_and_edit_monthly_timesheets')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

        {/* Compact Filters */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Month Navigation */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[140px]">
                <div className="text-lg font-semibold">
                  {monthlyData?.summary.month || currentMonth}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center space-x-2">
              <div className="w-64">
                <EmployeeDropdown
                  value={selectedEmployee}
                  onValueChange={(value) => setSelectedEmployee(value)}
                  placeholder={t('filter_by_employee')}
                  showSearch={true}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployee('all')}
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Compact Summary Cards */}
        {(monthlyData?.summary || !monthlyData) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('regular_hours')}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.regularHours || 0)).toFixed(1), isRTL)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('overtime_hours')}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.overtimeHours || 0)).toFixed(1), isRTL)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('total_hours')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.totalHours || 0)).toFixed(1), isRTL)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('days_worked')}</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.totalDays || 0)).toString(), isRTL)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Compact Calendar */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <CardTitle>{t('monthly_calendar')}</CardTitle>
              </div>
              <CardDescription className="flex items-center space-x-1">
                <Edit className="h-4 w-4" />
                {t('click_on_timesheet_to_edit_overtime')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                <div key={day} className={`p-2 text-center text-xs font-medium rounded ${
                  day === 'Fri' ? 'bg-blue-50 text-blue-700' : 'bg-muted'
                }`}>
                  {day}
                </div>
              ))}

              {/* Empty cells */}
              {Array.from({ length: (calendarGrid[0]?.day_of_week + 1) % 7 || 0 }, (_, i) => (
                <div key={`empty-${i}`} className="p-1 border rounded min-h-[80px] bg-muted/30"></div>
              ))}

              {/* Calendar days */}
              {calendarGrid.map((day) => {
                const isFriday = day.day_of_week === 5;
                
                if (day.isFutureDate) {
                  return (
                    <div key={day.date} className="p-1 border rounded min-h-[80px] bg-muted/50 opacity-50">
                      <div className="text-xs font-medium text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={day.date}
                    className={`p-1 border rounded min-h-[80px] ${
                      isFriday ? 'bg-blue-50 border-blue-200' : 'bg-background'
                    } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isFriday ? 'text-blue-700' : 'text-foreground'
                    }`}>
                      {new Date(day.date).getDate()}
                      {isFriday && <span className="text-xs text-blue-600 ml-1">(H)</span>}
                    </div>

                    {day.timesheets.length > 0 ? (
                      <div className="space-y-1">

                        {day.timesheets.map((timesheet) => {
                          const hasZeroHours = (Number(timesheet.hoursWorked) || 0) === 0 && 
                                             (Number(timesheet.overtimeHours) || 0) === 0;
                          
                          return (
                            <div
                              key={timesheet.id}
                              className={`text-xs p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                                hasZeroHours && !isFriday ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                              }`}
                              onClick={() => handleEditOvertime(timesheet)}
                              title={t('click_to_edit_overtime')}
                            >
                              <div className="font-medium truncate">
                                {timesheet.employee.firstName} {timesheet.employee.lastName}
                              </div>
                              <div className="text-xs">
                                {hasZeroHours && !isFriday ? (
                                  <span className="text-red-600 font-bold">A</span>
                                ) : (
                                  <>
                                    <span className="font-medium">{convertToArabicNumerals((Number(timesheet.hoursWorked) || 0).toString(), isRTL)}h</span>
                                    {(Number(timesheet.overtimeHours) || 0) > 0 && (
                                      <span className="text-orange-600 ml-1">
                                        +{convertToArabicNumerals((Number(timesheet.overtimeHours) || 0).toString(), isRTL)}h
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div 
                        className={`text-xs text-center mt-2 cursor-pointer hover:bg-accent rounded p-1 ${
                          isFriday ? 'text-blue-500' : 'text-red-500'
                        }`}
                        onClick={() => {
                          const newTimesheet = {
                            id: `temp-${day.date}`,
                            employeeId: selectedEmployee || '',
                            date: day.date,
                            hoursWorked: 0,
                            overtimeHours: 0,
                            status: 'draft',
                            employee: {
                              id: selectedEmployee || '',
                              firstName: 'Employee',
                              lastName: '',
                              fileNumber: ''
                            }
                          };
                          handleEditOvertime(newTimesheet);
                        }}
                        title={t('click_to_add_timesheet')}
                      >
                        {isFriday ? 'F' : 'A'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                {t('edit_timesheet')}
              </DialogTitle>
              <DialogDescription>
                {t('edit_timesheet_hours_and_overtime')}
              </DialogDescription>
            </DialogHeader>
            {editingTimesheet && (
              <div className="space-y-4">
                <Card className="p-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {editingTimesheet.employee.firstName.charAt(0)}{editingTimesheet.employee.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {editingTimesheet.employee.firstName} {editingTimesheet.employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(editingTimesheet.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{t('total_hours')}:</span>
                  <span className="text-lg font-bold text-primary">
                    {editForm.hoursWorked + editForm.overtimeHours}h
                  </span>
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