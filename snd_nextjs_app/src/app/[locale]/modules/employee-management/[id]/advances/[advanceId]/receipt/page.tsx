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
  advance: {
    id: number;
    amount: number;
    reason: string;
    purpose: string;
    status: string;
    payment_date: string | null;
    repaid_amount: number;
    monthly_deduction: number | null;
    balance: number;
    created_at: string;
    approved_at: string | null;
    notes?: string;
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

export default function AdvanceReceiptPage() {
  const params = useParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const employeeId = params.id as string;
  const advanceId = params.advanceId as string;
  const locale = params.locale as string || 'en';
  const { printRef, handlePrint } = usePrint({
    documentTitle: `Advance-Receipt-${employeeId}-${advanceId}`,
    waitForImages: true,
    onPrintError: error => {
      console.error('Print error:', error);
    },
  });

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`/api/employee/${employeeId}/advances/${advanceId}/receipt`);
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

    if (employeeId && advanceId) {
      fetchReceipt();
    }
  }, [employeeId, advanceId]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      case 'paid':
        return <Badge className="bg-blue-500">Paid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDownload = () => {
    if (!receiptData) return;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ADVANCE RECEIPT', pageWidth / 2, currentY, { align: 'center' });
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
    doc.text(`Advance ID: ${receiptData.advance.id}`, margin + 5, currentY);
    doc.text(
      `Date: ${receiptData.advance.payment_date || receiptData.advance.created_at.slice(0, 10)}`,
      pageWidth - margin - 50,
      currentY
    );
    currentY += 6;

    doc.text(`Employee: ${receiptData.employee.name}`, margin + 5, currentY);
    doc.text(`ID: ${receiptData.employee.employee_id}`, pageWidth - margin - 50, currentY);
    currentY += 6;

    doc.text(`Position: ${receiptData.employee.position}`, margin + 5, currentY);
    doc.text(`Status: ${receiptData.advance.status}`, pageWidth - margin - 50, currentY);
    currentY += 15;

    // Advance Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Advance Details:', margin, currentY);
    currentY += 10;

    // Amount Box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 40, 'F');
    doc.setDrawColor(0);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Amount: ${receiptData.advance.amount.toFixed(2)} SAR`, margin + 5, currentY + 8);
    currentY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Purpose: ${receiptData.advance.reason || receiptData.advance.purpose}`, margin + 5, currentY);
    currentY += 6;

    doc.text(`Repaid Amount: ${receiptData.advance.repaid_amount.toFixed(2)} SAR`, margin + 5, currentY);
    doc.text(
      `Remaining Balance: ${receiptData.advance.balance.toFixed(2)} SAR`,
      pageWidth - margin - 50,
      currentY
    );
    currentY += 6;

    if (receiptData.advance.monthly_deduction) {
      doc.text(
        `Monthly Deduction: ${receiptData.advance.monthly_deduction.toFixed(2)} SAR`,
        margin + 5,
        currentY
      );
      currentY += 6;
    }

    currentY += 10;

    // Notes if available
    if (receiptData.advance.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Notes:', margin, currentY);
      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const notes = receiptData.advance.notes;
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, currentY);
      currentY += splitNotes.length * 5 + 10;
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('This is a computer-generated receipt.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    // Save the PDF
    const filename = `Advance_Receipt_${receiptData.employee.employee_id}_${receiptData.advance.id}.pdf`;
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
            <Link href={`/${locale}/modules/employee-management/${employeeId}?tab=advances`}>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Advance Receipt</h2>
                <p className="text-gray-600">Advance #{receiptData.advance.id}</p>
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
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Details</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {receiptData.advance.payment_date || receiptData.advance.created_at.slice(0, 10)
                        ? new Date(
                            receiptData.advance.payment_date ||
                              receiptData.advance.created_at.slice(0, 10)
                          ).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      <span className="font-bold text-green-600">
                        SAR {Number(receiptData.advance.amount).toFixed(2)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span> {getStatusBadge(receiptData.advance.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advance Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <span className="font-medium">Purpose:</span> {receiptData.advance.reason || receiptData.advance.purpose}
                    </p>
                    <p>
                      <span className="font-medium">Total Advance:</span> SAR{' '}
                      {Number(receiptData.advance.amount).toFixed(2)}
                    </p>
                    {receiptData.advance.monthly_deduction && (
                      <p>
                        <span className="font-medium">Monthly Deduction:</span> SAR{' '}
                        {Number(receiptData.advance.monthly_deduction).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Total Repaid:</span> SAR{' '}
                      {Number(receiptData.advance.repaid_amount).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Remaining Balance:</span> SAR{' '}
                      <span className="font-bold text-orange-600">
                        {Number(receiptData.advance.balance).toFixed(2)}
                      </span>
                    </p>
                    {receiptData.advance.approved_at && (
                      <p>
                        <span className="font-medium">Approved Date:</span>{' '}
                        {new Date(receiptData.advance.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {receiptData.advance.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Notes</h3>
                  <p className="text-gray-600">{receiptData.advance.notes}</p>
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
            <Link href={`/${locale}/modules/employee-management/${employeeId}?tab=advances`}>
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Advance Receipt</h2>
                <p className="text-gray-600">Advance #{receiptData.advance.id}</p>
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
                      <span className="font-medium">Employee ID:</span> {receiptData.employee.employee_id}
                    </p>
                    <p>
                      <span className="font-medium">Position:</span> {receiptData.employee.position}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Details</h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {receiptData.advance.payment_date || receiptData.advance.created_at.slice(0, 10)
                        ? new Date(
                            receiptData.advance.payment_date ||
                              receiptData.advance.created_at.slice(0, 10)
                          ).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span>{' '}
                      <span className="font-bold text-green-600">
                        SAR {Number(receiptData.advance.amount).toFixed(2)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span> {getStatusBadge(receiptData.advance.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advance Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Advance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <span className="font-medium">Purpose:</span> {receiptData.advance.reason || receiptData.advance.purpose}
                    </p>
                    <p>
                      <span className="font-medium">Total Advance:</span> SAR{' '}
                      {Number(receiptData.advance.amount).toFixed(2)}
                    </p>
                    {receiptData.advance.monthly_deduction && (
                      <p>
                        <span className="font-medium">Monthly Deduction:</span> SAR{' '}
                        {Number(receiptData.advance.monthly_deduction).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">Total Repaid:</span> SAR{' '}
                      {Number(receiptData.advance.repaid_amount).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Remaining Balance:</span> SAR{' '}
                      <span className="font-bold text-orange-600">
                        {Number(receiptData.advance.balance).toFixed(2)}
                      </span>
                    </p>
                    {receiptData.advance.approved_at && (
                      <p>
                        <span className="font-medium">Approved Date:</span>{' '}
                        {new Date(receiptData.advance.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {receiptData.advance.notes && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{receiptData.advance.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t pt-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p>
                      <span className="font-medium">Receipt Generated:</span>{' '}
                      {new Date(receiptData.advance.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>This is an official advance receipt</p>
                    <p>Thank you for your request</p>
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

