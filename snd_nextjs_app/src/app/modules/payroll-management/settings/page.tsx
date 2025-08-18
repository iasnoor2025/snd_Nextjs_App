'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, DollarSign, FileText, Save, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PayrollSettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    company_name: 'SND Rental Management',
    currency: 'USD',
    pay_frequency: 'monthly',
    pay_day: '25',
    overtime_rate: '1.5',
    tax_year_start: '01-01',
    auto_generate_payroll: false,
    require_approval: true,
    send_notifications: true,
  });

  const [taxSettings, setTaxSettings] = useState({
    tax_calculation_method: 'progressive',
    social_security_rate: '6.2',
    medicare_rate: '1.45',
    state_tax_rate: '5.0',
    local_tax_rate: '2.0',
    exempt_employees: false,
  });

  const [deductionSettings, setDeductionSettings] = useState({
    health_insurance_rate: '3.0',
    retirement_rate: '5.0',
    other_deductions: '',
    max_deduction_percentage: '25.0',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: string | boolean) => {
    switch (section) {
      case 'general':
        setGeneralSettings(prev => ({ ...prev, [field]: value }));
        break;
      case 'tax':
        setTaxSettings(prev => ({ ...prev, [field]: value }));
        break;
      case 'deduction':
        setDeductionSettings(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/modules/payroll-management">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Payroll Settings</h1>
          <p className="text-gray-600">Configure payroll management settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tax
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Deductions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic payroll configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={generalSettings.company_name}
                    onChange={e => handleInputChange('general', 'company_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={generalSettings.currency}
                    onValueChange={value => handleInputChange('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_frequency">Pay Frequency</Label>
                  <Select
                    value={generalSettings.pay_frequency}
                    onValueChange={value => handleInputChange('general', 'pay_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay_day">Pay Day</Label>
                  <Input
                    id="pay_day"
                    type="number"
                    min="1"
                    max="31"
                    value={generalSettings.pay_day}
                    onChange={e => handleInputChange('general', 'pay_day', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime_rate">Overtime Rate Multiplier</Label>
                  <Input
                    id="overtime_rate"
                    type="number"
                    step="0.1"
                    value={generalSettings.overtime_rate}
                    onChange={e => handleInputChange('general', 'overtime_rate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_year_start">Tax Year Start</Label>
                  <Input
                    id="tax_year_start"
                    placeholder="MM-DD"
                    value={generalSettings.tax_year_start}
                    onChange={e => handleInputChange('general', 'tax_year_start', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-generate Payroll</Label>
                    <p className="text-sm text-gray-500">
                      Automatically generate payroll on pay day
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.auto_generate_payroll}
                    onCheckedChange={checked =>
                      handleInputChange('general', 'auto_generate_payroll', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-sm text-gray-500">Require manager approval for payroll</p>
                  </div>
                  <Switch
                    checked={generalSettings.require_approval}
                    onCheckedChange={checked =>
                      handleInputChange('general', 'require_approval', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email notifications for payroll events
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.send_notifications}
                    onCheckedChange={checked =>
                      handleInputChange('general', 'send_notifications', checked)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('General')} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save General Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure tax calculation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tax_calculation_method">Tax Calculation Method</Label>
                  <Select
                    value={taxSettings.tax_calculation_method}
                    onValueChange={value =>
                      handleInputChange('tax', 'tax_calculation_method', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="progressive">Progressive</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="marginal">Marginal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="social_security_rate">Social Security Rate (%)</Label>
                  <Input
                    id="social_security_rate"
                    type="number"
                    step="0.1"
                    value={taxSettings.social_security_rate}
                    onChange={e => handleInputChange('tax', 'social_security_rate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicare_rate">Medicare Rate (%)</Label>
                  <Input
                    id="medicare_rate"
                    type="number"
                    step="0.1"
                    value={taxSettings.medicare_rate}
                    onChange={e => handleInputChange('tax', 'medicare_rate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_tax_rate">State Tax Rate (%)</Label>
                  <Input
                    id="state_tax_rate"
                    type="number"
                    step="0.1"
                    value={taxSettings.state_tax_rate}
                    onChange={e => handleInputChange('tax', 'state_tax_rate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local_tax_rate">Local Tax Rate (%)</Label>
                  <Input
                    id="local_tax_rate"
                    type="number"
                    step="0.1"
                    value={taxSettings.local_tax_rate}
                    onChange={e => handleInputChange('tax', 'local_tax_rate', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exempt Employees</Label>
                  <p className="text-sm text-gray-500">
                    Allow tax exemptions for certain employees
                  </p>
                </div>
                <Switch
                  checked={taxSettings.exempt_employees}
                  onCheckedChange={checked => handleInputChange('tax', 'exempt_employees', checked)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Tax')} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Tax Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deduction Settings</CardTitle>
              <CardDescription>Configure automatic deductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="health_insurance_rate">Health Insurance Rate (%)</Label>
                  <Input
                    id="health_insurance_rate"
                    type="number"
                    step="0.1"
                    value={deductionSettings.health_insurance_rate}
                    onChange={e =>
                      handleInputChange('deduction', 'health_insurance_rate', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirement_rate">Retirement Rate (%)</Label>
                  <Input
                    id="retirement_rate"
                    type="number"
                    step="0.1"
                    value={deductionSettings.retirement_rate}
                    onChange={e =>
                      handleInputChange('deduction', 'retirement_rate', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_deduction_percentage">Max Deduction Percentage (%)</Label>
                  <Input
                    id="max_deduction_percentage"
                    type="number"
                    step="0.1"
                    value={deductionSettings.max_deduction_percentage}
                    onChange={e =>
                      handleInputChange('deduction', 'max_deduction_percentage', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="other_deductions">Other Deductions</Label>
                <Textarea
                  id="other_deductions"
                  placeholder="Enter additional deduction rules..."
                  value={deductionSettings.other_deductions}
                  onChange={e => handleInputChange('deduction', 'other_deductions', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave('Deduction')} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Deduction Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
