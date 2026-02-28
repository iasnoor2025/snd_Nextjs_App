'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CalendarIcon, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { ProtectedRoute } from '@/components/protected-route';

export default function CreatePayrollPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    employee_id: '',
    period: '', // YYYY-MM format for input[type=month]
    basic_salary: '',
    allowances: '',
    overtime_hours: '',
    overtime_rate: '',
    deduction_amount: '',
    advance_deduction: '',
    payment_date: undefined as Date | undefined,
    payment_method: '',
    payment_reference: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  // Fetch employee basic salary when employee is selected
  const fetchEmployeeSalary = useCallback(async (employeeId: string) => {
    if (!employeeId) return;
    setLoadingEmployee(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        const basicSalary = data.employee?.basic_salary ?? data.basic_salary;
        if (basicSalary != null && basicSalary !== '') {
          setFormData(prev => ({
            ...prev,
            basic_salary: String(Number(basicSalary)),
          }));
        }
      }
    } catch {
      // Ignore - user can enter manually
    } finally {
      setLoadingEmployee(false);
    }
  }, []);

  useEffect(() => {
    if (formData.employee_id) {
      fetchEmployeeSalary(formData.employee_id);
    }
  }, [formData.employee_id, fetchEmployeeSalary]);

  const handleInputChange = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Computed values
  const basicSalary = parseFloat(formData.basic_salary) || 0;
  const allowances = parseFloat(formData.allowances) || 0;
  const overtimeHours = parseFloat(formData.overtime_hours) || 0;
  const overtimeRate = parseFloat(formData.overtime_rate) || 0;
  const overtimeAmount = overtimeHours * overtimeRate;
  const deductionAmount = parseFloat(formData.deduction_amount) || 0;
  const advanceDeduction = parseFloat(formData.advance_deduction) || 0;
  const grossPay = basicSalary + allowances + overtimeAmount;
  const finalAmount = grossPay - deductionAmount - advanceDeduction;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.period) {
      toast.error('Please select employee and period');
      return;
    }
    const [yearStr, monthStr] = formData.period.split('-');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (!month || !year) {
      toast.error('Invalid period');
      return;
    }
    if (basicSalary <= 0) {
      toast.error('Basic salary is required');
      return;
    }

    setLoading(true);
    try {
      const isPaid = !!formData.payment_method;
      const payload = {
        employeeId: parseInt(formData.employee_id, 10),
        month,
        year,
        baseSalary: basicSalary,
        overtimeAmount,
        bonusAmount: allowances,
        deductionAmount,
        advanceDeduction,
        overtimeHours: overtimeHours || undefined,
        notes: formData.notes || undefined,
        status: isPaid ? 'paid' : 'pending',
        ...(isPaid && {
          paidAt: formData.payment_date
            ? format(formData.payment_date, 'yyyy-MM-dd')
            : new Date().toISOString().split('T')[0],
          paymentMethod: formData.payment_method,
          paymentReference: formData.payment_reference || undefined,
        }),
      };

      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to create payroll');
        return;
      }
      toast.success(t('payroll.success.create') || t('payroll.createSuccess') || 'Payroll created successfully');
      window.location.href = `/${locale}/payroll-management`;
    } catch {
      toast.error('Failed to create payroll');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const currentYear = new Date().getFullYear();
  const periodOptions = [];
  for (let y = currentYear; y >= currentYear - 3; y--) {
    for (let m = 12; m >= 1; m--) {
      const value = `${y}-${String(m).padStart(2, '0')}`;
      periodOptions.push({ value, label: `${monthNames[m - 1]} ${y}` });
    }
  }

  return (
    <ProtectedRoute requiredPermission={{ action: 'create', subject: 'Payroll' }}>
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${locale}/payroll-management`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('payroll.createTitle')}</h1>
          <p className="text-muted-foreground">{t('payroll.createDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.employeeInfo')}</CardTitle>
              <CardDescription>{t('payroll.employeeInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('payroll.employee')}</Label>
                  <EmployeeDropdown
                    value={formData.employee_id}
                    onValueChange={value => handleInputChange('employee_id', value)}
                    placeholder={t('payroll.selectEmployee')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">{t('payroll.period')}</Label>
                  <Select
                    value={formData.period}
                    onValueChange={value => handleInputChange('period', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('payroll.selectPeriod')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px] overflow-y-auto">
                      {periodOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.salaryDetails')}</CardTitle>
              <CardDescription>{t('payroll.salaryDetailsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">{t('payroll.basicSalary')}</Label>
                  <Input
                    id="basic_salary"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.basic_salary}
                    onChange={e => handleInputChange('basic_salary', e.target.value)}
                    disabled={loadingEmployee}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowances">{t('payroll.allowances')}</Label>
                  <Input
                    id="allowances"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.allowances}
                    onChange={e => handleInputChange('allowances', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gross_pay">{t('payroll.grossPay')}</Label>
                  <Input
                    id="gross_pay"
                    type="number"
                    readOnly
                    value={grossPay.toFixed(2)}
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overtime */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.overtime')}</CardTitle>
              <CardDescription>{t('payroll.overtimeDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime_hours">{t('payroll.overtimeHours')}</Label>
                  <Input
                    id="overtime_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={formData.overtime_hours}
                    onChange={e => handleInputChange('overtime_hours', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtime_rate">{t('payroll.overtimeRate')}</Label>
                  <Input
                    id="overtime_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.overtime_rate}
                    onChange={e => handleInputChange('overtime_rate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.deductions')}</CardTitle>
              <CardDescription>{t('payroll.deductionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deduction_amount">{t('payroll.deductions')}</Label>
                  <Input
                    id="deduction_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.deduction_amount}
                    onChange={e => handleInputChange('deduction_amount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance_deduction">{t('payroll.advanceDeduction')}</Label>
                  <Input
                    id="advance_deduction"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.advance_deduction}
                    onChange={e => handleInputChange('advance_deduction', e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm font-medium">
                {t('payroll.finalAmount')}: {finalAmount.toFixed(2)} SAR
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.paymentInfo')}</CardTitle>
              <CardDescription>{t('payroll.paymentInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_date">{t('payroll.paymentDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.payment_date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.payment_date
                          ? format(formData.payment_date, 'PPP')
                          : t('payroll.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={date => handleInputChange('payment_date', date || undefined)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">{t('payroll.paymentMethod')}</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={value => handleInputChange('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('payroll.selectPaymentMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">{t('payroll.bankTransfer')}</SelectItem>
                      <SelectItem value="check">{t('payroll.check')}</SelectItem>
                      <SelectItem value="cash">{t('payroll.cash')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_reference">{t('payroll.paymentReference')}</Label>
                <Input
                  id="payment_reference"
                  placeholder="Optional reference"
                  value={formData.payment_reference}
                  onChange={e => handleInputChange('payment_reference', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payroll.additionalNotes')}</CardTitle>
              <CardDescription>{t('payroll.additionalNotesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                placeholder={t('payroll.additionalNotes')}
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href={`/${locale}/payroll-management`}>
              <Button variant="outline" type="button">
                {t('payroll.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('payroll.createPayroll')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
    </ProtectedRoute>
  );
}
