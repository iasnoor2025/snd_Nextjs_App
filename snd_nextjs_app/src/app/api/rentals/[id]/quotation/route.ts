import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Generating quotation for rental:', params.id);
    const rental = await DatabaseService.getRental(params.id);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Generate unique quotation number
    const quotationNumber = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update rental with quotation information and create status log
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        quotationId: quotationNumber,
        status: 'quotation_generated',
        statusLogs: {
          create: {
            oldStatus: rental.status,
            newStatus: 'quotation_generated',
            changedBy: 'system',
            reason: `Quotation ${quotationNumber} generated`
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
      message: 'Quotation generated successfully',
      quotation: {
        id: quotationNumber,
        rentalId: params.id,
        quotationNumber,
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
