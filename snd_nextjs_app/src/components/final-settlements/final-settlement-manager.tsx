'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Plus,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Building,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { CreateFinalSettlementDialog } from './create-final-settlement-dialog';
import { ViewFinalSettlementDialog } from './view-final-settlement-dialog';
import { UnpaidSalaryAlert } from './unpaid-salary-alert';

interface FinalSettlement {
  id: number;
  settlementNumber: string;
  settlementType: 'vacation' | 'exit';
  employeeName: string;
  fileNumber?: string;
  hireDate: string;
  lastWorkingDate: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
  expectedReturnDate?: string;
  vacationDays?: number;
  totalServiceYears: number;
  totalServiceMonths: number;
  unpaidSalaryMonths: number;
  unpaidSalaryAmount: string;
  endOfServiceBenefit: string;
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

interface UnpaidSalaryInfo {
  employeeId: number;
  unpaidMonths: number;
  unpaidAmount: number;
  lastPaidMonth?: number;
  lastPaidYear?: number;
  lastPaidDate?: string;
  totalUnpaidMonths: number;
}

interface FinalSettlementManagerProps {
  employeeId: number;
  employeeName: string;
  canCreate?: boolean;
  canView?: boolean;
  canApprove?: boolean;
  canPay?: boolean;
  canDelete?: boolean;
}

export function FinalSettlementManager({
  employeeId,
  employeeName,
  canCreate = false,
  canView = true,
  canApprove = false,
  canPay = false,
  canDelete = false,
}: FinalSettlementManagerProps) {
  const { t, isRTL } = useI18n();
  const [settlements, setSettlements] = useState<FinalSettlement[]>([]);
  const [unpaidSalaryInfo, setUnpaidSalaryInfo] = useState<UnpaidSalaryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<FinalSettlement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settlementToDelete, setSettlementToDelete] = useState<FinalSettlement | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load final settlements
      const settlementsResponse = await fetch(`/api/employees/${employeeId}/final-settlements`);
      if (!settlementsResponse.ok) {
        throw new Error('Failed to fetch final settlements');
      }
      const settlementsData = await settlementsResponse.json();
      setSettlements(settlementsData.data || []);

