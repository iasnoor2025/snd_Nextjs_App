import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // Create rental invoice record in database
    try {
      const rentalInvoice = await RentalInvoiceService.createRentalInvoice({
        rentalId: parseInt(id),
        invoiceId: invoiceId,
        invoiceDate: invoiceDetails.posting_date || new Date().toISOString().split('T')[0],
        dueDate: invoiceDetails.due_date || null,
        amount: invoiceDetails.grand_total?.toString() || '0',
        status: invoiceDetails.status || 'pending'
      });

      // Also update rental record with latest invoice info
      const updateData = {
        invoiceId: invoiceId,
        invoiceDate: invoiceDetails.posting_date || new Date().toISOString().split('T')[0],
        paymentDueDate: invoiceDetails.due_date || null,
        paymentStatus: invoiceDetails.status === 'Paid' ? 'paid' as const : 'pending' as const,
        totalAmount: invoiceDetails.grand_total?.toString() || '0',
        finalAmount: invoiceDetails.grand_total?.toString() || '0'
      };

      await RentalService.updateRental(parseInt(id), updateData);

    } catch (createError) {
      console.error('Error creating rental invoice:', createError);
      return NextResponse.json(
        { 
          error: 'Failed to create invoice record',
          details: createError instanceof Error ? createError.message : 'Unknown database error'
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
