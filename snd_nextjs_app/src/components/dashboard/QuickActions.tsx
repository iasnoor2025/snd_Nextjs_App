"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BarChart3, DollarSign, Settings, Wrench, Truck, FileText, Calendar, Building2, Activity } from "lucide-react"
import { RoleBased } from "@/components/RoleBased"
import { useI18n } from "@/hooks/use-i18n"

interface QuickActionsProps {
  onHideSection: () => void
}

export function QuickActions({ onHideSection }: QuickActionsProps) {
  const router = useRouter()
  const { t } = useI18n()
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <RoleBased roles={['SUPER_ADMIN', 'ADMIN']}>
        <Card className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/user-management')}>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.user_management')}</h3>
            <p className="text-indigo-100 text-sm">{t('dashboard.quick_actions.user_management_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/analytics')}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.analytics')}</h3>
            <p className="text-emerald-100 text-sm">{t('dashboard.quick_actions.analytics_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR']}>
        <Card className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/payroll-management')}>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.payroll')}</h3>
            <p className="text-amber-100 text-sm">{t('dashboard.quick_actions.payroll_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-rose-600 via-rose-700 to-rose-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/settings')}>
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.settings')}</h3>
            <p className="text-rose-100 text-sm">{t('dashboard.quick_actions.settings_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/equipment-management')}>
          <CardContent className="p-6 text-center">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.equipment')}</h3>
            <p className="text-blue-100 text-sm">{t('dashboard.quick_actions.equipment_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/rental-management')}>
          <CardContent className="p-6 text-center">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.rentals')}</h3>
            <p className="text-purple-100 text-sm">{t('dashboard.quick_actions.rentals_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/document-management')}>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.documents')}</h3>
            <p className="text-cyan-100 text-sm">{t('dashboard.quick_actions.documents_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>

      <RoleBased roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
        <Card className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer" onClick={() => router.push('/modules/project-management')}>
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{t('dashboard.quick_actions.projects')}</h3>
            <p className="text-orange-100 text-sm">{t('dashboard.quick_actions.projects_desc')}</p>
          </CardContent>
        </Card>
      </RoleBased>
      </div>
    </div>
  )
}
