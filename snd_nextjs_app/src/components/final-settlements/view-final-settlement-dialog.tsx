'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Download,
  CheckCircle,
  CreditCard,
  MoreVertical,
  Eye,
  Calendar,
  DollarSign,
  Building,
  User,
  Calculator,
  AlertTriangle,
} from 'lucide-react';

interface FinalSettlement {
  id: number;
  settlementNumber: string;
  settlementType: 'vacation' | 'exit';
  employeeName: string;
  fileNumber?: string;
  iqamaNumber?: string;
  nationality?: string;
  designation?: string;
  department?: string;
  hireDate: string;
  lastWorkingDate: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
  expectedReturnDate?: string;
  vacationDurationMonths?: number;
  vacationDays?: number;
  totalServiceYears: number;
  totalServiceMonths: number;
  totalServiceDays: number;
  unpaidSalaryMonths: number;
  unpaidSalaryAmount: string;
  endOfServiceBenefit: string;
  accruedVacationDays?: number;
  accruedVacationAmount?: string;
  overtimeHours?: string;
  overtimeAmount?: string;
  otherBenefits?: string;
  otherBenefitsDescription?: string;
  pendingAdvances?: string;
  equipmentDeductions?: string;
  otherDeductions?: string;
  otherDeductionsDescription?: string;
  grossAmount: string;
  totalDeductions: string;
  netAmount: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid';
  preparedAt: string;
  approvedAt?: string;
  paidAt?: string;
  currency: string;
  createdAt: string;
}

interface ViewFinalSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: FinalSettlement;
  canApprove?: boolean;
  canPay?: boolean;
  onUpdate: () => void;
}

