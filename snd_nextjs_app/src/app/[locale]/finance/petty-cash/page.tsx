'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { useTranslations } from '@/hooks/use-translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PermissionContent } from '@/lib/rbac/rbac-components';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { PettyCashAccountDialog } from './PettyCashAccountDialog';
import { PettyCashTransactionDialog } from './PettyCashTransactionDialog';

interface PettyCashAccount {
  id: number;
  name: string;
  description?: string | null;
  currency: string;
  openingBalance: number;
  currentBalance?: number;
  isActive: boolean;
}

interface PettyCashTransaction {
  id: number;
  accountId: number;
  accountName?: string;
  transactionDate: string;
  type: string;
  amount: number;
  description?: string | null;
  reference?: string | null;
  receiptNumber?: string | null;
  expenseCategoryId?: number | null;
  categoryName?: string | null;
  projectId?: number | null;
  employeeId?: number | null;
  status: string;
  createdAt?: string;
}

export default function PettyCashPage() {
  const { t } = useTranslations();
  const [accounts, setAccounts] = useState<PettyCashAccount[]>([]);
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<PettyCashTransaction | null>(null);
  const [deleteTransactionDialogOpen, setDeleteTransactionDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<PettyCashTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PettyCashAccount | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const [filters, setFilters] = useState({
    accountId: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  type SortColumn = 'date' | 'account' | 'type' | 'amount' | 'description' | 'category' | 'balance';
  type SortDirection = 'asc' | 'desc';
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'date',
    direction: 'asc',
  });

  const loadAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await ApiService.getPettyCashAccounts({ active: !showInactive });
      if (res.success && res.data) setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const loadTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const params: Record<string, string> = {};
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.search?.trim()) params.search = filters.search.trim();
      const res = await ApiService.getPettyCashTransactions(params as any);
      if (res.success && res.data) setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [showInactive]);

  useEffect(() => {
    loadTransactions();
  }, [filters.accountId, filters.type, filters.dateFrom, filters.dateTo, filters.search]);

  // Debounce search input (300ms) before updating filters
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      searchDebounceRef.current = null;
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  // Compute running balance per account (transactions sorted newest first)
  const transactionsWithBalance = useMemo(() => {
    const accountBalances = new Map<number, number>();
    accounts.forEach((acc) => {
      accountBalances.set(acc.id, acc.currentBalance ?? acc.openingBalance ?? 0);
    });
    const withBalance = transactions.map((tx) => {
      const balance = accountBalances.get(tx.accountId) ?? 0;
      const isIn = tx.type === 'IN';
      const delta = isIn ? tx.amount : -(tx.amount ?? 0);
      accountBalances.set(tx.accountId, balance - delta);
      return { ...tx, runningBalance: balance };
    });
    const { column, direction } = sortConfig;
    const mult = direction === 'asc' ? 1 : -1;
    return [...withBalance].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (column) {
        case 'date': {
          aVal = a.transactionDate || '';
          bVal = b.transactionDate || '';
          const dateCmp = mult * (String(aVal).localeCompare(String(bVal)) || 0);
          if (dateCmp !== 0) return dateCmp;
          // Same date: IN first, then others (OUT, EXPENSE, ADJUSTMENT)
          const typeOrder: Record<string, number> = { IN: 0, OUT: 1, EXPENSE: 2, ADJUSTMENT: 3 };
          const aType = typeOrder[a.type] ?? 4;
          const bType = typeOrder[b.type] ?? 4;
          return aType - bType;
        }
        case 'account':
          aVal = (a.accountName ?? a.accountId)?.toString() ?? '';
          bVal = (b.accountName ?? b.accountId)?.toString() ?? '';
          return mult * (aVal.localeCompare(bVal) || 0);
        case 'type':
          aVal = a.type;
          bVal = b.type;
          return mult * (aVal.localeCompare(bVal) || 0);
        case 'amount':
          aVal = a.amount ?? 0;
          bVal = b.amount ?? 0;
          return mult * (aVal - bVal);
        case 'description':
          aVal = (a.description ?? '').toLowerCase();
          bVal = (b.description ?? '').toLowerCase();
          return mult * (aVal.localeCompare(bVal) || 0);
        case 'category':
          aVal = (a.categoryName ?? '').toLowerCase();
          bVal = (b.categoryName ?? '').toLowerCase();
          return mult * (aVal.localeCompare(bVal) || 0);
        case 'balance':
          aVal = (a as { runningBalance?: number }).runningBalance ?? 0;
          bVal = (b as { runningBalance?: number }).runningBalance ?? 0;
          return mult * (aVal - bVal);
        default:
          return 0;
      }
    });
  }, [transactions, accounts, sortConfig]);

  const handleAccountSaved = () => {
    setEditingAccount(null);
    setAccountDialogOpen(false);
    loadAccounts();
    loadTransactions();
  };

  const handleTransactionSaved = () => {
    setEditingTransaction(null);
    setTransactionDialogOpen(false);
    loadTransactions();
    loadAccounts();
  };

  const handleEditTransaction = (tx: PettyCashTransaction) => {
    setEditingTransaction(tx);
    setTransactionDialogOpen(true);
  };

  const openDeleteTransactionDialog = (tx: PettyCashTransaction) => {
    setTransactionToDelete(tx);
    setDeleteTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setDeletingTransaction(true);
    try {
      await ApiService.deletePettyCashTransaction(transactionToDelete.id);
      toast.success(t('pettyCash.transactionDeleted'));
      setTransactionToDelete(null);
      setDeleteTransactionDialogOpen(false);
      loadTransactions();
      loadAccounts();
    } catch (e) {
      toast.error(t('pettyCash.deleteTransactionFailed'));
      setDeleteTransactionDialogOpen(false);
      setTransactionToDelete(null);
    } finally {
      setDeletingTransaction(false);
    }
  };

  const handleEditAccount = (account: PettyCashAccount) => {
    setEditingAccount(account);
    setAccountDialogOpen(true);
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm(t('pettyCash.deactivateConfirm'))) return;
    try {
      await ApiService.deletePettyCashAccount(id);
      toast.success(t('pettyCash.accountDeactivated'));
      loadAccounts();
      loadTransactions();
    } catch (e) {
      toast.error(t('pettyCash.deactivateFailed'));
    }
  };

  const handleSort = (column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortableHead = ({ column, label, className = '' }: { column: SortColumn; label: string; className?: string }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
        {label}
        {sortConfig.column === column ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>
    </TableHead>
  );

  const formatAmount = (n: number) =>
    (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getTypeLabel = (type: string) => {
    if (type === 'IN') return t('pettyCash.typeIn');
    if (type === 'OUT') return t('pettyCash.typeOut');
    if (type === 'EXPENSE') return t('pettyCash.typeExpense');
    return t('pettyCash.typeAdjustment');
  };

  const handlePrintReport = () => {
    const accountName = filters.accountId
      ? accounts.find((a) => String(a.id) === filters.accountId)?.name ?? null
      : null;
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Petty Cash Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 10px; margin: 0; font-size: 12px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-right { text-align: right; }
    .text-green { color: #15803d; font-weight: 500; }
    .text-red { color: #b91c1c; font-weight: 500; }
    .summary { background-color: #f9f9f9; padding: 8px; margin: 10px 0; border-radius: 4px; font-size: 12px; }
    @media print { body { padding: 6px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>${t('pettyCash.title')} - ${t('pettyCash.transactions')}</h1>
  <div class="summary">
    <strong>${t('pettyCash.dateFrom')}:</strong> ${filters.dateFrom || '—'}<br/>
    <strong>${t('pettyCash.dateTo')}:</strong> ${filters.dateTo || '—'}<br/>
    ${accountName ? `<strong>${t('pettyCash.account')}:</strong> ${accountName}<br/>` : ''}
    ${filters.type && filters.type !== 'all' ? `<strong>${t('pettyCash.type')}:</strong> ${getTypeLabel(filters.type)}<br/>` : ''}
    ${filters.search ? `<strong>${t('pettyCash.search')}:</strong> ${filters.search}<br/>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>${t('pettyCash.date')}</th>
        <th>${t('pettyCash.account')}</th>
        <th>${t('pettyCash.type')}</th>
        <th>${t('pettyCash.description')}</th>
        <th>${t('pettyCash.category')}</th>
        <th class="text-right">${t('pettyCash.inAmount')}</th>
        <th class="text-right">${t('pettyCash.outAmount')}</th>
        <th class="text-right">${t('pettyCash.balance')}</th>
      </tr>
    </thead>
    <tbody>
`;
    if (transactionsWithBalance.length === 0) {
      html += `<tr><td colspan="8" style="text-align:center;color:#666;">${t('pettyCash.noTransactions')}</td></tr>`;
    } else {
      let totalIn = 0;
      let totalOut = 0;
      transactionsWithBalance.forEach((tx) => {
        const isIn = tx.type === 'IN';
        const amt = tx.amount ?? 0;
        if (isIn) totalIn += amt;
        else totalOut += amt;
        const amtStr = formatAmount(amt);
        const bal = (tx as { runningBalance?: number }).runningBalance ?? 0;
        const inCell = isIn ? `<span class="text-green">${amtStr}</span>` : '—';
        const outCell = !isIn ? `<span class="text-red">${amtStr}</span>` : '—';
        const balClass = bal >= 0 ? 'text-green' : 'text-red';
        const dateStr = tx.transactionDate ? format(new Date(tx.transactionDate + 'T12:00:00'), 'yyyy-MM-dd') : '—';
        html += `<tr${isIn ? ' style="background-color:#f0fdf4;"' : ''}>
          <td>${dateStr}</td>
          <td>${tx.accountName ?? tx.accountId}</td>
          <td>${getTypeLabel(tx.type)}</td>
          <td>${(tx.description || '—').replace(/</g, '&lt;')}</td>
          <td>${tx.categoryName || '—'}</td>
          <td class="text-right">${inCell}</td>
          <td class="text-right">${outCell}</td>
          <td class="text-right ${balClass}">${formatAmount(bal)}</td>
        </tr>`;
      });
      const mostRecent = transactionsWithBalance.reduce((a, b) => {
        const aDate = a.transactionDate || '';
        const bDate = b.transactionDate || '';
        if (aDate > bDate) return a;
        if (aDate < bDate) return b;
        return (a.id ?? 0) > (b.id ?? 0) ? a : b;
      });
      const lastBalance = (mostRecent as { runningBalance?: number })?.runningBalance ?? 0;
      const lastBalClass = lastBalance >= 0 ? 'text-green' : 'text-red';
      html += `
      <tr style="background-color:#f0f0f0;font-weight:bold;">
        <td colspan="3">${t('pettyCash.totalIn')} / ${t('pettyCash.totalOut')} / ${t('pettyCash.lastBalance')}</td>
        <td colspan="2"></td>
        <td class="text-right text-green">${formatAmount(totalIn)}</td>
        <td class="text-right text-red">${formatAmount(totalOut)}</td>
        <td class="text-right ${lastBalClass}">${formatAmount(lastBalance)}</td>
      </tr>`;
    }
    html += `
    </tbody>
  </table>
</body>
</html>`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const handleDownloadPdf = async () => {
    const params = new URLSearchParams();
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    params.set('sortColumn', sortConfig.column);
    params.set('sortDirection', sortConfig.direction);
    try {
      toast.loading(t('pettyCash.generatingPdf'), { id: 'petty-pdf' });
      const res = await fetch(`/api/petty-cash/report/pdf?${params.toString()}`);
      if (!res.ok) {
        toast.error(t('pettyCash.pdfFailed'), { id: 'petty-pdf' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Petty_Cash_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('pettyCash.pdfDownloaded'), { id: 'petty-pdf' });
    } catch (e) {
      toast.error(t('pettyCash.pdfFailed'), { id: 'petty-pdf' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-7 w-7" />
              {t('pettyCash.title')}
            </h1>
            <p className="text-muted-foreground">{t('pettyCash.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionContent action="create" subject="PettyCash">
              <Button variant="outline" size="sm" onClick={() => setAccountDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('pettyCash.addAccount')}
              </Button>
            </PermissionContent>
            <PermissionContent action="create" subject="PettyCash">
              <Button size="sm" onClick={() => setTransactionDialogOpen(true)}>
                <Receipt className="h-4 w-4 mr-2" />
                {t('pettyCash.addTransaction')}
              </Button>
            </PermissionContent>
            <Button variant="ghost" size="sm" onClick={() => { loadAccounts(); loadTransactions(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('pettyCash.refresh')}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-2" />
              {t('pettyCash.print')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" />
              {t('pettyCash.downloadPdf')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">{t('pettyCash.transactions')}</TabsTrigger>
            <TabsTrigger value="accounts">{t('pettyCash.accounts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('pettyCash.transactions')}</CardTitle>
                <CardDescription>{t('pettyCash.transactionsFilterDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="search">{t('pettyCash.search')}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        type="text"
                        placeholder={t('pettyCash.searchPlaceholder')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">{t('pettyCash.dateFrom')}</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">{t('pettyCash.dateTo')}</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">{t('pettyCash.account')}</Label>
                    <Select
                      value={filters.accountId || 'all'}
                      onValueChange={(v) => setFilters((f) => ({ ...f, accountId: v === 'all' ? '' : v }))}
                    >
                      <SelectTrigger id="account" className="h-10">
                        <SelectValue placeholder={t('pettyCash.allAccounts')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('pettyCash.allAccounts')}</SelectItem>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('pettyCash.type')}</Label>
                    <Select
                      value={filters.type || 'all'}
                      onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
                    >
                      <SelectTrigger id="type" className="h-10">
                        <SelectValue placeholder={t('pettyCash.type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('pettyCash.allTypes')}</SelectItem>
                        <SelectItem value="IN">{t('pettyCash.typeIn')}</SelectItem>
                        <SelectItem value="OUT">{t('pettyCash.typeOut')}</SelectItem>
                        <SelectItem value="EXPENSE">{t('pettyCash.typeExpense')}</SelectItem>
                        <SelectItem value="ADJUSTMENT">{t('pettyCash.typeAdjustment')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {loadingTransactions ? (
                  <p className="text-muted-foreground">{t('pettyCash.loading')}</p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <SortableHead column="date" label={t('pettyCash.date')} />
                          <SortableHead column="account" label={t('pettyCash.account')} />
                          <SortableHead column="type" label={t('pettyCash.type')} />
                          <SortableHead column="description" label={t('pettyCash.description')} />
                          <SortableHead column="category" label={t('pettyCash.category')} />
                          <SortableHead column="amount" label={t('pettyCash.inAmount')} className="text-right" />
                          <SortableHead column="amount" label={t('pettyCash.outAmount')} className="text-right" />
                          <SortableHead column="balance" label={t('pettyCash.balance')} className="text-right" />
                          <TableHead className="w-[100px]">{t('pettyCash.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsWithBalance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground">
                              {t('pettyCash.noTransactions')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactionsWithBalance.map((tx) => {
                            const isIn = tx.type === 'IN';
                            const amt = formatAmount(tx.amount ?? 0);
                            const bal = (tx as { runningBalance?: number }).runningBalance ?? 0;
                            return (
                              <TableRow key={tx.id} className={isIn ? 'bg-green-50 dark:bg-green-950/20' : ''}>
                                <TableCell>
                                  {tx.transactionDate ? format(new Date(tx.transactionDate + 'T12:00:00'), 'yyyy-MM-dd') : '—'}
                                </TableCell>
                                <TableCell>{tx.accountName ?? tx.accountId}</TableCell>
                                <TableCell>
                                  <span
                                    className={
                                      tx.type === 'IN' ? 'text-green-600 font-medium' : tx.type === 'OUT' || tx.type === 'EXPENSE' ? 'text-red-600 font-medium' : ''
                                    }
                                  >
                                    {tx.type === 'IN' ? t('pettyCash.typeIn') : tx.type === 'OUT' ? t('pettyCash.typeOut') : tx.type === 'EXPENSE' ? t('pettyCash.typeExpense') : t('pettyCash.typeAdjustment')}
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                                <TableCell>{tx.categoryName || '—'}</TableCell>
                                <TableCell className={`text-right font-medium ${isIn ? 'text-green-600' : ''}`}>
                                  {isIn ? amt : '—'}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${!isIn ? 'text-red-600' : ''}`}>
                                  {!isIn ? amt : '—'}
                                </TableCell>
                                <TableCell className={`text-right font-semibold ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatAmount(bal)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <PermissionContent action="update" subject="PettyCash">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEditTransaction(tx)}
                                        title={t('pettyCash.edit')}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </PermissionContent>
                                    <PermissionContent action="delete" subject="PettyCash">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => openDeleteTransactionDialog(tx)}
                                        title={t('pettyCash.delete')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </PermissionContent>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('pettyCash.accountsTitle')}</CardTitle>
                  <CardDescription>{t('pettyCash.accountsDesc')}</CardDescription>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  {t('pettyCash.showInactive')}
                </label>
              </CardHeader>
              <CardContent>
                {loadingAccounts ? (
                  <p className="text-muted-foreground">{t('pettyCash.loading')}</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((acc) => (
                      <Card key={acc.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{acc.name}</CardTitle>
                              {acc.description && (
                                <CardDescription className="mt-1">{acc.description}</CardDescription>
                              )}
                            </div>
                            {!acc.isActive && (
                              <span className="rounded bg-muted px-2 py-0.5 text-xs">{t('pettyCash.inactive')}</span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-2xl font-semibold">
                            {formatAmount(acc.currentBalance ?? acc.openingBalance ?? 0)} {acc.currency}
                          </p>
                          <div className="flex gap-2">
                            <PermissionContent action="update" subject="PettyCash">
                              <Button variant="outline" size="sm" onClick={() => handleEditAccount(acc)}>
                                <Pencil className="h-3 w-3 mr-1" />
                                {t('pettyCash.edit')}
                              </Button>
                            </PermissionContent>
                            {acc.isActive && (
                              <PermissionContent action="delete" subject="PettyCash">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAccount(acc.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {t('pettyCash.deactivate')}
                                </Button>
                              </PermissionContent>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {accounts.length === 0 && (
                      <p className="col-span-full text-center text-muted-foreground py-8">
                        {t('pettyCash.noAccounts')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PettyCashAccountDialog
          open={accountDialogOpen}
          onOpenChange={(open) => {
            if (!open) setEditingAccount(null);
            setAccountDialogOpen(open);
          }}
          account={editingAccount}
          onSuccess={handleAccountSaved}
        />
        <PettyCashTransactionDialog
          open={transactionDialogOpen}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
            setTransactionDialogOpen(open);
          }}
          accounts={accounts}
          onSuccess={handleTransactionSaved}
          transaction={editingTransaction}
        />

        <AlertDialog open={deleteTransactionDialogOpen} onOpenChange={setDeleteTransactionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pettyCash.deleteTransactionTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pettyCash.deleteTransactionConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingTransaction}>{t('common.actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  await handleDeleteTransaction();
                }}
                disabled={deletingTransaction}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingTransaction ? t('pettyCash.loading') : t('pettyCash.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
