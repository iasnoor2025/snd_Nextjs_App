# Dashboard Permissions System

This document explains how the new permission system works for the main dashboard page.

## Overview

The dashboard now has granular permission controls for each section, allowing administrators to control which users can see which dashboard sections based on their roles and permissions.

## How It Works

### 1. Permission Configuration

Permissions are defined in `src/lib/rbac/dashboard-permissions.ts`:

```typescript
export const dashboardSectionPermissions: DashboardSectionPermission[] = [
  {
    section: 'manualAssignments',
    action: 'read',
    subject: 'Employee',
    description: 'View and manage manual employee assignments',
    requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']
  },
  // ... more sections
];
```

### 2. Permission Components

Each dashboard section is wrapped with a permission component:

```tsx
<ManualAssignmentsPermission>
  <ManualAssignmentSection 
    employeeId={session?.user?.id ? parseInt(session.user.id) : undefined}
    onHideSection={() => toggleSection('manualAssignments')}
    allowAllEmployees={true}
  />
</ManualAssignmentsPermission>
```

### 3. Role-Based Access

The system automatically checks:
- User's role from NextAuth session
- Required permissions for each section
- Whether the user has the necessary role and permissions

## Available Sections and Permissions

| Section | Required Permission | Required Roles | Description |
|---------|-------------------|----------------|-------------|
| `manualAssignments` | `read` Employee | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR | Employee assignment management |
| `iqama` | `read` Employee | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR | Employee Iqama information |
| `equipment` | `read` Equipment | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR | Equipment status and maintenance |
| `financial` | `read` Payroll | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR | Financial overview and payroll |
| `timesheets` | `read` Timesheet | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE | Employee timesheets |
| `projectOverview` | `read` Project | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE | Project overview and status |
| `quickActions` | `read` Settings | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR, EMPLOYEE | Quick action buttons |
| `recentActivity` | `read` Settings | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR, OPERATOR | Recent system activities |
| `sectionControls` | `read` Settings | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR | Section visibility controls |
| `exportReports` | `export` Report | SUPER_ADMIN, ADMIN, MANAGER, SUPERVISOR | Export dashboard reports |

## Adding New Sections

To add a new dashboard section with permissions:

1. **Add permission configuration** in `dashboard-permissions.ts`:
```typescript
{
  section: 'newSection',
  action: 'read',
  subject: 'YourSubject',
  description: 'Description of the new section',
  requiredRole: ['SUPER_ADMIN', 'ADMIN', 'MANAGER']
}
```

2. **Create permission component** in `DashboardSectionPermission.tsx`:
```typescript
export function NewSectionPermission({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <DashboardSectionPermission section="newSection" fallback={fallback}>
      {children}
    </DashboardSectionPermission>
  );
}
```

3. **Use in dashboard** with section visibility:
```tsx
{sectionVisibility.newSection && (
  <NewSectionPermission>
    <NewSectionComponent />
  </NewSectionPermission>
)}
```

## Fallback Content

You can provide fallback content when users don't have permission:

```tsx
<ManualAssignmentsPermission 
  fallback={<div>You don't have permission to view this section</div>}
>
  <ManualAssignmentSection />
</ManualAssignmentsPermission>
```

## Testing Permissions

To test different permission levels:

1. **Change user role** in the database or session
2. **Check section visibility** - sections should appear/disappear based on permissions
3. **Verify role hierarchy** - higher roles should have access to more sections

## Security Notes

- Permissions are checked on both client and server side
- Role-based access control (RBAC) is enforced
- No sensitive data is exposed to unauthorized users
- Session validation ensures permissions are current

## Troubleshooting

### Section Not Visible
- Check user role in session
- Verify permission configuration
- Check console for permission errors

### Permission Denied
- Ensure user has required role
- Check if subject/action combinations are correct
- Verify RBAC configuration

### Type Errors
- Ensure all permission components are properly imported
- Check that section names match between config and components
- Verify TypeScript types are correct
