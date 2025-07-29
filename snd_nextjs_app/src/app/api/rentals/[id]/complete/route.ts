import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rental = await DatabaseService.getRental(params.id);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status !== 'active') {
      return NextResponse.json({ error: 'Rental must be active before completion' }, { status: 400 });
    }

    // Update rental with completion information
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        actualEndDate: new Date().toISOString(),
        status: 'completed',
        completedAt: new Date().toISOString(),
        statusLogs: {
          create: {
            oldStatus: rental.status,
            newStatus: 'completed',
            changedBy: 'system',
            reason: 'Rental completed'
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
