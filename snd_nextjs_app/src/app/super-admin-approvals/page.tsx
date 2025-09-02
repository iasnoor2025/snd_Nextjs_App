
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { SuperAdminApprovals } from '@/components/super-admin-approvals';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Clock, Shield, XCircle } from 'lucide-react';
// i18n refactor: All user-facing strings now use useTranslation('admin')
import { useI18n } from '@/hooks/use-i18n';

export default function SuperAdminApprovalsPage() {
  const { t } = useI18n();

  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              {t('super_admin_approval_center')}
            </h1>
            <p className="text-muted-foreground">{t('manage_all_system_approvals')}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              SUPER_ADMIN
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_approvals')}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">{t('across_all_modules')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">{t('awaiting_approval')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('approved')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{t('successfully_processed')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('rejected')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">{t('declined_requests')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('approval_modules')}</CardTitle>
            <CardDescription>{t('overview_of_approval_types')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">{t('rental_management')}</p>
                  <p className="text-sm text-muted-foreground">{t('equipment_requests')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">{t('timesheet')}</p>
                  <p className="text-sm text-muted-foreground">{t('time_tracking')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium">{t('payroll')}</p>
                  <p className="text-sm text-muted-foreground">{t('salary_processing')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium">{t('leave_management')}</p>
                  <p className="text-sm text-muted-foreground">{t('vacation_requests')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Approval Center */}
        <SuperAdminApprovals />
      </div>
    </ProtectedRoute>
  );
}
