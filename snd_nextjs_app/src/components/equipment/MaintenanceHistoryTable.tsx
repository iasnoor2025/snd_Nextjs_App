"use client";
import { useEffect, useMemo, useState } from 'react';
import ApiService from '@/lib/api-service';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MaintenanceForm from './MaintenanceForm';
import MaintenanceEditModal from './MaintenanceEditModal';
import MaintenanceViewDialog from './MaintenanceViewDialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export default function MaintenanceHistoryTable() {
  const [records, setRecords] = useState<any[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<any[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ equipmentId?: number; mechanicId?: number; startDate?: Date; endDate?: Date; status?: string }>({});
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const { t } = useTranslation('maintenance');

  async function load() {
    const res = await ApiService.getMaintenance({
      equipmentId: filters.equipmentId,
      mechanicId: filters.mechanicId,
      status: filters.status,
      startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
    });
    setRecords(res.data || []);
  }

  useEffect(() => {
    ApiService.getEquipment().then((res) => setEquipmentOptions(res.data || []));
    ApiService.getEmployees({ all: true }).then((res) => setEmployeeOptions(res.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [JSON.stringify(filters)]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-end">
        <div className="md:w-56">
          <label className="text-sm">{t('filters.equipment')}</label>
          <Select onValueChange={(v) => setFilters((f) => ({ ...f, equipmentId: v ? Number(v) : undefined }))}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.all')} />
            </SelectTrigger>
            <SelectContent>
              {equipmentOptions.map((e: any) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:w-56">
          <label className="text-sm">{t('filters.mechanic')}</label>
          <Select onValueChange={(v) => setFilters((f) => ({ ...f, mechanicId: v ? Number(v) : undefined }))}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.all')} />
            </SelectTrigger>
            <SelectContent>
              {employeeOptions.map((e: any) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:w-40">
          <label className="text-sm">{t('filters.start')}</label>
          <DatePicker date={filters.startDate} setDate={(d) => setFilters((f) => ({ ...f, startDate: d || undefined }))} />
        </div>
        <div className="md:w-40">
          <label className="text-sm">{t('filters.end')}</label>
          <DatePicker date={filters.endDate} setDate={(d) => setFilters((f) => ({ ...f, endDate: d || undefined }))} />
        </div>
        <div className="md:w-40">
          <label className="text-sm">{t('filters.status')}</label>
          <Select onValueChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">{t('status.open')}</SelectItem>
              <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setFilters({})}>{t('filters.reset')}</Button>
          <Button onClick={() => setOpen(true)}>{t('filters.create')}</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.equipment')}</TableHead>
              <TableHead>{t('table.mechanic')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
              <TableHead>{t('table.items')}</TableHead>
              <TableHead>{t('table.totalCost')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.equipment?.name}</TableCell>
                <TableCell>{r.mechanic ? `${r.mechanic.first_name} ${r.mechanic.last_name}` : '-'}</TableCell>
                <TableCell>{r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{r.items?.length || 0}</TableCell>
                <TableCell>{Number(r.cost || 0).toFixed(2)}</TableCell>
                <TableCell>{t(`status.${r.status}`, { defaultValue: r.status })}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={r.status === 'completed'}
                      onClick={async () => {
                        await ApiService.updateMaintenance(r.id, { status: 'completed' });
                        load();
                      }}
                    >
                      {r.status === 'completed' ? t('actions.completed') : t('actions.markCompleted')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setActiveId(r.id); setEditOpen(true); }}>{t('actions.edit')}</Button>
                    <Button size="sm" variant="outline" onClick={() => { setActiveId(r.id); setViewOpen(true); }}>{t('actions.view')}</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeletingId(r.id);
                        setConfirmOpen(true);
                      }}
                    >
                      {t('actions.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MaintenanceForm open={open} onOpenChange={setOpen} onCreated={load} />
      <MaintenanceEditModal open={editOpen} onOpenChange={setEditOpen} id={activeId} onSaved={load} />
      <MaintenanceViewDialog open={viewOpen} onOpenChange={setViewOpen} id={activeId} />
      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete maintenance record?"
        description="This action cannot be undone. The maintenance record and its items will be permanently deleted."
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={async () => {
          if (!deletingId) return;
          setDeleting(true);
          try {
            await ApiService.deleteMaintenance(deletingId);
            setConfirmOpen(false);
            setDeletingId(null);
            load();
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => {
          setDeletingId(null);
        }}
      />
    </div>
  );
}


