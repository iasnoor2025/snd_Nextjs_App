import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await DatabaseService.getRental(id);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotationId) {
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Generate quotation data for display
    const quotation = {
      id: rental.quotationId,
      rentalId: rental.id,
      quotationNumber: rental.quotationId,
      customer: rental.customer,
      rentalItems: rental.rentalItems,
      subtotal: rental.subtotal,
      taxAmount: rental.taxAmount,
      totalAmount: rental.totalAmount,
      discount: rental.discount,
      tax: rental.tax,
      finalAmount: rental.finalAmount,
      depositAmount: rental.depositAmount,
      paymentTermsDays: rental.paymentTermsDays,
      startDate: rental.startDate,
      expectedEndDate: rental.expectedEndDate,
      notes: rental.notes,
      createdAt: rental.createdAt,
      status: 'draft'
    };

    return NextResponse.json({
      quotation,
      rental
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}
