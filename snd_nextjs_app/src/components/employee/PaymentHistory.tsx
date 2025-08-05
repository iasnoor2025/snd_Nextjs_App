"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreditCard, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  notes?: string;
  advance_payment_id?: number;
  created_at: string;
}

interface ActiveAdvance {
  id: number;
  amount: number;
  repaid_amount: number;
  balance: number;
  status: string;
  payment_date: string | null;
  repayment_date: string | null;
  monthly_deduction: number;
}

interface EmployeeInfo {
  id: number;
  name: string;
  total_advance_balance: number;
}

interface Totals {
  monthly_deduction: number;
  remaining_balance: number;
}

interface PaymentHistoryProps {
  employeeId: number;
}

export default function PaymentHistory({ employeeId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeAdvances, setActiveAdvances] = useState<ActiveAdvance[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employee/${employeeId}/payments`)
      .then((res) => res.json())
      .then((data) => {
        setPayments(data?.payments || []);
        setActiveAdvances(data?.active_advances || []);
        setEmployeeInfo(data?.employee || null);
        setTotals(data?.totals || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('PaymentHistory API error:', error);
        setLoading(false);
      });
  }, [employeeId]);

  const handleRepaymentDelete = async (paymentId: number) => {
    setDeletingId(paymentId);
    try {
      const response = await fetch(`/api/employee/${employeeId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Repayment deleted successfully');
        // Refresh the payments list
        const updatedPayments = payments.filter(p => p.id !== paymentId);
        setPayments(updatedPayments);
      } else {
        const data = await response.json();
        toast.error(data?.message || 'Failed to delete repayment');
      }
    } catch (error: any) {
      toast.error('Failed to delete repayment');
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading payment history...</div>;

  return (
    <>
      {/* Summary Section */}
      {/* {employeeInfo && totals && (
        <Card className="mb-6 shadow-sm border border-gray-200 bg-white rounded-lg">
          <CardHeader className="bg-muted/50 rounded-t-lg p-4">
            <CardTitle className="text-lg font-semibold">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Employee</h3>
                <p className="text-2xl font-bold text-primary">{employeeInfo.name}</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Advance Balance</h3>
                <p className="text-2xl font-bold text-destructive">SAR {employeeInfo.total_advance_balance.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Deduction</h3>
                <p className="text-2xl font-bold text-primary">SAR {totals.monthly_deduction.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Active Advances Section */}
      {/* {activeAdvances.length > 0 && (
        <Card className="mb-6 shadow-sm border border-gray-200 bg-white rounded-lg">
          <CardHeader className="bg-muted/50 rounded-t-lg p-4 flex flex-row items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Active Advances</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Repaid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Deduction</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {activeAdvances.map((advance) => (
                    <tr key={advance.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">SAR {Number(advance.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">SAR {Number(advance.repaid_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-destructive">SAR {Number(advance.balance).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          advance.status === 'approved' ? 'bg-green-100 text-green-800' :
                          advance.status === 'partially_repaid' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {advance.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">SAR {Number(advance.monthly_deduction).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )} */}

      {/* Payment History Section */}
      <Card className="mt-6 shadow-sm border border-gray-200 bg-white rounded-lg">
      <CardHeader className="bg-muted/50 rounded-t-lg p-4 flex flex-row items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-semibold">Repayment History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
                         <tbody className="bg-white divide-y divide-gray-100">
               {payments.length > 0 ? (
                 payments.map((p: Payment, i: number) => (
                   <tr key={p.id || i} className="hover:bg-muted/20 transition-colors">
                     <td className="px-6 py-4 whitespace-nowrap font-medium text-primary">SAR {Number(p.amount).toFixed(2)}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{new Date(p.payment_date).toLocaleDateString()}</td>
                     <td className="px-6 py-4 whitespace-nowrap">{p.notes || '-'}</td>
                     <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                               <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => window.open(`/modules/employee-management/${employeeId}/payments/${p.id}/receipt`, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                       <Button
                         variant="outline"
                         size="icon"
                         className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                         onClick={() => { setSelectedPaymentId(p.id); setShowDeleteDialog(true); }}
                         disabled={deletingId === p.id}
                       >
                         {deletingId === p.id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                       </Button>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                     No repayment history found.
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Repayment</DialogTitle>
              <DialogDescription>Are you sure you want to delete this repayment? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deletingId === selectedPaymentId}
                onClick={() => selectedPaymentId && handleRepaymentDelete(selectedPaymentId)}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
                 </Dialog>
       </CardContent>
     </Card>
     </>
   );
 } 