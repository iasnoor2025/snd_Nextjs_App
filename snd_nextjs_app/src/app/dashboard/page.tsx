"use client"

import { ChartAreaSimple } from "@/components/chart-area-simple"
import { DataTable } from "@/components/data-table-simple"
import { SectionCards } from "@/components/section-cards"
import { SSEStatusCompact } from "@/components/sse-status"
import { useSidebar } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
// i18n refactor: All user-facing strings now use useTranslation('dashboard')
import { useTranslation } from 'react-i18next'

import data from "./data.json"

export default function Page() {
  const { t } = useTranslation('dashboard');
  const { state, open } = useSidebar()
  const router = useRouter()

  // Ensure user is authenticated
  const { data: session, status } = useSession()

  // Redirect to login if not authenticated or redirect employees to their dashboard
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push('/login');
      return;
    }

    // Redirect employees to their specific dashboard
    if (session.user?.role === 'EMPLOYEE') {
      router.push('/employee-dashboard');
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="h-full w-full bg-background">
      <div className="w-full p-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('dashboard_overview')}
              </h1>
              <p className="text-muted-foreground">
                {t('welcome_back', { name: session?.user?.name || t('user') })} {t('monitor_business_performance')}
              </p>
            </div>
            <SSEStatusCompact />
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">{t('sidebar_state')}: <span className="text-primary">{state}</span></p>
            <p className="text-sm text-muted-foreground">{t('open')}: {open ? t('yes') : t('no')}</p>
            <p className="text-sm text-muted-foreground">{t('content_flush_description')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCards />

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('analytics_overview')}</h2>
            <ChartAreaSimple />
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t('recent_activities')}</h2>
            <DataTable data={data} />
          </div>
        </div>
      </div>
    </div>
  )
}
