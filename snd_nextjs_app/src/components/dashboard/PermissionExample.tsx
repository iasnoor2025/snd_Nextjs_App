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

export function PermissionExample() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Permission System Example</CardTitle>
          <CardDescription>
            This example shows how different dashboard sections are protected by permissions.
            Sections will only be visible if the user has the required role and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Manual Assignments - Requires Employee read permission */}
            <ManualAssignmentsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view employee assignments.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Employee read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Manual Assignments Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Employee read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </ManualAssignmentsPermission>

            {/* Iqama - Requires Employee read permission */}
            <IqamaPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view Iqama information.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Employee read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Iqama Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Employee read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </IqamaPermission>

            {/* Equipment - Requires Equipment read permission */}
            <EquipmentPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view equipment information.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Equipment read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Equipment Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Equipment read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </EquipmentPermission>

            {/* Financial - Requires Payroll read permission */}
            <FinancialPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view financial information.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Payroll read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Financial Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Payroll read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </FinancialPermission>

            {/* Timesheets - Requires Timesheet read permission */}
            <TimesheetsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view timesheets.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Timesheet read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Timesheets Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Timesheet read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </TimesheetsPermission>

            {/* Project Overview - Requires Project read permission */}
            <ProjectOverviewPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view project information.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Project read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Project Overview Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Project read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </ProjectOverviewPermission>

            {/* Quick Actions - Requires Settings read permission */}
            <QuickActionsPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to access quick actions.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Settings read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Quick Actions Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Settings read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </QuickActionsPermission>

            {/* Recent Activity - Requires Settings read permission */}
            <RecentActivityPermission
              fallback={
                <div className="p-4 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    You don't have permission to view recent activity.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Requires: Settings read permission
                  </Badge>
                </div>
              }
            >
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium text-green-800">Recent Activity Section</h4>
                <p className="text-sm text-green-600 mt-1">
                  This section is visible because you have Settings read permission.
                </p>
                <Badge variant="default" className="mt-2">
                  ✓ Access Granted
                </Badge>
              </div>
            </RecentActivityPermission>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
