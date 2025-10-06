'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calculator,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  Info,
} from 'lucide-react';

interface UnpaidSalaryInfo {
  employeeId: number;
  unpaidMonths: number;
  unpaidAmount: number;
  lastPaidMonth?: number;
  lastPaidYear?: number;
  lastPaidDate?: string;
  totalUnpaidMonths: number;
}

interface CreateFinalSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  employeeName: string;
  settlementType: 'vacation' | 'exit';
  unpaidSalaryInfo: UnpaidSalaryInfo | null;
  onSuccess: () => void;
}

const createFormSchema = (settlementType: 'vacation' | 'exit') => {
  const baseSchema = {
    // Common fields
    manualUnpaidSalary: z.number().min(0).default(0), // Manual unpaid salary override
    overtimeHours: z.number().min(0).default(0), // Overtime hours
    overtimeAmount: z.number().min(0).default(0), // Manual overtime amount override
    otherBenefits: z.number().min(0).default(0),
    otherBenefitsDescription: z.string().optional(),
    pendingAdvances: z.number().min(0).default(0),
    equipmentDeductions: z.number().min(0).default(0),
    otherDeductions: z.number().min(0).default(0),
    otherDeductionsDescription: z.string().optional(),
    // Absent calculation fields
    absentCalculationPeriod: z.enum(['last_month', 'unpaid_period', 'custom']).default('last_month'),
    absentCalculationStartDate: z.string().optional(),
    absentCalculationEndDate: z.string().optional(),
    manualAbsentDays: z.number().min(0).default(0), // Manual absent days override
    notes: z.string().optional(),
  };

  if (settlementType === 'vacation') {
    return z.object({
      ...baseSchema,
      // Vacation settlement fields
      vacationStartDate: z.string().min(1, 'Vacation start date is required'),
      vacationDurationMonths: z.number().min(0.1, 'Vacation duration must be at least 0.1 months').max(12, 'Vacation duration cannot exceed 12 months'),
      vacationEndDate: z.string().min(1, 'Vacation end date is required'),
      expectedReturnDate: z.string().min(1, 'Expected return date is required'),
      manualVacationAllowance: z.number().min(0).default(0), // Manual vacation allowance override
      // Optional/unused for vacation
      lastWorkingDate: z.string().optional(),
      isResignation: z.boolean().default(false),
      resignationId: z.number().optional(),
      accruedVacationDays: z.number().min(0).default(0),
    });
  } else {
    return z.object({
      ...baseSchema,
      // Exit settlement fields
      lastWorkingDate: z.string().min(1, 'Last working date is required'),
      isResignation: z.boolean().default(false),
      resignationId: z.number().optional(),
      accruedVacationDays: z.number().min(0).default(0),
      // Optional/unused for exit
      vacationStartDate: z.string().optional(),
      vacationEndDate: z.string().optional(),
      expectedReturnDate: z.string().optional(),
      manualVacationAllowance: z.number().min(0).default(0),
    });
  }
};