      // Load unpaid salary information
      const unpaidSalaryResponse = await fetch(`/api/employees/${employeeId}/unpaid-salary`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store',
        },
      });
      if (unpaidSalaryResponse.ok) {
        const unpaidSalaryData = await unpaidSalaryResponse.json();
        setUnpaidSalaryInfo(unpaidSalaryData.data);
      }
    } catch (err) {
      console.error('Error loading final settlement data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const [settlementTypeToCreate, setSettlementTypeToCreate] = useState<'vacation' | 'exit'>('exit');

  const handleCreateSettlement = (type: 'vacation' | 'exit') => {
    setSettlementTypeToCreate(type);
    setCreateDialogOpen(true);
  };

  const handleViewSettlement = (settlement: FinalSettlement) => {
    setSelectedSettlement(settlement);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = async (settlementId: number, language: 'en' | 'ar' | 'bilingual' = 'bilingual') => {
    try {
      const response = await fetch(`/api/final-settlements/${settlementId}/pdf?language=${language}`);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to generate PDF';
        let errorDetails = '';
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorDetails = errorData.stack ? `\n\nDetails: ${errorData.stack.substring(0, 200)}` : '';
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            console.error('Error response text:', text);
            errorMessage = text || response.statusText || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(`${errorMessage}${errorDetails}`);
      }
      
      const blob = await response.blob();
      
      // Check if the blob is actually a PDF (not an error JSON)
      if (blob.type !== 'application/pdf') {
        const text = await blob.text();
        console.error('Blob is not PDF, content:', text.substring(0, 200));
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Final_Settlement_${settlementId}_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      alert(`Failed to download PDF: ${errorMessage}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
      pending_approval: { label: 'Pending Approval', variant: 'default' as const, icon: Clock },
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

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  const handleDeleteSettlement = (settlement: FinalSettlement) => {
    setSettlementToDelete(settlement);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSettlement = async () => {
    if (!settlementToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/final-settlements/${settlementToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete settlement');
      }

      // Remove from local state
      setSettlements(settlements.filter(s => s.id !== settlementToDelete.id));
      setDeleteDialogOpen(false);
      setSettlementToDelete(null);
    } catch (error) {
      console.error('Error deleting settlement:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete settlement');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Final Settlements</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Final Settlements</h2>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Final Settlements</h2>
        {canCreate && (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleCreateSettlement('vacation')} 
              className="flex items-center gap-2"
              variant="outline"
            >
              <Calendar className="h-4 w-4" />
              Vacation Settlement
            </Button>
            <Button 
              onClick={() => handleCreateSettlement('exit')} 
              className="flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" />
              Exit Settlement
            </Button>
          </div>
        )}
      </div>

      {/* Unpaid Salary Alert */}
      {unpaidSalaryInfo && unpaidSalaryInfo.unpaidMonths > 0 && (
        <UnpaidSalaryAlert unpaidSalaryInfo={unpaidSalaryInfo} />
      )}

      {/* Settlements List */}
      {settlements.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Receipt className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium mb-2">No Final Settlements</p>
              <p className="mb-4">No final settlements found for {employeeName}.</p>
              {canCreate && (
                <Button onClick={handleCreateSettlement} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Settlement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Settlement History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Settlement No.</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[200px]">Service Period</TableHead>
                    <TableHead className="min-w-[120px]">Unpaid Months</TableHead>
                    <TableHead className="min-w-[120px]">End of Service</TableHead>
                    <TableHead className="min-w-[120px]">Net Amount</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="w-24 min-w-[96px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">
                        {settlement.settlementNumber}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={settlement.settlementType === 'vacation' ? 'outline' : 'default'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {settlement.settlementType === 'vacation' ? (
                            <>
                              <Calendar className="h-3 w-3" />
                              Vacation
                            </>
                          ) : (
                            <>
                              <Building className="h-3 w-3" />
                              Exit
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {settlement.settlementType === 'vacation' ? (
                            <>
                              <div className="text-blue-600 font-medium">
                                Vacation: {settlement.vacationStartDate && formatDate(settlement.vacationStartDate)} - {settlement.vacationEndDate && formatDate(settlement.vacationEndDate)}
                              </div>
                              <div className="text-muted-foreground">
                                {settlement.vacationDays} days | Return: {settlement.expectedReturnDate && formatDate(settlement.expectedReturnDate)}
                              </div>
                            </>
                          ) : (
                            <>
                              <div>{formatDate(settlement.hireDate)} - {formatDate(settlement.lastWorkingDate)}</div>
                              <div className="text-muted-foreground">
                                {settlement.totalServiceYears}Y {settlement.totalServiceMonths}M
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {settlement.unpaidSalaryMonths > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-orange-600">
                              {settlement.unpaidSalaryMonths} months
                            </div>
                            <div className="text-muted-foreground">
                              {formatCurrency(settlement.unpaidSalaryAmount)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(settlement.endOfServiceBenefit)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          {formatCurrency(settlement.netAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(settlement.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canView && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSettlement(settlement)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(settlement.id)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canDelete && settlement.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSettlement(settlement)}
                              title="Delete Settlement"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Settlement Dialog */}
      <CreateFinalSettlementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        employeeId={employeeId}
        employeeName={employeeName}
        settlementType={settlementTypeToCreate}
        unpaidSalaryInfo={unpaidSalaryInfo}
        onSuccess={() => {
          setCreateDialogOpen(false);
          loadData();
        }}
      />

      {/* View Settlement Dialog */}
      {selectedSettlement && (
        <ViewFinalSettlementDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          settlement={selectedSettlement}
          canApprove={canApprove}
          canPay={canPay}
          onUpdate={loadData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Settlement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete settlement <strong>{settlementToDelete?.settlementNumber}</strong>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSettlement}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
