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
  Calculator,
  Calendar,
  User,
  Building,
  CreditCard,
} from 'lucide-react';
import { useI18n } from '@/contexts/i18n-context';
import { CreateFinalSettlementDialog } from './create-final-settlement-dialog';
import { ViewFinalSettlementDialog } from './view-final-settlement-dialog';
import { UnpaidSalaryAlert } from './unpaid-salary-alert';

interface FinalSettlement {
  id: number;
  settlementNumber: string;
  employeeName: string;
  fileNumber?: string;
  hireDate: string;
  lastWorkingDate: string;
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
}

export function FinalSettlementManager({
  employeeId,
  employeeName,
  canCreate = false,
  canView = true,
  canApprove = false,
  canPay = false,
}: FinalSettlementManagerProps) {
  const { t, isRTL } = useI18n();
  const [settlements, setSettlements] = useState<FinalSettlement[]>([]);
  const [unpaidSalaryInfo, setUnpaidSalaryInfo] = useState<UnpaidSalaryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<FinalSettlement | null>(null);

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
      const unpaidSalaryResponse = await fetch(`/api/employees/${employeeId}/unpaid-salary`);
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

  const handleCreateSettlement = () => {
    setCreateDialogOpen(true);
  };

  const handleViewSettlement = (settlement: FinalSettlement) => {
    setSelectedSettlement(settlement);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = async (settlementId: number, language: 'en' | 'ar' | 'bilingual' = 'bilingual') => {
    try {
      const response = await fetch(`/api/final-settlements/${settlementId}/pdf?language=${language}`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
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
      alert('Failed to download PDF');
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
          <Button onClick={handleCreateSettlement} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Settlement
          </Button>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement No.</TableHead>
                    <TableHead>Service Period</TableHead>
                    <TableHead>Unpaid Months</TableHead>
                    <TableHead>End of Service</TableHead>
                    <TableHead>Net Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">
                        {settlement.settlementNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(settlement.hireDate)} - {formatDate(settlement.lastWorkingDate)}</div>
                          <div className="text-muted-foreground">
                            {settlement.totalServiceYears}Y {settlement.totalServiceMonths}M
                          </div>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
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
    </div>
  );
}
