'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PettyCashAccount {
  id: number;
  name: string;
  currency: string;
}

interface PettyCashTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: PettyCashAccount[];
  onSuccess: () => void;
}

interface ExpenseCategory {
  id: number;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

export function PettyCashTransactionDialog({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}: PettyCashTransactionDialogProps) {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [type, setType] = useState<'IN' | 'OUT' | 'EXPENSE' | 'ADJUSTMENT'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open) {
      setAccountId(accounts[0] ? String(accounts[0].id) : '');
      setTransactionDate(new Date());
      setType('EXPENSE');
      setAmount('');
      setDescription('');
      setReference('');
      setReceiptNumber('');
      setExpenseCategoryId('');
      setProjectId('');
      setEmployeeId('');
    }
  }, [open, accounts]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [catRes, projRes] = await Promise.all([
          ApiService.get('/expense-categories'),
          ApiService.get('/projects', { limit: 500 }),
        ]);
        if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
        if (projRes.success && projRes.data)
          setProjects(Array.isArray(projRes.data) ? projRes.data : (projRes.data as any)?.data ?? []);
      } catch (e) {
        console.error('Load dropdowns:', e);
      }
    })();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error(t('pettyCash.selectAccountError'));
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error(t('pettyCash.validAmountError'));
      return;
    }
    setLoading(true);
    try {
      await ApiService.createPettyCashTransaction({
        accountId: parseInt(accountId),
        transactionDate: format(transactionDate, 'yyyy-MM-dd'),
        type,
        amount: amt,
        description: description.trim() || undefined,
        reference: reference.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
        expenseCategoryId: expenseCategoryId ? parseInt(expenseCategoryId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        employeeId: employeeId ? parseInt(employeeId) : null,
      });
      onSuccess();
    } catch (err) {
      toast.error(t('pettyCash.recordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('pettyCash.newTransaction')}</DialogTitle>
          <DialogDescription>
            {t('pettyCash.newTransactionDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('pettyCash.accountLabel')}</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger>
                <SelectValue placeholder={t('pettyCash.selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('pettyCash.dateLabel')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(transactionDate, 'yyyy-MM-dd')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={transactionDate} onSelect={(d) => d && setTransactionDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t('pettyCash.typeLabel')}</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">{t('pettyCash.typeIn')}</SelectItem>
                  <SelectItem value="OUT">{t('pettyCash.typeOut')}</SelectItem>
                  <SelectItem value="EXPENSE">{t('pettyCash.typeExpense')}</SelectItem>
                  <SelectItem value="ADJUSTMENT">{t('pettyCash.typeAdjustment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('pettyCash.amountLabel')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('pettyCash.amountPlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('pettyCash.description')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('pettyCash.whatIsThisFor')}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('pettyCash.receiptReference')}</Label>
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder={t('pettyCash.receiptPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('pettyCash.expenseCategory')}</Label>
            <Select value={expenseCategoryId || '__none__'} onValueChange={(v) => setExpenseCategoryId(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('pettyCash.optional')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('pettyCash.none')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('pettyCash.projectOptional')}</Label>
              <Select value={projectId || '__none__'} onValueChange={(v) => setProjectId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('pettyCash.optional')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('pettyCash.none')}</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <EmployeeDropdown
                value={employeeId}
                onValueChange={setEmployeeId}
                label={t('pettyCash.employeeOptional')}
                placeholder={t('pettyCash.none')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('pettyCash.saving') : t('pettyCash.record')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
