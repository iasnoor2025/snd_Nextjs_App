"use client"

import { ChartAreaSimple } from "@/components/chart-area-simple"
import { DataTable } from "@/components/data-table-simple"
import { SectionCards } from "@/components/section-cards"
import { SSEStatusCompact } from "@/components/sse-status"
import { useSidebar } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// i18n refactor: All user-facing strings now use useTranslation('dashboard')
import { useTranslation } from 'react-i18next'

import data from "./data.json"

export default function Page() {
  const { t } = useTranslation('dashboard');
  const { state, open } = useSidebar()
  const router = useRouter()
  const [iqamaData, setIqamaData] = useState<any[]>([])
  const [loadingIqama, setLoadingIqama] = useState<boolean>(false)

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

  // Fetch iqama expiring within next 30 days; also include expired and missing dates
  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      setLoadingIqama(true);
      try {
        const res = await fetch('/api/employees/iqama-expiring?days=30&range=next&includeExpired=1&expiredDays=30&includeMissing=1');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setIqamaData(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingIqama(false);
      }
    };
    fetchData();
  }, [session]);

  const iqamaExpiringColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'file_number', label: 'File No.' },
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'iqama_number', label: 'Iqama No.' },
    { key: 'iqama_expiry', label: 'Expiry Date' },
    { key: 'days_remaining', label: 'Days Left' },
    { key: 'status', label: 'Status' },
  ], []);

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

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Iqama Expiring / Expired / Missing (30 Days Window)</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {iqamaExpiringColumns.map(col => (
                      <TableHead key={col.key} className="py-2 pr-4">{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingIqama ? (
                    <TableRow><TableCell className="py-4" colSpan={iqamaExpiringColumns.length}>Loading...</TableCell></TableRow>
                  ) : iqamaData.length === 0 ? (
                    <TableRow><TableCell className="py-4" colSpan={iqamaExpiringColumns.length}>No records</TableCell></TableRow>
                  ) : (
                    iqamaData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2 pr-4">{row.name}</TableCell>
                        <TableCell className="py-2 pr-4">{row.file_number || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.employee_id}</TableCell>
                        <TableCell className="py-2 pr-4">{row.department || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.designation || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.iqama_number || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.iqama_expiry ? new Date(row.iqama_expiry).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.days_remaining ?? '-'}</TableCell>
                        <TableCell className={`py-2 pr-4 ${row.status === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>{row.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
