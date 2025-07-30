// TimesheetSummary.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TimesheetSummary({ employeeId }: { employeeId: number }) {
  // Generate sample data for the current month
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Generate daily records for the month
  const dailyRecords = Array.from({ length: daysInMonth }, (_, i) => {
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

  const calculateMonthlySummary = (records: any[]) => {
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

  const summary = calculateMonthlySummary(dailyRecords);

  return (
    <div className="space-y-4">
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
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {Array.from({ length: 31 }, (_, i) => {
                      const date = new Date(year, month, i + 1);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <th
                          key={i + 1}
                          className={`p-1 text-center text-xs font-medium ${isFridayDay ? 'bg-blue-900 text-blue-200' : 'text-cyan-100'}`}
                        >
                          {i + 1}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Days Row */}
                  <tr className="border-b">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(year, month, i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = dailyRecords.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <td key={`day-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-900' : ''}`}>
                          <div className={`text-[10px] ${isFridayDay ? 'font-bold text-blue-200' : 'text-cyan-200'}`}>
                            {record ? record.dayName : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Regular Hours Row */}
                  <tr className="border-b">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(year, month, i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = dailyRecords.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <td key={`regular-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-900' : ''}`}>
                          {record && record.regularHours > 0 ? (
                            <div className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-cyan-100'}`}>
                              {record.regularHours}h
                            </div>
                          ) : (
                            <div className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-cyan-700'}`}>-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Overtime Hours Row */}
                  <tr className="border-b">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(year, month, i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = dailyRecords.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <td key={`overtime-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-900' : ''}`}>
                          {record && record.overtimeHours > 0 ? (
                            <div className={`text-[10px] font-medium ${isFridayDay ? 'text-blue-200' : 'text-amber-300'}`}>
                              +{record.overtimeHours}h
                            </div>
                          ) : (
                            <div className={`text-[10px] ${isFridayDay ? 'text-blue-400' : 'text-cyan-700'}`}>-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Status Row */}
                  <tr className="border-b">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const date = new Date(year, month, i + 1);
                      const dateString = date.toISOString().slice(0, 10);
                      const record = dailyRecords.find((r) => r.date === dateString);
                      const isFridayDay = date.getDay() === 5;
                      return (
                        <td key={`status-${dateString}`} className={`p-1 text-center ${isFridayDay ? 'bg-blue-900' : ''}`}>
                          <div
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              isFridayDay
                                ? 'bg-blue-800 text-blue-200'
                                : record && record.status === 'present'
                                  ? 'bg-emerald-800 text-emerald-200'
                                  : record && record.status === 'absent'
                                    ? 'bg-red-800 text-red-200'
                                    : 'bg-cyan-900 text-cyan-200'
                            }`}
                          >
                            {isFridayDay
                              ? 'F'
                              : record && record.status === 'present'
                                ? 'P'
                                : record && record.status === 'absent'
                                  ? 'A'
                                  : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}