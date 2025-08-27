'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ManualAssignmentsPermission,
  IqamaPermission,
  EquipmentPermission,
  FinancialPermission,
  TimesheetsPermission,
  ProjectOverviewPermission,
  QuickActionsPermission,
  RecentActivityPermission
} from './DashboardSectionPermission';
import { useI18n } from '@/hooks/use-i18n';

export function PermissionExample() {
  const { t } = useI18n();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('common.permissions.dashboardPermissionSystemExample')}</CardTitle>
          <CardDescription>
            {t('common.permissions.dashboardPermissionSystemDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Manual Assignments - Requires Employee read permission */}
            <ManualAssignmentsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.employeeAssignments')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Employee read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.manualAssignmentsSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.manualAssignmentsDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </ManualAssignmentsPermission>

            {/* Iqama - Requires Employee read permission */}
            <IqamaPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.iqamaInformation')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Employee read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.iqamaSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.iqamaDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </IqamaPermission>

            {/* Equipment - Requires Equipment read permission */}
            <EquipmentPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.equipmentInformation')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Equipment read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.equipmentSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.equipmentDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </EquipmentPermission>

            {/* Financial - Requires Payroll read permission */}
            <FinancialPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.financialInformation')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Payroll read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.financialSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.financialDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </FinancialPermission>

            {/* Timesheets - Requires Timesheet read permission */}
            <TimesheetsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.timesheets')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Timesheet read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.timesheetsSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.timesheetsDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </TimesheetsPermission>

            {/* Project Overview - Requires Project read permission */}
            <ProjectOverviewPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.projectInformation')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Project read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.projectOverviewSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.projectOverviewDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </ProjectOverviewPermission>

            {/* Quick Actions - Requires Settings read permission */}
            <QuickActionsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.quickActions')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Settings read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.quickActionsSection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.quickActionsDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </QuickActionsPermission>

            {/* Recent Activity - Requires Settings read permission */}
            <RecentActivityPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {t('common.permissions.recentActivity')}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    {t('common.permissions.requiresPermission', { permission: 'Settings read' })}
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">{t('common.permissions.recentActivitySection')}</h4>
                <p className="text-sm text-green-600 mt-1">
                  {t('common.permissions.recentActivityDescription')}
                </p>
                <Badge variant="default" className="mt-2">
                  {t('common.permissions.accessGranted')}
                </Badge>
              </div>
            </RecentActivityPermission>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
