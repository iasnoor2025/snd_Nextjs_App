import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Receipt, Calendar, DollarSign } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaidSalaryInfoProps {
  employeeId: number;
  month: number;
  year: number;
}

interface PayrollData {
  id: number;
  status: string;
  // Use snake_case field names as they come from the API
  base_salary: string | number;
  overtime_amount: string | number;
  bonus_amount: string | number;
  deduction_amount: string | number;
  advance_deduction: string | number;
  final_amount: string | number;
  paid_at: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  payment_status: string | null;
  currency: string;
}

export default function PaidSalaryInfo({ employeeId, month, year }: PaidSalaryInfoProps) {
  const { t } = useTranslation();
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/payroll?employee_id=${employeeId}&month=${month}&year=${year}&status=paid&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch payroll data');
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setPayrollData(data.data[0]);
      } else {
        setPayrollData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [employeeId, month, year]);

  const formatCurrency = (amount: string | number) => {
    if (!amount && amount !== 0) return 'SAR 0.00';
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num)) {
      console.warn('Invalid amount value:', amount);
      return 'SAR 0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
    }).format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to get field value with fallback
  const getFieldValue = (camelCase: string | null | undefined, snakeCase: string | null | undefined) => {
    return camelCase || snakeCase || null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('employee.paidSalary.title', 'Paid Salary Information')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t('common.loading', 'Loading...')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('employee.paidSalary.title', 'Paid Salary Information')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            {t('employee.paidSalary.error', 'Error loading salary information')}: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!payrollData) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('employee.paidSalary.title', 'Paid Salary Information')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            {t('employee.paidSalary.noData', 'No paid salary information available for this month')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          {t('employee.paidSalary.title', 'Paid Salary Information')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status and Payment Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{t('employee.paidSalary.status', 'Status')}:</span>
              {getStatusBadge(payrollData.status)}
            </div>
            {payrollData.paid_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(payrollData.paid_at)}</span>
              </div>
            )}
          </div>

          {/* Salary Breakdown - Compact Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.baseSalary', 'Base')}:</span>
              <span className="font-medium">{formatCurrency(payrollData.base_salary)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.overtime', 'OT')}:</span>
              <span className="font-medium">{formatCurrency(payrollData.overtime_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.bonus', 'Bonus')}:</span>
              <span className="font-medium">{formatCurrency(payrollData.bonus_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.deductions', 'Ded')}:</span>
              <span className="font-medium text-red-600">-{formatCurrency(payrollData.deduction_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.advanceDeduction', 'Adv')}:</span>
              <span className="font-medium text-red-600">-{formatCurrency(payrollData.advance_deduction)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('employee.paidSalary.finalAmount', 'Total')}:</span>
              <span className="font-bold text-green-600">{formatCurrency(payrollData.final_amount)}</span>
            </div>
          </div>

          {/* Payment Details - Compact */}
          {payrollData.payment_method && (
            <div className="border-t pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('employee.paidSalary.paymentMethod', 'Method')}:</span>
                <span className="font-medium capitalize">{payrollData.payment_method.replace('_', ' ')}</span>
              </div>
              {payrollData.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('employee.paidSalary.paymentReference', 'Ref')}:</span>
                  <span className="font-medium font-mono">{payrollData.payment_reference}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
