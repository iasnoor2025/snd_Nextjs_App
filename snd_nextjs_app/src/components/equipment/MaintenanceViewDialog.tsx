"use client";
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiService } from '@/lib/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export default function MaintenanceViewDialog({
  open,
  onOpenChange,
  id,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  id: number | null;
}) {
  const [record, setRecord] = useState<any | null>(null);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit_cost: 0, unit: '', description: '' });
  const canAdd = useMemo(() => record && record.status !== 'completed', [record]);
  const { t } = useTranslation('maintenance');

  useEffect(() => {
    if (!open || !id) return;
    ApiService.getMaintenanceItem(id).then((res) => setRecord(res.data));
  }, [open, id]);

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('view.detailsTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">{t('view.equipment')}:</span> {record.equipment?.name}</div>
          <div><span className="font-medium">{t('view.mechanic')}:</span> {record.mechanic ? `${record.mechanic.first_name} ${record.mechanic.last_name}` : '-'}</div>
          <div><span className="font-medium">{t('view.type')}:</span> {record.type}</div>
          <div><span className="font-medium">{t('view.status')}:</span> {record.status}</div>
          <div><span className="font-medium">{t('view.date')}:</span> {record.scheduled_date ? new Date(record.scheduled_date).toLocaleString() : '-'}</div>
          <div><span className="font-medium">{t('view.due')}:</span> {record.due_date ? new Date(record.due_date).toLocaleDateString() : '-'}</div>
          <div><span className="font-medium">{t('view.title')}:</span> {record.title}</div>
          <div><span className="font-medium">{t('view.description')}:</span> {record.description || '-'}</div>
          <div><span className="font-medium">{t('view.itemsUsed')}:</span></div>
          <ul className="list-disc pl-5">
            {(record.items || []).map((it: any) => (
              <li key={it.id}>{it.name} — {Number(it.quantity).toFixed(2)} x {Number(it.unit_cost).toFixed(2)} = {Number(it.total_cost).toFixed(2)}</li>
            ))}
          </ul>
          <div className="font-medium">{t('view.totalCost')}: {Number(record.cost || 0).toFixed(2)}</div>

          {canAdd && (
            <div className="mt-4 space-y-2">
              <div className="font-medium">{t('actions.addItem')}</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-3">
                  <Input placeholder={t('form.item')} value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Input type="number" step="0.01" placeholder={t('form.qty')} value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <Input type="number" step="0.01" placeholder={t('form.unitCost')} value={newItem.unit_cost}
                    onChange={(e) => setNewItem({ ...newItem, unit_cost: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2"><Input placeholder={t('form.unit')} value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} /></div>
                <div className="md:col-span-3"><Input placeholder={t('form.description')} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} /></div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (!id) return;
                    const payload = { ...newItem } as any;
                    await ApiService.post(`/maintenance/${id}/items`, payload, { toastMessage: 'Item added', errorMessage: 'Failed to add item' });
                    const refreshed = await ApiService.getMaintenanceItem(id);
                    setRecord(refreshed.data);
                    setNewItem({ name: '', quantity: 1, unit_cost: 0, unit: '', description: '' });
                  }}
                >
                  {t('actions.addItem')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


