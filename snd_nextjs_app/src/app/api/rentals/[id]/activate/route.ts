import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

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

    if (rental.status !== 'mobilization') {
      return NextResponse.json({ error: 'Rental must be in mobilization status before activation' }, { status: 400 });
    }

    // Update rental with activation information
    const updatedRental = await prisma.rental.update({
      where: { id: parseInt(id) },
      data: {
        status: 'active',
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
      message: 'Rental activated successfully',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Error activating rental:', error);
    return NextResponse.json(
      { error: 'Failed to activate rental' },
      { status: 500 }
    );
  }
}
