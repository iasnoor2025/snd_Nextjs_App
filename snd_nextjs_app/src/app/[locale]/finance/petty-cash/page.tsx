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
import { PermissionContent } from '@/lib/rbac/rbac-components';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  Receipt,
  Pencil,
  Trash2,
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
    return transactions.map((tx) => {
      const balance = accountBalances.get(tx.accountId) ?? 0;
      const isIn = tx.type === 'IN';
      const delta = isIn ? tx.amount : -(tx.amount ?? 0);
      accountBalances.set(tx.accountId, balance - delta);
      return { ...tx, runningBalance: balance };
    });
  }, [transactions, accounts]);

  const handleAccountSaved = () => {
    setEditingAccount(null);
    setAccountDialogOpen(false);
    loadAccounts();
    loadTransactions();
  };

  const handleTransactionSaved = () => {
    setTransactionDialogOpen(false);
    loadTransactions();
    loadAccounts();
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
                          <TableHead>{t('pettyCash.date')}</TableHead>
                          <TableHead>{t('pettyCash.account')}</TableHead>
                          <TableHead>{t('pettyCash.type')}</TableHead>
                          <TableHead className="text-right">{t('pettyCash.inAmount')}</TableHead>
                          <TableHead className="text-right">{t('pettyCash.outAmount')}</TableHead>
                          <TableHead>{t('pettyCash.description')}</TableHead>
                          <TableHead>{t('pettyCash.category')}</TableHead>
                          <TableHead className="text-right">{t('pettyCash.balance')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionsWithBalance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                              {t('pettyCash.noTransactions')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactionsWithBalance.map((tx) => {
                            const isIn = tx.type === 'IN';
                            const amt = tx.amount?.toFixed(2) ?? '0.00';
                            const bal = (tx as { runningBalance?: number }).runningBalance ?? 0;
                            return (
                              <TableRow key={tx.id}>
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
                                <TableCell className={`text-right font-medium ${isIn ? 'text-green-600' : ''}`}>
                                  {isIn ? amt : '—'}
                                </TableCell>
                                <TableCell className={`text-right font-medium ${!isIn ? 'text-red-600' : ''}`}>
                                  {!isIn ? amt : '—'}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                                <TableCell>{tx.categoryName || '—'}</TableCell>
                                <TableCell className={`text-right font-semibold ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {bal.toFixed(2)}
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
                            {(acc.currentBalance ?? acc.openingBalance ?? 0).toFixed(2)} {acc.currency}
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
          onOpenChange={setTransactionDialogOpen}
          accounts={accounts}
          onSuccess={handleTransactionSaved}
        />
      </div>
    </ProtectedRoute>
  );
}
