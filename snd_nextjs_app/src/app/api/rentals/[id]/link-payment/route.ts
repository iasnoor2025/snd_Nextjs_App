import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { RentalPaymentService } from '@/lib/services/rental-payment-service';
import { ERPNextPaymentService } from '@/lib/services/erpnext-payment-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Verify the payment exists in ERPNext
    const paymentDetails = await ERPNextPaymentService.getPayment(paymentId);
    
    if (!paymentDetails) {
      return NextResponse.json(
        { error: 'Payment not found in ERPNext' },
        { status: 404 }
      );
    }

    // Check if payment is already linked to any rental
    try {
      const existingPayment = await RentalPaymentService.getPaymentByPaymentId(paymentId);
      if (existingPayment) {
        return NextResponse.json(
          { error: `Payment is already linked to rental ID ${existingPayment.rentalId}` },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking existing payment link:', error);
      // Continue with linking process even if check fails
    }

    // Create rental payment record in database
    try {
      const rentalPayment = await RentalPaymentService.createRentalPayment({
        rentalId: parseInt(id),
        paymentId: paymentId,
        paymentDate: paymentDetails.posting_date || new Date().toISOString().split('T')[0],
        amount: paymentDetails.paid_amount?.toString() || paymentDetails.total_allocated_amount?.toString() || '0',
        status: 'paid'
      });

      // Also update rental record with latest payment info
      const updateData = {
        paymentStatus: 'paid' as const,
        lastPaymentDate: paymentDetails.posting_date || new Date().toISOString().split('T')[0],
        lastPaymentAmount: paymentDetails.paid_amount?.toString() || paymentDetails.total_allocated_amount?.toString() || '0'
      };

      await RentalService.updateRental(parseInt(id), updateData);

    } catch (createError) {
      console.error('Error creating rental payment:', createError);
      return NextResponse.json(
        { 
          error: 'Failed to create payment record',
          details: createError instanceof Error ? createError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment linked successfully',
      payment: {
        id: paymentId,
        amount: paymentDetails.paid_amount || paymentDetails.total_allocated_amount,
        date: paymentDetails.posting_date
      }
    });

  } catch (error: any) {
    console.error('Error linking payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to link payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}