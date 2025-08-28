'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmployeeDropdown } from '@/components/ui/employee-dropdown';
import { useI18n } from '@/hooks/use-i18n';
import { CreditCard, DollarSign, Eye, History, Loader2, Plus, Trash2, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdvanceData {
  id: number;
  employee_id: number;
  amount: string;
  reason: string;
  status: string;
  notes: string;
  repaidAmount: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    file_number: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  } | null;
}

interface EmployeeAdvanceSectionProps {
  onHideSection: () => void;
}

export default function EmployeeAdvanceSection({ onHideSection }: EmployeeAdvanceSectionProps) {
  const { t } = useI18n();
  const [advances, setAdvances] = useState<AdvanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states
  const [isAdvanceRequestDialogOpen, setIsAdvanceRequestDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRepaymentDialogOpen, setIsRepaymentDialogOpen] = useState(false);
  
  // Form states
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  
  // Selected items
  const [selectedAdvanceForReject, setSelectedAdvanceForReject] = useState<AdvanceData | null>(null);
  const [selectedAdvanceForRepayment, setSelectedAdvanceForRepayment] = useState<AdvanceData | null>(null);
  


  // Fetch advances data
  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/advances');
      const data = await response.json();
             if (data.data) {
         setAdvances(data.data || []);
       } else {
         toast.error(t('dashboard.employeeAdvance.messages.failedToLoad'));
       }
           } catch (error) {
         console.error('Error fetching advances:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToLoad'));
       } finally {
      setLoading(false);
    }
  };



  // Handle new advance request
  const handleNewAdvance = async () => {
         if (!selectedEmployeeId || !advanceAmount || !advanceReason) {
       toast.error(t('dashboard.employeeAdvance.messages.fillRequiredFields'));
       return;
     }

    try {
      const response = await fetch('/api/advances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          amount: advanceAmount,
          reason: advanceReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceSubmitted'));
        setIsAdvanceRequestDialogOpen(false);
        setAdvanceAmount('');
        setAdvanceReason('');
        setSelectedEmployeeId('');
        fetchAdvances();
      } else {
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToSubmit'));
      }
           } catch (error) {
         console.error('Error submitting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToSubmit'));
       }
  };

  // Handle advance approval
  const handleApproveAdvance = async (advanceId: number) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceApproved'));
        fetchAdvances();
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToApprove'));
      }
           } catch (error) {
         console.error('Error approving advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToApprove'));
       }
  };

  // Handle advance rejection
  const handleRejectAdvance = async (advanceId: number, reason: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceRejected'));
        setIsRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedAdvanceForReject(null);
        fetchAdvances();
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToReject'));
      }
           } catch (error) {
         console.error('Error rejecting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToReject'));
       }
  };

  // Handle repayment
  const handleRepayment = async (advanceId: number, amount: string) => {
    try {
      const response = await fetch(`/api/employee/advances/${advanceId}/repay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repaymentAmount: amount,
        }),
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.repaymentRecorded'));
        setIsRepaymentDialogOpen(false);
        setRepaymentAmount('');
        setSelectedAdvanceForRepayment(null);
        fetchAdvances();
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToRecordRepayment'));
      }
           } catch (error) {
         console.error('Error recording repayment:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToRecordRepayment'));
       }
  };



  // Handle advance deletion
  const handleDeleteAdvance = async (advanceId: number) => {
         if (!confirm(t('dashboard.employeeAdvance.messages.confirmDelete'))) {
       return;
     }

    try {
      const response = await fetch(`/api/advances/${advanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
                 toast.success(t('dashboard.employeeAdvance.messages.advanceDeleted'));
        fetchAdvances();
      } else {
        const data = await response.json();
                 toast.error(data.error || t('dashboard.employeeAdvance.messages.failedToDelete'));
      }
           } catch (error) {
         console.error('Error deleting advance:', error);
         toast.error(t('dashboard.employeeAdvance.messages.failedToDelete'));
       }
  };

  // Calculate statistics
  const getStatistics = () => {
    const totalAdvances = advances.length;
    const pendingAdvances = advances.filter(a => a.status === 'pending').length;
    const approvedAdvances = advances.filter(a => a.status === 'approved').length;
    const totalAmount = advances.reduce((sum, a) => sum + parseFloat(a.amount), 0);
    const totalRepaid = advances.reduce((sum, a) => sum + parseFloat(a.repaidAmount || '0'), 0);
    const outstandingBalance = totalAmount - totalRepaid;

    return {
      totalAdvances,
      pendingAdvances,
      approvedAdvances,
      totalAmount,
      totalRepaid,
      outstandingBalance,
    };
  };

  // Initial data fetch
  useEffect(() => {
    fetchAdvances();
  }, []);

  const stats = getStatistics();

  return (
    <Card className="shadow-sm border border-gray-200 bg-white rounded-lg">
      <CardHeader className="bg-muted/50 rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
                           <CardTitle className="text-xl font-semibold">{t('dashboard.employeeAdvance.title')}</CardTitle>
             <CardDescription>
               {t('dashboard.employeeAdvance.description')}
             </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="text-muted-foreground hover:text-foreground"
            >
                             {t('dashboard.employeeAdvance.hideSection')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAdvanceRequestDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
                             {t('dashboard.employeeAdvance.newAdvance')}
            </Button>
            <Button
              variant="outline"
              onClick={fetchAdvances}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
                             {t('dashboard.employeeAdvance.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalAdvances')}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.totalAdvances}</p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.pending')}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingAdvances}</p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.approved')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.approvedAdvances}</p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalAmount')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">SAR {stats.totalAmount.toFixed(2)}</p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.totalRepaid')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">SAR {stats.totalRepaid.toFixed(2)}</p>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
                             <span className="text-sm font-medium text-muted-foreground">{t('dashboard.employeeAdvance.statistics.outstanding')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">SAR {stats.outstandingBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Advances Table */}
        <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-lg">
          <CardHeader className="bg-muted/50 rounded-t-lg p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
                             <CardTitle className="text-lg font-semibold">{t('dashboard.employeeAdvance.table.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted/50">
                  <tr>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.employee')}
                     </th>
                                                              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('dashboard.employeeAdvance.table.amount')}
                      </th>
                                                               <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('dashboard.employeeAdvance.table.currentBalance')}
                      </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                         {t('dashboard.employeeAdvance.table.reason')}
                       </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.date')}
                     </th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.status')}
                     </th>
                                         <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                       {t('dashboard.employeeAdvance.table.actions')}
                     </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading ? (
                                       <tr>
                     <td colSpan={6} className="px-6 py-8 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         <span className="text-muted-foreground">{t('dashboard.employeeAdvance.messages.loading')}</span>
                       </div>
                     </td>
                   </tr>
                 ) : advances.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                       {t('dashboard.employeeAdvance.messages.noRecords')}
                     </td>
                   </tr>
                  ) : (
                    advances.map(advance => (
                      <tr key={advance.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                                                             <div className="font-medium text-gray-900">
                                 {advance.employee?.first_name} {advance.employee?.last_name}
                               </div>
                               <div className="text-sm text-muted-foreground">
                                 {advance.employee?.file_number}
                               </div>
                            </div>
                          </div>
                        </td>
                                                 <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">
                           SAR {Number(advance.amount).toFixed(2)}
                         </td>
                                                   <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                            SAR {(Number(advance.amount) - Number(advance.repaidAmount || 0)).toFixed(2)}
                          </td>
                         <td className="px-6 py-4 max-w-[200px] truncate">{advance.reason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(advance.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              advance.status === 'approved'
                                ? 'default'
                                : advance.status === 'pending'
                                  ? 'secondary'
                                  : advance.status === 'rejected'
                                    ? 'destructive'
                                    : advance.status === 'partially_repaid'
                                      ? 'secondary'
                                      : advance.status === 'fully_repaid'
                                        ? 'default'
                                        : 'outline'
                            }
                            className={
                              advance.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : advance.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : advance.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : advance.status === 'partially_repaid'
                                      ? 'bg-blue-100 text-blue-800'
                                      : advance.status === 'fully_repaid'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {advance.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                                                         {/* Approve/Reject buttons for pending advances */}
                             {advance.status === 'pending' && (
                               <>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => handleApproveAdvance(advance.id)}
                                 >
                                   {t('dashboard.employeeAdvance.actions.approve')}
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => {
                                     setSelectedAdvanceForReject(advance);
                                     setIsRejectDialogOpen(true);
                                   }}
                                 >
                                   {t('dashboard.employeeAdvance.actions.reject')}
                                 </Button>
                               </>
                             )}

                             {/* Repayment button for approved advances */}
                             {(advance.status === 'approved' || advance.status === 'partially_repaid') && (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => {
                                   setSelectedAdvanceForRepayment(advance);
                                   setIsRepaymentDialogOpen(true);
                                 }}
                               >
                                 {t('dashboard.employeeAdvance.actions.repay')}
                               </Button>
                             )}



                            {/* View details button */}
                            <Button
                              size="sm"
                              variant="outline"
                                                             onClick={() => {
                                 // Navigate to employee details page
                                 window.open(`/modules/employee-management/${advance.employee_id}`, '_blank');
                               }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Delete button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteAdvance(advance.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </CardContent>

      {/* New Advance Dialog */}
      <Dialog open={isAdvanceRequestDialogOpen} onOpenChange={setIsAdvanceRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
                         <DialogTitle>{t('dashboard.employeeAdvance.dialogs.newAdvance.title')}</DialogTitle>
             <DialogDescription>{t('dashboard.employeeAdvance.dialogs.newAdvance.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
                         <div className="grid gap-2">
               <EmployeeDropdown
                 value={selectedEmployeeId}
                 onValueChange={setSelectedEmployeeId}
                 label={t('dashboard.employeeAdvance.dialogs.newAdvance.employee')}
                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.employee')}
                 required={true}
                 showSearch={true}
               />
             </div>
            <div className="grid gap-2">
              <label htmlFor="amount" className="text-sm font-medium">
                {t('dashboard.employeeAdvance.dialogs.newAdvance.amount')}
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={advanceAmount}
                onChange={e => setAdvanceAmount(e.target.value)}
                                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.amountPlaceholder')}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">
                {t('dashboard.employeeAdvance.dialogs.newAdvance.reason')}
              </label>
              <Textarea
                id="reason"
                value={advanceReason}
                onChange={e => setAdvanceReason(e.target.value)}
                                 placeholder={t('dashboard.employeeAdvance.dialogs.newAdvance.reasonPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
                             onClick={() => {
                 setIsAdvanceRequestDialogOpen(false);
                 setAdvanceAmount('');
                 setAdvanceReason('');
                 setSelectedEmployeeId('');
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.newAdvance.cancel')}
            </Button>
                         <Button type="button" onClick={handleNewAdvance}>
               {t('dashboard.employeeAdvance.dialogs.newAdvance.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



             {/* Reject Advance Dialog */}
       <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
         <DialogContent>
           <DialogHeader>
                           <DialogTitle>{t('dashboard.employeeAdvance.dialogs.rejectAdvance.title')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.employeeAdvance.dialogs.rejectAdvance.description')}
              </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid gap-2">
                               <label htmlFor="rejectionReason" className="text-sm font-medium">
                  {t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectionReason')}
                </label>
               <Textarea
                 id="rejectionReason"
                 value={rejectionReason}
                 onChange={e => setRejectionReason(e.target.value)}
                                    placeholder={t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectionReasonPlaceholder')}
                 rows={3}
               />
             </div>
           </div>
           <DialogFooter>
             <Button
               type="button"
               variant="outline"
               onClick={() => {
                 setIsRejectDialogOpen(false);
                 setRejectionReason('');
                 setSelectedAdvanceForReject(null);
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.rejectAdvance.cancel')}
             </Button>
             <Button
               type="button"
               variant="destructive"
               onClick={() => {
                 if (selectedAdvanceForReject && rejectionReason.trim()) {
                   handleRejectAdvance(selectedAdvanceForReject.id, rejectionReason);
                                    } else {
                     toast.error(t('dashboard.employeeAdvance.messages.provideRejectionReason'));
                   }
               }}
               disabled={!rejectionReason.trim()}
             >
               {t('dashboard.employeeAdvance.dialogs.rejectAdvance.rejectAdvance')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Repayment Dialog */}
       <Dialog open={isRepaymentDialogOpen} onOpenChange={setIsRepaymentDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{t('dashboard.employeeAdvance.dialogs.repayment.title')}</DialogTitle>
             <DialogDescription>
               {t('dashboard.employeeAdvance.dialogs.repayment.description')}
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             {selectedAdvanceForRepayment && (
               <div className="space-y-4">
                 <div className="rounded-lg border p-4 bg-muted/50">
                   <h4 className="font-medium mb-2">{t('dashboard.employeeAdvance.dialogs.repayment.advanceDetails')}</h4>
                   <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.employee')}: {selectedAdvanceForRepayment.employee?.first_name} {selectedAdvanceForRepayment.employee?.last_name}
                     </div>
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.amount')}: SAR {Number(selectedAdvanceForRepayment.amount).toFixed(2)}
                     </div>
                     <div>
                       {t('dashboard.employeeAdvance.dialogs.repayment.status')}: {selectedAdvanceForRepayment.status.replace('_', ' ')}
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid gap-2">
                   <label htmlFor="repaymentAmount" className="text-sm font-medium">
                     {t('dashboard.employeeAdvance.dialogs.repayment.repaymentAmount')}
                   </label>
                   <Input
                     id="repaymentAmount"
                     type="number"
                     step="0.01"
                     min="0"
                     value={repaymentAmount}
                     onChange={e => setRepaymentAmount(e.target.value)}
                     placeholder={t('dashboard.employeeAdvance.dialogs.repayment.repaymentAmountPlaceholder')}
                   />
                 </div>
               </div>
             )}
           </div>
           <DialogFooter>
             <Button
               type="button"
               variant="outline"
               onClick={() => {
                 setIsRepaymentDialogOpen(false);
                 setRepaymentAmount('');
                 setSelectedAdvanceForRepayment(null);
               }}
             >
               {t('dashboard.employeeAdvance.dialogs.repayment.cancel')}
             </Button>
             <Button
               type="button"
               onClick={() => {
                 if (selectedAdvanceForRepayment && repaymentAmount.trim()) {
                   handleRepayment(selectedAdvanceForRepayment.id, repaymentAmount);
                                    } else {
                     toast.error(t('dashboard.employeeAdvance.messages.provideRepaymentAmount'));
                   }
               }}
               disabled={!repaymentAmount.trim()}
             >
               {t('dashboard.employeeAdvance.dialogs.repayment.recordRepayment')}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </Card>
  );
}
