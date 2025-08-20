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
