import { NextRequest, NextResponse } from 'next/server';
import { RentalInvoiceService } from '@/lib/services/rental-invoice-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rentalId = parseInt(id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' },
        { status: 400 }
      );
    }

    const invoices = await RentalInvoiceService.getRentalInvoices(rentalId);

    return NextResponse.json(invoices);

  } catch (error: any) {
    console.error('Error fetching rental invoices:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch rental invoices',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
