'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PDFGenerator } from '@/lib/pdf-generator';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface QuotationItem {
  id: number;
  rentalId: number;
  equipmentId: number;
  equipmentName: string;
  unitPrice: string;
  totalPrice: string;
  rateType: string;
  operatorId?: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  equipmentModelNumber?: string;
  equipmentCategoryId?: number;
  quantity?: number; // Optional since API doesn't provide it
  rentalPeriod?: string;
}

interface Quotation {
  id: number;
  quotationNumber: string;
  displayNumber: string;
  customer: {
    name: string;
    company?: string;
    address?: string;
    vat?: string;
    email?: string;
    phone?: string;
  };
  rentalItems: QuotationItem[];
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  discount: string;
  tax: string;
  depositAmount: string;
  paymentTermsDays: number;
  startDate: string;
  expectedEndDate?: string;
  notes?: string;
  createdAt: string;
  validity?: string;
  customerReference?: string;
  deliveryAddress?: string;
  projectName?: string;
  deliveryRequiredBy?: string;
  deliveryTerms?: string;
  status?: string;
  shipVia?: string;
  shipmentTerms?: string;
}

export default function QuotationViewPage() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobilizationRate, setMobilizationRate] = useState<number>(500.0);
  const [demobilizationRate, setDemobilizationRate] = useState<number>(500.0);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [deliveryTerms, setDeliveryTerms] = useState<string>('');
  const [shipmentTerms, setShipmentTerms] = useState<string>('');
  const [additionalTerms, setAdditionalTerms] = useState<string>('');
  const [rentalTerms, setRentalTerms] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [mdTerms, setMdTerms] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveNotes, setSaveNotes] = useState<string>('');

  // Terms visibility state
  const [showGeneralNotes, setShowGeneralNotes] = useState<boolean>(false);
  const [showDeliveryTerms, setShowDeliveryTerms] = useState<boolean>(false);
  const [showShipmentTerms, setShowShipmentTerms] = useState<boolean>(false);
  const [showRentalTerms, setShowRentalTerms] = useState<boolean>(false);
  const [showPaymentTerms, setShowPaymentTerms] = useState<boolean>(false);
  const [showAdditionalTerms, setShowAdditionalTerms] = useState<boolean>(false);
  const [showMdTerms, setShowMdTerms] = useState<boolean>(false);

  // Ref for cursor positioning
  const cursorPositionRef = useRef<{ position: number; textarea: HTMLTextAreaElement | null }>({
    position: 0,
    textarea: null,
  });

  // Calculate total M&D cost
  const calculateTotalMDCost = () => {
    return mobilizationRate + demobilizationRate;
  };

  // Helper function to add bullet points and continue numbering
  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    setter: (value: string) => void,
    currentValue: string,
    fieldType?: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      try {
        const textarea = e.currentTarget;
        if (!textarea) {
          console.log('Textarea is null');
          return;
        }

        const cursorPosition = textarea.selectionStart || 0;
        const textBeforeCursor = currentValue.substring(0, cursorPosition);
        const textAfterCursor = currentValue.substring(cursorPosition);

        // Check if we're at the beginning of a line or after a bullet point
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1] || '';
        const trimmedLine = currentLine.trim();

        console.log('Current line:', currentLine);
        console.log('Current line trimmed:', trimmedLine);
        console.log('Field type:', fieldType);

        // Special handling for Rental Terms - auto-insert company name
        if (fieldType === 'rentalTerms' && quotation?.customer?.company) {
          const companyName = quotation.customer.company;

          // Check for numbered list pattern (1., 2., 3., etc.)
          const numberedMatch = trimmedLine.match(/^(\d+)\./);
          if (numberedMatch) {
            const currentNumber = parseInt(numberedMatch[1]);
            const nextNumber = currentNumber + 1;
            console.log('Continuing numbered list with company name:', nextNumber);

            const newText =
              textBeforeCursor + '\n' + nextNumber + '. ' + companyName + ' provides ';
            setter(newText);

            // Store cursor position for next render cycle
            cursorPositionRef.current = {
              position:
                cursorPosition + (nextNumber.toString().length + 2) + companyName.length + 10,
              textarea: textarea,
            };
            return;
          }

          // Check for bullet point patterns
          const isBulletPoint =
            trimmedLine === '' ||
            trimmedLine.startsWith('•') ||
            trimmedLine.startsWith('*') ||
            trimmedLine.startsWith('-');

          if (isBulletPoint) {
            console.log('Adding bullet point with company name');
            const newText = textBeforeCursor + '\n• ' + companyName + ' provides ';
            setter(newText);

            // Store cursor position for next render cycle
            cursorPositionRef.current = {
              position: cursorPosition + 3 + companyName.length + 10,
              textarea: textarea,
            };
            return;
          }
        }

        // Regular handling for other fields
        // Check for numbered list pattern (1., 2., 3., etc.)
        const numberedMatch = trimmedLine.match(/^(\d+)\./);
        if (numberedMatch) {
          const currentNumber = parseInt(numberedMatch[1]);
          const nextNumber = currentNumber + 1;
          console.log('Continuing numbered list:', nextNumber);

          const newText = textBeforeCursor + '\n' + nextNumber + '. ' + textAfterCursor;
          setter(newText);

          // Store cursor position for next render cycle
          cursorPositionRef.current = {
            position: cursorPosition + (nextNumber.toString().length + 2),
            textarea: textarea,
          };
          return;
        }

        // Check for bullet point patterns
        const isBulletPoint =
          trimmedLine === '' ||
          trimmedLine.startsWith('•') ||
          trimmedLine.startsWith('*') ||
          trimmedLine.startsWith('-');

        console.log('Is bullet point:', isBulletPoint);

        // If current line starts with bullet or is empty, add new bullet
        if (isBulletPoint) {
          console.log('Adding bullet point');
          const newText = textBeforeCursor + '\n• ' + textAfterCursor;
          setter(newText);

          // Store cursor position for next render cycle
          cursorPositionRef.current = {
            position: cursorPosition + 3,
            textarea: textarea,
          };
        } else {
          console.log('Adding regular newline');
          // Regular new line
          const newText = textBeforeCursor + '\n' + textAfterCursor;
          setter(newText);
        }
      } catch (error) {
        console.warn('Error in bullet point handler:', error);
        // Fallback to regular newline
        const cursorPosition = e.currentTarget.selectionStart || 0;
        const textBeforeCursor = currentValue.substring(0, cursorPosition);
        const textAfterCursor = currentValue.substring(cursorPosition);
        const newText = textBeforeCursor + '\n' + textAfterCursor;
        setter(newText);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  // Handle cursor positioning after state updates
  useEffect(() => {
    if (cursorPositionRef.current.textarea && cursorPositionRef.current.position > 0) {
      try {
        const textarea = cursorPositionRef.current.textarea;
        const position = cursorPositionRef.current.position;

        // Reset the ref
        cursorPositionRef.current = { position: 0, textarea: null };

        // Set cursor position and focus
        setTimeout(() => {
          if (textarea && textarea.setSelectionRange) {
            textarea.setSelectionRange(position, position);
            textarea.focus();
          }
        }, 0);
      } catch (error) {
        console.warn('Could not set cursor position:', error);
      }
    }
  });

  // Handle saving terms and conditions
  const handleSaveTerms = async () => {
    if (!quotation || !id) return;
    setSaving(true);
    try {
      // Only include terms that are currently visible
      const termsToSave: any = {};

      if (showGeneralNotes) termsToSave.generalNotes = generalNotes;
      if (showDeliveryTerms) termsToSave.deliveryTerms = deliveryTerms;
      if (showShipmentTerms) termsToSave.shipmentTerms = shipmentTerms;
      if (showRentalTerms) termsToSave.rentalTerms = rentalTerms;
      if (showPaymentTerms) termsToSave.paymentTerms = paymentTerms;
      if (showAdditionalTerms) termsToSave.additionalTerms = additionalTerms;
      if (showMdTerms) termsToSave.mdTerms = mdTerms;

      const response = await fetch('/api/quotations/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: parseInt(id as string),
          terms: termsToSave,
          notes: saveNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save terms and conditions');
      }

      toast.success('Terms and conditions saved successfully!', {
        description: `Saved ${Object.keys(termsToSave).length} visible terms to the database.`,
      });
      setSaveDialogOpen(false);
      setSaveNotes('');
      // Optionally refresh the quotation data: await fetchQuotation();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save terms and conditions', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try again or contact support if the problem persists.',
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rentals/${id}/quotation/view`);

      if (!response.ok) {
        throw new Error(`Failed to fetch quotation: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate that required data exists
      if (!data || !data.customer || !data.customer.name) {
        throw new Error('Invalid quotation data received from server');
      }

      setQuotation(data);

      // Initialize terms from quotation data
      setGeneralNotes(data.notes || '');
      setDeliveryTerms(data.deliveryTerms || '');
      setShipmentTerms(data.shipmentTerms || '');
      setAdditionalTerms(data.additionalTerms || '');
      setRentalTerms(`1. Equipment operates 10 hours/day, 26 days/month. Fridays/holidays = overtime.
2. ${data.customer?.company || 'Company'} provides fuel (diesel).
3. ${data.customer?.company || 'Company'} provides accommodation, food & transportation.`);
      setPaymentTerms(`1. 50% advance payment required before equipment mobilization
2. Remaining 50% payment within 7 days of equipment delivery
3. Late payments subject to 2% monthly interest
4. All payments must be made in SAR currency`);
      setMdTerms(`• Timeline: Mobilization within 24-48 hours of rental approval
• Equipment preparation and loading included
• Rates subject to distance and equipment size`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotation');
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!quotation) return;

    try {
      const pdfBlob = await PDFGenerator.generateQuotationPDF(quotation);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quotation.quotationNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Quotation not found'}</p>
          <Button onClick={fetchQuotation} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Additional safety check for customer data
  if (!quotation.customer || !quotation.customer.name) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Data Error</h1>
          <p className="text-gray-600">Customer information is missing from this quotation</p>
          <Button onClick={fetchQuotation} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quotation {quotation.displayNumber}</h1>

        <div className="flex items-center gap-4">
          <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
            Download PDF
          </Button>
        </div>
      </div>

      {/* Quotation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {quotation.customer.name}
              </p>
              {quotation.customer.company && (
                <p>
                  <strong>Company:</strong> {quotation.customer.company}
                </p>
              )}
              {quotation.customer.address && (
                <p>
                  <strong>Address:</strong> {quotation.customer.address}
                </p>
              )}
              {quotation.customer.vat && (
                <p>
                  <strong>VAT:</strong> {quotation.customer.vat}
                </p>
              )}
              {quotation.customer.email && (
                <p>
                  <strong>Email:</strong> {quotation.customer.email}
                </p>
              )}
              {quotation.customer.phone && (
                <p>
                  <strong>Phone:</strong> {quotation.customer.phone}
                </p>
              )}
              {quotation.customerReference && (
                <p>
                  <strong>Reference:</strong> {quotation.customerReference}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>Quotation Number:</strong> {quotation.quotationNumber}
              </p>
              <p>
                <strong>Created Date:</strong> {new Date(quotation.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Start Date:</strong> {new Date(quotation.startDate).toLocaleDateString()}
              </p>
              {quotation.expectedEndDate && (
                <p>
                  <strong>End Date:</strong>{' '}
                  {new Date(quotation.expectedEndDate).toLocaleDateString()}
                </p>
              )}
              <p>
                <strong>Payment Terms:</strong> {quotation.paymentTermsDays} days
              </p>
              {quotation.projectName && (
                <p>
                  <strong>Project:</strong> {quotation.projectName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Rental Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Equipment</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Price</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Rate Type</th>
                  {quotation.rentalItems.some(item => item.rentalPeriod) && (
                    <th className="border border-gray-300 px-4 py-2 text-center">Period</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {quotation.rentalItems.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{item.equipmentName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.quantity || 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      SAR {item.unitPrice}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      SAR {item.totalPrice}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.rateType}
                    </td>
                    {quotation.rentalItems.some(item => item.rentalPeriod) && (
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {item.rentalPeriod || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p>
                <strong>Subtotal:</strong> SAR {parseFloat(quotation.subtotal).toFixed(2)}
              </p>
              <p>
                <strong>Tax ({quotation.tax}%):</strong> SAR{' '}
                {parseFloat(quotation.taxAmount).toFixed(2)}
              </p>
              <p>
                <strong>Total Amount:</strong> SAR {parseFloat(quotation.totalAmount).toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <p>
                <strong>Discount:</strong> SAR {parseFloat(quotation.discount).toFixed(2)}
              </p>
              <p>
                <strong>Deposit Required:</strong> SAR{' '}
                {parseFloat(quotation.depositAmount).toFixed(2)}
              </p>
              <p>
                <strong>Final Amount:</strong> SAR{' '}
                {(parseFloat(quotation.totalAmount) - parseFloat(quotation.discount)).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Terms and Conditions</span>
              <Badge variant="secondary" className="text-xs">
                {
                  [
                    showGeneralNotes,
                    showDeliveryTerms,
                    showShipmentTerms,
                    showRentalTerms,
                    showPaymentTerms,
                    showAdditionalTerms,
                    showMdTerms,
                  ].filter(Boolean).length
                }
                /7 Visible
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGeneralNotes(true);
                  setShowDeliveryTerms(true);
                  setShowShipmentTerms(true);
                  setShowRentalTerms(true);
                  setShowPaymentTerms(true);
                  setShowAdditionalTerms(true);
                  setShowMdTerms(true);
                }}
                className="text-xs"
              >
                Show All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowGeneralNotes(false);
                  setShowDeliveryTerms(false);
                  setShowShipmentTerms(false);
                  setShowRentalTerms(false);
                  setShowPaymentTerms(false);
                  setShowAdditionalTerms(false);
                  setShowMdTerms(false);
                }}
                className="text-xs"
              >
                Hide All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  General Notes
                </label>
                <Button
                  variant={showGeneralNotes ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowGeneralNotes(!showGeneralNotes)}
                  className={`text-xs ${showGeneralNotes ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showGeneralNotes ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showGeneralNotes && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list
                  </div>
                  <Textarea
                    id="notes"
                    placeholder="Enter general notes and terms..."
                    className="w-full"
                    rows={3}
                    value={generalNotes}
                    onChange={e => setGeneralNotes(e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, setGeneralNotes, generalNotes)}
                  />
                </>
              )}
            </div>

            {/* Delivery Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="deliveryTerms" className="block text-sm font-medium text-gray-700">
                  Delivery Terms
                </label>
                <Button
                  variant={showDeliveryTerms ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowDeliveryTerms(!showDeliveryTerms)}
                  className={`text-xs ${showDeliveryTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showDeliveryTerms ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showDeliveryTerms && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list
                  </div>
                  <Textarea
                    id="deliveryTerms"
                    placeholder="Enter delivery terms and conditions..."
                    className="w-full"
                    rows={3}
                    value={deliveryTerms}
                    onChange={e => setDeliveryTerms(e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, setDeliveryTerms, deliveryTerms)}
                  />
                </>
              )}
            </div>

            {/* Shipment Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="shipmentTerms" className="block text-sm font-medium text-gray-700">
                  Shipment Terms
                </label>
                <Button
                  variant={showShipmentTerms ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowShipmentTerms(!showShipmentTerms)}
                  className={`text-xs ${showShipmentTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showShipmentTerms ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showShipmentTerms && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list
                  </div>
                  <Textarea
                    id="shipmentTerms"
                    placeholder="Enter shipment terms and conditions..."
                    className="w-full"
                    rows={3}
                    value={shipmentTerms}
                    onChange={e => setShipmentTerms(e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, setShipmentTerms, shipmentTerms)}
                  />
                </>
              )}
            </div>

            {/* Mobilization & Demobilization Rates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Mobilization & Demobilization Rates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobilization Rate */}
                <div>
                  <label
                    htmlFor="mobilizationRate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mobilization Rate (per equipment)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      SAR
                    </span>
                    <input
                      type="number"
                      id="mobilizationRate"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={mobilizationRate}
                      onChange={e => {
                        const value = parseFloat(e.target.value) || 0;
                        setMobilizationRate(value);
                      }}
                    />
                  </div>
                </div>

                {/* Demobilization Rate */}
                <div>
                  <label
                    htmlFor="demobilizationRate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Demobilization Rate (per equipment)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      SAR
                    </span>
                    <input
                      type="number"
                      id="demobilizationRate"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={demobilizationRate}
                      onChange={e => {
                        const value = parseFloat(e.target.value) || 0;
                        setDemobilizationRate(value);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Total M&D Cost Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total M&D Cost (per equipment):
                  </span>
                  <span className="text-lg font-bold text-blue-600" id="totalMDCost">
                    SAR {calculateTotalMDCost().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Additional M&D Terms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="mdTerms" className="block text-sm font-medium text-gray-700">
                    Additional M&D Terms
                  </label>
                  <Button
                    variant={showMdTerms ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setShowMdTerms(!showMdTerms)}
                    className={`text-xs ${showMdTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    {showMdTerms ? '👁️ Hide' : '👁️ Show'}
                  </Button>
                </div>
                {showMdTerms && (
                  <>
                    <div className="text-xs text-gray-500 mb-1">
                      💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                      the list
                    </div>
                    <Textarea
                      id="mdTerms"
                      placeholder="Enter additional mobilization and demobilization terms..."
                      className="w-full"
                      rows={3}
                      value={mdTerms}
                      onChange={e => setMdTerms(e.target.value)}
                      onKeyDown={e => handleTextareaKeyDown(e, setMdTerms, mdTerms)}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Rental Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="rentalTerms" className="block text-sm font-medium text-gray-700">
                  Rental Terms
                </label>
                <Button
                  variant={showRentalTerms ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowRentalTerms(!showRentalTerms)}
                  className={`text-xs ${showRentalTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showRentalTerms ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showRentalTerms && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list with company name
                  </div>
                  <Textarea
                    id="rentalTerms"
                    placeholder="Enter rental terms and conditions..."
                    className="w-full"
                    rows={4}
                    value={rentalTerms}
                    onChange={e => setRentalTerms(e.target.value)}
                    onKeyDown={e =>
                      handleTextareaKeyDown(e, setRentalTerms, rentalTerms, 'rentalTerms')
                    }
                  />
                </>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                  Payment Terms
                </label>
                <Button
                  variant={showPaymentTerms ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowPaymentTerms(!showPaymentTerms)}
                  className={`text-xs ${showPaymentTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showPaymentTerms ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showPaymentTerms && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list
                  </div>
                  <Textarea
                    id="paymentTerms"
                    placeholder="Enter payment terms and conditions..."
                    className="w-full"
                    rows={3}
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, setPaymentTerms, paymentTerms)}
                  />
                </>
              )}
            </div>

            {/* Additional Terms */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="additionalTerms"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Terms
                </label>
                <Button
                  variant={showAdditionalTerms ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowAdditionalTerms(!showAdditionalTerms)}
                  className={`text-xs ${showAdditionalTerms ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {showAdditionalTerms ? '👁️ Hide' : '👁️ Show'}
                </Button>
              </div>
              {showAdditionalTerms && (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    💡 Press Enter after bullet points (•) or numbered items (1., 2.) to continue
                    the list
                  </div>
                  <Textarea
                    id="additionalTerms"
                    placeholder="Enter any additional terms and conditions..."
                    className="w-full"
                    rows={3}
                    value={additionalTerms}
                    onChange={e => setAdditionalTerms(e.target.value)}
                    onKeyDown={e => handleTextareaKeyDown(e, setAdditionalTerms, additionalTerms)}
                  />
                </>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 <strong>Tip:</strong> Press Enter after bullet points (•) or numbered items (1.,
                2.) to continue the list
              </div>
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={
                      ![
                        showGeneralNotes,
                        showDeliveryTerms,
                        showShipmentTerms,
                        showRentalTerms,
                        showPaymentTerms,
                        showAdditionalTerms,
                        showMdTerms,
                      ].some(Boolean)
                    }
                  >
                    Save Terms & Conditions
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Save Terms & Conditions</DialogTitle>
                    <DialogDescription>
                      Save all changes to the terms and conditions. You can add optional notes about
                      what was changed.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="saveNotes">Change Notes (Optional)</Label>
                      <Textarea
                        id="saveNotes"
                        placeholder="Describe what changes were made..."
                        value={saveNotes}
                        onChange={e => setSaveNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Terms to be saved:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>
                          • General Notes:{' '}
                          {showGeneralNotes ? (generalNotes ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                        <li>
                          • Delivery Terms:{' '}
                          {showDeliveryTerms ? (deliveryTerms ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                        <li>
                          • Shipment Terms:{' '}
                          {showShipmentTerms ? (shipmentTerms ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                        <li>
                          • Rental Terms:{' '}
                          {showRentalTerms ? (rentalTerms ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                        <li>
                          • Payment Terms:{' '}
                          {showPaymentTerms ? (paymentTerms ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                        <li>
                          • Additional Terms:{' '}
                          {showAdditionalTerms
                            ? additionalTerms
                              ? 'Modified'
                              : 'Empty'
                            : 'Hidden'}
                        </li>
                        <li>
                          • M&D Terms: {showMdTerms ? (mdTerms ? 'Modified' : 'Empty') : 'Hidden'}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTerms}
                      disabled={saving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Visible Terms Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Currently Visible Terms:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                <div>General Notes: {showGeneralNotes ? '✅ Visible' : '❌ Hidden'}</div>
                <div>Delivery Terms: {showDeliveryTerms ? '✅ Visible' : '❌ Hidden'}</div>
                <div>Shipment Terms: {showShipmentTerms ? '✅ Visible' : '❌ Hidden'}</div>
                <div>Rental Terms: {showRentalTerms ? '✅ Visible' : '❌ Hidden'}</div>
                <div>Payment Terms: {showPaymentTerms ? '✅ Visible' : '❌ Hidden'}</div>
                <div>Additional Terms: {showAdditionalTerms ? '✅ Visible' : '❌ Hidden'}</div>
                <div>M&D Terms: {showMdTerms ? '✅ Visible' : '❌ Hidden'}</div>
              </div>

              {![
                showGeneralNotes,
                showDeliveryTerms,
                showShipmentTerms,
                showRentalTerms,
                showPaymentTerms,
                showAdditionalTerms,
                showMdTerms,
              ].some(Boolean) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  ℹ️ <strong>No terms are currently visible.</strong> Use the "Show All" button or
                  individual toggle buttons to display the terms you want to work with.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(quotation.notes || quotation.deliveryTerms || quotation.shipmentTerms) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quotation.notes && (
                <p>
                  <strong>Notes:</strong> {quotation.notes}
                </p>
              )}
              {quotation.deliveryTerms && (
                <p>
                  <strong>Delivery Terms:</strong> {quotation.deliveryTerms}
                </p>
              )}
              {quotation.shipmentTerms && (
                <p>
                  <strong>Shipment Terms:</strong> {quotation.shipmentTerms}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
