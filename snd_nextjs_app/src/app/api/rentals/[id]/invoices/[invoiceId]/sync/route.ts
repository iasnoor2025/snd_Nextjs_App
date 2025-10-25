import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function POST(
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

    // Get invoice details from ERPNext
    const invoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);
    
    if (!invoiceDetails) {
      return NextResponse.json(
        { error: 'Invoice not found in ERPNext' },
        { status: 404 }
      );
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
