import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { db } from '@/lib/db';
import { rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Generating quotation for rental:', id);
    
    // Test database connection first
    try {
      await db.select({ test: sql`1` }).from(rentals).limit(1);
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    const rental = await RentalService.getRental(parseInt(id));
    console.log('✅ Rental fetched:', rental ? 'success' : 'not found');

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Generate unique quotation number and ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
    const quotationNumber = `QT-${randomSuffix}-${Math.floor(timestamp / 1000000)}`;
    
    // Generate a smaller quotation ID that fits in PostgreSQL integer
    const quotationId = Math.floor(timestamp / 1000) + Math.floor(Math.random() * 10000);
    
    console.log('✅ Quotation number generated:', quotationNumber);
    console.log('✅ Quotation ID generated:', quotationId);

    // Update rental with quotation information
    try {
      await db.update(rentals)
        .set({
          quotationId: quotationId, // Use the generated quotationId
          status: 'quotation_generated',
        })
        .where(eq(rentals.id, parseInt(id)));
      
      console.log('✅ Rental updated successfully');
    } catch (updateError) {
      console.error('❌ Failed to update rental:', updateError);
      return NextResponse.json(
        { error: 'Failed to update rental', details: updateError instanceof Error ? updateError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Fetch rental with related data
    try {
      await db.select()
        .from(rentals)
        .where(eq(rentals.id, parseInt(id)))
        .limit(1);
      
      console.log('✅ Rental details fetched successfully');
    } catch (fetchError) {
      console.error('❌ Failed to fetch rental details:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch rental details', details: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
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
        rental: { id: parseInt(id) }
      }
    });
  } catch (error) {
    console.error('❌ Error generating quotation:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { 
        error: 'Failed to generate quotation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
