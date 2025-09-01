// TimesheetSummary.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TimesheetRecord {
  date: string;
  day: string;
  dayName: string;
  regularHours: number;
  overtimeHours: number;
  status: string;
}

interface TimesheetSummaryProps {
  employeeId: number;
  showEmployeeSelector?: boolean;
}

export default function TimesheetSummary({
  employeeId,
  showEmployeeSelector = false,
}: TimesheetSummaryProps) {
  const { t } = useTranslation();
  // Initialize with current month (July 2025)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date()); // Current month
  const [dailyRecords, setDailyRecords] = useState<TimesheetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employeeId);

  // Month/year selector data
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // 2 years back, 2 years forward
  const months = [
    { value: 0, label: t('timesheet:months.january') },
    { value: 1, label: t('timesheet:months.february') },
    { value: 2, label: t('timesheet:months.march') },
    { value: 3, label: t('timesheet:months.april') },
    { value: 4, label: t('timesheet:months.may') },
    { value: 5, label: t('timesheet:months.june') },
    { value: 6, label: t('timesheet:months.july') },
    { value: 7, label: t('timesheet:months.august') },
    { value: 8, label: t('timesheet:months.september') },
    { value: 9, label: t('timesheet:months.october') },
    { value: 10, label: t('timesheet:months.november') },
    { value: 11, label: t('timesheet:months.december') },
  ];

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value, 10);
    setSelectedMonth(new Date(selectedMonth.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value, 10);
    setSelectedMonth(new Date(newYear, selectedMonth.getMonth(), 1));
  };

  // Fetch real timesheet data for the selected month
  const fetchTimesheetData = async (year: number, month: number) => {
    if (!selectedEmployeeId) return;

    setIsLoading(true);
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // This gets the last day of the month

      // Fix: Use correct date range for any month
      const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${endDate.getDate()}`;

      const response = await fetch(
        `/api/employees/${selectedEmployeeId}/timesheets?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();

      if (data.success) {
        // Create a map of existing timesheet data
        const timesheetMap = new Map();
        data.data.forEach((timesheet: any) => {
          // Normalize the date to YYYY-MM-DD format by removing time component
          const normalizedDate = timesheet.date.split(' ')[0];

          timesheetMap.set(normalizedDate, {
            regularHours: timesheet.regular_hours || 0,
            overtimeHours: timesheet.overtime_hours || 0,
            status: timesheet.status || 'absent',
          });
        });

        // Generate daily records for the month with proper date handling
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const records = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          // Use proper date construction to avoid timezone issues
          const date = new Date(year, month, day);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isFriday = date.getDay() === 5;
          // Format date as YYYY-MM-DD
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // Get real data if exists, otherwise default
          const timesheetData = timesheetMap.get(dateString);

          return {
            date: dateString,
            day: String(day),
            dayName,
            regularHours: timesheetData ? timesheetData.regularHours : 0,
            overtimeHours: timesheetData ? timesheetData.overtimeHours : 0,
            status: isFriday
              ? 'friday'
              : timesheetData && timesheetData.regularHours > 0
                ? 'present'
                : 'absent',
          };
        });

        setDailyRecords(records);
      }
    } catch (error) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlySummary = (records: TimesheetRecord[]) => {
    const summary = {
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      daysWorked: 0,
      daysAbsent: 0,
    };

    records.forEach(record => {
      summary.totalRegularHours += Number(record.regularHours || 0);
      summary.totalOvertimeHours += Number(record.overtimeHours || 0);

      // Skip Friday records
      if (record.status === 'friday') {
        return;
      }

      if (record.status === 'absent') {
        summary.daysAbsent++;
      } else if (record.regularHours > 0 || record.overtimeHours > 0) {
        summary.daysWorked++;
      }
    });

    return summary;
  };

  // Update records when month changes
  useEffect(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    fetchTimesheetData(year, month);
  }, [selectedMonth, selectedEmployeeId]);

  const summary = calculateMonthlySummary(dailyRecords);
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        {/* <h2 className="text-2xl font-bold">Timesheet Summary</h2> */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Payslip-style month/year selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.getMonth().toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('timesheet:selectMonth')} />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t('timesheet:selectYear')} />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{t('timesheet:loading')}</span>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('timesheet:monthlyRecords')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <div className="bg-muted/50 px-3 py-2">
                  <h3 className="text-xs font-medium">{t('timesheet:dailyRecords')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(year, month, i + 1);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableHead
                              key={i + 1}
                              className={`p-1 text-center text-xs font-medium border ${
                                isFridayDay ? 'bg-blue-900 text-blue-200' : 'text-muted-foreground'
                              }`}
                            >
                              {i + 1}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Days Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(year, month, day);
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = dailyRecords.find(r => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell
                              key={`day-${dateString}`}
                              className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}
                            >
                              <div
                                className={`text-[10px] ${isFridayDay ? 'font-bold text-blue-200' : 'text-muted-foreground'}`}
                              >
                                {record ? record.dayName : ''}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Regular Hours Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(year, month, day);
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = dailyRecords.find(r => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell
                              key={`regular-${dateString}`}
                              className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}
                            >
                              {record && record.regularHours > 0 ? (
                                <div
                                  className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-foreground'}`}
                                >
                                  {record.regularHours}h
                                </div>
                              ) : (
                                <div
                                  className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-muted-foreground'}`}
                                >
                                  -
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Overtime Hours Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(year, month, day);
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = dailyRecords.find(r => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell
                              key={`overtime-${dateString}`}
                              className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}
                            >
                              {record && record.overtimeHours > 0 ? (
                                <div
                                  className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-orange-500'}`}
                                >
                                  +{record.overtimeHours}h
                                </div>
                              ) : (
                                <div
                                  className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-muted-foreground'}`}
                                >
                                  -
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Status Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(year, month, day);
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const record = dailyRecords.find(r => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell
                              key={`status-${dateString}`}
                              className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}
                            >
                              <span
                                className={`text-[10px] font-bold ${
                                  isFridayDay
                                    ? 'text-blue-600'
                                    : record && record.status === 'present'
                                      ? 'text-green-600'
                                      : record && record.status === 'absent'
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                }`}
                              >
                                {isFridayDay
                                  ? 'F'
                                  : record && record.status === 'present'
                                    ? 'P'
                                    : record && record.status === 'absent'
                                      ? 'A'
                                      : ''}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
