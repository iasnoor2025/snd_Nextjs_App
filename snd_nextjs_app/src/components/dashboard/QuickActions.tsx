'use client';

import { PermissionBased } from '@/components/PermissionBased';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import {
  Activity,
  BarChart3,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Truck,
  Users,
  Wrench,
  Award,
  BookOpen,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  onHideSection: () => void;
}

export function QuickActions({ onHideSection }: QuickActionsProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('dashboard.quickActions') || 'Quick Actions'}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onHideSection}
          className="flex items-center gap-2"
        >
          {t('dashboard.hideSection')}
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-2">
        <PermissionBased action="read" subject="User">
          <Button
            variant="default"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/user-management')}
          >
            <Users className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Users
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Report">
          <Button
            variant="secondary"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/analytics')}
          >
            <BarChart3 className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Analytics
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Payroll">
          <Button
            variant="outline"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/payroll-management')}
          >
            <DollarSign className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Payroll
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Settings">
          <Button
            variant="ghost"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/settings')}
          >
            <Settings className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Settings
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Equipment">
          <Button
            variant="default"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/equipment-management')}
          >
            <Wrench className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Equipment
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Rental">
          <Button
            variant="secondary"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/rental-management')}
          >
            <Truck className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Rentals
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Document">
          <Button
            variant="outline"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/document-management')}
          >
            <FileText className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Documents
              </div>
            </div>
          </Button>
        </PermissionBased>

        <PermissionBased action="read" subject="Project">
          <Button
            variant="ghost"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/project-management')}
          >
            <Building2 className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Projects
              </div>
            </div>
          </Button>
        </PermissionBased>

        {/* EMPLOYEE MANAGEMENT */}
        <PermissionBased action="read" subject="Employee">
          <Button
            variant="default"
            size="sm"
            className="h-16 p-2 flex flex-col items-center justify-center space-y-1 min-w-[80px]"
            onClick={() => router.push('/modules/employee-management')}
          >
            <Users className="h-4 w-4" />
            <div className="text-center">
              <div className="font-medium text-xs leading-tight">
                Employee
              </div>
            </div>
          </Button>
        </PermissionBased>
      </div>
    </div>
  );
}
