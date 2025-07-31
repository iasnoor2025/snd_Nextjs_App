import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Approving rental:', id);
    const rental = await DatabaseService.getRental(parseInt(id));

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotation_id) {
      console.log('No quotation found for rental:', rental);
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Update rental with approval information
    const updatedRental = await prisma.rental.update({
      where: { id: parseInt(id) },
      data: {
        approved_at: new Date(),
        status: 'approved',
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
      message: 'Quotation approved successfully',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Error approving quotation:', error);
    return NextResponse.json(
      { error: 'Failed to approve quotation' },
      { status: 500 }
    );
  }
}
