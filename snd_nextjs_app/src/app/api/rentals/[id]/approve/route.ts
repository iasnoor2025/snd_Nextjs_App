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
    const rental = await DatabaseService.getRental(id);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotationId) {
      console.log('No quotation found for rental:', rental);
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Update rental with approval information
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        approvedAt: new Date().toISOString(),
        status: 'approved',
        statusLogs: {
          create: {
            oldStatus: rental.status,
            newStatus: 'approved',
            changedBy: 'customer',
            reason: 'Quotation approved by customer'
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
