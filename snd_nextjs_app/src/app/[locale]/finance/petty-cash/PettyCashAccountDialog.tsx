'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PettyCashAccount {
  id: number;
  name: string;
  description?: string | null;
  currency: string;
  openingBalance: number;
  isActive?: boolean;
}

interface PettyCashAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: PettyCashAccount | null;
  onSuccess: () => void;
}

export function PettyCashAccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: PettyCashAccountDialogProps) {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [openingBalance, setOpeningBalance] = useState('0');

  useEffect(() => {
    if (open) {
      if (account) {
        setName(account.name);
        setDescription(account.description || '');
        setCurrency(account.currency || 'SAR');
        setOpeningBalance(String(account.openingBalance ?? 0));
      } else {
        setName('');
        setDescription('');
        setCurrency('SAR');
        setOpeningBalance('0');
      }
    }
  }, [open, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('pettyCash.nameRequiredError'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
        openingBalance: parseFloat(openingBalance) || 0,
      };
      if (account) {
        await ApiService.updatePettyCashAccount(account.id, payload);
        toast.success(t('pettyCash.accountUpdated'));
      } else {
        await ApiService.createPettyCashAccount(payload);
        toast.success(t('pettyCash.accountCreated'));
      }
      onSuccess();
    } catch (err) {
      toast.error(account ? t('pettyCash.updateFailed') : t('pettyCash.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? t('pettyCash.editAccount') : t('pettyCash.newAccount')}</DialogTitle>
          <DialogDescription>
            {account ? t('pettyCash.editAccountDesc') : t('pettyCash.newAccountDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('pettyCash.nameRequired')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('pettyCash.namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t('pettyCash.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('pettyCash.optional')}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">{t('pettyCash.currency')}</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="SAR"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingBalance">{t('pettyCash.openingBalance')}</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('pettyCash.saving') : account ? t('pettyCash.update') : t('pettyCash.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
