"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Timer, CheckCircle, RefreshCw, XCircle, UserX, Clock, Eye } from "lucide-react"
import { RoleBased } from "@/components/RoleBased"
import { useI18n } from "@/hooks/use-i18n"

interface TimesheetData {
  id: number
  employeeName: string
  status: 'present' | 'late' | 'absent' | 'half-day'
  approvalStatus: 'draft' | 'submitted' | 'foreman_approved' | 'incharge_approved' | 'checking_approved' | 'manager_approved' | 'rejected'
  totalHours: number
  overtimeHours: number
}

interface TimesheetsSectionProps {
  timesheetData: TimesheetData[]
  currentTime: Date
  session: any
  onApproveTimesheet: (id: number) => void
  onRejectTimesheet: (id: number) => void
  onMarkAbsent: (id: number) => void
  onEditHours: (id: number) => void
  approvalSuccess: string | null
  approvingTimesheet: number | null
  rejectingTimesheet: number | null
  markingAbsent: number | null
}

export function TimesheetsSection({ 
  timesheetData, 
  currentTime, 
  session,
  onApproveTimesheet,
  onRejectTimesheet,
  onMarkAbsent,
  onEditHours,
  approvalSuccess,
  approvingTimesheet,
  rejectingTimesheet,
  markingAbsent
}: TimesheetsSectionProps) {
  
  const { t } = useI18n()
  
  const getNextApprovalStage = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft': return t('timesheet.approvalWorkflow.submitDraft')
      case 'submitted': return t('timesheet.approvalWorkflow.foreman')
      case 'foreman_approved': return t('timesheet.approvalWorkflow.incharge')
      case 'incharge_approved': return t('timesheet.approvalWorkflow.checking')
      case 'checking_approved': return t('timesheet.approvalWorkflow.manager')
      default: return t('timesheet.approvalWorkflow.finalApproved')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {t('timesheet.todaysAttendance')}
            </CardTitle>
            <CardDescription>
              {t('timesheet.attendanceDescription')}
              <span className="ml-2 text-muted-foreground">
                ({currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
              </span>
            </CardDescription>
          </div>
          <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('timesheet.canApprove')}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {t('timesheet.role')}: {session?.user?.role?.replace('_', ' ')}
              </div>
            </div>
          </RoleBased>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attendance Summary */}
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-green-600">
              {timesheetData.filter(item => item.status === 'present').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('timesheet.attendance.present')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-yellow-600">
              {timesheetData.filter(item => item.status === 'late').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('timesheet.attendance.late')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-red-600">
              {timesheetData.filter(item => item.status === 'absent').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('timesheet.attendance.absent')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-blue-600">
              {timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('timesheet.attendance.approved')}</div>
          </div>
          <div className="text-center p-3 rounded-lg border bg-card">
            <div className="text-2xl font-bold text-orange-600">
              {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
            </div>
            <div className="text-sm text-muted-foreground">{t('timesheet.attendance.pending')}</div>
          </div>
        </div>

        {/* Approval Workflow Indicator */}
        <div className="p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">{t('timesheet.approvalWorkflow.title')}</div>
            <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
              <div className="text-xs text-muted-foreground">
                {t('timesheet.yourRole')}: {session?.user?.role?.replace('_', ' ')}
              </div>
            </RoleBased>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>{t('timesheet.approvalWorkflow.draftSubmitted')}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>{t('timesheet.approvalWorkflow.foreman')}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>{t('timesheet.approvalWorkflow.incharge')}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>{t('timesheet.approvalWorkflow.checking')}</span>
            </div>
            <div className="text-muted-foreground">→</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600">{t('timesheet.approvalWorkflow.managerFinal')}</span>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {approvalSuccess && (
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{approvalSuccess}</span>
            </div>
          </div>
        )}

        {/* Timesheet Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timesheet.table.employee')}</TableHead>
                <TableHead>{t('timesheet.table.attendance')}</TableHead>
                <TableHead>{t('timesheet.table.approval')}</TableHead>
                <TableHead>{t('timesheet.table.hours')}</TableHead>
                <TableHead>{t('timesheet.table.ot')}</TableHead>
                <TableHead>{t('timesheet.table.total')}</TableHead>
                <TableHead>{t('timesheet.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheetData.slice(0, 10).map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.employeeName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === 'present' ? 'default' :
                        item.status === 'late' ? 'secondary' :
                          item.status === 'half-day' ? 'outline' : 'destructive'}
                      className={`${item.status === 'present' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                          item.status === 'late' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                            item.status === 'half-day' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                              'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                        }`}
                    >
                      {item.status === 'present' ? t('timesheet.attendance.present') :
                       item.status === 'late' ? t('timesheet.attendance.late') :
                       item.status === 'half-day' ? t('timesheet.attendance.halfDay') :
                       t('timesheet.attendance.absent')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.approvalStatus === 'manager_approved' ? 'default' :
                          item.approvalStatus === 'foreman_approved' ? 'secondary' :
                            item.approvalStatus === 'incharge_approved' ? 'outline' :
                              item.approvalStatus === 'checking_approved' ? 'secondary' :
                                item.approvalStatus === 'submitted' ? 'secondary' :
                                  item.approvalStatus === 'pending' ? 'outline' :
                                    item.approvalStatus === 'draft' ? 'outline' :
                                      'destructive'
                      }
                      className={`capitalize ${item.approvalStatus === 'manager_approved' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                          item.approvalStatus === 'foreman_approved' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                            item.approvalStatus === 'incharge_approved' ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                              item.approvalStatus === 'checking_approved' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                                item.approvalStatus === 'submitted' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' :
                                  item.approvalStatus === 'pending' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800' :
                                    item.approvalStatus === 'draft' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800' :
                                      'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                        }`}
                    >
                      {item.approvalStatus === 'manager_approved' ? t('timesheet.approvalWorkflow.finalApproved') :
                        item.approvalStatus === 'foreman_approved' ? t('timesheet.approvalWorkflow.foremanApproved') :
                          item.approvalStatus === 'incharge_approved' ? t('timesheet.approvalWorkflow.inchargeApproved') :
                            item.approvalStatus === 'checking_approved' ? t('timesheet.approvalWorkflow.checkingApproved') :
                              item.approvalStatus === 'submitted' ? t('timesheet.approvalWorkflow.submitted') :
                                item.approvalStatus === 'pending' ? t('timesheet.approvalWorkflow.pending') :
                                  item.approvalStatus === 'draft' ? t('timesheet.approvalWorkflow.draft') :
                                    item.approvalStatus}
                    </Badge>
                    {item.approvalStatus !== 'manager_approved' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('timesheet.next')}: {getNextApprovalStage(item.approvalStatus)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-center">
                      <div className="font-medium">
                        {(() => {
                          try {
                            const hours = Number(item.totalHours) || 0;
                            return isNaN(hours) ? '0.0' : hours.toFixed(1);
                          } catch (error) {
                            return '0.0';
                          }
                        })()}h
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-center">
                      <div className="font-medium text-orange-600 dark:text-orange-400">
                        {(() => {
                          try {
                            const otHours = Number(item.overtimeHours) || 0;
                            return isNaN(otHours) ? '0.0' : otHours.toFixed(1);
                          } catch (error) {
                            return '0.0';
                          }
                        })()}h
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {(() => {
                          try {
                            const hours = Number(item.totalHours) || 0;
                            const otHours = Number(item.overtimeHours) || 0;
                            const total = (isNaN(hours) ? 0 : hours) + (isNaN(otHours) ? 0 : otHours);
                            return total.toFixed(1);
                          } catch (error) {
                            return '0.0';
                          }
                        })()}h
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* Approve Button */}
                      {item.approvalStatus !== 'manager_approved' && (
                        <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onApproveTimesheet(item.id)}
                            disabled={approvingTimesheet === item.id}
                            title={t('timesheet.approveToNextStage', { stage: getNextApprovalStage(item.approvalStatus) })}
                            className="h-8 w-8 p-0"
                          >
                            {approvingTimesheet === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </RoleBased>
                      )}

                      {/* Reject Button - Only for foreman and above */}
                      {item.approvalStatus !== 'manager_approved' && item.approvalStatus !== 'rejected' && (
                        <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRejectTimesheet(item.id)}
                            disabled={rejectingTimesheet === item.id}
                            title={t('timesheet.rejectTimesheet')}
                            className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50"
                          >
                            {rejectingTimesheet === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </RoleBased>
                      )}

                      {/* Mark Absent Button - Only for foreman and above */}
                      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkAbsent(item.id)}
                          disabled={markingAbsent === item.id}
                          title={t('timesheet.markAbsent')}
                          className="h-8 w-8 p-0 border-orange-200 text-orange-700 hover:bg-orange-50"
                        >
                          {markingAbsent === item.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </Button>
                      </RoleBased>

                      {/* Edit Hours Button - Only for foreman and above */}
                      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditHours(item.id)}
                          title={t('timesheet.editHours')}
                          className="h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                      </RoleBased>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* No timesheets message */}
        {timesheetData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Timer className="h-8 w-8 mx-auto mb-2 opacity-60" />
            <p className="font-medium">{t('timesheet.noTimesheetsToday')}</p>
            <p className="text-sm opacity-80">{t('timesheet.noTimesheetsDescription')}</p>
          </div>
        )}

        {timesheetData.length > 0 && (
          <>
            {/* Approval Progress Summary */}
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{t('timesheet.approvalProgress')}:</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {t('timesheet.finalApproved')}: {timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {t('timesheet.inProgress')}: {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
                    </span>
                    <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {t('timesheet.canApprove')}: {timesheetData.filter(item => item.approvalStatus !== 'manager_approved').length}
                      </span>
                    </RoleBased>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {Math.round((timesheetData.filter(item => item.approvalStatus === 'manager_approved').length / timesheetData.length) * 100)}% {t('timesheet.complete')}
                </div>
              </div>

              {/* Approval Stage Breakdown */}
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">{t('timesheet.stageBreakdown')}:</div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'submitted' || item.approvalStatus === 'draft').length}</div>
                    <div className="text-muted-foreground">{t('timesheet.approvalWorkflow.submitted')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'foreman_approved').length}</div>
                    <div className="text-muted-foreground">{t('timesheet.approvalWorkflow.foreman')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'incharge_approved').length}</div>
                    <div className="text-muted-foreground">{t('timesheet.approvalWorkflow.incharge')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'checking_approved').length}</div>
                    <div className="text-muted-foreground">{t('timesheet.approvalWorkflow.checking')}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{timesheetData.filter(item => item.approvalStatus === 'manager_approved').length}</div>
                    <div className="text-muted-foreground">{t('timesheet.approvalWorkflow.manager')}</div>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full"
              onClick={() => {/* Navigate to Timesheet management */}}>
              {t('timesheet.viewAllTimesheets', { count: timesheetData.length })}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
