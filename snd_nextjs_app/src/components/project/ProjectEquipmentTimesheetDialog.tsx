'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { ChevronLeft, ChevronRight, CalendarDays, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectEquipmentTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectEquipmentId: number;
  equipmentName: string;
  month: string; // YYYY-MM
  onSuccess?: () => void;
}

interface DailyHours {
  date: string; // YYYY-MM-DD
  regularHours: string | number;
  overtimeHours: string | number;
}

// Project-equipment counterpart of EquipmentTimesheetDialog (rentals).
// Same calendar grid, same "F"/10h defaults, posts to the project-equipment timesheet endpoints.
export function ProjectEquipmentTimesheetDialog({
  open,
  onOpenChange,
  projectId,
  projectEquipmentId,
  equipmentName,
  month,
  onSuccess,
}: ProjectEquipmentTimesheetDialogProps) {
  const [dailyHours, setDailyHours] = useState<DailyHours[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Active month inside the dialog. Seeded from the prop when the dialog opens,
  // then user can navigate to previous / next months without closing.
  const [currentMonth, setCurrentMonth] = useState<string>(month);
  // True when at least one timesheet entry exists in DB for this PE + currentMonth.
  // Drives the "Clear Month" button enable state.
  const [hasSavedData, setHasSavedData] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Reseed from the prop every time the dialog opens (or the prop changes while open).
  useEffect(() => {
    if (open) setCurrentMonth(month);
  }, [open, month]);

  // YYYY-MM -> YYYY-MM, offset = -1 (prev) or +1 (next)
  const shiftMonth = (ym: string, offset: number): string => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, (m - 1) + offset, 1);
    return format(d, 'yyyy-MM');
  };

  const goToPrevMonth = () => setCurrentMonth(prev => shiftMonth(prev, -1));
  const goToNextMonth = () => setCurrentMonth(prev => shiftMonth(prev, 1));
  const goToThisMonth = () => setCurrentMonth(format(new Date(), 'yyyy-MM'));

  const loadExistingData = useCallback(async () => {
    if (!projectEquipmentId || !currentMonth) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/equipment-timesheets?projectEquipmentId=${projectEquipmentId}&month=${currentMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        const rows: any[] = Array.isArray(data?.data) ? data.data : [];
        setHasSavedData(rows.length > 0);

        if (data.success && rows.length > 0) {
          const existingMap = new Map<string, { regularHours: string; overtimeHours: string }>(
            rows.map((ts: any) => [
              ts.date,
              {
                regularHours: ts.regularHours ?? '0',
                overtimeHours: ts.overtimeHours ?? '0',
              },
            ])
          );

          setDailyHours(prev =>
            prev.map(day => {
              const existing = existingMap.get(day.date);
              return existing ? { ...day, ...existing } : day;
            })
          );
        }
      } else {
        setHasSavedData(false);
      }
    } catch (error) {
      console.error('Error loading existing project equipment timesheet:', error);
      setHasSavedData(false);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, projectEquipmentId, currentMonth]);

  // Build the day grid + load existing entries whenever the dialog opens / month changes.
  useEffect(() => {
    if (!open || !currentMonth) return;

    const [year, monthNum] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const dates: DailyHours[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      // Friday default = "F" (off), else 10h
      const defaultHours = dayOfWeek === 5 ? 'F' : '10';

      dates.push({
        date: dateStr,
        regularHours: defaultHours,
        overtimeHours: '0',
      });
    }

    setDailyHours(dates);
    loadExistingData();
  }, [open, currentMonth, projectEquipmentId, loadExistingData]);

  const handleHoursChange = (
    index: number,
    field: 'regularHours' | 'overtimeHours',
    value: string
  ) => {
    setDailyHours(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!projectEquipmentId || !currentMonth) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);
    try {
      const dailyHoursData = dailyHours.map(day => ({
        date: day.date,
        regularHours:
          day.regularHours === 'F' || day.regularHours === 'Fri' ? 'F' : day.regularHours,
        overtimeHours: day.overtimeHours || '0',
      }));

      const response = await fetch(
        `/api/projects/${projectId}/equipment-timesheets/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectEquipmentId,
            month: currentMonth,
            dailyHours: dailyHoursData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save timesheet');
      }

      const result = await response.json();
      toast.success(
        `Timesheet saved (${monthLabel}): ${result.results.created} created, ${result.results.updated} updated`
      );
      setHasSavedData(true);

      if (onSuccess) onSuccess();
      // Keep the dialog open so the user can keep navigating between months.
    } catch (error: any) {
      console.error('Error saving project equipment timesheet:', error);
      toast.error(error.message || 'Failed to save timesheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the visible grid back to the defaults (10h workdays, "F" Fridays, 0 OT).
  const resetGridToDefaults = () => {
    if (!currentMonth) return;
    const [year, monthNum] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const dates: DailyHours[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay();
      const defaultHours = dayOfWeek === 5 ? 'F' : '10';
      dates.push({ date: dateStr, regularHours: defaultHours, overtimeHours: '0' });
    }
    setDailyHours(dates);
  };

  // Wipe DB rows for the active month and reset the grid + received flag.
  const handleClearMonth = async () => {
    if (!projectEquipmentId || !currentMonth) return;
    setIsClearing(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/equipment-timesheets?projectEquipmentId=${projectEquipmentId}&month=${currentMonth}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to clear timesheet');
      }

      const result = await response.json().catch(() => ({ deleted: 0 }));
      toast.success(
        `Cleared ${result.deleted ?? 0} entr${(result.deleted ?? 0) === 1 ? 'y' : 'ies'} for ${monthLabel}`
      );

      resetGridToDefaults();
      setHasSavedData(false);
      setConfirmClearOpen(false);

      // Refresh equipment row so Usage Hours / Cost fall back to the 10h/day formula.
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error clearing project equipment timesheet:', error);
      toast.error(error.message || 'Failed to clear timesheet');
    } finally {
      setIsClearing(false);
    }
  };

  const monthLabel = currentMonth
    ? format(new Date(currentMonth + '-01'), 'MMMM yyyy')
    : '';
  const thisMonth = format(new Date(), 'yyyy-MM');
  const isCurrentMonth = currentMonth === thisMonth;

  const totalRegular = dailyHours.reduce((sum, day) => {
    const hours =
      day.regularHours === 'F' || day.regularHours === 'Fri'
        ? 0
        : parseFloat(day.regularHours.toString()) || 0;
    return sum + hours;
  }, 0);

  const totalOvertime = dailyHours.reduce((sum, day) => {
    return sum + (parseFloat(day.overtimeHours.toString()) || 0);
  }, 0);

  const totalHours = totalRegular + totalOvertime;

  // Fit columns inside the dialog without horizontal scroll, with a sane minimum.
  const daysInMonth = dailyHours.length;
  const getColumnWidth = () => {
    if (daysInMonth === 0) return 50;
    if (typeof window === 'undefined') return 40;
    const viewportWidth = window.innerWidth;
    const dialogPadding = 80;
    const dateColumnWidth = 110;
    const totalColumnWidth = 80;
    const borderWidth = 4;
    const availableWidth =
      viewportWidth * 0.98 - dialogPadding - dateColumnWidth - totalColumnWidth - borderWidth;
    const calculatedWidth = Math.floor(availableWidth / daysInMonth);
    return Math.max(38, calculatedWidth);
  };
  const columnWidth = getColumnWidth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] max-w-[98vw] max-h-[90vh] p-1.5 sm:p-3 overflow-visible">
        <DialogHeader className="pb-1 sm:pb-2 px-1">
          <DialogTitle className="text-sm sm:text-base">
            Equipment Timesheet — {equipmentName}
          </DialogTitle>
          <DialogDescription className="text-[10px] sm:text-xs">
            Enter daily working hours. Use the arrows to navigate to previous or next months.
          </DialogDescription>

          {/* Month navigation */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={goToPrevMonth}
              disabled={isSubmitting || isLoading}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="min-w-[140px] text-center text-sm font-semibold">
              {monthLabel}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={goToNextMonth}
              disabled={isSubmitting || isLoading}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {!isCurrentMonth && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={goToThisMonth}
                disabled={isSubmitting || isLoading}
                title="Jump to current month"
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                This month
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading existing data...
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            <div className="border rounded-lg w-full">
              <div className="overflow-x-auto">
                <Table
                  className="w-full"
                  style={{ tableLayout: 'fixed', width: '100%' }}
                >
                  <colgroup>
                    <col style={{ width: '90px' }} />
                    {dailyHours.map(d => (
                      <col key={`col-${d.date}`} style={{ width: `${columnWidth}px` }} />
                    ))}
                    <col style={{ width: '60px' }} />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="sticky left-0 z-20 bg-background font-semibold border-r text-xs"
                        style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}
                      >
                        Date
                      </TableHead>
                      {dailyHours.map(day => {
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
                              padding: '2px 1px',
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-normal text-muted-foreground leading-none">
                                {format(date, 'EEE')}
                              </span>
                              <span
                                className={`text-[9px] font-semibold leading-none ${
                                  isFriday ? 'text-orange-600' : ''
                                }`}
                              >
                                {String(dayNumber).padStart(2, '0')}
                              </span>
                            </div>
                          </TableHead>
                        );
                      })}
                      <TableHead
                        className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs"
                        style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}
                      >
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Regular Hours Row */}
                    <TableRow>
                      <TableCell
                        className="sticky left-0 z-20 bg-background font-semibold border-r text-xs"
                        style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}
                      >
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
                              padding: '2px 1px',
                            }}
                          >
                            <Input
                              type="text"
                              value={day.regularHours}
                              onChange={e =>
                                handleHoursChange(index, 'regularHours', e.target.value)
                              }
                              placeholder={isFriday ? 'F' : '10'}
                              className="w-full h-6 text-center text-[10px] px-0.5"
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell
                        className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs"
                        style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}
                      >
                        {totalRegular.toFixed(1)}
                      </TableCell>
                    </TableRow>

                    {/* Overtime Row */}
                    <TableRow>
                      <TableCell
                        className="sticky left-0 z-20 bg-background font-semibold border-r text-xs"
                        style={{ width: '90px', minWidth: '90px', padding: '4px 2px' }}
                      >
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
                              padding: '2px 1px',
                            }}
                          >
                            <Input
                              type="number"
                              step="0.5"
                              value={day.overtimeHours}
                              onChange={e =>
                                handleHoursChange(index, 'overtimeHours', e.target.value)
                              }
                              placeholder="0"
                              className="w-full h-6 text-center text-[10px] px-0.5"
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell
                        className="text-center font-semibold bg-muted sticky right-0 z-10 border-l text-xs"
                        style={{ width: '60px', minWidth: '60px', padding: '4px 2px' }}
                      >
                        {totalOvertime.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 bg-muted rounded-lg">
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                Use &quot;F&quot; for Friday/off days in Regular Hours
              </div>
              <div className="flex gap-3 sm:gap-4 flex-wrap">
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Total Regular Hours
                  </div>
                  <div className="text-sm sm:text-base font-semibold">
                    {totalRegular.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Total Overtime Hours
                  </div>
                  <div className="text-sm sm:text-base font-semibold">
                    {totalOvertime.toFixed(1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Total Working Hours
                  </div>
                  <div className="text-sm sm:text-base font-bold text-primary">
                    {totalHours.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmClearOpen(true)}
            disabled={!hasSavedData || isSubmitting || isLoading || isClearing}
            title={
              hasSavedData
                ? `Delete all saved hours for ${monthLabel}`
                : 'No saved hours to delete for this month'
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Month
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isLoading || isClearing}>
              {isSubmitting ? 'Saving...' : 'Save Timesheet'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Confirm clearing all entries for the active month */}
      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved hours for {monthLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all timesheet entries for{' '}
              <span className="font-medium">{equipmentName}</span> in{' '}
              <span className="font-medium">{monthLabel}</span>. Usage Hours and Cost for this
              equipment will fall back to the 10h/day calendar formula. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearMonth}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? 'Clearing...' : 'Delete entries'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

export default ProjectEquipmentTimesheetDialog;
