'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Save, Calendar, User, ArrowLeft } from 'lucide-react';
import { useRouter , useParams } from 'next/navigation';

interface TimesheetData {
  date: string;
  workingHours: string;
  overtime: string;
}

interface BulkTimesheetFormProps {
  className?: string;
}

export default function BulkTimesheetForm({ className }: BulkTimesheetFormProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
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
                  workingHours: existing.workingHours === 'Fri' ? 'Fri' : (existing.workingHours ? parseFloat(existing.workingHours).toString() : ''),
                  overtime: existing.overtime ? parseFloat(existing.overtime).toString() : ''
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
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calendar className="h-5 w-5" />
              Employee Monthly Work Log
            </CardTitle>
            <CardDescription className="mt-2">
              Enter daily working hours and overtime for the selected month
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/timesheet-management`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields - Shadcn UI Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="empCode" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee Code
            </Label>
            <Input
              id="empCode"
              placeholder="E.g., EMP123"
              value={empCode}
              onChange={(e) => setEmpCode(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="month" className="text-sm font-medium">
              Select Month
            </Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Timesheet Table - Shadcn UI Design */}
        {datesArr.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card">
              <div className="overflow-x-auto">
                <div className="grid text-sm" style={{gridTemplateColumns: `100px repeat(${datesArr.length}, 1fr)`}}>
                  {/* Header Row */}
                  <div className="bg-muted p-3 font-semibold text-center border-r flex items-center justify-center">
                    <span className="text-muted-foreground">Day</span>
                  </div>
                  {datesArr.map((date, index) => (
                    <div 
                      key={index} 
                      className={`text-center p-2 font-medium border-r flex items-center justify-center ${isFriday(date) ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'}`}
                    >
                      {index + 1}
                    </div>
                  ))}
                  
                  {/* Days Row */}
                  <div className="bg-muted p-3 text-center border-r text-muted-foreground flex items-center justify-center">
                    <span className="text-xs">Days</span>
                  </div>
                  {datesArr.map((date, index) => (
                    <div 
                      key={index} 
                      className={`text-center p-2 border-r text-muted-foreground flex items-center justify-center ${isFriday(date) ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                    >
                      <span className="text-xs">{getDayName(date)}</span>
                    </div>
                  ))}
                  
                  {/* Regular Hours Row */}
                  <div className="bg-muted p-3 font-semibold text-center border-r flex items-center justify-center">
                    <span className="text-muted-foreground">Regular</span>
                  </div>
                  {timesheetData.map((item, index) => (
                    <div 
                      key={index} 
                      className={`text-center p-1 border-r flex items-center justify-center ${isFriday(item.date) ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                    >
                      {isFriday(item.date) ? (
                        <div className="w-full h-9 text-sm text-center border border-border bg-muted flex items-center justify-center px-2 text-muted-foreground">
                          Fri
                        </div>
                      ) : (
                        <Input
                          className="w-full h-9 text-sm text-center border border-border bg-background hover:bg-accent hover:text-accent-foreground focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2"
                          value={item.workingHours}
                          onChange={(e) => updateTimesheetData(index, 'workingHours', e.target.value)}
                          placeholder="8.0"
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Overtime Hours Row */}
                  <div className="bg-muted p-3 font-semibold text-center border-r flex items-center justify-center">
                    <span className="text-muted-foreground">Overtime</span>
                  </div>
                  {timesheetData.map((item, index) => (
                    <div 
                      key={index} 
                      className={`text-center p-1 border-r flex items-center justify-center ${isFriday(item.date) ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                    >
                      <Input
                        className="w-full h-9 text-sm text-center border border-border bg-background hover:bg-accent hover:text-accent-foreground focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 px-2"
                        value={item.overtime}
                        onChange={(e) => updateTimesheetData(index, 'overtime', e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button - Shadcn UI Design */}
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSubmit}
                disabled={!empCode.trim() || !month || isSubmitting || isLoading}
                className="flex items-center gap-2 h-10 px-6"
                size="default"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? 'Saving...' : 'Save Log'}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State - Shadcn UI Design */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading existing data...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
