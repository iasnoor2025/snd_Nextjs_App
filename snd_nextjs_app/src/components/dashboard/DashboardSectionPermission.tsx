'use client';

import React from 'react';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import { getPermissionForSection } from '@/lib/rbac/dashboard-permissions';

interface DashboardSectionPermissionProps {
  children: React.ReactNode;
  section: string;
  fallback?: React.ReactNode;
}

export function DashboardSectionPermission({ 
  children, 
  section, 
  fallback 
}: DashboardSectionPermissionProps) {
  const permission = getPermissionForSection(section);
  
  if (!permission) {
    // If no permission is defined for this section, show it by default
    return <>{children}</>;
  }

  return (
    <PermissionContent 
      action={permission.action} 
      subject={permission.subject}
      fallback={fallback}
    >
      {children}
    </PermissionContent>
  );
}

// Convenience components for each section
export function ManualAssignmentsPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="manualAssignments" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function IqamaPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="iqama" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function EquipmentPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="equipment" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function FinancialPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="financial" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function TimesheetsPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="timesheets" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function ProjectOverviewPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="projectOverview" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function QuickActionsPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="quickActions" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function RecentActivityPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="recentActivity" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function EmployeeAdvancePermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="employeeAdvance" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function SectionControlsPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="sectionControls" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}

export function ExportReportsPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="exportReports" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}
