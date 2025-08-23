'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePrint } from '@/hooks/use-print';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ReceiptData {
  payment: {
    id: number;
    amount: number;
    payment_date: string;
    notes?: string;
    recorded_by: string;
    created_at: string;
  };
  advance?: {
    id: number;
    amount: number;
    reason: string;
    payment_date: string | null;
    repaid_amount: number;
    balance: number;
  };
  employee: {
    id: number;
    name: string;
    position: string;
    employee_id: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function ReceiptPage() {
  const params = useParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params.id as string;
  const paymentId = params.paymentId as string;
  const { printRef, handlePrint } = usePrint({
    documentTitle: `Payment-Receipt-${employeeId}-${paymentId}`,
    waitForImages: true,
    onPrintError: error => {
      
      // Continue with print even if there are image errors
    },
  });

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/employee/${employeeId}/payments/${paymentId}/receipt`);
        if (response.ok) {
          const data = await response.json();
          setReceiptData(data.receipt);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load receipt');
        }
      } catch (error) {
        setError('Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId && paymentId) {
      fetchReceipt();
    }
  }, [employeeId, paymentId]);

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Receipt not found'}</p>
            <Link href={`/modules/employee-management/${employeeId}?tab=advances`}>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employee
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Print container - only visible when printing */}
      <div ref={printRef} className="hidden print:block">
        <div className="max-w-4xl mx-auto">
          {/* Receipt */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              {/* Company Header */}
              <div className="text-center mb-8 border-b pb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{receiptData.company.name}</h1>
                <p className="text-gray-600">{receiptData.company.address}</p>
                <p className="text-gray-600">
                  Phone: {receiptData.company.phone} | Email: {receiptData.company.email}
                </p>
              </div>

              {/* Receipt Title */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Receipt</h2>
                <p className="text-gray-600">Receipt #{receiptData.payment.id}</p>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Employee Information</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span> {receiptData.employee.name}
                    </p>

                    <p>
                      <span className="font-medium">Position:</span> {receiptData.employee.position}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Payment Details</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Payment Date:</span>{' '}
                      {new Date(receiptData.payment.payment_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      <span className="font-bold text-green-600">
                        SAR {Number(receiptData.payment.amount).toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Recorded By:</span>{' '}
                      {receiptData.payment.recorded_by}
                    </p>
                  </div>
                </div>
              </div>

              {/* Advance Information */}
              {receiptData.advance && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <span className="font-medium">Advance ID:</span> #{receiptData.advance.id}
                      </p>
                      <p>
                        <span className="font-medium">Advance Amount:</span> SAR{' '}
                        {Number(receiptData.advance.amount).toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Advance Date:</span>{' '}
                        {new Date(receiptData.advance.advance_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Purpose:</span> {receiptData.advance.purpose}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant={receiptData.advance.status === 'approved' ? 'default' : 'secondary'}>
                          {receiptData.advance.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {receiptData.payment.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Notes</h3>
                  <p className="text-gray-600">{receiptData.payment.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-6 border-t">
                <p className="text-sm text-gray-500">
                  This receipt was generated on {new Date().toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content - visible normally, hidden when printing */}
      <div className="block print:hidden">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/modules/employee-management/${employeeId}?tab=advances`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employee
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Receipt */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Company Header */}
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{receiptData.company.name}</h1>
              <p className="text-gray-600">{receiptData.company.address}</p>
              <p className="text-gray-600">
                Phone: {receiptData.company.phone} | Email: {receiptData.company.email}
              </p>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Receipt</h2>
              <p className="text-gray-600">Receipt #{receiptData.payment.id}</p>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Employee Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span> {receiptData.employee.name}
                  </p>
                  <p>
                    <span className="font-medium">Employee ID:</span>{' '}
                    {receiptData.employee.employee_id}
                  </p>
                  <p>
                    <span className="font-medium">Position:</span> {receiptData.employee.position}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Payment Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Payment Date:</span>{' '}
                    {new Date(receiptData.payment.payment_date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span>{' '}
                    <span className="font-bold text-green-600">
                      SAR {Number(receiptData.payment.amount).toFixed(2)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Recorded By:</span>{' '}
                    {receiptData.payment.recorded_by}
                  </p>
                </div>
              </div>
            </div>

            {/* Advance Information */}
            {receiptData.advance && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <span className="font-medium">Advance ID:</span> #{receiptData.advance.id}
                    </p>
                    <p>
                      <span className="font-medium">Advance Amount:</span> SAR{' '}
                      {Number(receiptData.advance.amount).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Reason:</span> {receiptData.advance.reason}
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Total Repaid:</span> SAR{' '}
                      {Number(receiptData.advance.repaid_amount).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Remaining Balance:</span> SAR{' '}
                      {Number(receiptData.advance.balance).toFixed(2)}
                    </p>
                    {receiptData.advance.payment_date && (
                      <p>
                        <span className="font-medium">Advance Date:</span>{' '}
                        {new Date(receiptData.advance.payment_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Notes */}
            {receiptData.payment.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {receiptData.payment.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>
                    <span className="font-medium">Receipt Generated:</span>{' '}
                    {new Date(receiptData.payment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p>This is an official payment receipt</p>
                  <p>Thank you for your payment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
