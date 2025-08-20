'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import DynamicDocumentTypeManager from '@/components/company/DynamicDocumentTypeManager';

export default function DocumentTypesPage() {
  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'Company' }}>
      <div className="w-full space-y-6">
        <DynamicDocumentTypeManager />
      </div>
    </ProtectedRoute>
  );
}
