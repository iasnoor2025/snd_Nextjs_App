'use client';

import { ProtectedRoute } from '@/components/protected-route';
import BulkTimesheetForm from '@/components/timesheet/BulkTimesheetForm';
import { useRBAC } from '@/lib/rbac/rbac-context';

export default function BulkTimesheetSubmitPage() {
  const { hasPermission } = useRBAC();

  if (!hasPermission('create', 'Timesheet')) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-4 px-4">
        <BulkTimesheetForm />
      </div>
    </ProtectedRoute>
  );
}
