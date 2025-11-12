'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

export default function EditCompanyPage() {
  const { t } = useI18n();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    // Saudi Law Required Documents
    commercial_registration: '',
    commercial_registration_expiry: '',
    tax_registration: '',
    tax_registration_expiry: '',
    municipality_license: '',
    municipality_license_expiry: '',
    chamber_of_commerce: '',
    chamber_of_commerce_expiry: '',
    labor_office_license: '',
    labor_office_license_expiry: '',
    gosi_registration: '',
    gosi_registration_expiry: '',
    saudi_standards_license: '',
    saudi_standards_license_expiry: '',
    environmental_license: '',
    environmental_license_expiry: '',
    // Additional Saudi Law Documents (optional)
    zakat_registration: '',
    zakat_registration_expiry: '',
    saudi_arabia_visa: '',
    saudi_arabia_visa_expiry: '',
    investment_license: '',
    investment_license_expiry: '',
    import_export_license: '',
    import_export_license_expiry: '',
    pharmaceutical_license: '',
    pharmaceutical_license_expiry: '',
    food_safety_license: '',
    food_safety_license_expiry: '',
    construction_license: '',
    construction_license_expiry: '',
    transportation_license: '',
    transportation_license_expiry: '',
    banking_license: '',
    banking_license_expiry: '',
    insurance_license: '',
    insurance_license_expiry: '',
    telecom_license: '',
    telecom_license_expiry: '',
    energy_license: '',
    energy_license_expiry: '',
    mining_license: '',
    mining_license_expiry: '',
    tourism_license: '',
    tourism_license_expiry: '',
    education_license: '',
    education_license_expiry: '',
    healthcare_license: '',
    healthcare_license_expiry: '',
    real_estate_license: '',
    real_estate_license_expiry: '',
    legal_services_license: '',
    legal_services_license_expiry: '',
    accounting_license: '',
    accounting_license_expiry: '',
    advertising_license: '',
    advertising_license_expiry: '',
    media_license: '',
    media_license_expiry: '',
    security_license: '',
    security_license_expiry: '',
    cleaning_license: '',
    cleaning_license_expiry: '',
    catering_license: '',
    catering_license_expiry: '',
    warehouse_license: '',
    warehouse_license_expiry: '',
    logistics_license: '',
    logistics_license_expiry: '',
    maintenance_license: '',
    maintenance_license_expiry: '',
    training_license: '',
    training_license_expiry: '',
    consulting_license: '',
    consulting_license_expiry: '',
    research_license: '',
    research_license_expiry: '',
    technology_license: '',
    technology_license_expiry: '',
    innovation_license: '',
    innovation_license_expiry: '',
    // Additional Company Information
    website: '',
    contact_person: '',
    contact_person_phone: '',
    contact_person_email: '',
    company_type: '',
    industry: '',
    employee_count: '',
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/companies/${id}`);
        const result = await response.json();

        if (result.success) {
          const company = result.data;
          setFormData({
            name: company.name,
            address: company.address || '',
            email: company.email || '',
            phone: company.phone || '',
            // Saudi Law Required Documents
            commercial_registration: company.commercial_registration || '',
            commercial_registration_expiry: company.commercial_registration_expiry || '',
            tax_registration: company.tax_registration || '',
            tax_registration_expiry: company.tax_registration_expiry || '',
            municipality_license: company.municipality_license || '',
            municipality_license_expiry: company.municipality_license_expiry || '',
            chamber_of_commerce: company.chamber_of_commerce || '',
            chamber_of_commerce_expiry: company.chamber_of_commerce_expiry || '',
            labor_office_license: company.labor_office_license || '',
            labor_office_license_expiry: company.labor_office_license_expiry || '',
            gosi_registration: company.gosi_registration || '',
            gosi_registration_expiry: company.gosi_registration_expiry || '',
            saudi_standards_license: company.saudi_standards_license || '',
            saudi_standards_license_expiry: company.saudi_standards_license_expiry || '',
            environmental_license: company.environmental_license || '',
            environmental_license_expiry: company.environmental_license_expiry || '',
            // Additional Saudi Law Documents (optional)
            zakat_registration: company.zakat_registration || '',
            zakat_registration_expiry: company.zakat_registration_expiry || '',
            saudi_arabia_visa: company.saudi_arabia_visa || '',
            saudi_arabia_visa_expiry: company.saudi_arabia_visa_expiry || '',
            investment_license: company.investment_license || '',
            investment_license_expiry: company.investment_license_expiry || '',
            import_export_license: company.import_export_license || '',
            import_export_license_expiry: company.import_export_license_expiry || '',
            pharmaceutical_license: company.pharmaceutical_license || '',
            pharmaceutical_license_expiry: company.pharmaceutical_license_expiry || '',
            food_safety_license: company.food_safety_license || '',
            food_safety_license_expiry: company.food_safety_license_expiry || '',
            construction_license: company.construction_license || '',
            construction_license_expiry: company.construction_license_expiry || '',
            transportation_license: company.transportation_license || '',
            transportation_license_expiry: company.transportation_license_expiry || '',
            banking_license: company.banking_license || '',
            banking_license_expiry: company.banking_license_expiry || '',
            insurance_license: company.insurance_license || '',
            insurance_license_expiry: company.insurance_license_expiry || '',
            telecom_license: company.telecom_license || '',
            telecom_license_expiry: company.telecom_license_expiry || '',
            energy_license: company.energy_license || '',
            energy_license_expiry: company.energy_license_expiry || '',
            mining_license: company.mining_license || '',
            mining_license_expiry: company.mining_license_expiry || '',
            tourism_license: company.tourism_license || '',
            tourism_license_expiry: company.tourism_license_expiry || '',
            education_license: company.education_license || '',
            education_license_expiry: company.education_license_expiry || '',
            healthcare_license: company.healthcare_license || '',
            healthcare_license_expiry: company.healthcare_license_expiry || '',
            real_estate_license: company.real_estate_license || '',
            real_estate_license_expiry: company.real_estate_license_expiry || '',
            legal_services_license: company.legal_services_license || '',
            legal_services_license_expiry: company.legal_services_license_expiry || '',
            accounting_license: company.accounting_license || '',
            accounting_license_expiry: company.accounting_license_expiry || '',
            advertising_license: company.advertising_license || '',
            advertising_license_expiry: company.advertising_license_expiry || '',
            media_license: company.media_license || '',
            media_license_expiry: company.media_license_expiry || '',
            security_license: company.security_license || '',
            security_license_expiry: company.security_license_expiry || '',
            cleaning_license: company.cleaning_license || '',
            cleaning_license_expiry: company.cleaning_license_expiry || '',
            catering_license: company.catering_license || '',
            catering_license_expiry: company.catering_license_expiry || '',
            warehouse_license: company.warehouse_license || '',
            warehouse_license_expiry: company.warehouse_license_expiry || '',
            logistics_license: company.logistics_license || '',
            logistics_license_expiry: company.logistics_license_expiry || '',
            maintenance_license: company.maintenance_license || '',
            maintenance_license_expiry: company.maintenance_license_expiry || '',
            training_license: company.training_license || '',
            training_license_expiry: company.training_license_expiry || '',
            consulting_license: company.consulting_license || '',
            consulting_license_expiry: company.consulting_license_expiry || '',
            research_license: company.research_license || '',
            research_license_expiry: company.research_license_expiry || '',
            technology_license: company.technology_license || '',
            technology_license_expiry: company.technology_license_expiry || '',
            innovation_license: company.innovation_license || '',
            innovation_license_expiry: company.innovation_license_expiry || '',
            // Additional Company Information
            website: company.website || '',
            contact_person: company.contact_person || '',
            contact_person_phone: company.contact_person_phone || '',
            contact_person_email: company.contact_person_email || '',
            company_type: company.company_type || '',
            industry: company.industry || '',
            employee_count: company.employee_count?.toString() || '',
          });
        } else {
          toast.error(result.message || t('company.messages.loadingError'));
          router.push(`/${locale}/company-management`);
        }
      } catch (error) {
        
        toast.error(t('company.messages.loadingError'));
        router.push(`/${locale}/company-management`);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('company.validation.nameRequired'));
      return;
    }

    if (!id) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('company.messages.saveSuccess'));
        router.push(`/${locale}/company-management/${id}`);
      } else {
        toast.error(result.message || t('company.messages.saveError'));
      }
    } catch (error) {
      
      toast.error(t('company.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle for extra optional Saudi law documents
  const [showExtraDocs, setShowExtraDocs] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('company.messages.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/company-management/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('company.actions.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('company.actions.edit')}</h1>
          <p className="text-muted-foreground">{t('company.messages.updateInfo')}</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('company.fields.basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('company.fields.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t('company.fields.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="website">{t('company.fields.website')}</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={e => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="company_type">{t('company.fields.companyType')}</Label>
                  <Input
                    id="company_type"
                    value={formData.company_type}
                    onChange={e => handleInputChange('company_type', e.target.value)}
                    placeholder="LLC, Joint Stock, etc."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">{t('company.fields.phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="address">{t('company.fields.address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={e => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="industry">{t('company.fields.industry')}</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={e => handleInputChange('industry', e.target.value)}
                    placeholder="Construction, Manufacturing, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="employee_count">{t('company.fields.employeeCount')}</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    value={formData.employee_count}
                    onChange={e => handleInputChange('employee_count', e.target.value)}
                    placeholder="Number of employees"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="contact_person">{t('company.fields.contactPerson')}</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={e => handleInputChange('contact_person', e.target.value)}
                  placeholder="Primary contact name"
                />
              </div>

              <div>
                <Label htmlFor="contact_person_phone">{t('company.fields.contactPersonPhone')}</Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={e => handleInputChange('contact_person_phone', e.target.value)}
                  placeholder="Contact phone number"
                />
              </div>

              <div>
                <Label htmlFor="contact_person_email">{t('company.fields.contactPersonEmail')}</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={e => handleInputChange('contact_person_email', e.target.value)}
                  placeholder="Contact email address"
                />
              </div>
            </div>

            {/* Saudi Law Required Documents */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-red-600 border-b border-red-200 pb-2">
                {t('company.documents.title')}
              </h3>
              
              {/* Commercial Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="commercial_registration">{t('company.documents.commercialRegistration')} *</Label>
                  <Input
                    id="commercial_registration"
                    value={formData.commercial_registration}
                    onChange={e => handleInputChange('commercial_registration', e.target.value)}
                    placeholder="Commercial registration number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="commercial_registration_expiry">{t('company.documents.commercialRegistrationExpiry')}</Label>
                  <Input
                    id="commercial_registration_expiry"
                    type="date"
                    value={formData.commercial_registration_expiry}
                    onChange={e => handleInputChange('commercial_registration_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Tax Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="tax_registration">{t('company.documents.taxRegistration')} *</Label>
                  <Input
                    id="tax_registration"
                    value={formData.tax_registration}
                    onChange={e => handleInputChange('tax_registration', e.target.value)}
                    placeholder="Tax registration number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tax_registration_expiry">{t('company.documents.taxRegistrationExpiry')}</Label>
                  <Input
                    id="tax_registration_expiry"
                    type="date"
                    value={formData.tax_registration_expiry}
                    onChange={e => handleInputChange('tax_registration_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Municipality License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="municipality_license">{t('company.documents.municipalityLicense')}</Label>
                  <Input
                    id="municipality_license"
                    value={formData.municipality_license}
                    onChange={e => handleInputChange('municipality_license', e.target.value)}
                    placeholder="Municipality license number"
                  />
                </div>
                <div>
                  <Label htmlFor="municipality_license_expiry">{t('company.documents.municipalityLicenseExpiry')}</Label>
                  <Input
                    id="municipality_license_expiry"
                    type="date"
                    value={formData.municipality_license_expiry}
                    onChange={e => handleInputChange('municipality_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Chamber of Commerce */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="chamber_of_commerce">{t('company.documents.chamberOfCommerce')}</Label>
                  <Input
                    id="chamber_of_commerce"
                    value={formData.chamber_of_commerce}
                    onChange={e => handleInputChange('chamber_of_commerce', e.target.value)}
                    placeholder="Chamber of commerce registration"
                  />
                </div>
                <div>
                  <Label htmlFor="chamber_of_commerce_expiry">{t('company.documents.chamberOfCommerceExpiry')}</Label>
                  <Input
                    id="chamber_of_commerce_expiry"
                    type="date"
                    value={formData.chamber_of_commerce_expiry}
                    onChange={e => handleInputChange('chamber_of_commerce_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Labor Office License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="labor_office_license">{t('company.documents.laborOfficeLicense')}</Label>
                  <Input
                    id="labor_office_license"
                    value={formData.labor_office_license}
                    onChange={e => handleInputChange('labor_office_license', e.target.value)}
                    placeholder="Labor office license number"
                  />
                </div>
                <div>
                  <Label htmlFor="labor_office_license_expiry">{t('company.documents.laborOfficeLicenseExpiry')}</Label>
                  <Input
                    id="labor_office_license_expiry"
                    type="date"
                    value={formData.labor_office_license_expiry}
                    onChange={e => handleInputChange('labor_office_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* GOSI Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="gosi_registration">{t('company.documents.gosiRegistration')}</Label>
                  <Input
                    id="gosi_registration"
                    value={formData.gosi_registration}
                    onChange={e => handleInputChange('gosi_registration', e.target.value)}
                    placeholder="GOSI registration number"
                  />
                </div>
                <div>
                  <Label htmlFor="gosi_registration_expiry">{t('company.documents.gosiRegistrationExpiry')}</Label>
                  <Input
                    id="gosi_registration_expiry"
                    type="date"
                    value={formData.gosi_registration_expiry}
                    onChange={e => handleInputChange('gosi_registration_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Saudi Standards License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="saudi_standards_license">{t('company.documents.saudiStandardsLicense')}</Label>
                  <Input
                    id="saudi_standards_license"
                    value={formData.saudi_standards_license}
                    onChange={e => handleInputChange('saudi_standards_license', e.target.value)}
                    placeholder="Saudi standards license number"
                  />
                </div>
                <div>
                  <Label htmlFor="saudi_standards_license_expiry">{t('company.documents.saudiStandardsLicenseExpiry')}</Label>
                  <Input
                    id="saudi_standards_license_expiry"
                    type="date"
                    value={formData.saudi_standards_license_expiry}
                    onChange={e => handleInputChange('saudi_standards_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Environmental License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="environmental_license">{t('company.documents.environmentalLicense')}</Label>
                  <Input
                    id="environmental_license"
                    value={formData.environmental_license}
                    onChange={e => handleInputChange('environmental_license', e.target.value)}
                    placeholder="Environmental license number"
                  />
                </div>
                <div>
                  <Label htmlFor="environmental_license_expiry">{t('company.documents.environmentalLicenseExpiry')}</Label>
                  <Input
                    id="environmental_license_expiry"
                    type="date"
                    value={formData.environmental_license_expiry}
                    onChange={e => handleInputChange('environmental_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Toggle extra optional fields */}
              <div className="pt-2">
                <Button type="button" variant="outline" onClick={() => setShowExtraDocs(v => !v)}>
                  {showExtraDocs ? 'Hide Additional Saudi Law Documents' : 'Add More Saudi Law Documents'}
                </Button>
              </div>

              {showExtraDocs && (
                <div className="space-y-6 mt-4">
                  {/* Render many optional pairs in a compact grid */}
                  {[
                    ['zakat_registration','zakat_registration_expiry','Zakat Registration'],
                    ['saudi_arabia_visa','saudi_arabia_visa_expiry','Saudi Arabia Visa'],
                    ['investment_license','investment_license_expiry','Investment License'],
                    ['import_export_license','import_export_license_expiry','Import/Export License'],
                    ['pharmaceutical_license','pharmaceutical_license_expiry','Pharmaceutical License'],
                    ['food_safety_license','food_safety_license_expiry','Food Safety License'],
                    ['construction_license','construction_license_expiry','Construction License'],
                    ['transportation_license','transportation_license_expiry','Transportation License'],
                    ['banking_license','banking_license_expiry','Banking License'],
                    ['insurance_license','insurance_license_expiry','Insurance License'],
                    ['telecom_license','telecom_license_expiry','Telecom License'],
                    ['energy_license','energy_license_expiry','Energy License'],
                    ['mining_license','mining_license_expiry','Mining License'],
                    ['tourism_license','tourism_license_expiry','Tourism License'],
                    ['education_license','education_license_expiry','Education License'],
                    ['healthcare_license','healthcare_license_expiry','Healthcare License'],
                    ['real_estate_license','real_estate_license_expiry','Real Estate License'],
                    ['legal_services_license','legal_services_license_expiry','Legal Services License'],
                    ['accounting_license','accounting_license_expiry','Accounting License'],
                    ['advertising_license','advertising_license_expiry','Advertising License'],
                    ['media_license','media_license_expiry','Media License'],
                    ['security_license','security_license_expiry','Security License'],
                    ['cleaning_license','cleaning_license_expiry','Cleaning License'],
                    ['catering_license','catering_license_expiry','Catering License'],
                    ['warehouse_license','warehouse_license_expiry','Warehouse License'],
                    ['logistics_license','logistics_license_expiry','Logistics License'],
                    ['maintenance_license','maintenance_license_expiry','Maintenance License'],
                    ['training_license','training_license_expiry','Training License'],
                    ['consulting_license','consulting_license_expiry','Consulting License'],
                    ['research_license','research_license_expiry','Research License'],
                    ['technology_license','technology_license_expiry','Technology License'],
                    ['innovation_license','innovation_license_expiry','Innovation License'],
                  ].map(([key, exp, label]) => (
                    <div key={key as string} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor={key as string}>{label as string}</Label>
                        <Input
                          id={key as string}
                          value={(formData as any)[key as string] as string}
                          onChange={e => handleInputChange(key as string, e.target.value)}
                          placeholder={`${label} number`}
                        />
                      </div>
                      <div>
                        <Label htmlFor={exp as string}>{label as string} Expiry</Label>
                        <Input
                          id={exp as string}
                          type="date"
                          value={(formData as any)[exp as string] as string}
                          onChange={e => handleInputChange(exp as string, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Link href={`/${locale}/company-management/${id}`}>
                <Button type="button" variant="outline" disabled={saving}>
                  {t('company.actions.cancel')}
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    {t('company.messages.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('company.actions.save')}
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
