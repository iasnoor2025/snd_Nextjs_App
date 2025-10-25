import { NextRequest, NextResponse } from 'next/server';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';
import { RentalService } from '@/lib/services/rental-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const rentalId = parseInt(id);

    if (isNaN(rentalId)) {
      return NextResponse.json(
        { error: 'Invalid rental ID' },
        { status: 400 }
      );
    }

    // Get rental details to find customer
    const rental = await RentalService.getRental(rentalId);
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }
    
    if (!rental.customerId) {
      return NextResponse.json([]); // No customer, no invoices
    }

    // Fetch invoices from ERPNext for this customer
    const invoices = await ERPNextInvoiceService.getInvoicesByCustomer(rental.customerId.toString());

    // Return all invoices for this customer
    return NextResponse.json(invoices);

  } catch (error: any) {
    console.error('Error fetching invoices from ERPNext:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices from ERPNext',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
