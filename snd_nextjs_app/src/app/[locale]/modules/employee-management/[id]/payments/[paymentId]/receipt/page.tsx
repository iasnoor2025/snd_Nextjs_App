'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrint } from '@/hooks/use-print';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

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
    if (!receiptData) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('PAYMENT RECEIPT', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Company Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(receiptData.company.name, margin, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(receiptData.company.address, margin, currentY);
    currentY += 5;
    doc.text(`Phone: ${receiptData.company.phone}`, margin, currentY);
    currentY += 5;
    doc.text(`Email: ${receiptData.company.email}`, margin, currentY);
    currentY += 15;

    // Receipt Details Box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 50);
    currentY += 8;

    // Receipt Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Receipt Details:', margin + 5, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Receipt ID: ${receiptData.payment.id}`, margin + 5, currentY);
    doc.text(`Date: ${new Date(receiptData.payment.payment_date).toLocaleDateString()}`, pageWidth - margin - 50, currentY);
    currentY += 6;

    doc.text(`Employee: ${receiptData.employee.name}`, margin + 5, currentY);
    doc.text(`ID: ${receiptData.employee.employee_id}`, pageWidth - margin - 50, currentY);
    currentY += 6;

    doc.text(`Position: ${receiptData.employee.position}`, margin + 5, currentY);
    currentY += 6;

    doc.text(`Recorded by: ${receiptData.payment.recorded_by}`, margin + 5, currentY);
    currentY += 15;

    // Payment Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Payment Details:', margin, currentY);
    currentY += 10;

    // Amount Box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 20, 'F');
    doc.setDrawColor(0);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Amount: ${receiptData.payment.amount.toFixed(2)} SAR`, margin + 5, currentY + 12);
    currentY += 30;

    // Notes if available
    if (receiptData.payment.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Notes:', margin, currentY);
      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const notes = receiptData.payment.notes;
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, currentY);
      currentY += splitNotes.length * 5 + 10;
    }

    // Advance details if available
    if (receiptData.advance) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Advance Payment Details:', margin, currentY);
      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Advance ID: ${receiptData.advance.id}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Reason: ${receiptData.advance.reason}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Total Advance: ${receiptData.advance.amount.toFixed(2)} SAR`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Repaid Amount: ${receiptData.advance.repaid_amount.toFixed(2)} SAR`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Remaining Balance: ${receiptData.advance.balance.toFixed(2)} SAR`, margin + 5, currentY);
      currentY += 15;
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('This is a computer-generated receipt.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save the PDF
    const filename = `Payment_Receipt_${receiptData.employee.employee_id}_${receiptData.payment.id}.pdf`;
    doc.save(filename);
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
                        {new Date(receiptData.advance.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Purpose:</span> {receiptData.advance.reason}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge variant="default">Paid</Badge>
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
