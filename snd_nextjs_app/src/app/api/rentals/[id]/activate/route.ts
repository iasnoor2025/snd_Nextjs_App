import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rental = await DatabaseService.getRental(id);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status !== 'mobilization') {
      return NextResponse.json({ error: 'Rental must be in mobilization status before activation' }, { status: 400 });
    }

    // Update rental with activation information
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: 'active',
        statusLogs: {
          create: {
            oldStatus: rental.status,
            newStatus: 'active',
            changedBy: 'system',
            reason: 'Rental activated'
          }
        }
      },
      include: {
        customer: true,
        rentalItems: {
          include: {
            equipment: true
          }
        },
        payments: true,
        invoices: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' }
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
