'use client';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'Required'),
  quantity: z.number().min(0.01, 'Invalid'),
  unit_cost: z.number().min(0, 'Invalid'),
  unit: z.string().optional(),
  description: z.string().optional(),
});

const formSchema = z.object({
  equipment_id: z.number().min(1, 'Equipment is required'),
  assigned_to_employee_id: z.number().optional(),
  type: z.enum(['corrective', 'scheduled']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduled_date: z.date().optional(),
  due_date: z.date().optional(),
  status: z.enum(['open', 'in_progress', 'completed']),
  items: z.array(itemSchema).min(0),
});

export type MaintenanceFormValues = z.infer<typeof formSchema>;

interface Option {
  value: number;
  label: string;
}

export function MaintenanceForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const [equipmentOptions, setEquipmentOptions] = useState<Option[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'corrective',
      status: 'open',
      items: [],
      title: 'Maintenance',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    name: 'items',
    control: form.control,
  });
  const { t } = useTranslation('maintenance');

  const totalCost = useMemo(() => {
    const items = form.getValues('items') || [];
    return items.reduce((sum, it) => sum + Number((it.quantity || 0) * (it.unit_cost || 0)), 0);
  }, [form.watch('items')]);

  useEffect(() => {
    ApiService.getEquipment().then(res => {
      const opts = (res.data || []).map((e: any) => ({ value: e.id, label: e.name }));
      setEquipmentOptions(opts);
    });
    ApiService.getEmployees({ all: true }).then(res => {
      const opts = (res.data || []).map((e: any) => ({
        value: e.id,
        label: `${e.first_name} ${e.last_name}`,
      }));
      setEmployeeOptions(opts);
    });
  }, []);

  async function onSubmit(values: MaintenanceFormValues) {
    const payload = {
      ...values,
      scheduled_date: values.scheduled_date ? values.scheduled_date.toISOString() : undefined,
      due_date: values.due_date ? values.due_date.toISOString() : undefined,
    };
    await ApiService.createMaintenance(payload);
    onCreated?.();
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('page.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="equipment_id"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.equipment')}</FormLabel>
                  <Select onValueChange={v => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectEquipment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentOptions.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to_employee_id"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.mechanic')}</FormLabel>
                  <Select onValueChange={v => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectMechanic')} />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrective">{t('type.repair')}</SelectItem>
                      <SelectItem value="scheduled">{t('type.scheduled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.status')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('status.open')}</SelectItem>
                      <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>{t('form.title')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('form.maintenanceTitlePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>{t('form.description')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('form.description')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.date')}</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>{t('form.dueDate')}</FormLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{t('form.itemsUsed')}</h4>
              <Button
                type="button"
                variant="secondary"
                onClick={() => append({ name: '', quantity: 1 as number, unit_cost: 0 as number })}
              >
                {t('form.addItem')}
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => {
                const quantity = Number(form.watch(`items.${idx}.quantity`) || 0);
                const unitCost = Number(form.watch(`items.${idx}.unit_cost`) || 0);
                const itemTotal = quantity * unitCost;
                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${idx}.name` as const}
                      render={({ field }: any) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>{t('form.item')}</FormLabel>
                          <FormControl>
                            <Input placeholder="Item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${idx}.quantity` as const}
                      render={({ field }: any) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{t('form.qty')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${idx}.unit_cost` as const}
                      render={({ field }: any) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{t('form.unitCost')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-2">
                      <FormLabel>{t('form.total')}</FormLabel>
                      <div className="h-10 flex items-center rounded-md border px-3 text-sm">
                        {itemTotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="md:col-span-3 flex items-end gap-2">
                      <Button type="button" variant="outline" onClick={() => remove(idx)}>
                        {t('actions.delete')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end text-sm font-medium">
              Total Cost: {totalCost.toFixed(2)}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">{t('actions.create')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MaintenanceForm;
