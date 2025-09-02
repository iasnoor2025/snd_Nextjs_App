'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';


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
  website?: string | null;
  taxNumber?: string | null;
  vatNumber?: string | null;
  creditLimit?: number | null;
  creditLimitUsed?: number | null;
  creditLimitRemaining?: number | null;
  paymentTerms?: string | null;
  currentDue?: number | null;
  totalValue?: number | null;
  outstandingAmount?: number | null;
  currency?: string | null;
  customerType?: string | null;
  customerGroup?: string | null;
  territory?: string | null;
  salesPerson?: string | null;
  defaultPriceList?: string | null;
  defaultCurrency?: string | null;
  language?: string | null;
  notes?: string | null;
  remarks?: string | null;
}

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useI18n();
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
    website: '',
    taxNumber: '',
    vatNumber: '',
    creditLimit: 0,
    creditLimitUsed: 0,
    creditLimitRemaining: 0,
    paymentTerms: '',
    currentDue: 0,
    totalValue: 0,
    outstandingAmount: 0,
    currency: 'SAR',
    customerType: '',
    customerGroup: '',
    territory: '',
    salesPerson: '',
    defaultPriceList: '',
    defaultCurrency: 'SAR',
    language: 'en',
    notes: '',
    remarks: '',
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
              website: data.customer.website || '',
              taxNumber: data.customer.taxNumber || '',
              vatNumber: data.customer.vatNumber || '',
              creditLimit: data.customer.creditLimit || 0,
              creditLimitUsed: data.customer.creditLimitUsed || 0,
              creditLimitRemaining: data.customer.creditLimitRemaining || 0,
              paymentTerms: data.customer.paymentTerms || '',
              currentDue: data.customer.currentDue || 0,
              totalValue: data.customer.totalValue || 0,
              outstandingAmount: data.customer.outstandingAmount || 0,
              currency: data.customer.currency || 'SAR',
              customerType: data.customer.customerType || '',
              customerGroup: data.customer.customerGroup || '',
              territory: data.customer.territory || '',
              salesPerson: data.customer.salesPerson || '',
              defaultPriceList: data.customer.defaultPriceList || '',
              defaultCurrency: data.customer.defaultCurrency || 'SAR',
              language: data.customer.language || 'en',
              notes: data.customer.notes || '',
              remarks: data.customer.remarks || '',
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

                <div>
                  <Label htmlFor="website">{t('fields.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={e => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
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

            {/* ERPNext Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sections.businessInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="taxNumber">{t('fields.taxNumber')}</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={e => handleInputChange('taxNumber', e.target.value)}
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <Label htmlFor="vatNumber">{t('fields.vatNumber')}</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={e => handleInputChange('vatNumber', e.target.value)}
                    placeholder="VAT123456789"
                  />
                </div>

                <div>
                  <Label htmlFor="customerType">{t('fields.customerType')}</Label>
                  <Input
                    id="customerType"
                    value={formData.customerType}
                    onChange={e => handleInputChange('customerType', e.target.value)}
                    placeholder="Individual/Company"
                  />
                </div>

                <div>
                  <Label htmlFor="customerGroup">{t('fields.customerGroup')}</Label>
                  <Input
                    id="customerGroup"
                    value={formData.customerGroup}
                    onChange={e => handleInputChange('customerGroup', e.target.value)}
                    placeholder="Commercial/Residential"
                  />
                </div>

                <div>
                  <Label htmlFor="territory">{t('fields.territory')}</Label>
                  <Input
                    id="territory"
                    value={formData.territory}
                    onChange={e => handleInputChange('territory', e.target.value)}
                    placeholder="Saudi Arabia"
                  />
                </div>

                <div>
                  <Label htmlFor="salesPerson">{t('fields.salesPerson')}</Label>
                  <Input
                    id="salesPerson"
                    value={formData.salesPerson}
                    onChange={e => handleInputChange('salesPerson', e.target.value)}
                    placeholder="Sales Representative"
                  />
                </div>
              </div>
            </div>

            {/* ERPNext Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('sections.financialInfo')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="creditLimit">{t('fields.creditLimit')}</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={e => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentTerms">{t('fields.paymentTerms')}</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={e => handleInputChange('paymentTerms', e.target.value)}
                    placeholder="Net 30"
                  />
                </div>

                <div>
                  <Label htmlFor="currency">{t('fields.currency')}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={value => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.selectCurrency')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultPriceList">{t('fields.defaultPriceList')}</Label>
                  <Input
                    id="defaultPriceList"
                    value={formData.defaultPriceList}
                    onChange={e => handleInputChange('defaultPriceList', e.target.value)}
                    placeholder="Standard"
                  />
                </div>

                <div>
                  <Label htmlFor="language">{t('fields.language')}</Label>
                  <Select
                    value={formData.language}
                    onValueChange={value => handleInputChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('fields.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div>
                <Label htmlFor="remarks">{t('fields.remarks')}</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={e => handleInputChange('remarks', e.target.value)}
                  rows={3}
                  placeholder={t('fields.remarksPlaceholder')}
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
