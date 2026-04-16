'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { useI18n } from '@/hooks/use-i18n';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  History,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { usePermission } from '@/lib/rbac/rbac-context';

interface AdvanceData {
  id: number;
  employee_id: number;
  amount: string;
  reason: string;
  status: string;
  notes: string;
  repaidAmount: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    file_number: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  } | null;
}

interface EmployeeAdvanceSectionProps {
  onHideSection: () => void;
}

/** SAR accounting display: thousands separators + 2 decimals (aligned with employee-management money fields). */
function formatSarAmount(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EmployeeAdvanceSection({ onHideSection }: EmployeeAdvanceSectionProps) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const { hasPermission } = usePermission();

  const manageAdvance = hasPermission('manage', 'Advance');
  const readAdvance = hasPermission('read', 'Advance');
  const createAdvance = hasPermission('create', 'Advance');
  const updateAdvance = hasPermission('update', 'Advance');
  const deleteAdvance = hasPermission('delete', 'Advance');
  const approveAdvancePerm = hasPermission('approve', 'Advance');
  const rejectAdvancePerm = hasPermission('reject', 'Advance');
  const readEmployee = hasPermission('read', 'Employee');
  const manageEmployee = hasPermission('manage', 'Employee');

  const canCreateAdvance = createAdvance || manageAdvance;
  const canDeleteAdvance = deleteAdvance || manageAdvance;
  const canRefreshAdvances = readAdvance || manageAdvance;
  /** Approve: explicit approve, manage, or legacy update when no separate approve/reject perms */
  const canApproveAdvance =
    manageAdvance ||
    approveAdvancePerm ||
    (updateAdvance && !approveAdvancePerm && !rejectAdvancePerm);
  const canRejectAdvance =
    manageAdvance ||
    rejectAdvancePerm ||
    (updateAdvance && !approveAdvancePerm && !rejectAdvancePerm);
  /** Repay updates balances — requires update (or manage) */
  const canRepayAdvance = updateAdvance || manageAdvance;
  const canOpenEmployeeProfile = readEmployee || manageEmployee;
  const [advances, setAdvances] = useState<AdvanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalAdvances: 0,
    pendingAdvances: 0,
    approvedAdvances: 0,
    totalAmount: 0,
    totalRepaid: 0,
    outstandingBalance: 0,
  });
  
  // Dialog states
  const [isAdvanceRequestDialogOpen, setIsAdvanceRequestDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  
  // Form states
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  
  // Selected items
  const [selectedAdvanceForReject, setSelectedAdvanceForReject] = useState<AdvanceData | null>(null);
  const [selectedAdvanceForRepayment, setSelectedAdvanceForRepayment] = useState<AdvanceData | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const prevFiltersKeyRef = useRef<string | undefined>(undefined);

  const loadAdvancesPage = useCallback(
    async (targetPage: number, options?: { silent?: boolean }) => {
      try {
        if (options?.silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(perPage),
        });
        const q = debouncedSearch.trim();
        if (q) params.set('search', q);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const response = await fetch(`/api/advances?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || tRef.current('dashboard.employeeAdvance.messages.failedToLoad'));
          setAdvances([]);
          return;
        }
        const rows = data.data ?? [];
        const totalRows = typeof data.total === 'number' ? data.total : 0;
        const lp = typeof data.last_page === 'number' ? data.last_page : 1;

        if (rows.length === 0 && totalRows > 0 && targetPage > lp) {
          setPage(lp);
          return;
        }

        setAdvances(rows);
        setTotal(totalRows);

        const s = data.summary;
        if (s) {
          const totalAmount = parseFloat(s.total_amount ?? '0') || 0;
          const totalRepaid = parseFloat(s.total_repaid ?? '0') || 0;
          setSummary({
            totalAdvances: s.total_advances ?? 0,
            pendingAdvances: s.pending ?? 0,
            approvedAdvances: s.approved ?? 0,
            totalAmount,
            totalRepaid,
            outstandingBalance: totalAmount - totalRepaid,
          });
        }
      } catch (error) {
        console.error('Error fetching advances:', error);
        toast.error(tRef.current('dashboard.employeeAdvance.messages.failedToLoad'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [perPage, debouncedSearch, statusFilter]
  );



  // Handle new advance request
  const handleNewAdvance = async () => {
         if (!selectedEmployeeId || !advanceAmount || !advanceReason) {
       toast.error(t('dashboard.employeeAdvance.messages.fillRequiredFields'));
       return;
     }

    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          amount: advanceAmount,
          reason: advanceReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceSubmitted'));
        setIsAdvanceRequestDialogOpen(false);
        setAdvanceAmount('');
        setAdvanceReason('');
        setSelectedEmployeeId('');
        if (page !== 1) {
          setPage(1);
        } else {
          void loadAdvancesPage(1);
        }
      } else {
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToSubmit'));
      }
           } catch (error) {
         console.error('Error submitting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToSubmit'));
       }
  };

  // Handle advance approval
  const handleApproveAdvance = async (advanceId: number) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceApproved'));
        void loadAdvancesPage(page, { silent: true });
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToApprove'));
      }
           } catch (error) {
         console.error('Error approving advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToApprove'));
       }
  };

  // Handle advance rejection
  const handleRejectAdvance = async (advanceId: number, reason: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceRejected'));
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedAdvanceForReject(null);
        void loadAdvancesPage(page, { silent: true });
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToReject'));
      }
           } catch (error) {
         console.error('Error rejecting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToReject'));
       }
  };

  // Handle repayment
  const handleRepayment = async (advanceId: number, amount: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repaymentAmount: amount,
        }),
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.repaymentRecorded'));
        setIsRepaymentDialogOpen(false);
        setRepaymentAmount('');
        setSelectedAdvanceForRepayment(null);
        void loadAdvancesPage(page, { silent: true });
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToRecordRepayment'));
      }
           } catch (error) {
         console.error('Error recording repayment:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToRecordRepayment'));
       }
  };



  // Handle advance deletion
  const handleDeleteAdvance = async (advanceId: number) => {
         if (!confirm(t('dashboard.employeeAdvance.messages.confirmDelete'))) {
       return;
     }

    try {
      const response = await fetch(`/api/advances/${advanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceDeleted'));
        void loadAdvancesPage(page, { silent: true });
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToDelete'));
      }
           } catch (error) {
         console.error('Error deleting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToDelete'));
       }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const key = `${debouncedSearch}__${statusFilter}`;
    if (prevFiltersKeyRef.current === undefined) {
      prevFiltersKeyRef.current = key;
      void loadAdvancesPage(page);
      return;
    }
    const filtersChanged = prevFiltersKeyRef.current !== key;
    if (filtersChanged) {
      prevFiltersKeyRef.current = key;
      if (page !== 1) {
        setPage(1);
        return;
      }
      void loadAdvancesPage(1);
      return;
    }
    void loadAdvancesPage(page);
  }, [page, debouncedSearch, statusFilter, loadAdvancesPage]);

  const stats = summary;

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-muted/50 rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
                           <CardTitle className="text-xl font-semibold">{t('dashboard.employeeAdvance.title')}</CardTitle>
             <CardDescription>
               {t('dashboard.employeeAdvance.description')}
             </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="text-muted-foreground hover:text-foreground"
            >
                             {t('dashboard.employeeAdvance.hideSection')}
            </Button>
            {canCreateAdvance && (
              <Button
                variant="outline"
                onClick={() => setIsAdvanceRequestDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('dashboard.employeeAdvance.newAdvance')}
              </Button>
            )}
            {canRefreshAdvances && (
              <Button
                variant="outline"
                onClick={() => void loadAdvancesPage(page, { silent: true })}
                disabled={refreshing || loading}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <History className="h-4 w-4" />
                )}
                {t('dashboard.employeeAdvance.refresh')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalAdvances')}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalAdvances}</p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.pending')}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pendingAdvances}</p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.approved')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.approvedAdvances}</p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalAmount')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              SAR {formatSarAmount(stats.totalAmount)}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600 dark:text-green-500" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalRepaid')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
              SAR {formatSarAmount(stats.totalRepaid)}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.outstanding')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              SAR {formatSarAmount(stats.outstandingBalance)}
            </p>
          </div>
        </div>

        {/* Advances Table */}
        <Card className="mt-6 shadow-sm">
          <CardHeader className="bg-muted/50 rounded-t-lg p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  {t('dashboard.employeeAdvance.table.title')}
                </CardTitle>
              </div>
              <div className="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder={t('dashboard.employeeAdvance.table.searchPlaceholder')}
                    className="pl-9"
                    aria-label={t('dashboard.employeeAdvance.table.searchPlaceholder')}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]" aria-label={t('dashboard.employeeAdvance.filters.status')}>
                    <SelectValue placeholder={t('dashboard.employeeAdvance.filters.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.employeeAdvance.filters.all')}</SelectItem>
                    <SelectItem value="pending">{t('dashboard.employeeAdvance.filters.pending')}</SelectItem>
                    <SelectItem value="approved">{t('dashboard.employeeAdvance.filters.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('dashboard.employeeAdvance.filters.rejected')}</SelectItem>
                    <SelectItem value="partially_repaid">
                      {t('dashboard.employeeAdvance.filters.partially_repaid')}
                    </SelectItem>
                    <SelectItem value="fully_repaid">{t('dashboard.employeeAdvance.filters.fully_repaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      {t('dashboard.employeeAdvance.table.fileNumber')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      {t('dashboard.employeeAdvance.table.employee')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      {t('dashboard.employeeAdvance.table.amount')}
                    </th>
                                                               <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        {t('dashboard.employeeAdvance.table.currentBalance')}
                      </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                         {t('dashboard.employeeAdvance.table.reason')}
                       </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.date')}
                     </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.status')}
                     </th>
                                         <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.actions')}
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {loading ? (
                                       <tr>
                     <td colSpan={8} className="px-6 py-8 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         <span className="text-muted-foreground">{t('dashboard.employeeAdvance.messages.loading')}</span>
                       </div>
                     </td>
                   </tr>
                 ) : advances.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground italic">
                       {t('dashboard.employeeAdvance.messages.noRecords')}
                     </td>
                   </tr>
                  ) : (
                    advances.map(advance => (
                      <tr key={advance.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap text-foreground tabular-nums">
                          {advance.employee?.file_number ?? '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="font-medium text-foreground">
                              {advance.employee?.first_name} {advance.employee?.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                           SAR {formatSarAmount(advance.amount)}
                         </td>
                                                   <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600 dark:text-blue-400">
                            SAR{' '}
                            {formatSarAmount(
                              Number(advance.amount) - Number(advance.repaidAmount || 0)
                            )}
                          </td>
                         <td className="px-6 py-4 max-w-[200px] truncate text-foreground">{advance.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-foreground">
                          {new Date(advance.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              advance.status === 'approved'
                                ? 'default'
                                : advance.status === 'pending'
                                  ? 'secondary'
                                  : advance.status === 'rejected'
                                    ? 'destructive'
                                    : advance.status === 'partially_repaid'
                                      ? 'secondary'
                                      : advance.status === 'fully_repaid'
                                        ? 'default'
                                        : 'outline'
                            }
                            className={
                              advance.status === 'approved'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : advance.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                  : advance.status === 'rejected'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    : advance.status === 'partially_repaid'
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                      : advance.status === 'fully_repaid'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                        : 'bg-muted text-muted-foreground'
                            }
                          >
                            {advance.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {advance.status === 'pending' && canApproveAdvance && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600/40 text-green-700 hover:bg-green-50 dark:border-green-500/40 dark:text-green-400 dark:hover:bg-green-950/40"
                                onClick={() => handleApproveAdvance(advance.id)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                {t('dashboard.employeeAdvance.actions.approve')}
                              </Button>
                            )}
                            {advance.status === 'pending' && canRejectAdvance && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedAdvanceForReject(advance);
                                  setIsRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                {t('dashboard.employeeAdvance.actions.reject')}
                              </Button>
                            )}

                            {(advance.status === 'approved' || advance.status === 'partially_repaid') &&
                              canRepayAdvance && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAdvanceForRepayment(advance);
                                    setIsRepaymentDialogOpen(true);
                                  }}
                                >
                                  {t('dashboard.employeeAdvance.actions.repay')}
                                </Button>
                              )}

                            {canOpenEmployeeProfile && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.open(`/${locale}/employee-management/${advance.employee_id}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            {canDeleteAdvance && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300"
                                onClick={() => handleDeleteAdvance(advance.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && total > perPage && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t px-4 py-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  {t('common.pagination.showing')} {(page - 1) * perPage + 1}{' '}
                  {t('common.pagination.to')} {Math.min(page * perPage, total)}{' '}
                  {t('common.pagination.of')} {total} {t('common.pagination.results')}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => page > 1 && setPage(page - 1)}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {(() => {
                      const totalPages = Math.ceil(total / perPage);
                      const pageNumbers: number[] = [];
                      for (let p = 1; p <= totalPages; p++) {
                        if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                          pageNumbers.push(p);
                        }
                      }
                      const deduped = [...new Set(pageNumbers)].sort((a, b) => a - b);
                      const items: JSX.Element[] = [];
                      let prev = 0;
                      for (const p of deduped) {
                        if (prev && p > prev + 1) {
                          items.push(
                            <PaginationItem key={`ellipsis-${p}`}>
                              <span className="px-2 text-muted-foreground">…</span>
                            </PaginationItem>
                          );
                        }
                        items.push(
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={() => setPage(p)}
                              isActive={page === p}
                              className="cursor-pointer"
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                        prev = p;
                      }
                      return items;
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          page < Math.ceil(total / perPage) && setPage(page + 1)
                        }
                        className={
                          page >= Math.ceil(total / perPage)
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>

      {/* New Advance Dialog */}
      <Dialog open={isAdvanceRequestDialogOpen} onOpenChange={setIsAdvanceRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
                         <DialogTitle>{t('dashboard.employeeAdvance.dialogs.newAdvance.title')}</DialogTitle>
             <DialogDescription>{t('dashboard.employeeAdvance.dialogs.newAdvance.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
                         <div className="grid gap-2">
               <EmployeeDropdown
                 value={selectedEmployeeId}
                 onValueChange={setSelectedEmployeeId}
                 label={t('dashboard.employeeAdvance.dialogs.newAdvance.employee')}
                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.employee')}
                 required={true}
                 showSearch={true}
               />
             </div>
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                {t('dashboard.employeeAdvance.dialogs.newAdvance.amount')}
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
                                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.amountPlaceholder')}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                {t('dashboard.employeeAdvance.dialogs.newAdvance.reason')}
              </label>
              <Textarea
                id="reason"
                value={advanceReason}
                onChange={e => setAdvanceReason(e.target.value)}
                                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.reasonPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
                             onClick={() => {
                 setIsAdvanceRequestDialogOpen(false);
                 setAdvanceAmount('');
                 setAdvanceReason('');
                 setSelectedEmployeeId('');
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.newAdvance.cancel')}
            </Button>
                         <Button type="button" onClick={handleNewAdvance}>
               {t('dashboard.employeeAdvance.dialogs.newAdvance.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



             {/* Reject Advance Dialog */}
       <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
         <DialogContent>
           <DialogHeader>
                           <DialogTitle>{t('dashboard.employeeAdvance.dialogs.rejectAdvance.title')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.employeeAdvance.dialogs.rejectAdvance.description')}
              </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid gap-2">
                               <label htmlFor="rejectionReason" className="text-sm font-medium">
                  {t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectionReason')}
                </label>
               <Textarea
                 id="rejectionReason"
                 value={rejectionReason}
                 onChange={e => setRejectionReason(e.target.value)}
                                    placeholder={t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectionReasonPlaceholder')}
                 rows={3}
               />
             </div>
           </div>
           <DialogFooter>
             <Button
               type="button"
               variant="outline"
               onClick={() => {
                 setIsRejectDialogOpen(false);
                 setRejectionReason('');
                 setSelectedAdvanceForReject(null);
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.rejectAdvance.cancel')}
             </Button>
             <Button
               type="button"
               variant="destructive"
               onClick={() => {
                 if (selectedAdvanceForReject && rejectionReason.trim()) {
                   handleRejectAdvance(selectedAdvanceForReject.id, rejectionReason);
                                    } else {
                     toast.error(t('dashboard.employeeAdvance.messages.provideRejectionReason'));
                   }
               }}
               disabled={!rejectionReason.trim()}
             >
               {t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectAdvance')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Repayment Dialog */}
       <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{t('dashboard.employeeAdvance.dialogs.repayment.title')}</DialogTitle>
             <DialogDescription>
               {t('dashboard.employeeAdvance.dialogs.repayment.description')}
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             {selectedAdvanceForRepayment && (
               <div className="space-y-4">
                 <div className="rounded-lg border p-4 bg-muted/50">
                   <h4 className="font-medium mb-2">{t('dashboard.employeeAdvance.dialogs.repayment.advanceDetails')}</h4>
                   <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.employee')}: {selectedAdvanceForRepayment.employee?.first_name} {selectedAdvanceForRepayment.employee?.last_name}
                     </div>
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.amount')}: SAR{' '}
                       {formatSarAmount(selectedAdvanceForRepayment.amount)}
                     </div>
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.status')}: {selectedAdvanceForRepayment.status.replace('_', ' ')}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid gap-2">
                   <label htmlFor="repaymentAmount" className="text-sm font-medium">
                     {t('dashboard.employeeAdvance.dialogs.repayment.repaymentAmount')}
                   </label>
                   <Input
                     id="repaymentAmount"
                     type="number"
                     step="0.01"
                     min="0"
                     value={repaymentAmount}
                     onChange={e => setRepaymentAmount(e.target.value)}
                     placeholder={t('dashboard.employeeAdvance.dialogs.repayment.repaymentAmountPlaceholder')}
                   />
                 </div>
               </div>
             )}
           </div>
           <DialogFooter>
             <Button
               type="button"
               variant="outline"
               onClick={() => {
                 setIsRepaymentDialogOpen(false);
                 setRepaymentAmount('');
                 setSelectedAdvanceForRepayment(null);
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.repayment.cancel')}
             </Button>
             <Button
               type="button"
               onClick={() => {
                 if (selectedAdvanceForRepayment && repaymentAmount.trim()) {
                   handleRepayment(selectedAdvanceForRepayment.id, repaymentAmount);
                                    } else {
                     toast.error(t('dashboard.employeeAdvance.messages.provideRepaymentAmount'));
                   }
               }}
               disabled={!repaymentAmount.trim()}
             >
               {t('dashboard.employeeAdvance.dialogs.repayment.recordRepayment')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </Card>
  );
}
