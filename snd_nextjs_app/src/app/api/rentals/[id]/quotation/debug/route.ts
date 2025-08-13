import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 DEBUG: Fetching rental with ID:', id);
    
    const rental = await RentalService.getRental(parseInt(id));
    console.log('📦 DEBUG: Raw rental data:', JSON.stringify(rental, null, 2));

    if (!rental) {
      return NextResponse.json({ 
        error: 'Rental not found',
        debug: { id, timestamp: new Date().toISOString() }
      }, { status: 404 });
    }

    // Return all the data for debugging
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      rentalId: id,
      rental: {
        id: rental.id,
        customerId: rental.customerId,
        customerName: rental.customer?.name,
        customerEmail: rental.customer?.email,
        customerPhone: rental.customer?.phone,
        customer: rental.customer,
        quotationId: rental.quotationId,
        rental_items: rental.rental_items,
        rentalItems: rental.rentalItems,
        subtotal: rental.subtotal,
        taxAmount: rental.taxAmount,
        totalAmount: rental.totalAmount,
        discount: rental.discount,
        tax: rental.tax,
        depositAmount: rental.depositAmount,
        paymentTermsDays: rental.paymentTermsDays,
        startDate: rental.startDate,
        expectedEndDate: rental.expectedEndDate,
        notes: rental.notes,
        createdAt: rental.createdAt,
        status: rental.status
      }
    });
  } catch (error) {
    console.error('❌ DEBUG: Error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      debug: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
