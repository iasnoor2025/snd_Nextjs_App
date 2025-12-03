import { NextRequest, NextResponse } from 'next/server';
import { RentalPaymentService } from '@/lib/services/rental-payment-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const { id, paymentId } = params;
    const rentalId = parseInt(id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' },
        { status: 400 }
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Delete the payment from rental_payments table
    await RentalPaymentService.deletePayment(paymentId);

    return NextResponse.json({
      success: true,
      message: 'Payment unlinked successfully'
    });

  } catch (error: any) {
    console.error('Error unlinking payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to unlink payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
