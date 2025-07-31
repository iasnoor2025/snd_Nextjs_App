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

    if (rental.status !== 'active') {
      return NextResponse.json({ error: 'Rental must be active before completion' }, { status: 400 });
    }

    // Update rental with completion information
    const updatedRental = await prisma.rental.update({
      where: { id: parseInt(id) },
      data: {
        actual_end_date: new Date(),
        status: 'completed',
        completed_at: new Date(),
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
