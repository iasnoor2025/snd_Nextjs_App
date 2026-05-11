'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer, Download, FileText, RefreshCw } from 'lucide-react';
import { ProjectEquipmentTimesheetDialog } from '@/components/project/ProjectEquipmentTimesheetDialog';
import {
  ProjectResourcesReportService,
  ProjectEquipmentMonthlyReportData,
} from '@/lib/services/project-resources-report-service';

interface ReportItem {
  projectEquipmentId: number;
  equipmentId: number | null;
  equipmentName: string;
  doorNumber: string | null;
  operatorName: string | null;
  operatorFileNumber: string | null;
  startDate: string | null;            // raw PE.start_date
  endDate: string | null;
  effectiveStartDate: string | null;   // start within this month
  effectiveEndDate: string | null;
  durationDays: number;                // overlap days in this month
  hourlyRate: number;
  maintenanceCost: number;
  regularHours: number;                // kept for the dialog/PDF
  overtimeHours: number;
  timesheetHours: number;              // regular + overtime
  usageHours: number;                  // hours used for the cost: timesheet OR durationDays*10
  isManualHours: boolean;
  monthlyCost: number;
  received: boolean;
}

interface ReportMonth {
  monthKey: string;
  monthLabel: string;
  items: ReportItem[];
  summary: {
    totalEquipment: number;
    withHours: number;
    active: number;
    received: number;
    totalDurationDays: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalUsageHours: number;
    totalCost: number;
  };
}

interface ProjectEquipmentMonthlyReportProps {
  projectId: number | string;
  projectName: string;
}

