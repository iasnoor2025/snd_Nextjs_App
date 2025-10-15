'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Save, Calendar, User } from 'lucide-react';

interface TimesheetData {
  date: string;
  workingHours: string;
  overtime: string;
}

interface BulkTimesheetFormProps {
  className?: string;
}

export default function BulkTimesheetForm({ className }: BulkTimesheetFormProps) {
  const [empCode, setEmpCode] = useState('');
  const [month, setMonth] = useState('');
  const [datesArr, setDatesArr] = useState<string[]>([]);
  const [timesheetData, setTimesheetData] = useState<TimesheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMonth(currentMonth);
  }, []);

  // Build table when empCode or month changes
  useEffect(() => {
    if (empCode.trim() && month) {
      buildTable(month);
      loadExistingData();
    } else {
      clearTable();
    }
  }, [empCode, month]);

  const clearTable = () => {
    setDatesArr([]);
    setTimesheetData([]);
  };

  const buildTable = (monthVal: string) => {
    const [yy, mm] = monthVal.split('-');
    const days = new Date(parseInt(yy), parseInt(mm), 0).getDate();
    const dates: string[] = [];
    const data: TimesheetData[] = [];

    for (let i = 1; i <= days; i++) {
      const iso = `${yy}-${mm}-${String(i).padStart(2, '0')}`;
      dates.push(iso);
      
      const d = new Date(iso);
      const isFri = d.getDay() === 5;
      const defaultH = isFri ? '' : '8';
      
      data.push({
        date: iso,
        workingHours: defaultH,
        overtime: ''
      });
    }

    setDatesArr(dates);
    setTimesheetData(data);
  };

  const loadExistingData = async () => {
    if (!empCode.trim() || !month) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/timesheets/bulk-submit?empCode=${empCode}&month=${month}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const existingData = result.data;
        setTimesheetData(prev => 
          prev.map((item, index) => {
            const existing = existingData[index];
            return existing ? {
              ...item,
              workingHours: existing.workingHours,
              overtime: existing.overtime
            } : item;
          })
        );
        toast.success('Existing data loaded');
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast.error('Failed to load existing data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimesheetData = (index: number, field: 'workingHours' | 'overtime', value: string) => {
    setTimesheetData(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const applyFridayLogic = (index: number, workingHours: string) => {
    const date = new Date(datesArr[index]);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (dayName !== 'Friday') {
      return workingHours;
    }

    const prev = index > 0 ? timesheetData[index - 1]?.workingHours || 'A' : 'A';
    const next = index < timesheetData.length - 1 ? timesheetData[index + 1]?.workingHours || 'A' : 'A';
    
    if (prev === 'A' && next === 'A') {
      return 'A';
    } else if (workingHours === 'A') {
      return 'Fri';
    }
    
    return workingHours;
  };

  const handleSubmit = async () => {
    if (!empCode.trim() || !month) {
      toast.error('Please enter Employee Code and select Month');
      return;
    }

    setIsSubmitting(true);
    try {
      // Apply Friday logic to all entries
      const processedData = timesheetData.map((item, index) => ({
        ...item,
        workingHours: applyFridayLogic(index, item.workingHours.trim() || 'A')
      }));

      const payload = {
        empCode: empCode.trim(),
        month,
        dates: processedData.map(item => item.date),
        workingHours: processedData.map(item => item.workingHours),
        overtime: processedData.map(item => item.overtime)
      };

      const response = await fetch('/api/timesheets/bulk-submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        // Reload data to show updated values
        loadExistingData();
      } else {
        toast.error(result.error || 'Failed to save timesheet data');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast.error('Failed to submit timesheet data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const isFriday = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDay() === 5;
  };

  const getMonthName = (monthVal: string) => {
    const [yy, mm] = monthVal.split('-');
    const date = new Date(parseInt(yy), parseInt(mm) - 1, 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-4 w-4" />
          Employee Monthly Work Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields - More Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="empCode" className="text-sm font-medium flex items-center gap-1">
              <User className="h-3 w-3" />
              Employee Code
            </Label>
            <Input
              id="empCode"
              placeholder="E.g., EMP123"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="month" className="text-sm font-medium">
              Select Month
            </Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        {/* Timesheet Table - More Compact */}
        {datesArr.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto border rounded-lg">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="w-20 text-xs font-medium">Dates</TableHead>
                    {datesArr.map((date, index) => (
                      <TableHead 
                        key={index} 
                        className={`text-center min-w-8 text-xs font-medium ${isFriday(date) ? 'bg-green-50' : ''}`}
                      >
                        {index + 1}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow className="h-6">
                    <TableHead className="w-20 text-xs">Days</TableHead>
                    {datesArr.map((date, index) => (
                      <TableHead 
                        key={index} 
                        className={`text-center text-xs ${isFriday(date) ? 'bg-green-50' : ''}`}
                      >
                        {getDayName(date)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="h-8">
                    <TableHead className="bg-gray-50 text-xs font-medium">Regular Hours</TableHead>
                    {timesheetData.map((item, index) => (
                      <TableCell 
                        key={index} 
                        className={`text-center p-0.5 ${isFriday(item.date) ? 'bg-green-50' : ''}`}
                      >
                        <Input
                          className="w-10 h-6 text-xs text-center border-gray-300"
                          value={item.workingHours}
                          onChange={(e) => updateTimesheetData(index, 'workingHours', e.target.value)}
                          placeholder="8"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow className="h-8">
                    <TableHead className="bg-gray-50 text-xs font-medium">Overtime Hours</TableHead>
                    {timesheetData.map((item, index) => (
                      <TableCell 
                        key={index} 
                        className={`text-center p-0.5 ${isFriday(item.date) ? 'bg-green-50' : ''}`}
                      >
                        <Input
                          className="w-10 h-6 text-xs text-center border-gray-300"
                          value={item.overtime}
                          onChange={(e) => updateTimesheetData(index, 'overtime', e.target.value)}
                          placeholder="0"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Submit Button - More Compact */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmit}
                disabled={!empCode.trim() || !month || isSubmitting || isLoading}
                className="flex items-center gap-2 h-8 px-4"
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                {isSubmitting ? 'Saving...' : 'Save Log'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State - More Compact */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">Loading existing data...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
