import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

const ISO_DATE_REGEX = /^0{4}-0{2}-0{2}/;

const getIsoDateString = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || ISO_DATE_REGEX.test(trimmed)) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

const normalizeAmountValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') {
    return '0';
  }

  const stringValue = typeof value === 'number' ? value.toString() : `${value}`;
  const cleaned = stringValue.replace(/[^0-9.-]+/g, '').trim();
  const parsed = parseFloat(cleaned);

  return Number.isFinite(parsed) ? parsed.toString() : '0';
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : JSON.stringify(error);
};

const isDuplicateInvoiceError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return (
    (error as { code?: string })?.code === '23505' ||
    message.includes('duplicate key') ||
    message.includes('unique constraint')
  );
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Verify the invoice exists in ERPNext
    const invoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);
    
    if (!invoiceDetails) {
      return NextResponse.json(
        { error: 'Invoice not found in ERPNext' },
        { status: 404 }
      );
    }

    // Check if invoice is already linked to any rental
    try {
      const existingInvoice = await RentalInvoiceService.getInvoiceByInvoiceId(invoiceId);
      if (existingInvoice) {
        return NextResponse.json(
          { error: `Invoice is already linked to rental ID ${existingInvoice.rentalId}` },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking existing invoice link:', error);
      // Continue with linking process even if check fails
    }

    const safeInvoiceDate =
      getIsoDateString(invoiceDetails.posting_date) || getTodayIsoDate();
    const safeDueDate = getIsoDateString(invoiceDetails.due_date);
    const invoiceAmountValue =
      invoiceDetails.grand_total ??
      invoiceDetails.total ??
      invoiceDetails.rounded_total ??
      invoiceDetails.base_grand_total ??
      invoiceDetails.outstanding_amount ??
      0;
    const normalizedInvoiceAmount = normalizeAmountValue(invoiceAmountValue);
    const invoiceStatusNormalized = invoiceDetails.status?.toLowerCase() || 'pending';

    // Create rental invoice record in database
    try {
      const rentalInvoice = await RentalInvoiceService.createRentalInvoice({
        rentalId: parseInt(id),
        invoiceId: invoiceId,
        invoiceDate: safeInvoiceDate,
        dueDate: safeDueDate || null,
        amount: normalizedInvoiceAmount,
        status: invoiceDetails.status || 'pending'
      });

      // Also update rental record with latest invoice info
      const updateData = {
        invoiceId: invoiceId,
        invoiceDate: safeInvoiceDate,
        paymentDueDate: safeDueDate || null,
        paymentStatus: invoiceStatusNormalized === 'paid' ? 'paid' as const : 'pending' as const,
        totalAmount: normalizedInvoiceAmount,
        finalAmount: normalizedInvoiceAmount
      };

      await RentalService.updateRental(parseInt(id), updateData);

    } catch (createError) {
      console.error('Error creating rental invoice:', createError);
      if (isDuplicateInvoiceError(createError)) {
        const existingInvoice = await RentalInvoiceService.getInvoiceByInvoiceId(invoiceId);
        const detailMessage = existingInvoice
          ? `Invoice is already linked to rental ID ${existingInvoice.rentalId}`
          : 'Invoice is already linked to another rental';

        return NextResponse.json(
          {
            error: 'Invoice already linked',
            details: detailMessage
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create invoice record',
          details: getErrorMessage(createError)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice linked successfully',
      invoice: {
        id: invoiceId,
        amount: invoiceDetails.grand_total,
        date: invoiceDetails.posting_date,
        dueDate: invoiceDetails.due_date
      }
    });

  } catch (error: any) {
    console.error('Error linking invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to link invoice',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
