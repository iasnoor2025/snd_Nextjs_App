import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await DatabaseService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status !== 'approved') {
      return NextResponse.json({ error: 'Rental must be approved before mobilization' }, { status: 400 });
    }

    // Update rental with mobilization information
    const updatedRentalResult = await db.update(rentals)
      .set({
        mobilizationDate: new Date(),
        status: 'mobilization',
      })
      .where(eq(rentals.id, parseInt(id)))
      .returning();
    
    const updatedRental = updatedRentalResult[0];

    return NextResponse.json({
      message: 'Mobilization started successfully',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Error starting mobilization:', error);
    return NextResponse.json(
      { error: 'Failed to start mobilization' },
      { status: 500 }
    );
  }
}
