import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { RentalService } from '@/lib/services/rental-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get rental data with all necessary information
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Log the complete rental object structure
    console.log('Rental object structure:', rental);

    // Validate rental can have invoice generated
    if (rental.status === 'cancelled' || rental.status === 'draft') {
      return NextResponse.json(
        { error: 'Cannot generate invoice for cancelled or draft rental' },
        { status: 400 }
      );
    }

    if (rental.invoiceId) {
      return NextResponse.json(
        { error: 'Invoice already exists for this rental' },
        { status: 400 }
      );
    }

    // Generate unique invoice number
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    const invoiceNumber = `INV-${randomSuffix}-${Math.floor(timestamp / 1000000)}`;

    // Create ERPNext invoice

    let erpnextInvoice;
    try {
      erpnextInvoice = await ERPNextInvoiceService.createRentalInvoice(rental, invoiceNumber);
      
    } catch (erpnextError) {
      
      throw new Error(
        `ERPNext invoice creation failed: ${erpnextError instanceof Error ? erpnextError.message : 'Unknown error'}`
      );
    }

    // Extract invoice ID from ERPNext response (handle different response structures)
    let invoiceId = invoiceNumber; // fallback to generated number
    if (erpnextInvoice && typeof erpnextInvoice === 'object') {
      if (erpnextInvoice.name) {
        invoiceId = erpnextInvoice.name;
      } else if (erpnextInvoice.data && erpnextInvoice.data.name) {
        invoiceId = erpnextInvoice.data.name;
      } else if (erpnextInvoice.id) {
        invoiceId = erpnextInvoice.id;
      }
    }

    // Get updated invoice details from ERPNext to sync payment status
    
    let erpnextInvoiceDetails: any = null;
    try {
      erpnextInvoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);
      
    } catch (syncError) {
      
      erpnextInvoiceDetails = erpnextInvoice;
    }

    // Check if ERPNext invoice was deleted and reset rental if needed
    if (!erpnextInvoiceDetails || erpnextInvoiceDetails.error) {

      // Reset rental invoice information
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
        success: false,
        message: 'ERPNext invoice was deleted, rental reset for new invoice creation',
        data: {
          invoiceId: null,
          status: 'reset',
          message: 'You can now create a new invoice for this rental',
        },
      });
    }

    // Extract payment status and other details from ERPNext
    const paymentStatus = erpnextInvoiceDetails?.docstatus === 1 ? 'submitted' : 'pending';
    const outstandingAmount =
      erpnextInvoiceDetails?.outstanding_amount || erpnextInvoiceDetails?.grand_total || 0;
    let invoiceStatus = erpnextInvoiceDetails?.status || 'Draft';

    // Update rental with invoice information
    const updateData = {
      invoiceId: invoiceId,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentDueDate: new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'active',
      paymentStatus: paymentStatus as any, // Use synced payment status from ERPNext
      // Add ERPNext synced data
      erpnextInvoiceStatus: invoiceStatus,
      outstandingAmount: outstandingAmount.toString(),
      lastErpNextSync: new Date().toISOString(),
    };

    await db
      .update(rentals)
      .set(updateData)
      .where(eq(rentals.id, parseInt(id)));

    // Optionally submit the invoice in ERPNext if it's in draft status
    if (invoiceStatus === 'Draft') {
      
      try {
        await ERPNextInvoiceService.submitInvoice(invoiceId);
        
        // Update the status
        invoiceStatus = 'Submitted';
      } catch (submitError) {
        
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice generated and synced successfully',
      data: {
        invoiceId: invoiceId,
        invoiceNumber: invoiceNumber,
        invoiceDate: updateData.invoiceDate,
        paymentDueDate: updateData.paymentDueDate,
        paymentStatus: paymentStatus,
        erpnextInvoiceStatus: invoiceStatus,
        outstandingAmount: outstandingAmount,
        lastErpNextSync: updateData.lastErpNextSync,
        erpnextInvoice: erpnextInvoiceDetails,
      },
    });
  } catch (error) {

    // Enhanced error logging
    if (error instanceof Error) {
      
    }

    return NextResponse.json(
      {
        error: 'Failed to generate invoice',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
