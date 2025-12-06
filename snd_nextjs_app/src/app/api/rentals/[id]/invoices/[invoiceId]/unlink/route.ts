import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { RentalService } from '@/lib/services/rental-service';

export async function DELETE(
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

    // Delete the invoice from rental_invoices table
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
      };
      
      await RentalService.updateRental(rentalId, resetData);
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice unlinked successfully'
    });

  } catch (error: any) {
    console.error('Error unlinking invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to unlink invoice',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
