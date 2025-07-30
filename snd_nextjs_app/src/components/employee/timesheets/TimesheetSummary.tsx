// TimesheetSummary.tsx
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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

export default function TimesheetSummary({ employeeId, showEmployeeSelector = false }: TimesheetSummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [dailyRecords, setDailyRecords] = useState<TimesheetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employeeId);

  // Month/year selector data
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // 2 years back, 2 years forward
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value, 10);
    setSelectedMonth(new Date(selectedMonth.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (value: string) => {
    const newYear = parseInt(value, 10);
    setSelectedMonth(new Date(newYear, selectedMonth.getMonth(), 1));
  };

  // Generate sample data for the selected month
  const generateDailyRecords = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isFriday = date.getDay() === 5;

      return {
        date: date.toISOString().slice(0, 10),
        day: String(day),
        dayName,
        regularHours: Math.random() > 0.3 ? Math.floor(Math.random() * 8) + 6 : 0, // 6-14 hours or 0
        overtimeHours: Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0, // 1-4 hours or 0
        status: isFriday ? 'friday' : (Math.random() > 0.2 ? 'present' : 'absent')
      };
    });
  };

  const calculateMonthlySummary = (records: TimesheetRecord[]) => {
    const summary = {
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      daysWorked: 0,
      daysAbsent: 0,
    };

    records.forEach((record) => {
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
    const records = generateDailyRecords(year, month);
    setDailyRecords(records);
  }, [selectedMonth]);

  const summary = calculateMonthlySummary(dailyRecords);
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-2xl font-bold">Timesheet Summary</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Payslip-style month/year selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.getMonth().toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth.getFullYear().toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
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
            <span>Loading timesheet data...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Regular Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRegularHours.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overtime Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalOvertimeHours.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(summary.totalRegularHours + summary.totalOvertimeHours).toFixed(1)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Timesheet Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <div className="bg-muted/50 px-3 py-2">
                  <h3 className="text-xs font-medium">Daily Timesheet Records</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Array.from({ length: 31 }, (_, i) => {
                          const date = new Date(year, month, i + 1);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableHead
                              key={i + 1}
                              className={`p-1 text-center text-xs font-medium border ${isFridayDay ? 'bg-blue-900 text-blue-200' : 'text-muted-foreground'
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
                          const date = new Date(year, month, i + 1);
                          const dateString = date.toISOString().slice(0, 10);
                          const record = dailyRecords.find((r) => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell key={`day-${dateString}`} className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}>
                              <div className={`text-[10px] ${isFridayDay ? 'font-bold text-blue-200' : 'text-muted-foreground'}`}>
                                {record ? record.dayName : ''}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Regular Hours Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(year, month, i + 1);
                          const dateString = date.toISOString().slice(0, 10);
                          const record = dailyRecords.find((r) => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell key={`regular-${dateString}`} className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}>
                              {record && record.regularHours > 0 ? (
                                <div className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-foreground'}`}>
                                  {record.regularHours}h
                                </div>
                              ) : (
                                <div className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-muted-foreground'}`}>-</div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Overtime Hours Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(year, month, i + 1);
                          const dateString = date.toISOString().slice(0, 10);
                          const record = dailyRecords.find((r) => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell key={`overtime-${dateString}`} className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}>
                              {record && record.overtimeHours > 0 ? (
                                <div className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-orange-500'}`}>
                                  +{record.overtimeHours}h
                                </div>
                              ) : (
                                <div className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-muted-foreground'}`}>-</div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {/* Status Row */}
                      <TableRow>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const date = new Date(year, month, i + 1);
                          const dateString = date.toISOString().slice(0, 10);
                          const record = dailyRecords.find((r) => r.date === dateString);
                          const isFridayDay = date.getDay() === 5;
                          return (
                            <TableCell key={`status-${dateString}`} className={`p-1 text-center border ${isFridayDay ? 'bg-blue-900' : ''}`}>
                              <Badge
                                variant={
                                  isFridayDay
                                    ? 'secondary'
                                    : record && record.status === 'present'
                                      ? 'default'
                                      : record && record.status === 'absent'
                                        ? 'destructive'
                                        : 'outline'
                                }
                                className={`text-[10px] font-bold ${isFridayDay
                                    ? 'bg-blue-800 text-blue-200 border-blue-800'
                                    : record && record.status === 'present'
                                      ? 'bg-green-600 text-white border-green-600'
                                      : record && record.status === 'absent'
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-gray-600 text-white border-gray-600'
                                  }`}
                              >
                                {isFridayDay
                                  ? 'F'
                                  : record && record.status === 'present'
                                    ? 'P'
                                    : record && record.status === 'absent'
                                      ? 'A'
                                      : ''}
                              </Badge>
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