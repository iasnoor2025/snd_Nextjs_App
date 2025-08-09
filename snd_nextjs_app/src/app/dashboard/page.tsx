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
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
// i18n refactor: All user-facing strings now use useTranslation('dashboard')
import { useTranslation } from 'react-i18next'

import data from "./data.json"

export default function Page() {
  const { t } = useTranslation('dashboard');
  const { state, open } = useSidebar()
  const router = useRouter()
  const [iqamaData, setIqamaData] = useState<any[]>([])
  const [loadingIqama, setLoadingIqama] = useState<boolean>(false)
  const [pageIqama, setPageIqama] = useState<number>(1)
  const [totalPagesIqama, setTotalPagesIqama] = useState<number>(1)
  const [limitIqama] = useState<number>(10)
  const [searchIqama, setSearchIqama] = useState<string>("")
  const [searchInput, setSearchInput] = useState<string>("")
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true)
  const [updateOpen, setUpdateOpen] = useState<boolean>(false)
  const [updating, setUpdating] = useState<boolean>(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [newExpiry, setNewExpiry] = useState<string>("")

  // On Leave table state
  const [leaveData, setLeaveData] = useState<any[]>([])
  const [leaveLoading, setLeaveLoading] = useState<boolean>(false)
  const [leavePage, setLeavePage] = useState<number>(1)
  const [leaveTotalPages, setLeaveTotalPages] = useState<number>(1)
  const [leaveLimit] = useState<number>(10)
  const [leaveSearch, setLeaveSearch] = useState<string>("")
  const [leaveSearchInput, setLeaveSearchInput] = useState<string>("")

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
        const params = new URLSearchParams({
          days: '30',
          range: 'next',
          includeExpired: '1',
          expiredDays: '30',
          includeMissing: '1',
          page: String(pageIqama),
          limit: String(limitIqama),
          search: searchIqama,
        });
        const res = await fetch(`/api/employees/iqama-expiring?${params.toString()}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setIqamaData(json.data || []);
        if (json.pagination?.totalPages) {
          setTotalPagesIqama(json.pagination.totalPages);
        } else {
          setTotalPagesIqama(1);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingIqama(false);
        if (isFirstLoad) setIsFirstLoad(false);
      }
    };
    fetchData();
  }, [session, pageIqama, limitIqama, searchIqama]);

  // Debounce search input to avoid flicker on each keystroke
  useEffect(() => {
    const handle = setTimeout(() => {
      setPageIqama(1);
      setSearchIqama(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch employees currently on leave
  useEffect(() => {
    if (!session) return;
    const run = async () => {
      setLeaveLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(leavePage),
          limit: String(leaveLimit),
          search: leaveSearch,
        });
        const res = await fetch(`/api/employees/leaves/active?${params.toString()}`);
        if (!res.ok) throw new Error('Failed leave fetch');
        const json = await res.json();
        setLeaveData(json.data || []);
        setLeaveTotalPages(json.pagination?.totalPages || 1);
      } catch (e) {
        console.error(e);
      } finally {
        setLeaveLoading(false);
      }
    };
    run();
  }, [session, leavePage, leaveLimit, leaveSearch]);

  // Debounce leave search
  useEffect(() => {
    const h = setTimeout(() => {
      setLeavePage(1);
      setLeaveSearch(leaveSearchInput.trim());
    }, 400);
    return () => clearTimeout(h);
  }, [leaveSearchInput]);

  const iqamaExpiringColumns = useMemo(() => [
    { key: 'name', label: 'Name' },
    { key: 'file_number', label: 'File No.' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'iqama_number', label: 'Iqama No.' },
    { key: 'iqama_expiry', label: 'Expiry Date' },
    { key: 'days_remaining', label: 'Days Left' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
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
            <div className="mb-4 flex items-center gap-2">
              <Input
                placeholder="Search by name, file no., department, designation, iqama no."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); }}
                className="max-w-md"
              />
              {loadingIqama && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Updating...
                </div>
              )}
            </div>
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
                  {(loadingIqama && iqamaData.length === 0) ? (
                    <TableRow><TableCell className="py-4" colSpan={iqamaExpiringColumns.length}>Loading...</TableCell></TableRow>
                  ) : iqamaData.length === 0 ? (
                    <TableRow><TableCell className="py-4" colSpan={iqamaExpiringColumns.length}>No records</TableCell></TableRow>
                  ) : (
                    iqamaData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2 pr-4">{row.name}</TableCell>
                        <TableCell className="py-2 pr-4">{row.file_number || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.department || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.designation || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.iqama_number || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.iqama_expiry ? new Date(row.iqama_expiry).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.days_remaining ?? '-'}</TableCell>
                        <TableCell className={`py-2 pr-4 ${row.status === 'expired' ? 'text-red-600 font-medium' : row.status === 'expiring' ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>{row.status}</TableCell>
                        <TableCell className="py-2 pr-4">
                          <Button size="sm" onClick={() => { setSelectedRow(row); setNewExpiry(row.iqama_expiry ? new Date(row.iqama_expiry).toISOString().slice(0,10) : ""); setUpdateOpen(true); }}>Update</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (pageIqama > 1 && !loadingIqama) setPageIqama(pageIqama - 1) }}
                      className={pageIqama <= 1 || loadingIqama ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const items: JSX.Element[] = []
                    const maxToShow = 5
                    const addLink = (p: number, active = false) => {
                      items.push(
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={active} onClick={(e) => { e.preventDefault(); setPageIqama(p) }}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    }
                    if (totalPagesIqama <= maxToShow) {
                      for (let p = 1; p <= totalPagesIqama; p++) addLink(p, p === pageIqama)
                    } else {
                      addLink(1, pageIqama === 1)
                      const showLeftEllipsis = pageIqama > 3
                      const showRightEllipsis = pageIqama < totalPagesIqama - 2
                      const start = Math.max(2, pageIqama - 1)
                      const end = Math.min(totalPagesIqama - 1, pageIqama + 1)
                      if (showLeftEllipsis) {
                        items.push(<PaginationItem key="ellipsisl"><PaginationEllipsis /></PaginationItem>)
                      }
                      for (let p = start; p <= end; p++) addLink(p, p === pageIqama)
                      if (showRightEllipsis) {
                        items.push(<PaginationItem key="ellipsisr"><PaginationEllipsis /></PaginationItem>)
                      }
                      addLink(totalPagesIqama, pageIqama === totalPagesIqama)
                    }
                    return items
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (pageIqama < totalPagesIqama && !loadingIqama) setPageIqama(pageIqama + 1) }}
                      className={pageIqama >= totalPagesIqama || loadingIqama ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Employees Currently on Leave</h2>
            <div className="mb-4 flex items-center gap-2">
              <Input
                placeholder="Search by employee, file no., dept, designation, leave type"
                value={leaveSearchInput}
                onChange={(e) => setLeaveSearchInput(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2 pr-4">Name</TableHead>
                    <TableHead className="py-2 pr-4">File No.</TableHead>
                    <TableHead className="py-2 pr-4">Department</TableHead>
                    <TableHead className="py-2 pr-4">Designation</TableHead>
                    <TableHead className="py-2 pr-4">Leave Type</TableHead>
                    <TableHead className="py-2 pr-4">Start</TableHead>
                    <TableHead className="py-2 pr-4">End</TableHead>
                    <TableHead className="py-2 pr-4">Days Left</TableHead>
                    <TableHead className="py-2 pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(leaveLoading && leaveData.length === 0) ? (
                    <TableRow><TableCell className="py-4" colSpan={9}>Loading...</TableCell></TableRow>
                  ) : leaveData.length === 0 ? (
                    <TableRow><TableCell className="py-4" colSpan={9}>No records</TableCell></TableRow>
                  ) : (
                    leaveData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="py-2 pr-4">{row.name}</TableCell>
                        <TableCell className="py-2 pr-4">{row.file_number || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.department || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.designation || '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.leave_type}</TableCell>
                        <TableCell className="py-2 pr-4">{row.start_date ? new Date(row.start_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.end_date ? new Date(row.end_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.days_left ?? '-'}</TableCell>
                        <TableCell className="py-2 pr-4">{row.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (leavePage > 1 && !leaveLoading) setLeavePage(leavePage - 1) }}
                      className={leavePage <= 1 || leaveLoading ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const items: JSX.Element[] = []
                    const maxToShow = 5
                    const addLink = (p: number, active = false) => {
                      items.push(
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={active} onClick={(e) => { e.preventDefault(); setLeavePage(p) }}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    }
                    if (leaveTotalPages <= maxToShow) {
                      for (let p = 1; p <= leaveTotalPages; p++) addLink(p, p === leavePage)
                    } else {
                      addLink(1, leavePage === 1)
                      const showLeftEllipsis = leavePage > 3
                      const showRightEllipsis = leavePage < leaveTotalPages - 2
                      const start = Math.max(2, leavePage - 1)
                      const end = Math.min(leaveTotalPages - 1, leavePage + 1)
                      if (showLeftEllipsis) {
                        items.push(<PaginationItem key="ellipsisl"><PaginationEllipsis /></PaginationItem>)
                      }
                      for (let p = start; p <= end; p++) addLink(p, p === leavePage)
                      if (showRightEllipsis) {
                        items.push(<PaginationItem key="ellipsisr"><PaginationEllipsis /></PaginationItem>)
                      }
                      addLink(leaveTotalPages, leavePage === leaveTotalPages)
                    }
                    return items
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (leavePage < leaveTotalPages && !leaveLoading) setLeavePage(leavePage + 1) }}
                      className={leavePage >= leaveTotalPages || leaveLoading ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

          {/* Update Iqama Expiry Dialog */}
          <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Iqama Expiry</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">{selectedRow?.name} ({selectedRow?.file_number || '-'})</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iqama_expiry_date">Expiry Date</Label>
                  <Input id="iqama_expiry_date" type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} />
                  <div className="text-xs text-muted-foreground">Leave empty to clear.</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpdateOpen(false)} disabled={updating}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!selectedRow) return;
                    try {
                      setUpdating(true);
                      const res = await fetch(`/api/employees/${selectedRow.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ iqama_expiry: newExpiry || null }),
                      });
                      if (!res.ok) throw new Error('Failed to update');
                      // Optionally refetch page to re-apply filters/order
                      // await fetchData(); // fetchData is inline; keeping optimistic update
                      const now = new Date();
                      const updatedDate = newExpiry ? new Date(newExpiry) : null;
                      setIqamaData((prev) => prev.map((r) => {
                        if (r.id !== selectedRow.id) return r;
                        const status = !updatedDate ? 'missing' : (updatedDate < now ? 'expired' : 'expiring');
                        const days_remaining = updatedDate ? Math.ceil((updatedDate.getTime() - now.getTime()) / (1000*60*60*24)) : null;
                        return { ...r, iqama_expiry: updatedDate, status, days_remaining };
                      }));
                      setUpdateOpen(false);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                >{updating ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
