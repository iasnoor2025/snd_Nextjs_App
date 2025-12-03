import { db } from '@/lib/drizzle';
import { rentals } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const syncInvoicesHandler = async (_request: NextRequest) => {
  try {
    // Get all rentals with invoices
    let rentalsWithInvoices;
    try {
      rentalsWithInvoices = await db
        .select({
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
          invoiceId: rentals.invoiceId,
          invoiceDate: rentals.invoiceDate,
          paymentStatus: rentals.paymentStatus,
          outstandingAmount: rentals.outstandingAmount
        })
        .from(rentals)
        .where(sql`${rentals.invoiceId} IS NOT NULL`);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      
      // Try a simpler query without the new fields
      try {
        rentalsWithInvoices = await db
          .select({
            id: rentals.id,
            rentalNumber: rentals.rentalNumber,
            invoiceId: rentals.invoiceId,
            paymentStatus: rentals.paymentStatus
          })
          .from(rentals)
          .where(sql`${rentals.invoiceId} IS NOT NULL`);
        
              } catch (simpleDbError) {
        console.error('Simple database query also failed:', simpleDbError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database query failed',
            details: `Original error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}. Simple query error: ${simpleDbError instanceof Error ? simpleDbError.message : 'Unknown error'}`,
          },
          { status: 500 }
        );
      }
    }

    const results = {
      checked: 0,
      deleted: 0,
      updated: 0,
      errors: []
    };

    for (const rental of rentalsWithInvoices) {
      try {
        results.checked++;
        
        // Check if invoice exists in ERPNext
        let invoiceDetails: any = null;
        try {
          invoiceDetails = await ERPNextInvoiceService.getInvoice(rental.invoiceId!);
        } catch (error) {
          invoiceDetails = null;
        }

        // If invoice was deleted in ERPNext, reset rental record
        if (!invoiceDetails || invoiceDetails.error) {
          try {
            await db
              .update(rentals)
              .set({
                invoiceId: null,
                invoiceDate: null,
                paymentDueDate: null,
                paymentStatus: 'pending',
                updatedAt: new Date().toISOString().split('T')[0]
              })
              .where(eq(rentals.id, rental.id));

            results.deleted++;
          } catch (updateError) {
            console.error(`Failed to reset rental ${rental.id}:`, updateError);
            results.errors.push({
              rentalId: rental.id,
              rentalNumber: rental.rentalNumber,
              invoiceId: rental.invoiceId,
              error: `Failed to reset rental: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`
            });
          }
        } else {
          // Update rental with latest invoice information
          const paymentStatus = invoiceDetails.outstanding_amount === 0 ? 'paid' : 'pending';
          const outstandingAmount = invoiceDetails.outstanding_amount || 0;

          try {
            await db
              .update(rentals)
              .set({
                paymentStatus: paymentStatus,
                updatedAt: new Date().toISOString().split('T')[0]
              })
              .where(eq(rentals.id, rental.id));

            results.updated++;
          } catch (updateError) {
            console.error(`Failed to update rental ${rental.id}:`, updateError);
            results.errors.push({
              rentalId: rental.id,
              rentalNumber: rental.rentalNumber,
              invoiceId: rental.invoiceId,
              error: `Failed to update rental: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`
            });
          }
        }
      } catch (error) {
        console.error(`Error processing rental ${rental.id}:`, error);
        results.errors.push({
          rentalId: rental.id,
          rentalNumber: rental.rentalNumber,
          invoiceId: rental.invoiceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} rentals, reset ${results.deleted} deleted invoices, updated ${results.updated} invoices`,
      data: results
    });

  } catch (error) {
    console.error('Error in bulk invoice sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

const getInvoiceStatusHandler = async (_request: NextRequest) => {
  try {
    // Get all rentals with invoices for status check
    const rentalsWithInvoices = await db
      .select({
        id: rentals.id,
        rentalNumber: rentals.rentalNumber,
        invoiceId: rentals.invoiceId,
        invoiceDate: rentals.invoiceDate,
        paymentStatus: rentals.paymentStatus,
        outstandingAmount: rentals.outstandingAmount,
      })
      .from(rentals)
      .where(sql`${rentals.invoiceId} IS NOT NULL`);

    return NextResponse.json({
      success: true,
      message: `Found ${rentalsWithInvoices.length} rentals with invoices`,
      data: {
        rentalsWithInvoices,
        totalRentals: rentalsWithInvoices.length
      }
    });
  } catch (error) {
    console.error('Error getting invoice status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get invoice status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
