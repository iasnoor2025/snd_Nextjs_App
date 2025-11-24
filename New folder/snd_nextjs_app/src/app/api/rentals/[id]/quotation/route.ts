import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Test database connection first
    try {
      await db
        .select({ test: sql`1` })
        .from(rentals)
        .limit(1);
      
    } catch (dbError) {
      
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    const rental = await RentalService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Generate unique quotation number and ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    const quotationNumber = `QT-${randomSuffix}-${Math.floor(timestamp / 1000000)}`;

    // Generate a smaller quotation ID that fits in PostgreSQL integer
    const quotationId = Math.floor(timestamp / 1000) + Math.floor(Math.random() * 10000);

    // Update rental with quotation information
    try {
      await db
        .update(rentals)
        .set({
          quotationId: quotationId, // Use the generated quotationId
          status: 'quotation_generated',
        })
        .where(eq(rentals.id, parseInt(id)));

    } catch (updateError) {
      
      return NextResponse.json(
        {
          error: 'Failed to update rental',
          details: updateError instanceof Error ? updateError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Fetch rental with related data
    try {
      await db
        .select()
        .from(rentals)
        .where(eq(rentals.id, parseInt(id)))
        .limit(1);

    } catch (fetchError) {
      
      return NextResponse.json(
        {
          error: 'Failed to fetch rental details',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Quotation generated successfully',
      quotation: {
        id: quotationNumber,
        rentalId: parseInt(id),
        quotationNumber: quotationNumber,
        createdAt: new Date().toISOString(),
        rental: { id: parseInt(id) },
      },
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Failed to generate quotation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
