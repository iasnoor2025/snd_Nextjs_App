import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status !== 'active') {
      return NextResponse.json({ error: 'Rental must be active before completion' }, { status: 400 });
    }

    // Update rental with completion information
    const updatedRentalResult = await db.update(rentals)
      .set({
        actualEndDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(rentals.id, parseInt(id)))
      .returning();
    
    const updatedRental = updatedRentalResult[0];

    return NextResponse.json({
      message: 'Rental completed successfully',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Error completing rental:', error);
    return NextResponse.json(
      { error: 'Failed to complete rental' },
      { status: 500 }
    );
  }
}
