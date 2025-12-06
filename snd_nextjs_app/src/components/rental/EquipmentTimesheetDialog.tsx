'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EquipmentTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rentalId: number;
  rentalItemId: number;
  equipmentName: string;
  month: string; // YYYY-MM format
  onSuccess?: () => void;
}

interface DailyHours {
  date: string; // YYYY-MM-DD
  regularHours: string | number;
  overtimeHours: string | number;
}

export function EquipmentTimesheetDialog({
  open,
  onOpenChange,
  rentalId,
  rentalItemId,
  equipmentName,
  month,
  onSuccess,
}: EquipmentTimesheetDialogProps) {
  const [dailyHours, setDailyHours] = useState<DailyHours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize days for the month
  useEffect(() => {
    if (!open || !month) return;

    const [year, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const dates: DailyHours[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      
      // Default: Friday = 0 hours, other days = 10 hours
      const defaultHours = dayOfWeek === 5 ? 'F' : '10';
      
      dates.push({
        date: dateStr,
        regularHours: defaultHours,
        overtimeHours: '0',
      });
    }

    setDailyHours(dates);
    loadExistingData();
  }, [open, month, rentalItemId]);

  // Load existing timesheet data
  const loadExistingData = async () => {
    if (!rentalItemId || !month) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/rentals/${rentalId}/equipment-timesheets?rentalItemId=${rentalItemId}&month=${month}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          // Map existing data to dailyHours
          const existingMap = new Map(
            data.data.map((ts: any) => [
              ts.date,
              {
                regularHours: ts.regularHours || '0',
                overtimeHours: ts.overtimeHours || '0',
              },
            ])
          );

          setDailyHours((prev) =>
            prev.map((day) => {
              const existing = existingMap.get(day.date);
              return existing
                ? { ...day, ...existing }
                : day;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error loading existing timesheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHoursChange = (index: number, field: 'regularHours' | 'overtimeHours', value: string) => {
    setDailyHours((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!rentalItemId || !month) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for submission
      const dailyHoursData = dailyHours.map((day) => ({
        date: day.date,
        regularHours: day.regularHours === 'F' || day.regularHours === 'Fri' ? 'F' : day.regularHours,
        overtimeHours: day.overtimeHours || '0',
      }));

      const response = await fetch(`/api/rentals/${rentalId}/equipment-timesheets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalItemId,
          month,
          dailyHours: dailyHoursData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import timesheet data');
      }

      const result = await response.json();
      toast.success(
        `Timesheet imported: ${result.results.created} created, ${result.results.updated} updated`
      );

      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error importing timesheet:', error);
      toast.error(error.message || 'Failed to import timesheet data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthLabel = month
    ? format(new Date(month + '-01'), 'MMMM yyyy')
    : '';

  // Calculate totals
  const totalRegular = dailyHours.reduce((sum, day) => {
    const hours = day.regularHours === 'F' || day.regularHours === 'Fri' ? 0 : parseFloat(day.regularHours.toString()) || 0;
    return sum + hours;
  }, 0);

  const totalOvertime = dailyHours.reduce((sum, day) => {
    return sum + (parseFloat(day.overtimeHours.toString()) || 0);
  }, 0);

  const totalHours = totalRegular + totalOvertime;

  // Calculate column width to fit exactly without scrolling
  const daysInMonth = dailyHours.length;
  const getColumnWidth = () => {
    if (daysInMonth === 0) return 50;
    if (typeof window === 'undefined') return 40;
    // Calculate available width more precisely
    const viewportWidth = window.innerWidth;
    const dialogPadding = 80; // Total horizontal padding (40px each side for 98vw)
    const dateColumnWidth = 110;
    const totalColumnWidth = 80;
    const borderWidth = 4; // Table borders (2px each side)
    const scrollbarWidth = 0; // No scrollbar needed
    const availableWidth = (viewportWidth * 0.98) - dialogPadding - dateColumnWidth - totalColumnWidth - borderWidth - scrollbarWidth;
    // Calculate width per column to fit exactly
    const calculatedWidth = Math.floor(availableWidth / daysInMonth);
    // Ensure minimum readable width
    return Math.max(38, calculatedWidth);
  };
  const columnWidth = getColumnWidth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[98vw] max-h-[90vh] p-1.5 sm:p-3 overflow-visible">
        <DialogHeader className="pb-1 sm:pb-2 px-1">
          <DialogTitle className="text-sm sm:text-base">Equipment Timesheet - {equipmentName}</DialogTitle>
          <DialogDescription className="text-[10px] sm:text-xs">
            Enter daily working hours for {monthLabel}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading existing data...
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            <div className="border rounded-lg w-full">
              <div className="overflow-x-auto">
                <Table className="w-full" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '90px' }} />
                    {dailyHours.map(() => (
                      <col key={Math.random()} style={{ width: `${columnWidth}px` }} />
                    ))}
                    <col style={{ width: '60px' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-20 bg-background font-semibold border-r text-xs" style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}>
                        Date
                      </TableHead>
                      {dailyHours.map((day) => {
                        const date = new Date(day.date);
                        const dayNumber = date.getDate();
                        const isFriday = date.getDay() === 5;
                        return (
                          <TableHead
                            key={day.date}
                            className={`text-center ${isFriday ? 'bg-orange-50' : ''}`}
                            style={{ 
                              width: `${columnWidth}px`,
                              minWidth: `${columnWidth}px`,
                              maxWidth: `${columnWidth}px`,
                              padding: '2px 1px'
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-normal text-muted-foreground leading-none">
                                {format(date, 'EEE')}
                              </span>
                              <span className={`text-[9px] font-semibold leading-none ${isFriday ? 'text-orange-600' : ''}`}>
                                {String(dayNumber).padStart(2, '0')}
                              </span>
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs" style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}>
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Regular Hours Row */}
                    <TableRow>
                      <TableCell className="sticky left-0 z-20 bg-background font-semibold border-r text-xs" style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}>
                        Regular
                      </TableCell>
                      {dailyHours.map((day, index) => {
                        const date = new Date(day.date);
                        const isFriday = date.getDay() === 5;
                        return (
                        <TableCell 
                          key={`regular-${day.date}`} 
                          className={`${isFriday ? 'bg-orange-50' : ''}`}
                          style={{ 
                            width: `${columnWidth}px`,
                            minWidth: `${columnWidth}px`,
                            maxWidth: `${columnWidth}px`,
                            padding: '2px 1px'
                          }}
                        >
                          <Input
                            type="text"
                            value={day.regularHours}
                            onChange={(e) =>
                              handleHoursChange(index, 'regularHours', e.target.value)
                            }
                            placeholder={isFriday ? 'F' : '10'}
                            className="w-full h-6 text-center text-[10px] px-0.5"
                          />
                        </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs" style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}>
                        {totalRegular.toFixed(1)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Overtime Hours Row */}
                    <TableRow>
                      <TableCell className="sticky left-0 z-20 bg-background font-semibold border-r text-xs" style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}>
                        OT
                      </TableCell>
                      {dailyHours.map((day, index) => {
                        const date = new Date(day.date);
                        const isFriday = date.getDay() === 5;
                        return (
                        <TableCell 
                          key={`overtime-${day.date}`} 
                          className={`${isFriday ? 'bg-orange-50' : ''}`}
                          style={{ 
                            width: `${columnWidth}px`,
                            minWidth: `${columnWidth}px`,
                            maxWidth: `${columnWidth}px`,
                            padding: '2px 1px'
                          }}
                        >
                          <Input
                            type="number"
                            step="0.5"
                            value={day.overtimeHours}
                            onChange={(e) =>
                              handleHoursChange(index, 'overtimeHours', e.target.value)
                            }
                            placeholder="0"
                            className="w-full h-6 text-center text-[10px] px-0.5"
                          />
                        </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs" style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}>
                        {totalOvertime.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Use "F" for Friday/off days in Regular Hours
              </div>
              <div className="flex gap-3 sm:gap-4 flex-wrap">
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total Regular Hours</div>
                  <div className="text-sm sm:text-base font-semibold">{totalRegular.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total Overtime Hours</div>
                  <div className="text-sm sm:text-base font-semibold">{totalOvertime.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total Working Hours</div>
                  <div className="text-sm sm:text-base font-bold text-primary">{totalHours.toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Importing...' : 'Import Timesheet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

