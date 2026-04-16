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
import {
  ARABIC_FONT_NAME,
  applyArabicFontToPdf,
  loadArabicFontDataForPdf,
  textContainsArabic,
} from '@/lib/utils/pdf-arabic-font';

/** Default branding when company.logo is not set in DB */
const DEFAULT_COMPANY_LOGO_PATH = '/snd-logo.png';

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
    logo: string | null;
  };
}

function CompanyReceiptHeader({ company }: { company: ReceiptData['company'] }) {
  const logoSrc = (company.logo && company.logo.trim()) || DEFAULT_COMPANY_LOGO_PATH;
  return (
    <div className="mb-8 border-b border-gray-200 pb-6">
      <div className="flex flex-row items-center gap-4 md:gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- public + optional S3 URLs */}
        <img
          src={logoSrc}
          alt=""
          className="h-14 w-auto max-h-20 max-w-[140px] shrink-0 object-contain md:h-16 print:h-14"
        />
        <div className="min-w-0 flex-1 text-left">
          <h1 className="text-xl font-bold leading-tight text-gray-900 md:text-2xl">{company.name}</h1>
        </div>
      </div>
    </div>
  );
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

  const handleDownload = async () => {
    if (!receiptData) return;

    const arabicFontData = await loadArabicFontDataForPdf();
    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const innerW = pageWidth - 2 * margin;
    const rightX = pageWidth - margin - 3;

    if (arabicFontData) {
      applyArabicFontToPdf(doc, arabicFontData, false);
    }
    const notoReady = !!arabicFontData;

    const setLatin = (style: 'normal' | 'bold' = 'normal') => {
      doc.setFont('helvetica', style);
    };

    const setFontForString = (s: string) => {
      if (notoReady && textContainsArabic(s)) {
        doc.setFont(ARABIC_FONT_NAME, 'normal');
      } else {
        doc.setFont('helvetica', 'normal');
      }
    };

    const headerTop = 14;
    const logoW = 30;
    const logoH = 12;
    const textX = margin + logoW + 5;
    const textMaxW = pageWidth - textX - margin;

    const loadLogoImage = async (): Promise<{ dataUrl: string; fmt: 'PNG' | 'JPEG' } | null> => {
      const candidates = Array.from(
        new Set(
          [receiptData.company.logo?.trim(), DEFAULT_COMPANY_LOGO_PATH].filter((u): u is string => !!u)
        )
      );
      for (const path of candidates) {
        try {
          const href = path.startsWith('http') ? path : new URL(path, window.location.origin).href;
          const res = await fetch(href, { mode: path.startsWith('http') ? 'cors' : 'same-origin' });
          if (!res.ok) continue;
          const blob = await res.blob();
          const mime = blob.type || '';
          const fmt: 'PNG' | 'JPEG' = mime.includes('png') ? 'PNG' : 'JPEG';
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
          return { dataUrl, fmt };
        } catch {
          /* try next */
        }
      }
      return null;
    };

    const logoImg = await loadLogoImage();
    if (logoImg) {
      doc.addImage(logoImg.dataUrl, logoImg.fmt, margin, headerTop, logoW, logoH);
    }

    let y = headerTop + 5;
    setLatin('bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    const nameLines = doc.splitTextToSize(receiptData.company.name, textMaxW);
    nameLines.forEach(line => {
      doc.text(line, textX, y);
      y += 5;
    });

    const textBlockBottom = y + 1;
    const logoBottom = headerTop + logoH;
    y = Math.max(textBlockBottom, logoBottom) + 8;

    setLatin('bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.text('ADVANCE RECEIPT', pageWidth / 2, y, { align: 'center' });
    y += 7;
    setLatin('normal');
    doc.setFontSize(10);
    doc.text(`Advance #${receiptData.advance.id}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Receipt Details — outline box; section title stays inside top padding (no overlap with next section)
    const receiptBoxTop = y;
    y += 5;
    setLatin('bold');
    doc.setFontSize(10);
    doc.text('Receipt Details', margin + 3, y);
    y += 5.5;
    setLatin('normal');
    doc.setFontSize(9.5);
    const dateStr =
      receiptData.advance.payment_date || receiptData.advance.created_at.slice(0, 10) || '—';
    doc.text(`Advance ID: ${receiptData.advance.id}`, margin + 3, y);
    doc.text(`Date: ${dateStr}`, rightX, y, { align: 'right' });
    y += 5.5;
    doc.text(`Employee: ${receiptData.employee.name}`, margin + 3, y);
    doc.text(`ID: ${receiptData.employee.employee_id}`, rightX, y, { align: 'right' });
    y += 5.5;
    doc.text(`Position: ${receiptData.employee.position}`, margin + 3, y);
    doc.text(`Status: ${receiptData.advance.status}`, rightX, y, { align: 'right' });
    y += 6;
    const receiptBoxBottom = y + 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.35);
    doc.rect(margin, receiptBoxTop, innerW, receiptBoxBottom - receiptBoxTop);
    y = receiptBoxBottom + 9;

    // Advance Details — heading outside the gray box
    setLatin('bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Advance Details', margin, y);
    y += 7;

    const pad = 4;
    const lineH = 4.6;

    const purposeRaw = String(receiptData.advance.reason || receiptData.advance.purpose || '—');
    const purposeTextWidth = innerW - 2 * pad;
    /**
     * Label "Purpose:" must use Helvetica. Value text must be wrapped with the font that contains its glyphs:
     * Helvetica cannot measure Arabic, so splitTextToSize on "Purpose: …Arabic" often yields [] — nothing drawn.
     */
    doc.setFontSize(9.5);
    const wrapPurposeValue = (): string[] => {
      if (notoReady && textContainsArabic(purposeRaw)) {
        setFontForString(purposeRaw);
      } else {
        setLatin('normal');
      }
      doc.setFontSize(9.5);
      let lines = doc.splitTextToSize(purposeRaw, purposeTextWidth);
      if (lines.length === 0 && purposeRaw.trim()) {
        lines = [purposeRaw];
      }
      return lines;
    };
    const purposeValueLines = wrapPurposeValue();
    setLatin('normal');

    const hasMonthly =
      receiptData.advance.monthly_deduction != null && receiptData.advance.monthly_deduction !== undefined;

    let measureY = y + pad + 2;
    measureY += 7;
    measureY += 4.5;
    measureY += purposeValueLines.length * lineH;
    measureY += 2;
    measureY += 5.5;
    if (hasMonthly) measureY += 5;
    const grayH = measureY - y + pad;

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(210, 210, 210);
    doc.rect(margin, y, innerW, grayH, 'FD');

    let ty = y + pad + 2;
    setLatin('bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 120, 60);
    doc.text(`Amount: SAR ${receiptData.advance.amount.toFixed(2)}`, margin + pad, ty);
    doc.setTextColor(0, 0, 0);
    ty += 7;

    setLatin('normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Purpose:', margin + pad, ty);
    ty += 4.5;

    doc.setFontSize(9.5);
    purposeValueLines.forEach(line => {
      setFontForString(line);
      doc.text(line, margin + pad, ty);
      ty += lineH;
    });
    setLatin('normal');
    ty += 2;

    doc.setFontSize(9.5);
    doc.text(`Repaid Amount: SAR ${receiptData.advance.repaid_amount.toFixed(2)}`, margin + pad, ty);
    doc.setTextColor(180, 80, 20);
    doc.text(`Remaining Balance: SAR ${receiptData.advance.balance.toFixed(2)}`, rightX, ty, {
      align: 'right',
    });
    doc.setTextColor(0, 0, 0);
    ty += 5.5;

    if (hasMonthly) {
      doc.text(`Monthly Deduction: SAR ${Number(receiptData.advance.monthly_deduction).toFixed(2)}`, margin + pad, ty);
    }

    y = y + grayH + 8;

    if (receiptData.advance.notes) {
      setLatin('bold');
      doc.setFontSize(10);
      doc.text('Notes', margin, y);
      y += 5;
      setLatin('normal');
      doc.setFontSize(9);
      setFontForString(receiptData.advance.notes);
      const noteLines = doc.splitTextToSize(receiptData.advance.notes, innerW);
      noteLines.forEach(line => {
        doc.text(line, margin, y);
        y += 4.5;
      });
      setLatin('normal');
      y += 6;
    }

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('This is an official advance receipt.', margin, pageHeight - 14);
    doc.text(`Generated: ${new Date().toLocaleString()}`, rightX, pageHeight - 14, { align: 'right' });

    doc.save(`Advance_Receipt_${receiptData.employee.employee_id}_${receiptData.advance.id}.pdf`);
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
            <Link href={`/${locale}/employee-management/${employeeId}?tab=advances`}>
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
              <CompanyReceiptHeader company={receiptData.company} />

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
                    <p dir="auto">
                      <span className="font-medium">Purpose:</span>{' '}
                      {receiptData.advance.reason || receiptData.advance.purpose}
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
            <Link href={`/${locale}/employee-management/${employeeId}?tab=advances`}>
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
              <CompanyReceiptHeader company={receiptData.company} />

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
                    <p dir="auto">
                      <span className="font-medium">Purpose:</span>{' '}
                      {receiptData.advance.reason || receiptData.advance.purpose}
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