const SAR = (n: number) =>
  `SAR ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const HRS = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });

// Monthly Equipment Timesheet Report — mirrors the rental "Monthly Items Report" UX:
// Print / Download / Month dropdown header, then one card per month with
// Received-All Timesheet checkbox + per-row timesheet icon and received toggle.
export function ProjectEquipmentMonthlyReport({
  projectId,
  projectName,
}: ProjectEquipmentMonthlyReportProps) {
  const [months, setMonths] = useState<ReportMonth[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [timesheetDialog, setTimesheetDialog] = useState<{
    open: boolean;
    projectEquipmentId: number | null;
    equipmentName: string;
    month: string;
  }>({ open: false, projectEquipmentId: null, equipmentName: '', month: '' });

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/equipment-timesheets/monthly-report`
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load report');
      }
      const payload = await response.json();
      if (!payload?.success || !payload?.data) {
        throw new Error('Invalid report response');
      }
      setMonths(Array.isArray(payload.data.months) ? payload.data.months : []);
    } catch (error: any) {
      console.error('Error loading monthly report:', error);
      toast.error(error.message || 'Failed to load monthly report');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Toggle "received" for a single (project_equipment, month) pair.
  const toggleRowReceived = async (
    projectEquipmentId: number,
    monthKey: string,
    received: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/equipment-timesheet-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectEquipmentId, month: monthKey, received }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }

      // Optimistic local update
      setMonths(prev =>
        prev.map(m => {
          if (m.monthKey !== monthKey) return m;
          const items = m.items.map(it =>
            it.projectEquipmentId === projectEquipmentId ? { ...it, received } : it
          );
          const recvCount = items.filter(it => it.received).length;
          return { ...m, items, summary: { ...m.summary, received: recvCount } };
        })
      );
    } catch (error: any) {
      console.error('Error updating received status:', error);
      toast.error(error.message || 'Failed to update received status');
    }
  };

  // Mark or unmark every row in the month at once.
  const toggleMonthReceived = async (monthKey: string, received: boolean) => {
    const monthData = months.find(m => m.monthKey === monthKey);
    if (!monthData) return;

    try {
      await Promise.all(
        monthData.items.map(item =>
          fetch(`/api/projects/${projectId}/equipment-timesheet-status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectEquipmentId: item.projectEquipmentId,
              month: monthKey,
              received,
            }),
          })
        )
      );

      setMonths(prev =>
        prev.map(m => {
          if (m.monthKey !== monthKey) return m;
          const items = m.items.map(it => ({ ...it, received }));
          return {
            ...m,
            items,
            summary: { ...m.summary, received: received ? items.length : 0 },
          };
        })
      );

      toast.success(
        received ? `All marked received for ${monthData.monthLabel}` : `Cleared received for ${monthData.monthLabel}`
      );
    } catch (error: any) {
      console.error('Error toggling month received:', error);
      toast.error('Failed to update received status');
    }
  };

  // Visible months (after applying the dropdown filter)
  const visibleMonths =
    selectedMonth === 'all' ? months : months.filter(m => m.monthKey === selectedMonth);

  // Download a PDF — same payload structure as ProjectEquipmentMonthlyReportData.
  // Falls back to client-side generation using existing service.
  const handleDownload = async () => {
    if (visibleMonths.length === 0) {
      toast.error('No data to download');
      return;
    }
    const loadingId = toast.loading('Building PDF...');
    try {
      // Single-month case uses the dedicated API to get a fresh aggregate.
      // For "all months" we generate one PDF per month and zip is not in scope —
      // download just the most recent month (sticking with rental UX of one-month-per-pdf).
      const monthsToExport =
        selectedMonth === 'all' ? [visibleMonths[0]] : visibleMonths;

      for (const m of monthsToExport) {
        const reportData: ProjectEquipmentMonthlyReportData = {
          project: { id: projectId, name: projectName },
          month: m.monthKey,
          items: m.items.map(it => ({
            projectEquipmentId: it.projectEquipmentId,
            equipmentName: it.equipmentName,
            doorNumber: it.doorNumber,
            operatorName: it.operatorName,
            operatorFileNumber: it.operatorFileNumber,
            startDate: it.startDate,
            endDate: it.endDate,
            effectiveStartDate: it.effectiveStartDate,
            durationDays: it.durationDays,
            hourlyRate: it.hourlyRate,
            regularHours: it.regularHours,
            overtimeHours: it.overtimeHours,
            timesheetHours: it.timesheetHours,
            isManualHours: it.isManualHours,
            monthlyCost: it.monthlyCost,
            received: it.received,
          })),
          summary: m.summary,
        };
        await ProjectResourcesReportService.downloadMonthlyEquipmentTimesheetReport(
          reportData,
          `equipment-timesheet-${(projectName || 'project').replace(/\s+/g, '-')}-${m.monthKey}.pdf`
        );
      }

      toast.dismiss(loadingId);
      toast.success('Report downloaded');
    } catch (error: any) {
      toast.dismiss(loadingId);
      console.error('Error downloading report:', error);
      toast.error(error.message || 'Failed to download report');
    }
  };

  // Print using a new window — mirrors the rental side's approach.
  const handlePrint = () => {
    if (visibleMonths.length === 0) {
      toast.error('No data to print');
      return;
    }

    const monthsHtml = visibleMonths
      .map(
        m => `
        <div class="month-section">
          <h2>${m.monthLabel}</h2>
          <div class="summary">
            <strong>Items:</strong> ${m.summary.totalEquipment} |
            <strong>Active:</strong> ${m.summary.active} |
            <strong>Received:</strong> ${m.summary.received} |
            <strong>Total:</strong> ${SAR(m.summary.totalCost)}
          </div>
          <table>
            <thead>
              <tr>
                <th class="sl-col">SI#</th>
                <th>Equipment</th>
                <th>Operator</th>
                <th>Start Date</th>
                <th class="num">Duration</th>
                <th class="num">Total</th>
                <th class="center">TS</th>
              </tr>
            </thead>
            <tbody>
              ${m.items
                .map((it, i) => {
                  const displayedStart =
                    it.effectiveStartDate || it.startDate || null;
                  const durationLabel = it.isManualHours
                    ? `${HRS(it.timesheetHours)} hrs`
                    : it.durationDays > 0
                      ? `${it.durationDays} ${it.durationDays === 1 ? 'day' : 'days'}`
                      : '-';
                  return `
                <tr>
                  <td class="sl-col">${i + 1}</td>
                  <td>${escapeHtml(it.equipmentName)}${it.doorNumber ? ` (${escapeHtml(it.doorNumber)})` : ''}</td>
                  <td>${escapeHtml(it.operatorName || '-')}${
                    it.operatorFileNumber
                      ? ` (File: ${escapeHtml(it.operatorFileNumber)})`
                      : ''
                  }</td>
                  <td>${displayedStart ? format(new Date(displayedStart), 'MMM dd, yyyy') : '-'}</td>
                  <td class="num">${durationLabel}</td>
                  <td class="num">${SAR(it.monthlyCost)}</td>
                  <td class="center">${it.received ? 'Y' : '-'}</td>
                </tr>
              `;
                })
                .join('')}
              <tr class="totals">
                <td colspan="4"><strong>TOTAL</strong></td>
                <td class="num"><strong>${m.summary.totalDurationDays} days</strong></td>
                <td class="num"><strong>${SAR(m.summary.totalCost)}</strong></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      `
      )
      .join('');

    const html = `
      <html>
        <head>
          <title>Monthly Equipment Timesheet Report — ${escapeHtml(projectName)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; font-size: 12px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 6px; font-size: 20px; margin-bottom: 6px; }
            h2 { color: #444; margin: 14px 0 6px; font-size: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: 700; }
            .summary { background: #f9f9f9; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; }
            .sl-col { width: 30px; text-align: center; }
            .num { text-align: right; }
            .center { text-align: center; }
            .totals td { background: #f0f0f0; }
            .meta { margin-bottom: 8px; }
            @media print { .no-print { display: none; } body { padding: 8px; } }
          </style>
        </head>
        <body>
          <h1>Monthly Equipment Timesheet Report</h1>
          <div class="meta">
            <strong>Project:</strong> ${escapeHtml(projectName)}<br/>
            <strong>Generated:</strong> ${format(new Date(), 'MMMM dd, yyyy HH:mm')}<br/>
            <strong>Filter:</strong> ${selectedMonth === 'all' ? 'All Months' : visibleMonths[0]?.monthLabel || selectedMonth}
          </div>
          ${monthsHtml}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    } else {
      toast.error('Pop-up blocked. Please allow pop-ups to print.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <CardTitle>Monthly Equipment Timesheet Report</CardTitle>
            <CardDescription>
              Project equipment grouped by month with timesheet summaries
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadReport}
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} disabled={loading}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(m => (
                  <SelectItem key={m.monthKey} value={m.monthKey}>
                    {m.monthLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : visibleMonths.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No equipment activity to report. Assign equipment in the Equipment tab first.
          </div>
        ) : (
          visibleMonths.map(monthData => {
            const allReceived =
              monthData.items.length > 0 &&
              monthData.items.every(it => it.received);
            return (
              <div
                key={monthData.monthKey}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/40 border-b">
                  <div className="text-lg font-semibold">{monthData.monthLabel}</div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={allReceived}
                        onCheckedChange={checked =>
                          toggleMonthReceived(monthData.monthKey, checked === true)
                        }
                      />
                      Received All Timesheet
                    </label>
                    <div className="text-xs flex items-center gap-4">
                      <span>
                        <span className="text-muted-foreground">Items </span>
                        <span className="font-semibold">
                          {monthData.summary.totalEquipment}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Active </span>
                        <span className="font-semibold">
                          {monthData.summary.active}
                        </span>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Value </span>
                        <span className="font-semibold text-primary">
                          {SAR(monthData.summary.totalCost)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">SI#</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-32 text-center">Timesheet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthData.items.map((it, idx) => {
                      // Effective start date within this month (max(item start, month start))
                      const displayedStart =
                        it.effectiveStartDate || it.startDate || null;
                      // Duration label: manual hours win over the 10h/day calendar formula.
                      const durationLabel = it.isManualHours
                        ? `${HRS(it.timesheetHours)} hrs`
                        : it.durationDays > 0
                          ? `${it.durationDays} ${it.durationDays === 1 ? 'day' : 'days'}`
                          : '-';
                      return (
                        <TableRow key={`${monthData.monthKey}-${it.projectEquipmentId}`}>
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {it.equipmentName}
                            {it.doorNumber ? (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({it.doorNumber})
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {it.operatorName ? (
                              <div>
                                <div>{it.operatorName}</div>
                                {it.operatorFileNumber && (
                                  <div className="text-xs text-muted-foreground">
                                    File: {it.operatorFileNumber}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {displayedStart
                              ? format(new Date(displayedStart), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              it.isManualHours ? 'text-green-600 font-semibold' : ''
                            }`}
                            title={
                              it.isManualHours
                                ? `Manual timesheet hours${
                                    it.overtimeHours
                                      ? ` (Reg ${HRS(it.regularHours)} + OT ${HRS(
                                          it.overtimeHours
                                        )})`
                                      : ''
                                  }`
                                : it.durationDays > 0
                                  ? `Calendar days in this month (${HRS(
                                      it.usageHours
                                    )} hrs at 10h/day)`
                                  : 'Not active in this month'
                            }
                          >
                            {durationLabel}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {SAR(it.monthlyCost)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Enter / edit timesheet for this month"
                                onClick={() =>
                                  setTimesheetDialog({
                                    open: true,
                                    projectEquipmentId: it.projectEquipmentId,
                                    equipmentName: it.equipmentName,
                                    month: monthData.monthKey,
                                  })
                                }
                              >
                                <FileText
                                  className={`h-4 w-4 ${
                                    it.isManualHours ? 'text-green-600' : ''
                                  }`}
                                />
                              </Button>
                              <Checkbox
                                checked={it.received}
                                onCheckedChange={checked =>
                                  toggleRowReceived(
                                    it.projectEquipmentId,
                                    monthData.monthKey,
                                    checked === true
                                  )
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })
        )}
      </CardContent>

      {timesheetDialog.projectEquipmentId && (
        <ProjectEquipmentTimesheetDialog
          open={timesheetDialog.open}
          onOpenChange={open =>
            setTimesheetDialog(prev => ({ ...prev, open }))
          }
          projectId={Number(projectId)}
          projectEquipmentId={timesheetDialog.projectEquipmentId}
          equipmentName={timesheetDialog.equipmentName}
          month={timesheetDialog.month}
          onSuccess={() => {
            // Reload report data to pick up new hours / received flag.
            loadReport();
          }}
        />
      )}
    </Card>
  );
}

// Minimal HTML escaping for the print-window content.
function escapeHtml(input: string): string {
  if (input == null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default ProjectEquipmentMonthlyReport;
