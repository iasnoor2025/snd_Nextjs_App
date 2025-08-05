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

      console.log('Frontend - Selected employee:', selectedEmployee);
      console.log('Frontend - Employee type:', typeof selectedEmployee);
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

      const response = await fetch(url, {
        method,
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
        throw new Error(isNewTimesheet ? 'Failed to create timesheet' : 'Failed to update timesheet');
      }

      toast.success(isNewTimesheet ? t('timesheet_created_successfully') : t('timesheet_updated_successfully'));
      setEditDialog(false);
      setEditingTimesheet(null);
      fetchMonthlyData(); // Refresh data
    } catch (error) {
      console.error('Error saving timesheet:', error);
      toast.error(t('failed_to_save_timesheet'));
    }
  };

  // Generate calendar grid - Show only current month like payslip
  const calendarGrid = useMemo(() => {
    if (!monthlyData?.calendar) return [];

    const [year, month] = currentMonth.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentDay = today.getDate();

    console.log('Frontend calendar debug:', {
      year,
      month,
      daysInMonth,
      currentMonth,
      currentYear,
      currentMonthNum,
      currentDay
    });

    // Create grid with only current month days (1 to daysInMonth)
    const grid = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

      // Convert to Saturday-start week (0=Saturday, 1=Sunday, ..., 6=Friday)
      const saturdayStartDayOfWeek = (dayOfWeek + 1) % 7;

      // Check if this is a future date
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
        isCurrentMonth: true, // Always true since we're only showing current month
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isFutureDate,
      };
    });

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

        {/* Enhanced Filters Section */}
        <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Month Navigation */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('prev')}
                  className="hover:bg-white hover:shadow-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[160px]">
                  <div className="text-xl font-semibold text-gray-800">
                    {monthlyData?.summary.month || currentMonth}
                  </div>
                  {selectedEmployee && selectedEmployee !== "" && (
                    <div className="text-sm text-blue-600 font-medium mt-1">
                      Selected Employee
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMonthChange('next')}
                  className="hover:bg-white hover:shadow-sm transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Employee Filter */}
              <div className="flex items-center space-x-3">
                <div className="min-w-[200px] max-w-[400px] w-auto">
                  <EmployeeDropdown
                    value={selectedEmployee}
                    onValueChange={(value) => setSelectedEmployee(value)}
                    placeholder={t('filter_by_employee')}
                    showSearch={true}
                    className=""
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployee('all')}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Summary */}
        {(monthlyData?.summary || !monthlyData) && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                {t('monthly_summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.regularHours || 0)).toFixed(1), isRTL)}
                  </div>
                  <div className="text-sm font-medium text-blue-600">{t('regular_hours')}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center border border-orange-200">
                  <div className="text-3xl font-bold text-orange-700 mb-2">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.overtimeHours || 0)).toFixed(1), isRTL)}
                  </div>
                  <div className="text-sm font-medium text-orange-600">{t('overtime_hours')}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.totalHours || 0)).toFixed(1), isRTL)}
                  </div>
                  <div className="text-sm font-medium text-green-600">{t('total_hours')}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-700 mb-2">
                    {convertToArabicNumerals((Number(monthlyData?.summary?.totalDays || 0)).toString(), isRTL)}
                  </div>
                  <div className="text-sm font-medium text-purple-600">{t('days_worked')}</div>
                </div>
              </div>


            </CardContent>
          </Card>
        )}

        {/* Enhanced Calendar Grid */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              {t('monthly_calendar')}
            </CardTitle>
            <CardDescription className="flex items-center">
              <Edit className="h-4 w-4 mr-1" />
              {t('click_on_timesheet_to_edit_overtime')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Enhanced Day headers - Start with Saturday */}
              {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                <div key={day} className={`p-3 text-center font-semibold text-sm rounded-lg ${
                  day === 'Fri' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the first day of the month - Adjusted for Saturday start */}
              {Array.from({ length: (calendarGrid[0]?.day_of_week + 1) % 7 || 0 }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 border border-gray-200 rounded-lg min-h-[120px] bg-gray-50"></div>
              ))}

              {/* Calendar days - Show only current month like payslip */}
              {calendarGrid.map((day, index) => {
                const isFriday = day.day_of_week === 5; // Friday in Saturday-start week
                
                // Skip future dates
                if (day.isFutureDate) {
                  return (
                    <div
                      key={day.date}
                      className="p-2 border rounded min-h-[100px] bg-gray-100 opacity-50"
                    >
                      <div className="text-sm font-medium mb-1 text-gray-400">
                        {new Date(day.date).getDate()}
                      </div>
                      <div className="text-gray-300 text-xs text-center mt-2">
                        -
                      </div>
                    </div>
                  );
                }
                
                // Check if any timesheet has 0 hours worked (except Fridays)
                const hasZeroHours = day.timesheets.some(timesheet => 
                  (Number(timesheet.hoursWorked) || 0) === 0 && 
                  (Number(timesheet.overtimeHours) || 0) === 0
                );
                
                return (
                  <div
                    key={day.date}
                    className={`p-3 border border-gray-200 rounded-lg min-h-[120px] shadow-sm hover:shadow-md transition-shadow ${
                      isFriday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    } ${
                      day.isToday ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${
                      isFriday ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                      {new Date(day.date).getDate()}
                      {isFriday && <span className="text-xs text-blue-600 ml-1 font-medium">(Holiday)</span>}
                    </div>

                                          {day.timesheets.length > 0 ? (
                        // Show all timesheet data, but mark 0-hour entries differently
                        <div className="space-y-1">
                          {day.timesheets.map((timesheet) => {
                            const hasZeroHours = (Number(timesheet.hoursWorked) || 0) === 0 && 
                                               (Number(timesheet.overtimeHours) || 0) === 0;
                            
                            return (
                              <div
                                key={timesheet.id}
                                className={`text-xs p-2 rounded-lg cursor-pointer hover:shadow-sm transition-all ${
                                  hasZeroHours && !isFriday ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                                }`}
                                onClick={() => handleEditOvertime(timesheet)}
                                title={t('click_to_edit_overtime')}
                              >
                                <div className="font-semibold truncate text-gray-800">
                                  {timesheet.employee.firstName} {timesheet.employee.lastName}
                                </div>
                                <div className="text-gray-700 mt-1">
                                  {hasZeroHours && !isFriday ? (
                                    <span className="text-red-600 font-bold text-sm">A</span>
                                  ) : (
                                    <>
                                      <span className="font-medium">{convertToArabicNumerals((Number(timesheet.hoursWorked) || 0).toString(), isRTL)}h</span>
                                      {(Number(timesheet.overtimeHours) || 0) > 0 && (
                                        <span className="text-orange-600 ml-1 font-medium">
                                          +{convertToArabicNumerals((Number(timesheet.overtimeHours) || 0).toString(), isRTL)}h
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <div className="text-gray-500 truncate text-xs mt-1">
                                  {timesheet.project?.name || timesheet.assignment?.name || t('no_project')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div 
                          className={`text-xs text-center mt-2 cursor-pointer hover:bg-gray-50 rounded p-1 ${
                            isFriday ? 'text-blue-500' : 'text-red-500'
                          }`}
                          onClick={() => {
                            // Create a new timesheet entry for this day
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
                                  employeeId: ''
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