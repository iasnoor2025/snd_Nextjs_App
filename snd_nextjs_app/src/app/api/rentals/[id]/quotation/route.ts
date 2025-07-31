import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

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
    const updatedRental = await prisma.rental.update({
      where: { id: parseInt(id) },
      data: {
        quotation_id: parseInt(quotationNumber.replace(/\D/g, '')), // Extract numeric part
        status: 'quotation_generated',
      },
      include: {
        customer: true,
        rental_items: {
          include: {
            equipment: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Quotation generated successfully',
      quotation: {
        id: quotationNumber,
        rental_id: parseInt(id),
        quotation_number: quotationNumber,
        created_at: new Date().toISOString(),
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
