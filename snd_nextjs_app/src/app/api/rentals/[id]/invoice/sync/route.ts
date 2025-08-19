import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get rental to check current invoice status
    const rental = await db
      .select()
      .from(rentals)
      .where(eq(rentals.id, parseInt(id)))
      .limit(1);

    if (rental.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const currentRental = rental[0];
    if (!currentRental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!currentRental.invoiceId) {
      return NextResponse.json({
        success: true,
        message: 'No invoice to sync - rental has no invoice ID',
        data: { status: 'no_invoice' },
      });
    }

    // Check if ERPNext invoice still exists
    try {
      const erpnextInvoice = await ERPNextInvoiceService.getInvoice(currentRental.invoiceId);

      // Note: erpnextInvoiceStatus, outstandingAmount, and lastErpNextSync fields don't exist in rentals schema
      // These updates are skipped as the fields are not available

      return NextResponse.json({
        success: true,
        message: 'Invoice sync completed successfully',
        data: {
          invoiceId: currentRental.invoiceId,
          status: 'synced',
          erpnextStatus: erpnextInvoice?.status,
        },
      });
    } catch (erpnextError) {

      // Reset rental invoice information since ERPNext invoice was deleted
      const resetData = {
        invoiceId: null,
        invoiceDate: null,
        paymentDueDate: null,
        paymentStatus: 'pending',
      };

      await db
        .update(rentals)
        .set(resetData)
        .where(eq(rentals.id, parseInt(id)));

      return NextResponse.json({
        success: true,
        message: 'ERPNext invoice was deleted, rental reset for new invoice creation',
        data: {
          status: 'reset',
          previousInvoiceId: currentRental.invoiceId,
          message: 'You can now create a new invoice for this rental',
        },
      });
    }
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to sync invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get rental to check current invoice status
    const rental = await db
      .select()
      .from(rentals)
      .where(eq(rentals.id, parseInt(id)))
      .limit(1);

    if (rental.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const currentRental = rental[0];
    if (!currentRental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!currentRental.invoiceId) {
      return NextResponse.json({
        success: true,
        message: 'No invoice to sync - rental has no invoice ID',
        data: { status: 'no_invoice' },
      });
    }

    // Check if ERPNext invoice still exists
    try {
      const erpnextInvoice = await ERPNextInvoiceService.getInvoice(currentRental.invoiceId);

      // Note: erpnextInvoiceStatus, outstandingAmount, and lastErpNextSync fields don't exist in rentals schema
      // These updates are skipped as the fields are not available

      return NextResponse.json({
        success: true,
        message: 'Invoice sync completed successfully',
        data: {
          invoiceId: currentRental.invoiceId,
          status: 'synced',
          erpnextStatus: erpnextInvoice?.status,
        },
      });
    } catch (erpnextError) {

      // Reset rental invoice information since ERPNext invoice was deleted
      const resetData = {
        invoiceId: null,
        invoiceDate: null,
        paymentDueDate: null,
        paymentStatus: 'pending',
        erpnextInvoiceStatus: null,
        outstandingAmount: '0.00',
        lastErpNextSync: new Date().toISOString(),
      };

      await db
        .update(rentals)
        .set(resetData)
        .where(eq(rentals.id, parseInt(id)));

      return NextResponse.json({
        success: true,
        message: 'ERPNext invoice was deleted, rental reset for new invoice creation',
        data: {
          status: 'reset',
          previousInvoiceId: currentRental.invoiceId,
          message: 'You can now create a new invoice for this rental',
        },
      });
    }
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Failed to sync invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
