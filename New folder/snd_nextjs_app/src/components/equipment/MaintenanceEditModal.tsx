'use client';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ApiService from '@/lib/api-service';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function MaintenanceEditModal({
  open,
  onOpenChange,
  id,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: number | null;
  onSaved?: () => void;
}) {
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation('maintenance');

  useEffect(() => {
    if (!open || !id) return;
    ApiService.getMaintenanceItem(id).then(res => setRecord(res.data));
  }, [open, id]);

  async function save() {
    if (!id || !record) return;
    setLoading(true);
    try {
      await ApiService.updateMaintenance(id, {
        status: record.status,
        title: record.title,
        description: record.description,
        scheduled_date: record.scheduled_date,
        due_date: record.due_date,
      });
      onSaved?.();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('page.editTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">{t('form.status')}</label>
              <Select
                value={record.status}
                onValueChange={v => setRecord({ ...record, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t('status.open')}</SelectItem>
                  <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('status.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">{t('form.type')}</label>
              <Select value={record.type} onValueChange={v => setRecord({ ...record, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">{t('type.repair')}</SelectItem>
                  <SelectItem value="scheduled">{t('type.scheduled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm">{t('form.title')}</label>
            <Input
              value={record.title || ''}
              onChange={e => setRecord({ ...record, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm">{t('form.description')}</label>
            <Textarea
              value={record.description || ''}
              onChange={e => setRecord({ ...record, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">{t('form.date')}</label>
              <DatePicker
                date={record.scheduled_date ? new Date(record.scheduled_date) : undefined}
                setDate={d => setRecord({ ...record, scheduled_date: d ? d.toISOString() : null })}
              />
            </div>
            <div>
              <label className="text-sm">{t('form.dueDate')}</label>
              <DatePicker
                date={record.due_date ? new Date(record.due_date) : undefined}
                setDate={d => setRecord({ ...record, due_date: d ? d.toISOString() : null })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={save} disabled={loading}>
              {loading ? t('actions.saving') : t('actions.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
