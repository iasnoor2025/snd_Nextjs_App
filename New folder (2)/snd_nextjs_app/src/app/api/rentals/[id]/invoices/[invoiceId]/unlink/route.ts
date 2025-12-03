import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invoiceId: string } }
) {
  try {
    const { id, invoiceId } = params;
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
