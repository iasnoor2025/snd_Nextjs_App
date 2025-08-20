'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CreateCompanyPage() {
  const router = useRouter();
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
    // Additional Saudi Law Documents
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!formData.commercial_registration.trim()) {
      toast.error('Commercial registration number is required by Saudi law');
      return;
    }

    if (!formData.tax_registration.trim()) {
      toast.error('Tax registration number is required by Saudi law');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Company created successfully');
        router.push('/modules/company-management');
      } else {
        toast.error(result.message || 'Failed to create company');
      }
    } catch (error) {
      
      toast.error('Failed to create company');
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

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/modules/company-management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Create New Company</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Company Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={e => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_type">Company Type</Label>
                <Input
                  id="company_type"
                  value={formData.company_type}
                  onChange={e => handleInputChange('company_type', e.target.value)}
                  placeholder="LLC, Joint Stock, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={e => handleInputChange('industry', e.target.value)}
                  placeholder="Construction, Manufacturing, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input
                  id="employee_count"
                  type="number"
                  value={formData.employee_count}
                  onChange={e => handleInputChange('employee_count', e.target.value)}
                  placeholder="Number of employees"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                placeholder="Enter company address"
                rows={3}
              />
            </div>

            {/* Contact Person Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={e => handleInputChange('contact_person', e.target.value)}
                  placeholder="Primary contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_phone">Contact Phone</Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={e => handleInputChange('contact_person_phone', e.target.value)}
                  placeholder="Contact phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_person_email">Contact Email</Label>
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
                Saudi Law Required Documents
              </h3>
              
              {/* Commercial Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="commercial_registration">Commercial Registration Number *</Label>
                  <Input
                    id="commercial_registration"
                    value={formData.commercial_registration}
                    onChange={e => handleInputChange('commercial_registration', e.target.value)}
                    placeholder="Commercial registration number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercial_registration_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="tax_registration">Tax Registration Number *</Label>
                  <Input
                    id="tax_registration"
                    value={formData.tax_registration}
                    onChange={e => handleInputChange('tax_registration', e.target.value)}
                    placeholder="Tax registration number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_registration_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="municipality_license">Municipality License Number</Label>
                  <Input
                    id="municipality_license"
                    value={formData.municipality_license}
                    onChange={e => handleInputChange('municipality_license', e.target.value)}
                    placeholder="Municipality license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality_license_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="chamber_of_commerce">Chamber of Commerce Registration</Label>
                  <Input
                    id="chamber_of_commerce"
                    value={formData.chamber_of_commerce}
                    onChange={e => handleInputChange('chamber_of_commerce', e.target.value)}
                    placeholder="Chamber of commerce registration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chamber_of_commerce_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="labor_office_license">Labor Office License</Label>
                  <Input
                    id="labor_office_license"
                    value={formData.labor_office_license}
                    onChange={e => handleInputChange('labor_office_license', e.target.value)}
                    placeholder="Labor office license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labor_office_license_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="gosi_registration">GOSI Registration Number</Label>
                  <Input
                    id="gosi_registration"
                    value={formData.gosi_registration}
                    onChange={e => handleInputChange('gosi_registration', e.target.value)}
                    placeholder="GOSI registration number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gosi_registration_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="saudi_standards_license">Saudi Standards License</Label>
                  <Input
                    id="saudi_standards_license"
                    value={formData.saudi_standards_license}
                    onChange={e => handleInputChange('saudi_standards_license', e.target.value)}
                    placeholder="Saudi standards license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saudi_standards_license_expiry">Expiry Date</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="environmental_license">Environmental License</Label>
                  <Input
                    id="environmental_license"
                    value={formData.environmental_license}
                    onChange={e => handleInputChange('environmental_license', e.target.value)}
                    placeholder="Environmental license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environmental_license_expiry">Expiry Date</Label>
                  <Input
                    id="environmental_license_expiry"
                    type="date"
                    value={formData.environmental_license_expiry}
                    onChange={e => handleInputChange('environmental_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Zakat Registration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="zakat_registration">Zakat Registration</Label>
                  <Input
                    id="zakat_registration"
                    value={formData.zakat_registration}
                    onChange={e => handleInputChange('zakat_registration', e.target.value)}
                    placeholder="Zakat registration number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zakat_registration_expiry">Expiry Date</Label>
                  <Input
                    id="zakat_registration_expiry"
                    type="date"
                    value={formData.zakat_registration_expiry}
                    onChange={e => handleInputChange('zakat_registration_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Saudi Arabia Visa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="saudi_arabia_visa">Saudi Arabia Visa</Label>
                  <Input
                    id="saudi_arabia_visa"
                    value={formData.saudi_arabia_visa}
                    onChange={e => handleInputChange('saudi_arabia_visa', e.target.value)}
                    placeholder="Business visa number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saudi_arabia_visa_expiry">Expiry Date</Label>
                  <Input
                    id="saudi_arabia_visa_expiry"
                    type="date"
                    value={formData.saudi_arabia_visa_expiry}
                    onChange={e => handleInputChange('saudi_arabia_visa_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Investment License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="investment_license">Investment License</Label>
                  <Input
                    id="investment_license"
                    value={formData.investment_license}
                    onChange={e => handleInputChange('investment_license', e.target.value)}
                    placeholder="Investment license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investment_license_expiry">Expiry Date</Label>
                  <Input
                    id="investment_license_expiry"
                    type="date"
                    value={formData.investment_license_expiry}
                    onChange={e => handleInputChange('investment_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Import/Export License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="import_export_license">Import/Export License</Label>
                  <Input
                    id="import_export_license"
                    value={formData.import_export_license}
                    onChange={e => handleInputChange('import_export_license', e.target.value)}
                    placeholder="Import/export license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import_export_license_expiry">Expiry Date</Label>
                  <Input
                    id="import_export_license_expiry"
                    type="date"
                    value={formData.import_export_license_expiry}
                    onChange={e => handleInputChange('import_export_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Pharmaceutical License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pharmaceutical_license">Pharmaceutical License</Label>
                  <Input
                    id="pharmaceutical_license"
                    value={formData.pharmaceutical_license}
                    onChange={e => handleInputChange('pharmaceutical_license', e.target.value)}
                    placeholder="Pharmaceutical license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmaceutical_license_expiry">Expiry Date</Label>
                  <Input
                    id="pharmaceutical_license_expiry"
                    type="date"
                    value={formData.pharmaceutical_license_expiry}
                    onChange={e => handleInputChange('pharmaceutical_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Food Safety License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="food_safety_license">Food Safety License</Label>
                  <Input
                    id="food_safety_license"
                    value={formData.food_safety_license}
                    onChange={e => handleInputChange('food_safety_license', e.target.value)}
                    placeholder="Food safety license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="food_safety_license_expiry">Expiry Date</Label>
                  <Input
                    id="food_safety_license_expiry"
                    type="date"
                    value={formData.food_safety_license_expiry}
                    onChange={e => handleInputChange('food_safety_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Construction License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="construction_license">Construction License</Label>
                  <Input
                    id="construction_license"
                    value={formData.construction_license}
                    onChange={e => handleInputChange('construction_license', e.target.value)}
                    placeholder="Construction license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="construction_license_expiry">Expiry Date</Label>
                  <Input
                    id="construction_license_expiry"
                    type="date"
                    value={formData.construction_license_expiry}
                    onChange={e => handleInputChange('construction_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Transportation License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="transportation_license">Transportation License</Label>
                  <Input
                    id="transportation_license"
                    value={formData.transportation_license}
                    onChange={e => handleInputChange('transportation_license', e.target.value)}
                    placeholder="Transportation license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportation_license_expiry">Expiry Date</Label>
                  <Input
                    id="transportation_license_expiry"
                    type="date"
                    value={formData.transportation_license_expiry}
                    onChange={e => handleInputChange('transportation_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Banking License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="banking_license">Banking License</Label>
                  <Input
                    id="banking_license"
                    value={formData.banking_license}
                    onChange={e => handleInputChange('banking_license', e.target.value)}
                    placeholder="Banking license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banking_license_expiry">Expiry Date</Label>
                  <Input
                    id="banking_license_expiry"
                    type="date"
                    value={formData.banking_license_expiry}
                    onChange={e => handleInputChange('banking_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Insurance License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="insurance_license">Insurance License</Label>
                  <Input
                    id="insurance_license"
                    value={formData.insurance_license}
                    onChange={e => handleInputChange('insurance_license', e.target.value)}
                    placeholder="Insurance license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_license_expiry">Expiry Date</Label>
                  <Input
                    id="insurance_license_expiry"
                    type="date"
                    value={formData.insurance_license_expiry}
                    onChange={e => handleInputChange('insurance_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Telecommunications License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telecom_license">Telecommunications License</Label>
                  <Input
                    id="telecom_license"
                    value={formData.telecom_license}
                    onChange={e => handleInputChange('telecom_license', e.target.value)}
                    placeholder="Telecom license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telecom_license_expiry">Expiry Date</Label>
                  <Input
                    id="telecom_license_expiry"
                    type="date"
                    value={formData.telecom_license_expiry}
                    onChange={e => handleInputChange('telecom_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Energy License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="energy_license">Energy License</Label>
                  <Input
                    id="energy_license"
                    value={formData.energy_license}
                    onChange={e => handleInputChange('energy_license', e.target.value)}
                    placeholder="Energy license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energy_license_expiry">Expiry Date</Label>
                  <Input
                    id="energy_license_expiry"
                    type="date"
                    value={formData.energy_license_expiry}
                    onChange={e => handleInputChange('energy_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Mining License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mining_license">Mining License</Label>
                  <Input
                    id="mining_license"
                    value={formData.mining_license}
                    onChange={e => handleInputChange('mining_license', e.target.value)}
                    placeholder="Mining license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mining_license_expiry">Expiry Date</Label>
                  <Input
                    id="mining_license_expiry"
                    type="date"
                    value={formData.mining_license_expiry}
                    onChange={e => handleInputChange('mining_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Tourism License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tourism_license">Tourism License</Label>
                  <Input
                    id="tourism_license"
                    value={formData.tourism_license}
                    onChange={e => handleInputChange('tourism_license', e.target.value)}
                    placeholder="Tourism license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tourism_license_expiry">Expiry Date</Label>
                  <Input
                    id="tourism_license_expiry"
                    type="date"
                    value={formData.tourism_license_expiry}
                    onChange={e => handleInputChange('tourism_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Education License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="education_license">Education License</Label>
                  <Input
                    id="education_license"
                    value={formData.education_license}
                    onChange={e => handleInputChange('education_license', e.target.value)}
                    placeholder="Education license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_license_expiry">Expiry Date</Label>
                  <Input
                    id="education_license_expiry"
                    type="date"
                    value={formData.education_license_expiry}
                    onChange={e => handleInputChange('education_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Healthcare License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="healthcare_license">Healthcare License</Label>
                  <Input
                    id="healthcare_license"
                    value={formData.healthcare_license}
                    onChange={e => handleInputChange('healthcare_license', e.target.value)}
                    placeholder="Healthcare license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthcare_license_expiry">Expiry Date</Label>
                  <Input
                    id="healthcare_license_expiry"
                    type="date"
                    value={formData.healthcare_license_expiry}
                    onChange={e => handleInputChange('healthcare_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Real Estate License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="real_estate_license">Real Estate License</Label>
                  <Input
                    id="real_estate_license"
                    value={formData.real_estate_license}
                    onChange={e => handleInputChange('real_estate_license', e.target.value)}
                    placeholder="Real estate license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="real_estate_license_expiry">Expiry Date</Label>
                  <Input
                    id="real_estate_license_expiry"
                    type="date"
                    value={formData.real_estate_license_expiry}
                    onChange={e => handleInputChange('real_estate_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Legal Services License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="legal_services_license">Legal Services License</Label>
                  <Input
                    id="legal_services_license"
                    value={formData.legal_services_license}
                    onChange={e => handleInputChange('legal_services_license', e.target.value)}
                    placeholder="Legal services license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_services_license_expiry">Expiry Date</Label>
                  <Input
                    id="legal_services_license_expiry"
                    type="date"
                    value={formData.legal_services_license_expiry}
                    onChange={e => handleInputChange('legal_services_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Accounting License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="accounting_license">Accounting License</Label>
                  <Input
                    id="accounting_license"
                    value={formData.accounting_license}
                    onChange={e => handleInputChange('accounting_license', e.target.value)}
                    placeholder="Accounting license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accounting_license_expiry">Expiry Date</Label>
                  <Input
                    id="accounting_license_expiry"
                    type="date"
                    value={formData.accounting_license_expiry}
                    onChange={e => handleInputChange('accounting_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Advertising License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="advertising_license">Advertising License</Label>
                  <Input
                    id="advertising_license"
                    value={formData.advertising_license}
                    onChange={e => handleInputChange('advertising_license', e.target.value)}
                    placeholder="Advertising license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advertising_license_expiry">Expiry Date</Label>
                  <Input
                    id="advertising_license_expiry"
                    type="date"
                    value={formData.advertising_license_expiry}
                    onChange={e => handleInputChange('advertising_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Media License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="media_license">Media License</Label>
                  <Input
                    id="media_license"
                    value={formData.media_license}
                    onChange={e => handleInputChange('media_license', e.target.value)}
                    placeholder="Media license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media_license_expiry">Expiry Date</Label>
                  <Input
                    id="media_license_expiry"
                    type="date"
                    value={formData.media_license_expiry}
                    onChange={e => handleInputChange('media_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Security License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="security_license">Security License</Label>
                  <Input
                    id="security_license"
                    value={formData.security_license}
                    onChange={e => handleInputChange('security_license', e.target.value)}
                    placeholder="Security license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security_license_expiry">Expiry Date</Label>
                  <Input
                    id="security_license_expiry"
                    type="date"
                    value={formData.security_license_expiry}
                    onChange={e => handleInputChange('security_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Cleaning License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cleaning_license">Cleaning License</Label>
                  <Input
                    id="cleaning_license"
                    value={formData.cleaning_license}
                    onChange={e => handleInputChange('cleaning_license', e.target.value)}
                    placeholder="Cleaning license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cleaning_license_expiry">Expiry Date</Label>
                  <Input
                    id="cleaning_license_expiry"
                    type="date"
                    value={formData.cleaning_license_expiry}
                    onChange={e => handleInputChange('cleaning_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Catering License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="catering_license">Catering License</Label>
                  <Input
                    id="catering_license"
                    value={formData.catering_license}
                    onChange={e => handleInputChange('catering_license', e.target.value)}
                    placeholder="Catering license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catering_license_expiry">Expiry Date</Label>
                  <Input
                    id="catering_license_expiry"
                    type="date"
                    value={formData.catering_license_expiry}
                    onChange={e => handleInputChange('catering_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Warehouse License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="warehouse_license">Warehouse License</Label>
                  <Input
                    id="warehouse_license"
                    value={formData.warehouse_license}
                    onChange={e => handleInputChange('warehouse_license', e.target.value)}
                    placeholder="Warehouse license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse_license_expiry">Expiry Date</Label>
                  <Input
                    id="warehouse_license_expiry"
                    type="date"
                    value={formData.warehouse_license_expiry}
                    onChange={e => handleInputChange('warehouse_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Logistics License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="logistics_license">Logistics License</Label>
                  <Input
                    id="logistics_license"
                    value={formData.logistics_license}
                    onChange={e => handleInputChange('logistics_license', e.target.value)}
                    placeholder="Logistics license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logistics_license_expiry">Expiry Date</Label>
                  <Input
                    id="logistics_license_expiry"
                    type="date"
                    value={formData.logistics_license_expiry}
                    onChange={e => handleInputChange('logistics_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Maintenance License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maintenance_license">Maintenance License</Label>
                  <Input
                    id="maintenance_license"
                    value={formData.maintenance_license}
                    onChange={e => handleInputChange('maintenance_license', e.target.value)}
                    placeholder="Maintenance license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_license_expiry">Expiry Date</Label>
                  <Input
                    id="maintenance_license_expiry"
                    type="date"
                    value={formData.maintenance_license_expiry}
                    onChange={e => handleInputChange('maintenance_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Training License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="training_license">Training License</Label>
                  <Input
                    id="training_license"
                    value={formData.training_license}
                    onChange={e => handleInputChange('training_license', e.target.value)}
                    placeholder="Training license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_license_expiry">Expiry Date</Label>
                  <Input
                    id="training_license_expiry"
                    type="date"
                    value={formData.training_license_expiry}
                    onChange={e => handleInputChange('training_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Consulting License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="consulting_license">Consulting License</Label>
                  <Input
                    id="consulting_license"
                    value={formData.consulting_license}
                    onChange={e => handleInputChange('consulting_license', e.target.value)}
                    placeholder="Consulting license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consulting_license_expiry">Expiry Date</Label>
                  <Input
                    id="consulting_license_expiry"
                    type="date"
                    value={formData.consulting_license_expiry}
                    onChange={e => handleInputChange('consulting_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Research License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="research_license">Research License</Label>
                  <Input
                    id="research_license"
                    value={formData.research_license}
                    onChange={e => handleInputChange('research_license', e.target.value)}
                    placeholder="Research license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="research_license_expiry">Expiry Date</Label>
                  <Input
                    id="research_license_expiry"
                    type="date"
                    value={formData.research_license_expiry}
                    onChange={e => handleInputChange('research_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Technology License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="technology_license">Technology License</Label>
                  <Input
                    id="technology_license"
                    value={formData.technology_license}
                    onChange={e => handleInputChange('technology_license', e.target.value)}
                    placeholder="Technology license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technology_license_expiry">Expiry Date</Label>
                  <Input
                    id="technology_license_expiry"
                    type="date"
                    value={formData.technology_license_expiry}
                    onChange={e => handleInputChange('technology_license_expiry', e.target.value)}
                  />
                </div>
              </div>

              {/* Innovation License */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="innovation_license">Innovation License</Label>
                  <Input
                    id="innovation_license"
                    value={formData.innovation_license}
                    onChange={e => handleInputChange('innovation_license', e.target.value)}
                    placeholder="Innovation license number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="innovation_license_expiry">Expiry Date</Label>
                  <Input
                    id="innovation_license_expiry"
                    type="date"
                    value={formData.innovation_license_expiry}
                    onChange={e => handleInputChange('innovation_license_expiry', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Company'}
              </Button>
              <Link href="/modules/company-management">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
