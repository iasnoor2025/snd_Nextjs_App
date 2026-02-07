import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';
import { RentalService } from '@/lib/services/rental-service';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get all invoices from our database
    const allInvoices = await db.execute(sql`
      SELECT ri.*, r.id as rental_id, r.rental_number 
      FROM rental_invoices ri
      JOIN rentals r ON ri.rental_id = r.id
      ORDER BY ri.created_at DESC
    `);
    let processedCount = 0;
    let deletedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const invoice of allInvoices.rows as any[]) {
      try {
        processedCount++;
        // Check if invoice exists in ERPNext
        const erpnextInvoice = await ERPNextInvoiceService.getInvoice(invoice.invoice_id);

        if (!erpnextInvoice) {
          // Delete from our database
          await RentalInvoiceService.deleteInvoice(invoice.invoice_id);

          // Check if this was the main invoice for the rental
          const rental = await RentalService.getRental(invoice.rental_id);
          if (rental?.invoiceId === invoice.invoice_id) {
            // Reset the main rental invoice fields
            const resetData = {
              invoiceId: null,
              invoiceDate: null,
              paymentDueDate: null,
              paymentStatus: 'pending' as const,
              totalAmount: null,
              finalAmount: null
            };

            await RentalService.updateRental(invoice.rental_id, resetData);
          }

          deletedCount++;
        } else {
          // Invoice exists in ERPNext, update status if needed
          const currentStatus = invoice.status;
          const erpnextStatus = erpnextInvoice.status || 'pending';

          if (currentStatus !== erpnextStatus) {
            await RentalInvoiceService.updateInvoiceStatus(invoice.invoice_id, erpnextStatus);
            updatedCount++;
          }
        }

      } catch (error) {
        console.error(`Error processing invoice ${invoice.invoice_id}:`, error);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: 'Bulk invoice sync completed',
      summary: {
        totalProcessed: processedCount,
        deletedFromERPNext: deletedCount,
        statusUpdated: updatedCount,
        errors: errorCount
      }
    };
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in bulk invoice sync:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform bulk invoice sync',
        details: error.message
      },
      { status: 500 }
    );
  }
}
