import { NextRequest, NextResponse } from 'next/server';
import { ERPNextInvoiceService } from '@/lib/services/erpnext-invoice-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const { invoiceId } = params;

    // Fetch invoice from ERPNext
    const invoice = await ERPNextInvoiceService.getInvoice(invoiceId);

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching ERPNext invoice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoice from ERPNext',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

