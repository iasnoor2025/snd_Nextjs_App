import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TimesheetRecord {
  date: string;
  day: string;
  dayName: string;
  regularHours: number;
  overtimeHours: number;
  status: string;
}

interface DailyTimesheetRecordsProps {
  timesheets: TimesheetRecord[];
  selectedMonth: string;
  showSummary?: boolean;
  className?: string;
}

export const DailyTimesheetRecords: React.FC<DailyTimesheetRecordsProps> = ({
  timesheets,
  selectedMonth,
  showSummary = true,
  className = ''
}) => {
  const calculateMonthlySummary = (records: TimesheetRecord[]) => {
    const summary = {
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalDays: 0,
      daysWorked: 0,
      daysAbsent: 0,
      status: {
        approved: 0,
        pending: 0,
        rejected: 0,
      },
    };

    // Calculate total days in month
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    summary.totalDays = endDate.getDate();

    // Count days worked and absent (excluding Fridays)
    records.forEach((record) => {
      summary.totalRegularHours += Number(record.regularHours || 0);
      summary.totalOvertimeHours += Number(record.overtimeHours || 0);

      // Skip Friday records
      if (isFriday(record.date)) {
        return;
      }

      if (record.status === 'absent') {
        summary.daysAbsent++;
      } else if (record.regularHours > 0 || record.overtimeHours > 0) {
        summary.daysWorked++;
      }

      if (record.status) {
        summary.status[record.status as keyof typeof summary.status]++;
      }
    });

    return summary;
  };

  // Add this function to check if a day is Friday
  const isFriday = (date: string) => {
    const day = new Date(date).getDay();
    return day === 5; // 5 represents Friday
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showSummary && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Regular Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{calculateMonthlySummary(timesheets).totalRegularHours.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Overtime Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{calculateMonthlySummary(timesheets).totalOvertimeHours.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Days Worked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{calculateMonthlySummary(timesheets).daysWorked}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Days Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{calculateMonthlySummary(timesheets).daysAbsent}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">Daily Timesheet Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 31 }, (_, i) => {
                    const date = new Date(selectedMonth);
                    date.setDate(i + 1);
                    const isFridayDay = date.getDay() === 5;
                    return (
                      <TableHead
                        key={i + 1}
                        className={`p-1 text-center text-xs font-medium ${
                          isFridayDay
                            ? 'bg-blue-600 text-blue-50'
                            : 'bg-muted text-muted-foreground'
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
                  {Array.from(
                    { length: new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate() },
                    (_, i) => {
                      const date = new Date(selectedMonth);
                      date.setDate(i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = timesheets.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <TableCell key={`day-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-600' : ''}`}>
                          <div className={`text-[10px] ${
                            isFridayDay
                              ? 'font-bold text-blue-50'
                              : 'text-muted-foreground'
                          }`}>
                            {record ? record.dayName : ''}
                          </div>
                        </TableCell>
                      );
                    },
                  )}
                </TableRow>
                {/* Regular Hours Row */}
                <TableRow>
                  {Array.from(
                    { length: new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate() },
                    (_, i) => {
                      const date = new Date(selectedMonth);
                      date.setDate(i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = timesheets.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <TableCell key={`regular-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-600' : ''}`}>
                          {record && record.regularHours > 0 ? (
                            <div className={`text-[10px] font-medium ${
                              isFridayDay
                                ? 'text-blue-50'
                                : 'text-foreground'
                            }`}>
                              {record.regularHours}h
                            </div>
                          ) : (
                            <div className={`text-[10px] ${
                              isFridayDay
                                ? 'text-blue-200'
                                : 'text-muted-foreground'
                            }`}>-</div>
                          )}
                        </TableCell>
                      );
                    },
                  )}
                </TableRow>
                {/* Overtime Hours Row */}
                <TableRow>
                  {Array.from(
                    { length: new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate() },
                    (_, i) => {
                      const date = new Date(selectedMonth);
                      date.setDate(i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = timesheets.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <TableCell key={`overtime-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-600' : ''}`}>
                          {record && record.overtimeHours > 0 ? (
                            <div className={`text-[10px] font-medium ${
                              isFridayDay
                                ? 'text-blue-50'
                                : 'text-amber-600'
                            }`}>
                              +{record.overtimeHours}h
                            </div>
                          ) : (
                            <div className={`text-[10px] ${
                              isFridayDay
                                ? 'text-blue-200'
                                : 'text-muted-foreground'
                            }`}>-</div>
                          )}
                        </TableCell>
                      );
                    },
                  )}
                </TableRow>
                {/* Status Row */}
                <TableRow>
                  {Array.from(
                    { length: new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate() },
                    (_, i) => {
                      const date = new Date(selectedMonth);
                      date.setDate(i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = timesheets.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <TableCell key={`status-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-600' : ''}`}>
                          <Badge
                            variant={
                              isFridayDay
                                ? 'secondary'
                                : record &&
                                  (record.status === 'approved' ||
                                    record.status === 'submitted' ||
                                    record.status === 'present')
                                ? 'default'
                                : record && (record.status === 'absent' || record.status === 'A')
                                  ? 'destructive'
                                  : record
                                    ? 'outline'
                                    : 'secondary'
                            }
                            className={`h-5 w-5 rounded-full p-0 text-[8px] font-bold ${
                              isFridayDay
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : record &&
                                  (record.status === 'approved' ||
                                    record.status === 'submitted' ||
                                    record.status === 'present')
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : record && (record.status === 'absent' || record.status === 'A')
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : record
                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                    : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                          >
                            {isFridayDay
                              ? 'F'
                              : record &&
                                (record.status === 'approved' ||
                                  record.status === 'submitted' ||
                                  record.status === 'present')
                                ? 'P'
                                : record && (record.status === 'absent' || record.status === 'A')
                                  ? 'A'
                                  : record
                                    ? record.status
                                    : ''}
                          </Badge>
                        </TableCell>
                      );
                    },
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