export function ViewFinalSettlementDialog({
  open,
  onOpenChange,
  settlement,
  canApprove = false,
  canPay = false,
  onUpdate,
}: ViewFinalSettlementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'pay' | null>(null);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${settlement.currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
      pending_approval: { label: 'Pending Approval', variant: 'default' as const, icon: Eye },
      approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
      paid: { label: 'Paid', variant: 'success' as const, icon: CreditCard },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDownloadPDF = async (language: 'en' | 'ar' | 'bilingual' = 'bilingual') => {
    try {
      const response = await fetch(`/api/final-settlements/${settlement.id}/pdf?language=${language}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Get JSON response with base64 data
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to generate PDF');
      }
      
      // Convert data URI to blob
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = data.data; // data URI
      a.download = data.filename || `Final_Settlement_${settlement.settlementNumber}_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      alert(`Failed to download PDF: ${errorMessage}`);
    }
  };

  const handleStatusChange = async (newStatus: 'approved' | 'paid') => {
    try {
      setLoading(true);

      const response = await fetch(`/api/final-settlements/${settlement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update settlement status');
      }

      onUpdate();
      setActionDialogOpen(false);
      setActionType(null);
    } catch (error) {
      console.error('Error updating settlement:', error);
      alert('Failed to update settlement status');
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (type: 'approve' | 'pay') => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  const canShowApproveButton = canApprove && (settlement.status === 'draft' || settlement.status === 'pending_approval');
  const canShowPayButton = canPay && settlement.status === 'approved';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Final Settlement Details
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(settlement.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownloadPDF('bilingual')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF (Bilingual)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadPDF('en')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF (English)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadPDF('ar')}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF (Arabic)
                    </DropdownMenuItem>
                    {(canShowApproveButton || canShowPayButton) && <DropdownMenuSeparator />}
                    {canShowApproveButton && (
                      <DropdownMenuItem onClick={() => openActionDialog('approve')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Settlement
                      </DropdownMenuItem>
                    )}
                    {canShowPayButton && (
                      <DropdownMenuItem onClick={() => openActionDialog('pay')}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Employee & Service Info */}
            <div className="space-y-4">
              {/* Settlement Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Settlement Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement Number:</span>
                    <span className="font-medium">{settlement.settlementNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prepared Date:</span>
                    <span>{formatDate(settlement.preparedAt)}</span>
                  </div>
                  {settlement.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved Date:</span>
                      <span>{formatDate(settlement.approvedAt)}</span>
                    </div>
                  )}
                  {settlement.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid Date:</span>
                      <span>{formatDate(settlement.paidAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employee Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employee Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{settlement.employeeName}</span>
                  </div>
                  {settlement.fileNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Number:</span>
                      <span>{settlement.fileNumber}</span>
                    </div>
                  )}
                  {settlement.iqamaNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Iqama Number:</span>
                      <span>{settlement.iqamaNumber}</span>
                    </div>
                  )}
                  {settlement.nationality && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nationality:</span>
                      <span>{settlement.nationality}</span>
                    </div>
                  )}
                  {settlement.designation && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position:</span>
                      <span>{settlement.designation}</span>
                    </div>
                  )}
                  {settlement.department && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span>{settlement.department}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Service Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hire Date:</span>
                    <span>{formatDate(settlement.hireDate)}</span>
                  </div>
                  
                  {settlement.settlementType === 'vacation' ? (
                    <>
                      {settlement.vacationStartDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vacation Start Date:</span>
                          <span>{formatDate(settlement.vacationStartDate)}</span>
                        </div>
                      )}
                      {settlement.vacationDurationMonths && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vacation Duration:</span>
                          <span className="font-medium">{settlement.vacationDurationMonths} months</span>
                        </div>
                      )}
                      {settlement.vacationEndDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vacation End Date:</span>
                          <span>{formatDate(settlement.vacationEndDate)}</span>
                        </div>
                      )}
                      {settlement.expectedReturnDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Return Date:</span>
                          <span>{formatDate(settlement.expectedReturnDate)}</span>
                        </div>
                      )}
                      {settlement.vacationDays && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vacation Days:</span>
                          <span className="font-medium">{settlement.vacationDays} days</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Working Date:</span>
                      <span>{formatDate(settlement.lastWorkingDate)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Service:</span>
                    <span className="font-medium">
                      {settlement.totalServiceYears} Years, {settlement.totalServiceMonths} Months, {settlement.totalServiceDays} Days
                    </span>
                  </div>
                  {settlement.unpaidSalaryAmount > 0 && parseFloat(settlement.lastBasicSalary) > 0 && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-orange-600">
                        <span>Unpaid Salary Months:</span>
                        <span className="font-medium">
                          {Math.round((parseFloat(settlement.unpaidSalaryAmount) / parseFloat(settlement.lastBasicSalary)) * 10) / 10} months
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Financial Information */}
            <div className="space-y-4">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Benefits */}
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">Benefits</h4>
                    <div className="space-y-2 text-sm">
                      {settlement.unpaidSalaryAmount > 0 && parseFloat(settlement.lastBasicSalary) > 0 && (
                        <div className="flex justify-between">
                          <span>Unpaid Salaries ({Math.round((parseFloat(settlement.unpaidSalaryAmount) / parseFloat(settlement.lastBasicSalary)) * 10) / 10} months):</span>
                          <span className="font-medium">{formatCurrency(settlement.unpaidSalaryAmount)}</span>
                        </div>
                      )}
                      
                      {settlement.settlementType === 'vacation' ? (
                        <div className="flex justify-between">
                          <span>Vacation Allowance:</span>
                          <span className="font-medium">{formatCurrency(settlement.endOfServiceBenefit)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span>End of Service Benefits:</span>
                          <span className="font-medium">{formatCurrency(settlement.endOfServiceBenefit)}</span>
                        </div>
                      )}

                      {/* Additional Benefits for Exit Settlements */}
                      {settlement.settlementType === 'exit' && settlement.accruedVacationDays && parseFloat(settlement.accruedVacationAmount || '0') > 0 && (
                        <div className="flex justify-between">
                          <span>Accrued Vacation ({settlement.accruedVacationDays} days):</span>
                          <span className="font-medium">{formatCurrency(settlement.accruedVacationAmount || '0')}</span>
                        </div>
                      )}

                      {/* Overtime Benefits */}
                      {settlement.overtimeHours && parseFloat(settlement.overtimeHours) > 0 && (
                        <div className="flex justify-between">
                          <span>Overtime ({settlement.overtimeHours} hours):</span>
                          <span className="font-medium">{formatCurrency(settlement.overtimeAmount || '0')}</span>
                        </div>
                      )}

                      {/* Other Benefits */}
                      {settlement.otherBenefits && parseFloat(settlement.otherBenefits) > 0 && (
                        <div className="flex justify-between">
                          <span>Other Benefits{settlement.otherBenefitsDescription ? ` (${settlement.otherBenefitsDescription})` : ''}:</span>
                          <span className="font-medium">{formatCurrency(settlement.otherBenefits)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Gross Amount */}
                  <div className="flex justify-between font-medium text-lg">
                    <span>Gross Amount:</span>
                    <span className="text-green-600">{formatCurrency(settlement.grossAmount)}</span>
                  </div>

                  {parseFloat(settlement.totalDeductions) > 0 && (
                    <>
                      <Separator />
                      
                      {/* Deductions */}
                      <div>
                        <h4 className="font-medium mb-2 text-red-700">Deductions</h4>
                        <div className="space-y-2 text-sm">
                          {settlement.pendingAdvances && parseFloat(settlement.pendingAdvances) > 0 && (
                            <div className="flex justify-between">
                              <span>Pending Advances:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(settlement.pendingAdvances)}</span>
                            </div>
                          )}
                          
                          {settlement.equipmentDeductions && parseFloat(settlement.equipmentDeductions) > 0 && (
                            <div className="flex justify-between">
                              <span>Equipment Deductions:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(settlement.equipmentDeductions)}</span>
                            </div>
                          )}
                          
                          {settlement.otherDeductions && parseFloat(settlement.otherDeductions) > 0 && (
                            <div className="flex justify-between">
                              <span>Other Deductions{settlement.otherDeductionsDescription ? ` (${settlement.otherDeductionsDescription})` : ''}:</span>
                              <span className="font-medium text-red-600">-{formatCurrency(settlement.otherDeductions)}</span>
                            </div>
                          )}
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium">
                          <span>Total Deductions:</span>
                          <span className="text-red-600">-{formatCurrency(settlement.totalDeductions)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Net Amount */}
                  <div className="flex justify-between font-bold text-xl p-3 bg-green-50 rounded-lg">
                    <span>Net Settlement Amount:</span>
                    <span className="text-green-700">{formatCurrency(settlement.netAmount)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Saudi Labor Law Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Legal Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Saudi Labor Law Article 84</p>
                        <p>This settlement has been calculated in accordance with the Saudi Labor Law requirements for end-of-service benefits and final settlement procedures.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => handleDownloadPDF('bilingual')}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Settlement' : 'Mark as Paid'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? 'Are you sure you want to approve this final settlement? This action cannot be undone.'
                : 'Are you sure you want to mark this settlement as paid? This will complete the settlement process.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleStatusChange(actionType!)}
              disabled={loading}
            >
              {loading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Mark as Paid')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