export function CreateFinalSettlementDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  settlementType,
  unpaidSalaryInfo,
  onSuccess,
}: CreateFinalSettlementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formSchema = createFormSchema(settlementType);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: settlementType === 'vacation' ? {
      manualUnpaidSalary: 0,
      overtimeHours: 0,
      overtimeAmount: 0,
      vacationStartDate: new Date().toISOString().split('T')[0],
      vacationDurationMonths: 1,
      vacationEndDate: '',
      expectedReturnDate: '',
      manualVacationAllowance: 0,
      otherBenefits: 0,
      pendingAdvances: 0,
      equipmentDeductions: 0,
      otherDeductions: 0,
      absentCalculationPeriod: 'last_month',
      absentCalculationStartDate: '',
      absentCalculationEndDate: '',
      manualAbsentDays: 0,
      isResignation: false,
      accruedVacationDays: 0,
      lastWorkingDate: '',
    } : {
      manualUnpaidSalary: 0,
      overtimeHours: 0,
      overtimeAmount: 0,
      lastWorkingDate: new Date().toISOString().split('T')[0],
      isResignation: false,
      accruedVacationDays: 0,
      manualVacationAllowance: 0,
      otherBenefits: 0,
      pendingAdvances: 0,
      equipmentDeductions: 0,
      otherDeductions: 0,
      absentCalculationPeriod: 'unpaid_period',
      absentCalculationStartDate: '',
      absentCalculationEndDate: '',
      manualAbsentDays: 0,
      vacationStartDate: '',
      vacationEndDate: '',
      expectedReturnDate: '',
    },
  });

  // Watch form values for real-time preview
  const formValues = form.watch();

  useEffect(() => {
    if (open) {
      if (settlementType === 'vacation' && formValues.vacationStartDate && formValues.vacationEndDate && formValues.expectedReturnDate) {
        generatePreview();
      } else if (settlementType === 'exit' && formValues.lastWorkingDate) {
        generatePreview();
      }
    }
  }, [open, formValues.lastWorkingDate, formValues.isResignation, formValues.vacationStartDate, formValues.vacationDurationMonths, formValues.vacationEndDate, formValues.expectedReturnDate, formValues.manualUnpaidSalary, formValues.overtimeHours, formValues.overtimeAmount, formValues.manualVacationAllowance, formValues.absentCalculationPeriod, formValues.absentCalculationStartDate, formValues.absentCalculationEndDate, formValues.manualAbsentDays]);

  const generatePreview = async () => {
    try {
      let requestBody: any = {
        employeeId,
        settlementType,
      };

      if (settlementType === 'vacation') {
        if (!formValues.vacationStartDate || !formValues.vacationEndDate || !formValues.expectedReturnDate) return;
        
        requestBody = {
          ...requestBody,
          vacationStartDate: formValues.vacationStartDate,
          vacationDurationMonths: formValues.vacationDurationMonths || 1,
          vacationEndDate: formValues.vacationEndDate,
          expectedReturnDate: formValues.expectedReturnDate,
          manualUnpaidSalary: formValues.manualUnpaidSalary || 0,
          overtimeHours: formValues.overtimeHours || 0,
          overtimeAmount: formValues.overtimeAmount || 0,
          manualVacationAllowance: formValues.manualVacationAllowance || 0,
          absentCalculationPeriod: formValues.absentCalculationPeriod,
          absentCalculationStartDate: formValues.absentCalculationStartDate,
          absentCalculationEndDate: formValues.absentCalculationEndDate,
          manualAbsentDays: formValues.manualAbsentDays || 0,
        };
      } else {
        if (!formValues.lastWorkingDate) return;
        
        requestBody = {
          ...requestBody,
          lastWorkingDate: formValues.lastWorkingDate,
          isResignation: formValues.isResignation,
          manualUnpaidSalary: formValues.manualUnpaidSalary || 0,
          overtimeHours: formValues.overtimeHours || 0,
          overtimeAmount: formValues.overtimeAmount || 0,
          absentCalculationPeriod: formValues.absentCalculationPeriod,
          absentCalculationStartDate: formValues.absentCalculationStartDate,
          absentCalculationEndDate: formValues.absentCalculationEndDate,
          manualAbsentDays: formValues.manualAbsentDays || 0,
        };
      }

      const response = await fetch('/api/final-settlements/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.data);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/employees/${employeeId}/final-settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          settlementType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create final settlement');
      }

      const result = await response.json();
      
      // Show success and close dialog
      onSuccess();
      form.reset();
      setPreview(null);
    } catch (err) {
      console.error('Error creating final settlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create final settlement');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {settlementType === 'vacation' ? (
              <Calendar className="h-5 w-5" />
            ) : (
              <Calculator className="h-5 w-5" />
            )}
            Create {settlementType === 'vacation' ? 'Vacation' : 'Exit'} Settlement for {employeeName}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Unpaid Salary Warning */}
        {unpaidSalaryInfo && unpaidSalaryInfo.unpaidMonths > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Unpaid Salary Detected:</strong> This employee has {unpaidSalaryInfo.unpaidMonths} unpaid {unpaidSalaryInfo.unpaidMonths === 1 ? 'month' : 'months'} 
              totaling {formatCurrency(unpaidSalaryInfo.unpaidAmount)}. This will be automatically included in the settlement.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-6">
            <div>
              <div className="space-y-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Settlement Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Manual Unpaid Salary - Common for both types */}
                    <FormField
                      control={form.control}
                      name="manualUnpaidSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manual Unpaid Salary (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Override automatic unpaid salary calculation (leave 0 to use system calculation)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Overtime Fields - Common for both types */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="overtimeHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overtime Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="e.g., 20.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Total overtime hours worked
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="overtimeAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Overtime Amount (SAR)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="e.g., 1500.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Manual overtime amount override
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Absent Calculation - Common for both types */}
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <h4 className="font-medium">Absent Calculation</h4>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="absentCalculationPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calculation Period</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="last_month">Last Month</option>
                                <option value="unpaid_period">Unpaid Period</option>
                                <option value="custom">Custom Period</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Choose the period for absent calculation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {formValues.absentCalculationPeriod === 'custom' && (
                        <>
                          <FormField
                            control={form.control}
                            name="absentCalculationStartDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="absentCalculationEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={form.control}
                        name="manualAbsentDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manual Absent Days</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Override automatic absent calculation (leave 0 to use system calculation)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {settlementType === 'vacation' ? (
                      <>
                        {/* Vacation Settlement Fields */}
                        <FormField
                          control={form.control}
                          name="vacationStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vacation Start Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    
                                    // Auto-calculate vacation end date and expected return date if duration is set
                                    if (formValues.vacationDurationMonths && formValues.vacationDurationMonths > 0) {
                                      const startDate = new Date(e.target.value);
                                      const endDate = new Date(startDate);
                                      endDate.setMonth(endDate.getMonth() + formValues.vacationDurationMonths);
                                      
                                      // Set vacation end date (last day of vacation)
                                      const vacationEndDate = new Date(endDate);
                                      vacationEndDate.setDate(vacationEndDate.getDate() - 1);
                                      
                                      // Set expected return date (next working day after vacation)
                                      const expectedReturnDate = new Date(endDate);
                                      
                                      form.setValue('vacationEndDate', vacationEndDate.toISOString().split('T')[0]);
                                      form.setValue('expectedReturnDate', expectedReturnDate.toISOString().split('T')[0]);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vacationDurationMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vacation Duration (Months)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  min="0.1" 
                                  max="12" 
                                  placeholder="e.g., 1.5 for 1.5 months"
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    field.onChange(value);
                                    
                                    // Auto-calculate vacation end date and expected return date
                                    if (formValues.vacationStartDate && value > 0) {
                                      const startDate = new Date(formValues.vacationStartDate);
                                      const endDate = new Date(startDate);
                                      endDate.setMonth(endDate.getMonth() + value);
                                      
                                      // Set vacation end date (last day of vacation)
                                      const vacationEndDate = new Date(endDate);
                                      vacationEndDate.setDate(vacationEndDate.getDate() - 1);
                                      
                                      // Set expected return date (next working day after vacation)
                                      const expectedReturnDate = new Date(endDate);
                                      
                                      form.setValue('vacationEndDate', vacationEndDate.toISOString().split('T')[0]);
                                      form.setValue('expectedReturnDate', expectedReturnDate.toISOString().split('T')[0]);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter vacation duration in months (e.g., 1.5 for 1.5 months)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vacationEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vacation End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="expectedReturnDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Return Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="manualVacationAllowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Manual Vacation Allowance (SAR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormDescription>
                                Override the calculated vacation allowance (leave 0 for automatic calculation)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <>
                        {/* Exit Settlement Fields */}
                        <FormField
                          control={form.control}
                          name="lastWorkingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Working Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isResignation"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Employee Resignation</FormLabel>
                                <FormDescription>
                                  Check this if the employee resigned voluntarily. 
                                  This affects end-of-service benefit calculation.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settlementType === 'exit' && (
                      <FormField
                        control={form.control}
                        name="accruedVacationDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accrued Vacation Days</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Unused vacation days that will be compensated
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="otherBenefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Benefits Amount (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherBenefitsDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Benefits Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe other benefits (if any)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Deductions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pendingAdvances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pending Advances (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Outstanding salary advances to be deducted
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="equipmentDeductions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Deductions (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Cost of unreturned or damaged equipment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherDeductions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Deductions (SAR)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="otherDeductionsDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Deductions Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe other deductions (if any)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes or comments..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Settlement Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <div className="space-y-4">
                    {/* Service Information */}
                    <div>
                      <h4 className="font-medium mb-2">Service Period</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Total Service: {preview.serviceDetails?.totalServiceYears}Y {preview.serviceDetails?.totalServiceMonths}M {preview.serviceDetails?.totalServiceDays}D</div>
                        <div>Last Working: {new Date(preview.serviceDetails?.lastWorkingDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Absent Calculation Details */}
                    {preview.absentCalculation && (
                      <div>
                        <h4 className="font-medium mb-2 text-orange-700">Absent Calculation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Calculation Period:</span>
                            <span className="font-medium capitalize">{preview.absentCalculation.calculationPeriod.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Period:</span>
                            <span className="font-medium">
                              {preview.absentCalculation.startDate} to {preview.absentCalculation.endDate}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Absent Days:</span>
                            <span className="font-medium">{preview.absentCalculation.absentDays}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Rate:</span>
                            <span className="font-medium">{formatCurrency(preview.absentCalculation.dailyRate)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Absent Deduction:</span>
                            <span className="font-medium">-{formatCurrency(preview.absentCalculation.absentDeduction)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Financial Summary */}
                    <div>
                      <h4 className="font-medium mb-2">Financial Summary</h4>
                      <div className="space-y-2 text-sm">
                        {(unpaidSalaryInfo && unpaidSalaryInfo.unpaidAmount > 0) || formValues.manualUnpaidSalary > 0 ? (
                          <div className="flex justify-between">
                            <span>Unpaid Salaries ({formValues.manualUnpaidSalary > 0 && preview.employee?.basicSalary && preview.employee.basicSalary > 0
                              ? (formValues.manualUnpaidSalary / preview.employee.basicSalary).toFixed(1)
                              : (unpaidSalaryInfo?.unpaidMonths || 0)} months):</span>
                            <span className="font-medium">{formatCurrency(
                              formValues.manualUnpaidSalary > 0 
                                ? formValues.manualUnpaidSalary 
                                : (unpaidSalaryInfo?.unpaidAmount || 0)
                            )}</span>
                          </div>
                        ) : null}
                        
                        {settlementType === 'vacation' ? (
                          <>
                            <div className="flex justify-between">
                              <span>Vacation Allowance:</span>
                              <span className="font-medium">{formatCurrency(
                                formValues.manualVacationAllowance > 0 
                                  ? formValues.manualVacationAllowance 
                                  : (preview.vacationDetails?.vacationAllowance || 0)
                              )}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>End of Service Benefit:</span>
                              <span className="font-medium">{formatCurrency(preview.endOfServiceBenefit?.endOfServiceBenefit || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Accrued Vacation:</span>
                              <span className="font-medium">{formatCurrency((formValues.accruedVacationDays || 0) * (preview.employee?.basicSalary || 0) / 30)}</span>
                            </div>
                          </>
                        )}

                        {/* Overtime Benefits */}
                        {(formValues.overtimeHours > 0 || formValues.overtimeAmount > 0) && (
                          <div className="flex justify-between">
                            <span>Overtime ({formValues.overtimeHours > 0 ? `${formValues.overtimeHours} hours` : 'manual amount'}):</span>
                            <span className="font-medium">{formatCurrency(
                              formValues.overtimeAmount > 0 
                                ? formValues.overtimeAmount 
                                : (preview.finalCalculation?.breakdown?.overtimeAmount || 0)
                            )}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span>Other Benefits:</span>
                          <span className="font-medium">{formatCurrency(formValues.otherBenefits || 0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Gross Amount:</span>
                          <span>{formatCurrency(
                            settlementType === 'vacation' ? (
                              (formValues.manualUnpaidSalary > 0 ? formValues.manualUnpaidSalary : (unpaidSalaryInfo?.unpaidAmount || 0)) +
                              (formValues.manualVacationAllowance > 0 
                                ? formValues.manualVacationAllowance 
                                : (preview.vacationDetails?.vacationAllowance || 0)) +
                              (formValues.overtimeAmount > 0 
                                ? formValues.overtimeAmount 
                                : (preview.finalCalculation?.breakdown?.overtimeAmount || 0)) +
                              (formValues.otherBenefits || 0)
                            ) : (
                              (formValues.manualUnpaidSalary > 0 ? formValues.manualUnpaidSalary : (unpaidSalaryInfo?.unpaidAmount || 0)) +
                              (preview.endOfServiceBenefit?.endOfServiceBenefit || 0) +
                              ((formValues.accruedVacationDays || 0) * (preview.employee?.basicSalary || 0) / 30) +
                              (formValues.overtimeAmount > 0 
                                ? formValues.overtimeAmount 
                                : (preview.finalCalculation?.breakdown?.overtimeAmount || 0)) +
                              (formValues.otherBenefits || 0)
                            )
                          )}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Total Deductions:</span>
                          <span>-{formatCurrency(
                            (formValues.pendingAdvances || 0) +
                            (formValues.equipmentDeductions || 0) +
                            (formValues.otherDeductions || 0) +
                            (preview.absentCalculation?.absentDeduction || 0)
                          )}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-green-600 text-lg">
                          <span>Net Amount:</span>
                          <span>{formatCurrency(
                            settlementType === 'vacation' ? (
                              (formValues.manualUnpaidSalary > 0 ? formValues.manualUnpaidSalary : (unpaidSalaryInfo?.unpaidAmount || 0)) +
                              (formValues.manualVacationAllowance > 0 
                                ? formValues.manualVacationAllowance 
                                : (preview.vacationDetails?.vacationAllowance || 0)) +
                              (formValues.overtimeAmount > 0 
                                ? formValues.overtimeAmount 
                                : (preview.finalCalculation?.breakdown?.overtimeAmount || 0)) +
                              (formValues.otherBenefits || 0) -
                              (formValues.pendingAdvances || 0) -
                              (formValues.equipmentDeductions || 0) -
                              (formValues.otherDeductions || 0) -
                              (preview.absentCalculation?.absentDeduction || 0)
                            ) : (
                              (formValues.manualUnpaidSalary > 0 ? formValues.manualUnpaidSalary : (unpaidSalaryInfo?.unpaidAmount || 0)) +
                              (preview.endOfServiceBenefit?.endOfServiceBenefit || 0) +
                              ((formValues.accruedVacationDays || 0) * (preview.employee?.basicSalary || 0) / 30) +
                              (formValues.overtimeAmount > 0 
                                ? formValues.overtimeAmount 
                                : (preview.finalCalculation?.breakdown?.overtimeAmount || 0)) +
                              (formValues.otherBenefits || 0) -
                              (formValues.pendingAdvances || 0) -
                              (formValues.equipmentDeductions || 0) -
                              (formValues.otherDeductions || 0) -
                              (preview.absentCalculation?.absentDeduction || 0)
                            )
                          )}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Legal Information */}
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Saudi Labor Law:</strong> This calculation is based on Article 84 of the Saudi Labor Law. 
                        {formValues.isResignation ? ' As this is a resignation, benefits may be reduced according to service period.' : ' Full benefits apply for company termination.'}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calculator className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>Enter last working date to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading || !preview}
          >
            {loading ? 'Creating...' : 'Create Settlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
