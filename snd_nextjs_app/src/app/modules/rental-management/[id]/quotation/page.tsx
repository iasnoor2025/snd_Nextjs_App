'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  CheckCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter, useParams } from 'next/navigation';
import { PDFGenerator } from '@/lib/pdf-generator';

interface QuotationItem {
  id: string;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  days?: number;
  rateType: string;
  rentalPeriod?: string;
  delivery?: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  vat?: string;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customer: Customer;
  rentalItems: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  depositAmount: number;
  paymentTermsDays: number;
  startDate: string;
  expectedEndDate?: string;
  notes?: string;
  createdAt: string;
  status: string;
  validity?: string;
  customerReference?: string;
  deliveryAddress?: string;
  projectName?: string;
  deliveryRequiredBy?: string;
  deliveryTerms?: string;
  shipVia?: string;
  shipmentTerms?: string;
}

export default function QuotationViewPage() {
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format amounts
  const formatAmount = (amount: any): string => {
    if (amount === null || amount === undefined) return '0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helper function to convert Decimal to number
  const convertDecimal = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'object' && value !== null) {
      // Handle Prisma Decimal type
      if (value.toFixed) {
        return parseFloat(value.toFixed(2));
      } else if (value.toString) {
        return parseFloat(value.toString()) || 0;
      }
    }
    return 0;
  };

  // Fetch quotation details
  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rentals/${rentalId}/quotation/view`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotation');
      }
      const data = await response.json();
  
      setQuotation(data.quotation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch quotation details');
    } finally {
      setLoading(false);
    }
  };

  // Print quotation
  const handlePrint = () => {
    window.print();
  };

  // Send quotation to customer
  const handleSendToCustomer = async () => {
    if (!quotation) return;

    try {
      // Here you would integrate with your email service
      // For now, we'll just show a success message
      toast.success(`Quotation sent to ${quotation.customer.email || 'customer'}`);

      // You could also update the quotation status to 'sent'
      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'quotation_sent'
        }),
      });

      if (response.ok) {
        toast.success('Quotation status updated');
        fetchQuotation();
      }
    } catch (err) {
      toast.error('Failed to send quotation');
    }
  };

  // Customer approval
  const handleCustomerApproval = async () => {
    if (!quotation) return;

    try {
      const response = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve quotation');
      }

      toast.success('Quotation approved successfully!');
      router.push(`/modules/rental-management/${rentalId}`);
    } catch (err) {
      toast.error('Failed to approve quotation');
    }
  };

  // Download quotation as PDF
  const handleDownload = async () => {
    if (!quotation) return;

    // Validate quotation data before generating PDF
    if (!quotation.rentalItems || quotation.rentalItems.length === 0) {
      toast.error('No rental items found in quotation');
      return;
    }

    // Check for missing equipment names
    const invalidItems = quotation.rentalItems.filter(item => !item.equipmentName);
    if (invalidItems.length > 0) {
      toast.error('Some rental items are missing equipment names');
      return;
    }

    try {
      // Show loading toast
      toast.loading('Generating PDF...');

      // Generate PDF using the PDF generator service
      const pdfData = {
        quotationNumber: quotation.quotationNumber,
        customer: {
          ...quotation.customer,
          company: quotation.customer.company || 'C.A.T. INTERNATIONAL L.L.C.',
          vat: quotation.customer.vat || ''
        },
        rentalItems: quotation.rentalItems.map(item => ({
          ...item,
          equipmentName: item.equipmentName || 'Unknown Equipment',
          rateType: item.rateType || 'Daily',
          quantity: item.quantity || 1,
          unitPrice: convertDecimal(item.unitPrice),
          totalPrice: convertDecimal(item.totalPrice),
          rentalPeriod: item.rentalPeriod || '26/10',
          delivery: item.delivery || ''
        })),
        subtotal: convertDecimal(quotation.subtotal),
        taxAmount: convertDecimal(quotation.taxAmount),
        totalAmount: convertDecimal(quotation.totalAmount),
        discount: convertDecimal(quotation.discount),
        tax: convertDecimal(quotation.tax),
        depositAmount: convertDecimal(quotation.depositAmount),
        paymentTermsDays: quotation.paymentTermsDays,
        startDate: quotation.startDate,
        expectedEndDate: quotation.expectedEndDate,
        notes: quotation.notes,
        createdAt: quotation.createdAt,
        validity: quotation.validity || '',
        customerReference: quotation.customerReference || '',
        deliveryAddress: quotation.deliveryAddress || '',
        projectName: quotation.projectName || '',
        deliveryRequiredBy: quotation.deliveryRequiredBy || '',
        deliveryTerms: quotation.deliveryTerms || '',
        status: quotation.status || '',
        shipVia: quotation.shipVia || 'Your Truck',
        shipmentTerms: quotation.shipmentTerms || ''
      };

  
      const pdfBlob = await PDFGenerator.generateQuotationPDF(pdfData);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Quotation downloaded successfully');
    } catch (err) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      toast.error(errorMessage);
      console.error('PDF generation error:', err);
    }
  };

  // Alternative: Generate PDF from HTML content
  const handleDownloadFromHTML = async () => {
    if (!quotation) return;

    try {
      // Show loading toast
      toast.loading('Generating PDF from content...');

      // Wait a bit for the content to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF from HTML content
      const pdfBlob = await PDFGenerator.generatePDFFromHTML('quotation-content', `quotation-${quotation.quotationNumber}.pdf`);

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('Quotation downloaded successfully');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to generate PDF from content');
      console.error('PDF generation error:', err);
    }
  };

  useEffect(() => {
    if (rentalId) {
      fetchQuotation();
    }
  }, [rentalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 text-lg">Error: {error || 'Quotation not found'}</p>
          <Button onClick={() => router.push(`/modules/rental-management/${rentalId}`)} className="mt-4">
            Back to Rental
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/modules/rental-management/${rentalId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rental
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Quotation #{quotation.quotationNumber}</h1>
            <p className="text-muted-foreground">
              {quotation.customer.name} • {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
                 <div className="flex gap-2">
           <Button variant="outline" onClick={handleDownload}>
             <Download className="w-4 h-4 mr-2" />
             Download PDF
           </Button>
           <Button variant="outline" onClick={handleDownloadFromHTML}>
             <Download className="w-4 h-4 mr-2" />
             Download HTML
           </Button>
           <Button variant="outline" onClick={handlePrint}>
             <Printer className="w-4 h-4 mr-2" />
             Print
           </Button>
           <Button onClick={handleSendToCustomer}>
             <Mail className="w-4 h-4 mr-2" />
             Send to Customer
           </Button>
         </div>
      </div>

      {/* Quotation Content */}
      <div id="quotation-content" className="max-w-4xl mx-auto">
        {/* Company Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary">Your Company Name</h2>
                <p className="text-muted-foreground">123 Business Street</p>
                <p className="text-muted-foreground">City, State 12345</p>
                <p className="text-muted-foreground">Phone: (555) 123-4567</p>
                <p className="text-muted-foreground">Email: info@yourcompany.com</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-semibold text-primary">QUOTATION</h3>
                <p className="text-sm text-muted-foreground">Quotation #: {quotation.quotationNumber}</p>
                <p className="text-sm text-muted-foreground">Date: {format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-muted-foreground">Valid Until: {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">{quotation.customer.name}</p>
                {quotation.customer.email && <p className="text-sm text-muted-foreground">{quotation.customer.email}</p>}
                {quotation.customer.phone && <p className="text-sm text-muted-foreground">{quotation.customer.phone}</p>}
              </div>
              <div>
                {quotation.customer.address && <p className="text-sm text-muted-foreground">{quotation.customer.address}</p>}
                {quotation.customer.city && <p className="text-sm text-muted-foreground">{quotation.customer.city}, {quotation.customer.state}</p>}
                {quotation.customer.postalCode && <p className="text-sm text-muted-foreground">{quotation.customer.postalCode}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Rental Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{format(new Date(quotation.startDate), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected End Date</p>
                <p className="font-semibold">
                  {quotation.expectedEndDate
                    ? format(new Date(quotation.expectedEndDate), 'MMM dd, yyyy')
                    : 'To be determined'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-semibold">{quotation.paymentTermsDays} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposit Required</p>
                <p className="font-semibold">${formatAmount(quotation.depositAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Equipment & Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate Type</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.rentalItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.equipmentName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.rateType}</TableCell>
                    <TableCell>${formatAmount(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">${formatAmount(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${formatAmount(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({quotation.tax}%):</span>
                <span>${formatAmount(quotation.taxAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${formatAmount(quotation.discount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>${formatAmount(quotation.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Deposit Required:</span>
                <span>${formatAmount(quotation.depositAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Payment Terms</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Payment is due within {quotation.paymentTermsDays} days of invoice date</li>
                <li>• A deposit of ${formatAmount(quotation.depositAmount)} is required to secure the rental</li>
                <li>• Late payments may incur additional charges</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rental Terms</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Equipment must be returned in the same condition as received</li>
                <li>• Any damage or loss will be charged at replacement cost</li>
                <li>• Cancellation must be made 24 hours in advance</li>
              </ul>
            </div>
            {quotation.notes && (
              <div>
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-sm text-muted-foreground">{quotation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please review this quotation and contact us to confirm your approval.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => router.push(`/modules/rental-management/${rentalId}`)}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Rental Details
                </Button>
                <Button onClick={handleSendToCustomer}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send to Customer
                </Button>
                <Button onClick={handleCustomerApproval}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Quotation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
