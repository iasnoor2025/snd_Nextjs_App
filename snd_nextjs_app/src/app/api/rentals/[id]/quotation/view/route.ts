import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await DatabaseService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotation_id) {
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Generate quotation data for display
    const quotation = {
      id: rental.quotation_id,
      rental_id: rental.id,
      quotation_number: rental.quotation_id,
      customer: rental.customer,
      rental_items: rental.rental_items,
      subtotal: rental.subtotal,
      tax_amount: rental.tax_amount,
      total_amount: rental.total_amount,
      discount: rental.discount,
      tax: rental.tax,
      final_amount: rental.final_amount,
      deposit_amount: rental.deposit_amount,
      payment_terms_days: rental.payment_terms_days,
      start_date: rental.start_date,
      expected_end_date: rental.expected_end_date,
      notes: rental.notes,
      created_at: rental.created_at,
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
