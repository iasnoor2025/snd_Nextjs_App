'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CheckCircle, DollarSign } from 'lucide-react';

interface UnpaidSalaryInfo {
  employeeId: number;
  unpaidMonths: number;
  unpaidAmount: number;
  lastPaidMonth?: number;
  lastPaidYear?: number;
  lastPaidDate?: string;
  totalUnpaidMonths: number;
}

interface UnpaidSalaryAlertProps {
  unpaidSalaryInfo: UnpaidSalaryInfo;
}

export function UnpaidSalaryAlert({ unpaidSalaryInfo }: UnpaidSalaryAlertProps) {
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`;
  };

  const formatLastPaidDate = () => {
    if (unpaidSalaryInfo.lastPaidDate) {
      return new Date(unpaidSalaryInfo.lastPaidDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    if (unpaidSalaryInfo.lastPaidMonth && unpaidSalaryInfo.lastPaidYear) {
      return `${getMonthName(unpaidSalaryInfo.lastPaidMonth)} ${unpaidSalaryInfo.lastPaidYear}`;
    }
    return 'Never';
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const isPaid = unpaidSalaryInfo.unpaidMonths === 0;

  // Paid salary status - show in same card with success styling
  if (isPaid) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-800">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="flex items-center gap-2">
          Paid Salary Status
          <Badge variant="outline" className="border-green-600 text-green-800">
            Compliant
          </Badge>
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <div>
                  <div className="font-medium">Status</div>
                  <div className="text-sm opacity-80">All salary paid up to date</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="font-medium">Last Payment</div>
                  <div className="text-sm opacity-80">{formatLastPaidDate()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <div>
                  <div className="font-medium">Unpaid Amount</div>
                  <div className="text-sm opacity-80">0.00 SAR</div>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-md bg-white bg-opacity-50">
              <p className="text-sm">
                <strong>Saudi Labor Law Compliance:</strong> According to Article 90 of the Saudi Labor Law,
                wages must be paid monthly. This employee is compliant with all salary payments up to date.
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Unpaid salary alert (existing behavior)
  const getSeverityLevel = () => {
    const monthsToCheck = unpaidSalaryInfo.unpaidMonths;
    if (monthsToCheck >= 6) return 'critical';
    if (monthsToCheck >= 3) return 'high';
    if (monthsToCheck >= 1) return 'medium';
    return 'low';
  };

  const severity = getSeverityLevel();

  const alertConfig = {
    low: {
      className: 'border-blue-200 bg-blue-50 text-blue-800',
      icon: <Calendar className="h-4 w-4 text-blue-600" />,
      badgeVariant: 'default' as const,
    },
    medium: {
      className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      badgeVariant: 'secondary' as const,
    },
    high: {
      className: 'border-orange-200 bg-orange-50 text-orange-800',
      icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      badgeVariant: 'destructive' as const,
    },
    critical: {
      className: 'border-red-200 bg-red-50 text-red-800',
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      badgeVariant: 'destructive' as const,
    },
  };

  const config = alertConfig[severity];

  return (
    <Alert className={config.className}>
      {config.icon}
      <AlertTitle className="flex items-center gap-2">
        Unpaid Salary Alert
        <Badge variant={config.badgeVariant}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority
        </Badge>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div>
                <div className="font-medium">Unpaid Months</div>
                <div className="text-sm opacity-80">
                  {unpaidSalaryInfo.unpaidMonths} {unpaidSalaryInfo.unpaidMonths === 1 ? 'month' : 'months'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <div>
                <div className="font-medium">Unpaid Amount</div>
                <div className="text-sm opacity-80">
                  {formatCurrency(unpaidSalaryInfo.unpaidAmount)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <div>
                <div className="font-medium">Last Payment</div>
                <div className="text-sm opacity-80">
                  {formatLastPaidDate()}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-md bg-white bg-opacity-50">
            <p className="text-sm">
              <strong>Saudi Labor Law Compliance:</strong> According to Article 90 of the Saudi Labor Law,
              wages must be paid monthly. This employee has {unpaidSalaryInfo.unpaidMonths} unpaid {unpaidSalaryInfo.unpaidMonths === 1 ? 'month' : 'months'}
              totaling {formatCurrency(unpaidSalaryInfo.unpaidAmount)}.
              {severity === 'critical' && ' Immediate action is required to ensure legal compliance.'}
              {severity === 'high' && ' Please address this matter promptly to avoid legal complications.'}
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
