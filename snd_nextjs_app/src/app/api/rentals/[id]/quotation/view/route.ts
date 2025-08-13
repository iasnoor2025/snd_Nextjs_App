import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Fetching rental with ID:', id);
    
    const rental = await RentalService.getRental(parseInt(id));
    console.log('📦 Rental data received:', rental);

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.quotationId) {
      return NextResponse.json({ error: 'No quotation found for this rental' }, { status: 404 });
    }

    // Ensure customer data exists
    if (!rental.customer) {
      console.log('❌ Customer data missing from rental:', rental);
      return NextResponse.json({ error: 'Customer data not found for this rental' }, { status: 404 });
    }

    console.log('👤 Customer data found:', rental.customer);

    // Generate quotation data for display
    const quotation = {
      id: rental.quotationId,
      quotationNumber: `QT-${rental.quotationId}`,
      displayNumber: `QT-${rental.quotationId.toString().padStart(6, '0')}`,
      customer: {
        name: rental.customer.name || 'Unknown Customer',
        company: rental.customer.company || '',
        address: rental.customer.address || '',
        vat: rental.customer.vat || '',
        email: rental.customer.email || '',
        phone: rental.customer.phone || ''
      },
      rentalItems: rental.rental_items || [],
      subtotal: rental.subtotal || 0,
      taxAmount: rental.taxAmount || 0,
      totalAmount: rental.totalAmount || 0,
      discount: rental.discount || 0,
      tax: rental.tax || 0,
      finalAmount: rental.finalAmount || 0,
      depositAmount: rental.depositAmount || 0,
      paymentTermsDays: rental.paymentTermsDays || 30,
      startDate: rental.startDate ? new Date(rental.startDate).toISOString() : new Date().toISOString(),
      expectedEndDate: rental.expectedEndDate ? new Date(rental.expectedEndDate).toISOString() : undefined,
      notes: rental.notes || '',
      createdAt: rental.createdAt ? new Date(rental.createdAt).toISOString() : new Date().toISOString(),
      status: 'draft',
      // Note: Some fields like validity, customerReference, deliveryAddress, etc. don't exist in rentals schema
      // These are set to empty strings as they are not available
      validity: '',
      customerReference: '',
      deliveryAddress: '',
      projectName: '',
      deliveryRequiredBy: '',
      deliveryTerms: rental.deliveryTerms || '',
      shipVia: '',
      shipmentTerms: rental.shipmentTerms || '',
      rentalTerms: rental.rentalTerms || '',
      paymentTerms: rental.paymentTerms || '',
      additionalTerms: rental.additionalTerms || '',
      mdTerms: rental.mdTerms || ''
    };

    console.log('📄 Generated quotation data:', quotation);

    // Return quotation data directly (not wrapped in an object)
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('❌ Error fetching quotation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}
