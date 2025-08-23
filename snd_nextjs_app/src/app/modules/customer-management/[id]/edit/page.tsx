'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/use-i18n';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  isActive: boolean;
  contactPerson?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  companyName?: string | null;
  notes?: string | null;
}

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation('customer');
  const { isRTL } = useI18n();
  // Unwrap params Promise immediately - this must be called unconditionally
  const { id } = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    isActive: true,
    contactPerson: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    companyName: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/customers/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomer(data.customer);
            setFormData({
              name: data.customer.name || '',
              email: data.customer.email || '',
              phone: data.customer.phone || '',
              status: data.customer.status || 'active',
              isActive: data.customer.isActive !== false,
              contactPerson: data.customer.contactPerson || '',
              address: data.customer.address || '',
              city: data.customer.city || '',
              state: data.customer.state || '',
              postalCode: data.customer.postalCode || '',
              country: data.customer.country || '',
              companyName: data.customer.companyName || '',
              notes: data.customer.notes || '',
            });
          } else {
            toast.error(t('messages.loadingError'));
            router.push('/modules/customer-management');
          }
        } else {
          toast.error(t('messages.customerNotFound'));
          router.push('/modules/customer-management');
        }
      } catch (error) {
        
        toast.error(t('messages.loadingError'));
        router.push('/modules/customer-management');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, router]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/customers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(id),
          ...formData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(t('messages.saveSuccess'));
          router.push(`/modules/customer-management/${id}`);
        } else {
          toast.error(result.message || t('messages.saveError'));
        }
      } else {
        const error = await response.json();
        toast.error(error.message || t('messages.saveError'));
      }
    } catch (error) {
      
      toast.error(t('messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">{t('messages.customerNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/modules/customer-management/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('actions.back')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('actions.editCustomer')}</h1>
          <p className="text-muted-foreground">{t('fields.basicInfo')}</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('fields.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('fields.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('fields.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">{t('fields.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">{t('fields.companyName')}</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={e => handleInputChange('companyName', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPerson">{t('fields.contactPerson')}</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={e => handleInputChange('contactPerson', e.target.value)}
                  />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">{t('fields.address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">{t('fields.city')}</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">{t('fields.state')}</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={e => handleInputChange('state', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">{t('fields.postalCode')}</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={e => handleInputChange('postalCode', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">{t('fields.country')}</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={e => handleInputChange('country', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Notes */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="status">{t('fields.status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                                         <SelectTrigger>
                       <SelectValue placeholder={t('fields.selectStatus')} />
                     </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('status.active')}</SelectItem>
                      <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
                      <SelectItem value="pending">{t('status.pending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">{t('fields.isActive')}</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t('fields.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={4}
                  placeholder={t('fields.notesPlaceholder')}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/modules/customer-management/${id}`)}
                disabled={saving}
              >
                {t('actions.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('messages.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('actions.save')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
