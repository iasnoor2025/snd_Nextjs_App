import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { RentalService } from '@/lib/services/rental-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🚀 Starting invoice generation for rental:', id);

    // Get rental data with all necessary information
    const rental = await RentalService.getRental(parseInt(id));
    console.log('✅ Rental fetched:', rental ? 'success' : 'not found');

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Log the complete rental object structure
    console.log('🔍 Complete rental object:', JSON.stringify(rental, null, 2));
    console.log('🔍 Customer object:', JSON.stringify(rental.customer, null, 2));
    console.log('🔍 Rental items count:', rental.rental_items?.length || 0);

    console.log('📋 Rental details:', {
      id: rental.id,
      rentalNumber: rental.rentalNumber,
      customer: rental.customer,
      customerName: rental.customer?.name,
      totalAmount: rental.totalAmount,
      status: rental.status,
      invoiceId: rental.invoiceId,
    });

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

    console.log('🔢 Generated invoice number:', invoiceNumber);

    // Create ERPNext invoice
    console.log('🌐 Creating ERPNext invoice...');
    console.log('📤 Rental data being sent to ERPNext:', {
      id: rental.id,
      customerName: rental.customer?.name,
      customerId: rental.customerId,
      totalAmount: rental.totalAmount,
      rentalNumber: rental.rentalNumber,
    });

    let erpnextInvoice;
    try {
      erpnextInvoice = await ERPNextInvoiceService.createRentalInvoice(rental, invoiceNumber);
      console.log('✅ ERPNext invoice created successfully:', erpnextInvoice);
    } catch (erpnextError) {
      console.error('❌ ERPNext invoice creation failed:', erpnextError);
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

    console.log('🔢 Final invoice ID:', invoiceId);

    // Get updated invoice details from ERPNext to sync payment status
    console.log('🔄 Syncing invoice details from ERPNext...');
    let erpnextInvoiceDetails: any = null;
    try {
      erpnextInvoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);
      console.log('✅ ERPNext invoice details fetched:', erpnextInvoiceDetails);
    } catch (syncError) {
      console.log('⚠️ Could not fetch ERPNext invoice details, using created data:', syncError);
      erpnextInvoiceDetails = erpnextInvoice;
    }

    // Check if ERPNext invoice was deleted and reset rental if needed
    if (!erpnextInvoiceDetails || erpnextInvoiceDetails.error) {
      console.log('⚠️ ERPNext invoice not found or deleted, resetting rental invoice status...');

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

      console.log('✅ Rental invoice status reset - can create new invoice');

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
    let paymentStatus = erpnextInvoiceDetails?.docstatus === 1 ? 'submitted' : 'pending';
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

    console.log('💾 Updating rental with invoice information:', updateData);
    await db
      .update(rentals)
      .set(updateData)
      .where(eq(rentals.id, parseInt(id)));

    console.log('✅ Rental updated with invoice information');

    // Optionally submit the invoice in ERPNext if it's in draft status
    if (invoiceStatus === 'Draft') {
      console.log('📤 Submitting invoice in ERPNext...');
      try {
        await ERPNextInvoiceService.submitInvoice(invoiceId);
        console.log('✅ Invoice submitted successfully in ERPNext');
        // Update the status
        invoiceStatus = 'Submitted';
      } catch (submitError) {
        console.log('⚠️ Could not submit invoice in ERPNext:', submitError);
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
    console.error('❌ Error generating invoice:', error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
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
