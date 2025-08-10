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
    console.log('Generating quotation for rental:', id);
    const rental = await DatabaseService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Generate unique quotation number
    const quotationNumber = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update rental with quotation information
    const updatedRentalResult = await db.update(rentals)
      .set({
        quotationId: parseInt(quotationNumber.replace(/\D/g, '')), // Extract numeric part
        status: 'quotation_generated',
      })
      .where(eq(rentals.id, parseInt(id)))
      .returning();
    
    const updatedRental = updatedRentalResult[0];

    // Fetch rental with related data
    const rentalWithDetails = await db.select()
      .from(rentals)
      .where(eq(rentals.id, parseInt(id)))
      .limit(1);

    return NextResponse.json({
      message: 'Quotation generated successfully',
      quotation: {
        id: quotationNumber,
        rentalId: parseInt(id),
        quotationNumber: quotationNumber,
        createdAt: new Date().toISOString(),
        rental: updatedRental
      }
    });
  } catch (error) {
    console.error('Error generating quotation:', error);
    return NextResponse.json(
      { error: 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
