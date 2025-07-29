"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Phone, Mail, MapPin, Calendar, DollarSign, IdCard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    employee_id: "",
    file_number: "",
    status: "active",
    hire_date: "",
    date_of_birth: "",
    nationality: "",
    current_location: "",
    hourly_rate: "",
    basic_salary: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    iqama_number: "",
    iqama_expiry: "",
    passport_number: "",
    passport_expiry: "",
    driving_license_number: "",
    driving_license_expiry: "",
    operator_license_number: "",
    operator_license_expiry: "",
    tuv_certification_number: "",
    tuv_certification_expiry: "",
    spsp_license_number: "",
    spsp_license_expiry: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.employee_id.trim()) {
      toast.error('First name, last name, and employee ID are required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          basic_salary: formData.basic_salary ? parseFloat(formData.basic_salary) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Employee created successfully');
        router.push('/modules/employee-management');
      } else {
        toast.error(result.message || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/modules/employee-management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Create New Employee</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => handleInputChange('middle_name', e.target.value)}
                  placeholder="Enter middle name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="Enter employee ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_number">File Number</Label>
                <Input
                  id="file_number"
                  value={formData.file_number}
                  onChange={(e) => handleInputChange('file_number', e.target.value)}
                  placeholder="Enter file number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange('hire_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_location">Current Location</Label>
                <Input
                  id="current_location"
                  value={formData.current_location}
                  onChange={(e) => handleInputChange('current_location', e.target.value)}
                  placeholder="Enter current location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  placeholder="Enter hourly rate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  step="0.01"
                  value={formData.basic_salary}
                  onChange={(e) => handleInputChange('basic_salary', e.target.value)}
                  placeholder="Enter basic salary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Enter postal code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                <Input
                  id="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  placeholder="Enter relationship"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Documents & Licenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iqama_number">Iqama Number</Label>
                <Input
                  id="iqama_number"
                  value={formData.iqama_number}
                  onChange={(e) => handleInputChange('iqama_number', e.target.value)}
                  placeholder="Enter Iqama number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iqama_expiry">Iqama Expiry</Label>
                <Input
                  id="iqama_expiry"
                  type="date"
                  value={formData.iqama_expiry}
                  onChange={(e) => handleInputChange('iqama_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passport_number">Passport Number</Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleInputChange('passport_number', e.target.value)}
                  placeholder="Enter passport number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport_expiry">Passport Expiry</Label>
                <Input
                  id="passport_expiry"
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => handleInputChange('passport_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driving_license_number">Driving License Number</Label>
                <Input
                  id="driving_license_number"
                  value={formData.driving_license_number}
                  onChange={(e) => handleInputChange('driving_license_number', e.target.value)}
                  placeholder="Enter driving license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driving_license_expiry">Driving License Expiry</Label>
                <Input
                  id="driving_license_expiry"
                  type="date"
                  value={formData.driving_license_expiry}
                  onChange={(e) => handleInputChange('driving_license_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operator_license_number">Operator License Number</Label>
                <Input
                  id="operator_license_number"
                  value={formData.operator_license_number}
                  onChange={(e) => handleInputChange('operator_license_number', e.target.value)}
                  placeholder="Enter operator license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator_license_expiry">Operator License Expiry</Label>
                <Input
                  id="operator_license_expiry"
                  type="date"
                  value={formData.operator_license_expiry}
                  onChange={(e) => handleInputChange('operator_license_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tuv_certification_number">TUV Certification Number</Label>
                <Input
                  id="tuv_certification_number"
                  value={formData.tuv_certification_number}
                  onChange={(e) => handleInputChange('tuv_certification_number', e.target.value)}
                  placeholder="Enter TUV certification number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tuv_certification_expiry">TUV Certification Expiry</Label>
                <Input
                  id="tuv_certification_expiry"
                  type="date"
                  value={formData.tuv_certification_expiry}
                  onChange={(e) => handleInputChange('tuv_certification_expiry', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spsp_license_number">SPSP License Number</Label>
                <Input
                  id="spsp_license_number"
                  value={formData.spsp_license_number}
                  onChange={(e) => handleInputChange('spsp_license_number', e.target.value)}
                  placeholder="Enter SPSP license number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spsp_license_expiry">SPSP License Expiry</Label>
                <Input
                  id="spsp_license_expiry"
                  type="date"
                  value={formData.spsp_license_expiry}
                  onChange={(e) => handleInputChange('spsp_license_expiry', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Creating...' : 'Create Employee'}
          </Button>
          <Link href="/modules/employee-management">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
} 