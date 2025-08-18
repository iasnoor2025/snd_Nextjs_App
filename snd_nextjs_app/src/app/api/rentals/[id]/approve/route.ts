import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('Approving rental:', id);
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotationId) {
      console.log('No quotation found for rental:', rental);
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Update rental with approval information
    const updatedRentalResult = await db
      .update(rentals)
      .set({
        approvedAt: new Date().toISOString().split('T')[0],
        status: 'approved',
      })
      .where(eq(rentals.id, parseInt(id)))
      .returning();

    const updatedRental = updatedRentalResult[0];

    return NextResponse.json({
      message: 'Quotation approved successfully',
      rental: updatedRental,
    });
  } catch (error) {
    console.error('Error approving quotation:', error);
    return NextResponse.json({ error: 'Failed to approve quotation' }, { status: 500 });
  }
}
