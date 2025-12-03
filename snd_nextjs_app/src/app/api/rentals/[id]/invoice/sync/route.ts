import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);

    // Get rental data
    const rental = await db
      .select()
      .from(rentals)
      .where(eq(rentals.id, rentalId))
      .limit(1);

    if (rental.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const rentalData = rental[0];

    if (!rentalData.invoiceId) {
      return NextResponse.json({ error: 'No invoice found for this rental' }, { status: 400 });
    }

    // Get invoice details from ERPNext
    let invoiceDetails: any = null;
    try {
      invoiceDetails = await ERPNextInvoiceService.getInvoice(rentalData.invoiceId);
    } catch (error) {
      console.error('Error fetching invoice from ERPNext:', error);
      invoiceDetails = null;
    }

    // Check if invoice was deleted in ERPNext
    if (!invoiceDetails || invoiceDetails.error) {
      // Reset rental invoice information
      const resetData = {
        invoiceId: null,
        invoiceDate: null,
        paymentDueDate: null,
        paymentStatus: 'pending',
        outstandingAmount: '0.00',
        lastErpNextSync: new Date().toISOString(),
        updatedAt: new Date().toISOString().split('T')[0]
      };

      await db
        .update(rentals)
        .set(resetData)
        .where(eq(rentals.id, rentalId));

      return NextResponse.json({
        success: true,
        message: 'Invoice was deleted in ERPNext, rental record reset',
        data: {
          invoiceId: null,
          status: 'reset',
          message: 'Invoice deleted in ERPNext, rental ready for new invoice creation'
        }
      });
    }

    // Update rental with latest invoice information
    const paymentStatus = invoiceDetails.outstanding_amount === 0 ? 'paid' : 'pending';
    const outstandingAmount = invoiceDetails.outstanding_amount || 0;
    const invoiceAmount = invoiceDetails.grand_total || invoiceDetails.total || 0;

    try {
      await db
        .update(rentals)
        .set({
          paymentStatus: paymentStatus,
          totalAmount: invoiceAmount.toString(),
          finalAmount: invoiceAmount.toString(),
          updatedAt: new Date().toISOString().split('T')[0]
        })
        .where(eq(rentals.id, rentalId));

      return NextResponse.json({
        success: true,
        message: 'Invoice status synced successfully',
        data: {
          invoiceId: rentalData.invoiceId,
          paymentStatus: paymentStatus,
          outstandingAmount: outstandingAmount,
          invoiceAmount: invoiceAmount,
          invoiceDetails: invoiceDetails
        }
      });
    } catch (updateError) {
      console.error(`Failed to update rental ${rentalId}:`, updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update rental with invoice data',
          details: updateError instanceof Error ? updateError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error syncing invoice status:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync invoice status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}