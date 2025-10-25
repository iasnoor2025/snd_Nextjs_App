import { NextRequest, NextResponse } from 'next/server';
import { RentalPaymentService } from '@/lib/services/rental-payment-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const rentalId = parseInt(id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' },
        { status: 400 }
      );
    }

    const payments = await RentalPaymentService.getRentalPayments(rentalId);

    return NextResponse.json(payments);

  } catch (error: any) {
    console.error('Error fetching rental payments:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rental payments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
