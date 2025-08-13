import { NextRequest, NextResponse } from 'next/server';
import { RentalService } from '@/lib/services/rental-service';
import { PDFGenerator } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Downloading invoice PDF for rental:', id);
    
    // Get rental data with all necessary information
    const rental = await RentalService.getRental(parseInt(id));
    console.log('✅ Rental fetched:', rental ? 'success' : 'not found');

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (!rental.invoiceId) {
      return NextResponse.json(
        { error: 'No invoice found for this rental. Please generate an invoice first.' },
        { status: 400 }
      );
    }

    // Prepare invoice data for PDF generation
    const invoiceData = {
      invoiceNumber: rental.invoiceId,
      invoiceDate: rental.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: rental.paymentDueDate || new Date(Date.now() + (rental.paymentTermsDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer: {
        name: rental.customer?.name || 'Unknown Customer',
        email: rental.customer?.email || '',
        phone: rental.customer?.phone || '',
        company: rental.customer?.company || '',
        address: rental.customer?.address || '',
        vat: rental.customer?.vat || '',
      },
      rentalItems: (rental.rentalItems || [])
        .filter(item => item.equipmentId && item.equipmentName) // Filter out items with null equipmentId
        .map(item => ({
          id: item.id,
          rentalId: item.rentalId,
          equipmentId: item.equipmentId!,
          equipmentName: item.equipmentName!,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          rateType: item.rateType,
          operatorId: item.operatorId || undefined,
          status: item.status,
          notes: item.notes || '',
          createdAt: item.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: item.updatedAt || new Date().toISOString().split('T')[0],
          equipmentModelNumber: item.equipmentModelNumber || undefined,
          equipmentCategoryId: item.equipmentCategoryId || undefined,
        })),
      subtotal: rental.subtotal?.toString() || '0',
      taxAmount: rental.taxAmount?.toString() || '0',
      totalAmount: rental.totalAmount?.toString() || '0',
      discount: rental.discount?.toString() || '0',
      tax: rental.tax?.toString() || '0',
      depositAmount: rental.depositAmount?.toString() || '0',
      paymentTermsDays: rental.paymentTermsDays || 30,
      startDate: rental.startDate || new Date().toISOString().split('T')[0],
      expectedEndDate: rental.expectedEndDate || undefined,
      notes: rental.notes || '',
      createdAt: rental.createdAt || new Date().toISOString().split('T')[0],
      erpnextInvoiceId: rental.invoiceId,
    };

    // Generate PDF
    const pdfBlob = await PDFGenerator.generateRentalInvoicePDF(invoiceData);
    
    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${rental.rentalNumber}-${rental.invoiceId}.pdf"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to download invoice PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
