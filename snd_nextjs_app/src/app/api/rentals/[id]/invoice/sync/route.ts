import { NextRequest, NextResponse } from 'next/server';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔄 Starting invoice sync for rental (GET):', id);
    
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
    
    if (!currentRental.invoiceId) {
      return NextResponse.json({
        success: true,
        message: 'No invoice to sync - rental has no invoice ID',
        data: { status: 'no_invoice' }
      });
    }

    console.log('🔍 Checking ERPNext invoice:', currentRental.invoiceId);

    // Check if ERPNext invoice still exists
    try {
      const erpnextInvoice = await ERPNextInvoiceService.getInvoice(currentRental.invoiceId);
      console.log('✅ ERPNext invoice found:', erpnextInvoice?.name);

      // Note: erpnextInvoiceStatus, outstandingAmount, and lastErpNextSync fields don't exist in rentals schema
      // These updates are skipped as the fields are not available
      console.log('ERPNext invoice sync completed - no schema fields to update');

      return NextResponse.json({
        success: true,
        message: 'Invoice sync completed successfully',
        data: {
          invoiceId: currentRental.invoiceId,
          status: 'synced',
          erpnextStatus: erpnextInvoice?.status
        }
      });

    } catch (erpnextError) {
      console.log('❌ ERPNext invoice not found or deleted:', erpnextError);

      // Reset rental invoice information since ERPNext invoice was deleted
      const resetData = {
        invoiceId: null,
        invoiceDate: null,
        paymentDueDate: null,
        paymentStatus: 'pending'
      };

      await db
        .update(rentals)
        .set(resetData)
        .where(eq(rentals.id, parseInt(id)));

      console.log('✅ Rental invoice status reset - can create new invoice');

      return NextResponse.json({
        success: true,
        message: 'ERPNext invoice was deleted, rental reset for new invoice creation',
        data: {
          status: 'reset',
          previousInvoiceId: currentRental.invoiceId,
          message: 'You can now create a new invoice for this rental'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error syncing invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔄 Starting invoice sync for rental (POST):', id);
    
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
    
    if (!currentRental.invoiceId) {
      return NextResponse.json({
        success: true,
        message: 'No invoice to sync - rental has no invoice ID',
        data: { status: 'no_invoice' }
      });
    }

    console.log('🔍 Checking ERPNext invoice:', currentRental.invoiceId);

    // Check if ERPNext invoice still exists
    try {
      const erpnextInvoice = await ERPNextInvoiceService.getInvoice(currentRental.invoiceId);
      console.log('✅ ERPNext invoice found:', erpnextInvoice?.name);

      // Note: erpnextInvoiceStatus, outstandingAmount, and lastErpNextSync fields don't exist in rentals schema
      // These updates are skipped as the fields are not available
      console.log('ERPNext invoice sync completed - no schema fields to update');

      return NextResponse.json({
        success: true,
        message: 'Invoice sync completed successfully',
        data: {
          invoiceId: currentRental.invoiceId,
          status: 'synced',
          erpnextStatus: erpnextInvoice?.status
        }
      });

    } catch (erpnextError) {
      console.log('❌ ERPNext invoice not found or deleted:', erpnextError);

      // Reset rental invoice information since ERPNext invoice was deleted
      const resetData = {
        invoiceId: null,
        invoiceDate: null,
        paymentDueDate: null,
        paymentStatus: 'pending',
        erpnextInvoiceStatus: null,
        outstandingAmount: '0.00',
        lastErpNextSync: new Date().toISOString()
      };

      await db
        .update(rentals)
        .set(resetData)
        .where(eq(rentals.id, parseInt(id)));

      console.log('✅ Rental invoice status reset - can create new invoice');

      return NextResponse.json({
        success: true,
        message: 'ERPNext invoice was deleted, rental reset for new invoice creation',
        data: {
          status: 'reset',
          previousInvoiceId: currentRental.invoiceId,
          message: 'You can now create a new invoice for this rental'
        }
      });
    }

  } catch (error) {
    console.error('❌ Error syncing invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
