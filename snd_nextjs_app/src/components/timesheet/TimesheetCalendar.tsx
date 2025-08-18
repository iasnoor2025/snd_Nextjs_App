'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TimesheetData {
  id: string;
  date: string;
  hours_worked: string;
  overtime_hours: string;
  status: string;
  start_time?: string;
  end_time?: string;
}

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  timesheet?: TimesheetData | undefined;
  totalHours: number;
  overtimeHours: number;
}

interface TimesheetCalendarProps {
  employeeId: string;
  className?: string;
}

export default function TimesheetCalendar({ employeeId, className = '' }: TimesheetCalendarProps) {
  const { t } = useTranslation('dashboard');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [timesheets, setTimesheets] = useState<TimesheetData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch timesheet data for the current month
  const fetchTimesheetData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/timesheets/employee/${employeeId}?month=${currentMonth}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data.timesheets || []);
      }
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheetData();
  }, [currentMonth, employeeId]);

  const today = new Date();

  const generateCalendar = useCallback(
    (year: number, month: number) => {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const calendar: CalendarDay[] = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendar.push({
          date: '',
          day: 0,
          isCurrentMonth: false,
          isToday: false,
          isFuture: false,
          timesheet: undefined,
          totalHours: 0,
          overtimeHours: 0,
        });
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const date = new Date(year, month - 1, day);
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        const timesheet = timesheets.find(t => t.date === dateStr);
        const totalHours = timesheet ? parseFloat(timesheet.hours_worked) : 0;
        const overtimeHours = timesheet ? parseFloat(timesheet.overtime_hours) : 0;

        calendar.push({
          date: dateStr,
          day,
          isCurrentMonth: true,
          isToday,
          isFuture,
          timesheet,
          totalHours,
          overtimeHours,
        });
      }

      return calendar;
    },
    [timesheets, today]
  );

  const calendarGrid = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    if (!year || !month) return [];

    return generateCalendar(year, month);
  }, [currentMonth, generateCalendar]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    if (!year || !month) return;

    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      if (month === 1) {
        newYear = year - 1;
        newMonth = 12;
      } else {
        newMonth = month - 1;
      }
    } else {
      if (month === 12) {
        newYear = year + 1;
        newMonth = 1;
      } else {
        newMonth = month + 1;
      }
    }

    setCurrentMonth(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'manager_approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getMonthDisplayName = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    if (!year || !month) return '';

    return new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('timesheet_calendar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('loading_calendar')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('timesheet_calendar')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {getMonthDisplayName()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {t('timesheet_entries', { month: getMonthDisplayName() })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium bg-muted rounded">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarGrid.map((day, index) => {
            // Calculate if this is a Friday (6th day in Saturday-start week: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6)
            const isFriday = index % 7 === 6;

            return (
              <div
                key={index}
                className={`p-2 border rounded min-h-[80px] ${
                  !day.isCurrentMonth
                    ? 'bg-muted/30 opacity-50'
                    : day.isToday
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : day.isFuture
                        ? 'bg-muted/50 opacity-50'
                        : isFriday
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-background'
                }`}
              >
                {day.isCurrentMonth && (
                  <>
                    <div className={`text-xs font-medium mb-1 ${isFriday ? 'text-blue-700' : ''}`}>
                      {day.day}
                      {isFriday && <span className="text-xs text-blue-600 ml-1">(H)</span>}
                    </div>

                    {day.timesheet && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium">{day.totalHours}h</span>
                        </div>

                        {day.overtimeHours > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-orange-600" />
                            <span className="text-xs text-orange-600">+{day.overtimeHours}h</span>
                          </div>
                        )}

                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 h-4 ${getStatusColor(day.timesheet.status)}`}
                        >
                          {day.timesheet.status === 'manager_approved'
                            ? 'approved'
                            : day.timesheet.status}
                        </Badge>
                      </div>
                    )}

                    {!day.timesheet && !day.isFuture && (
                      <div className="text-xs text-muted-foreground mt-1">{t('no_entry')}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">
                {timesheets.reduce((sum, t) => sum + parseFloat(t.hours_worked), 0).toFixed(1)}h
              </div>
              <div className="text-muted-foreground">{t('regular_hours')}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">
                {timesheets.reduce((sum, t) => sum + parseFloat(t.overtime_hours), 0).toFixed(1)}h
              </div>
              <div className="text-muted-foreground">{t('overtime')}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {
                  timesheets.filter(t => t.status === 'approved' || t.status === 'manager_approved')
                    .length
                }
              </div>
              <div className="text-muted-foreground">{t('approved')}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
