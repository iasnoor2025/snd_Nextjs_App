import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { RentalService } from '@/lib/services/rental-service';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Invoice API called');
    
    const { id } = await params;
    console.log('Rental ID:', id);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { billingMonth } = body || {};
    console.log('Billing month:', billingMonth);

    // Get rental data with all necessary information
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Log the complete rental object structure
    console.log('Rental object structure:', rental);
    console.log('Billing month requested:', billingMonth);

    // Validate rental can have invoice generated
    if (rental.status === 'cancelled' || rental.status === 'draft') {
      return NextResponse.json(
        { error: 'Cannot generate invoice for cancelled or draft rental' },
        { status: 400 }
      );
    }

    // Check if invoice already exists for this rental and month
    if (rental.invoiceId && !billingMonth) {
      return NextResponse.json(
        { error: 'Invoice already exists for this rental' },
        { status: 400 }
      );
    }

    // For monthly billing, check if invoice already exists for this specific month
    if (billingMonth && rental.invoiceId) {
      // Check if the existing invoice is for the same month
      const existingInvoiceDate = new Date(rental.invoiceDate);
      const [year, month] = billingMonth.split('-');
      const billingDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      
      if (existingInvoiceDate.getFullYear() === billingDate.getFullYear() && 
          existingInvoiceDate.getMonth() === billingDate.getMonth()) {
        return NextResponse.json(
          { error: `Invoice already exists for ${billingMonth}` },
          { status: 400 }
        );
      }
    }

    // Generate unique invoice number
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    const invoiceNumber = `INV-${randomSuffix}-${Math.floor(timestamp / 1000000)}`;

    // Recalculate rental totals to ensure accurate invoice amount
    await RentalService.recalculateRentalTotals(parseInt(id));
    
    // Get updated rental data with recalculated totals
    const updatedRental = await RentalService.getRental(parseInt(id));
    if (!updatedRental) {
      return NextResponse.json({ error: 'Rental not found after recalculation' }, { status: 404 });
    }

    console.log('Recalculated rental totals:', {
      subtotal: updatedRental.subtotal,
      taxAmount: updatedRental.taxAmount,
      totalAmount: updatedRental.totalAmount,
      finalAmount: updatedRental.finalAmount
    });

    // Create invoiceRental object (always needed)
    let invoiceRental = { ...updatedRental };
    
    // Create ERPNext invoice with billing month information
    let erpnextInvoice;
    try {
      
      if (billingMonth) {
        console.log(`Creating invoice for billing month: ${billingMonth}`);
        
        // Parse the billing month (format: YYYY-MM)
        const [year, month] = billingMonth.split('-');
        const billingYear = parseInt(year);
        const billingMonthNum = parseInt(month);
        
        // Calculate dates for the billing month
        const monthStart = new Date(billingYear, billingMonthNum - 1, 1); // First day of billing month
        const monthEnd = new Date(billingYear, billingMonthNum, 0); // Last day of billing month
        
        // From date: Use rental start date if it's within the billing month, otherwise use month start
        const rentalStartDate = new Date(updatedRental.startDate);
        const fromDate = rentalStartDate >= monthStart && rentalStartDate <= monthEnd 
          ? rentalStartDate 
          : monthStart;
        
        // To date: End of billing month
        const toDate = monthEnd;
        
        // Invoice date: End of billing month
        invoiceRental.invoiceDate = monthEnd.toISOString().split('T')[0];
        
        // Payment due date: 30 days after end of billing month
        const dueDate = new Date(monthEnd);
        dueDate.setDate(dueDate.getDate() + 30);
        invoiceRental.paymentDueDate = dueDate.toISOString().split('T')[0];
        
        // Add custom fields for ERPNext
        invoiceRental.customFrom = fromDate.toISOString().split('T')[0];
        invoiceRental.customTo = toDate.toISOString().split('T')[0];
        
        // Add invoice month for subject
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[billingMonthNum - 1];
        invoiceRental.invoiceMonth = `${monthName} ${billingYear}`;
        invoiceRental.customSubject = `Invoice for ${updatedRental.rentalNumber} - ${monthName} ${billingYear}`;
        
        console.log(`Billing month calculation:`, {
          billingMonth: billingMonth,
          billingYear: billingYear,
          billingMonthNum: billingMonthNum,
          monthStart: monthStart.toISOString().split('T')[0],
          monthEnd: monthEnd.toISOString().split('T')[0],
          rentalStartDate: rentalStartDate.toISOString().split('T')[0],
          fromDate: fromDate.toISOString().split('T')[0],
          toDate: toDate.toISOString().split('T')[0],
          invoiceDate: invoiceRental.invoiceDate,
          paymentDueDate: invoiceRental.paymentDueDate,
          customFrom: invoiceRental.customFrom,
          customTo: invoiceRental.customTo,
          invoiceMonth: invoiceRental.invoiceMonth,
          customSubject: invoiceRental.customSubject
        });
      } else {
        // For non-monthly billing, set default values
        invoiceRental.invoiceDate = new Date().toISOString().split('T')[0];
        invoiceRental.paymentDueDate = new Date(Date.now() + (updatedRental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        invoiceRental.customFrom = invoiceRental.invoiceDate;
        invoiceRental.customTo = invoiceRental.paymentDueDate;
        invoiceRental.invoiceMonth = 'One-time Invoice';
        invoiceRental.customSubject = `Invoice for ${updatedRental.rentalNumber} - One-time Invoice`;
      }
      
      // Validate rental data before creating invoice
      if (!invoiceRental.customer?.name && !invoiceRental.customerName) {
        return NextResponse.json(
          { error: 'Customer information is missing from rental data' },
          { status: 400 }
        );
      }

      if (!invoiceRental.totalAmount || parseFloat(invoiceRental.totalAmount.toString()) <= 0) {
        return NextResponse.json(
          { error: 'Rental total amount is invalid or zero' },
          { status: 400 }
        );
      }

      console.log('Validated rental data for invoice creation:', {
        customer: invoiceRental.customer?.name || invoiceRental.customerName,
        totalAmount: invoiceRental.totalAmount,
        invoiceDate: invoiceRental.invoiceDate,
        paymentDueDate: invoiceRental.paymentDueDate,
        customFrom: invoiceRental.customFrom,
        customTo: invoiceRental.customTo,
        invoiceMonth: invoiceRental.invoiceMonth,
        customSubject: invoiceRental.customSubject
      });

      erpnextInvoice = await ERPNextInvoiceService.createRentalInvoice(invoiceRental, invoiceNumber);
      
    } catch (erpnextError) {
      console.error('ERPNext invoice creation error:', erpnextError);
      console.error('Invoice rental data:', invoiceRental);
      console.error('Invoice number:', invoiceNumber);
      
      return NextResponse.json(
        {
          error: 'ERPNext invoice creation failed',
          details: erpnextError instanceof Error ? erpnextError.message : 'Unknown error',
          billingMonth: billingMonth,
          invoiceNumber: invoiceNumber
        },
        { status: 500 }
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
    console.log('Getting ERPNext invoice details for:', invoiceId);
    
    let erpnextInvoiceDetails: any = null;
    try {
      erpnextInvoiceDetails = await ERPNextInvoiceService.getInvoice(invoiceId);
      console.log('Fetched ERPNext invoice details:', erpnextInvoiceDetails);
    } catch (syncError) {
      console.log('Failed to fetch ERPNext invoice details, using created invoice:', syncError);
      erpnextInvoiceDetails = erpnextInvoice;
      console.log('Using created invoice details:', erpnextInvoiceDetails);
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

    // Get the actual invoice amount from ERPNext
    const invoiceAmount = erpnextInvoiceDetails?.grand_total || erpnextInvoiceDetails?.total || 0;
    console.log('ERPNext invoice amount calculation:', {
      grand_total: erpnextInvoiceDetails?.grand_total,
      total: erpnextInvoiceDetails?.total,
      base_grand_total: erpnextInvoiceDetails?.base_grand_total,
      rounded_total: erpnextInvoiceDetails?.rounded_total,
      invoiceAmount: invoiceAmount,
      willUpdateTotalAmount: invoiceAmount > 0
    });
    
    // If invoiceAmount is 0, log full invoice details for debugging
    if (invoiceAmount === 0) {
      console.error('Invoice amount is 0! Full ERPNext invoice details:', JSON.stringify(erpnextInvoiceDetails, null, 2));
    }
    
    // Update rental with invoice information
    // For monthly billing, this updates to the latest invoice
    const updateData: any = {
      invoiceId: invoiceId,
      invoiceDate: billingMonth ? invoiceRental.invoiceDate : new Date().toISOString().split('T')[0],
      paymentDueDate: billingMonth ? invoiceRental.paymentDueDate : new Date(Date.now() + (updatedRental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      paymentStatus: paymentStatus as any, // Use synced payment status from ERPNext
      updatedAt: new Date().toISOString().split('T')[0], // Update the updatedAt timestamp
    };
    
    // Only update totalAmount if we have a valid invoice amount from ERPNext
    if (invoiceAmount > 0) {
      updateData.totalAmount = invoiceAmount.toString();
      console.log('Updating totalAmount with ERPNext invoice amount:', invoiceAmount);
    } else {
      console.warn('Invoice amount is 0 or invalid, keeping original totalAmount');
    }

    let updateResult;
    try {
      updateResult = await db
        .update(rentals)
        .set(updateData)
        .where(eq(rentals.id, parseInt(id)));

      console.log('Rental update result:', updateResult);
      console.log('Updated rental data:', updateData);
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        {
          error: 'Failed to update rental record',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          updateData: updateData
        },
        { status: 500 }
      );
    }

    // Create rental invoice record for tracking multiple invoices
    try {
      await RentalInvoiceService.createRentalInvoice({
        rentalId: parseInt(id),
        invoiceId: invoiceId,
        invoiceDate: billingMonth ? invoiceRental.invoiceDate : new Date().toISOString().split('T')[0],
        dueDate: billingMonth ? invoiceRental.paymentDueDate : new Date(Date.now() + (updatedRental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: invoiceAmount.toString(),
        status: invoiceStatus
      });
      console.log('Created rental invoice record for tracking');
    } catch (invoiceRecordError) {
      console.error('Failed to create rental invoice record:', invoiceRecordError);
      // Don't fail the whole operation if invoice record creation fails
    }

    // Verify the rental was updated
    const verifiedRental = await RentalService.getRental(parseInt(id));
    console.log('Updated rental verification:', {
      invoiceId: verifiedRental?.invoiceId,
      invoiceDate: verifiedRental?.invoiceDate,
      paymentStatus: verifiedRental?.paymentStatus
    });

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
        erpnextInvoice: erpnextInvoiceDetails,
      },
    });
  } catch (error) {
    console.error('=== Invoice generation error ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown error type');

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error cause:', error.cause);
    }

    // Ensure we always return valid JSON
    try {
      return NextResponse.json(
        {
          error: 'Failed to generate invoice',
          details: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          stack: error instanceof Error ? error.stack : undefined,
          errorType: error instanceof Error ? error.name : typeof error,
        },
        { status: 500 }
      );
    } catch (jsonError) {
      console.error('Failed to create JSON response:', jsonError);
      // Fallback to plain text response
      return new Response(
        JSON.stringify({
          error: 'Failed to generate invoice',
          details: 'Error creating JSON response',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}
