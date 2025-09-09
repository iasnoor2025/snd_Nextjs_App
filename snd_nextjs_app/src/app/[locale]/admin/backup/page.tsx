'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { DatabaseBackupManager } from '@/components/admin/DatabaseBackupManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Shield, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

export default function DatabaseBackupPage() {
  const { } = useI18n();

  return (
    <ProtectedRoute requiredPermission={{ action: 'manage', subject: 'all' }}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-blue-600" />
              Database Backup Management
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and restore database backups
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              SUPER_ADMIN
            </div>
          </div>
        </div>

        {/* Warning Card */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-orange-700">
              Database backup and restore operations are critical system functions. 
              Only authorized SUPER_ADMIN users can perform these operations. 
              Always create a backup before restoring to prevent data loss.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Backup Manager */}
        <DatabaseBackupManager />
      </div>
    </ProtectedRoute>
  );
}
