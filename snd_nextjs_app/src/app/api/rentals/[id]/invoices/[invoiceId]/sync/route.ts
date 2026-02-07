import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { RentalService } from '@/lib/services/rental-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const { id, invoiceId } = await params;
    const rentalId = parseInt(id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' },
        { status: 400 }
      );
    }

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Get invoice details from ERPNext
    const invoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);

    // Check if invoice was deleted in ERPNext
    if (!invoiceDetails) {
      // Delete the invoice from our database
      try {
        await RentalInvoiceService.deleteInvoice(invoiceId);

        // Also check if this was the main invoice for the rental and reset if needed
        const rental = await RentalService.getRental(rentalId);
        if (rental?.invoiceId === invoiceId) {
          // Reset the main rental invoice fields
          const resetData = {
            invoiceId: null,
            invoiceDate: null,
            paymentDueDate: null,
            paymentStatus: 'pending' as const,
            totalAmount: null,
            finalAmount: null
          };

          await RentalService.updateRental(rentalId, resetData);
        }

        return NextResponse.json({
          success: true,
          message: 'Invoice was deleted in ERPNext and has been unlinked from rental',
          action: 'deleted'
        });

      } catch (deleteError) {
        console.error('Error deleting invoice after ERPNext deletion:', deleteError);
        return NextResponse.json(
          {
            error: 'Invoice deleted in ERPNext but failed to unlink from rental',
            details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // Update the invoice record in our database
    try {
      await RentalInvoiceService.updateInvoiceStatus(invoiceId, invoiceDetails.status || 'pending');

      return NextResponse.json({
        success: true,
        message: 'Invoice synced successfully',
        invoice: {
          id: invoiceId,
          status: invoiceDetails.status,
          amount: invoiceDetails.grand_total || invoiceDetails.total
        }
      });

    } catch (updateError) {
      console.error('Error updating invoice status:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update invoice status',
          details: updateError instanceof Error ? updateError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error syncing invoice:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync invoice',
        details: error.message
      },
      { status: 500 }
    );
  }
}
