"use client";
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ApiService } from '@/lib/api-service';

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

  useEffect(() => {
    if (!open || !id) return;
    ApiService.getMaintenanceItem(id).then((res) => setRecord(res.data));
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
          <DialogTitle>Edit Maintenance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Status</label>
              <Select value={record.status} onValueChange={(v) => setRecord({ ...record, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Type</label>
              <Select value={record.type} onValueChange={(v) => setRecord({ ...record, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrective">Repair</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm">Title</label>
            <Input value={record.title || ''} onChange={(e) => setRecord({ ...record, title: e.target.value })} />
          </div>
          <div>
            <label className="text-sm">Description</label>
            <Textarea value={record.description || ''} onChange={(e) => setRecord({ ...record, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm">Date</label>
              <DatePicker
                date={record.scheduled_date ? new Date(record.scheduled_date) : undefined}
                setDate={(d) => setRecord({ ...record, scheduled_date: d ? d.toISOString() : null })}
              />
            </div>
            <div>
              <label className="text-sm">Due</label>
              <DatePicker
                date={record.due_date ? new Date(record.due_date) : undefined}
                setDate={(d) => setRecord({ ...record, due_date: d ? d.toISOString() : null })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


