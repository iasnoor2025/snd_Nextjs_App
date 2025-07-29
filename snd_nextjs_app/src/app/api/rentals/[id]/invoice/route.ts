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

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate due date based on payment terms
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (rental.paymentTermsDays || 30));

    // Create invoice and update rental
    const invoice = await prisma.invoice.create({
      data: {
        rentalId: params.id,
        userId: 'system', // You might want to get the actual user ID
        invoiceNumber,
        issueDate: new Date(),
        dueDate: dueDate,
        subtotal: rental.subtotal,
        taxAmount: rental.taxAmount,
        totalAmount: rental.totalAmount,
        discountAmount: rental.discount,
        paidAmount: 0,
        balance: rental.totalAmount,
        status: 'draft',
      }
    });

    // Update rental with invoice information and create status log
    const updatedRental = await prisma.rental.update({
      where: { id: params.id },
      data: {
        invoiceDate: new Date(),
        statusLogs: {
          create: {
            oldStatus: rental.status,
            newStatus: 'invoice_generated',
            changedBy: 'system',
            reason: `Invoice ${invoiceNumber} generated`
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
      message: 'Invoice generated successfully',
      invoice: {
        ...invoice,
        rental: updatedRental
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
