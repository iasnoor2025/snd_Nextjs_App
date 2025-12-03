import { NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to create test invoice',
    usage: 'POST /api/test/create-test-invoice'
  });
}

export async function POST(request: Request) {
  try {
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        error: 'ERPNext configuration missing'
      }, { status: 400 });
    }

    const url = `${ERPNEXT_URL}/api/resource/Sales Invoice`;
    const headers = {
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Create a minimal test invoice with various date field names
    const testInvoiceData = {
      doctype: 'Sales Invoice',
      customer: 'INDEPNDENT INNOVATION GENERAL CONT.CO',
      posting_date: '2025-08-01', // July 2025 billing month
      due_date: '2025-08-31',
      set_posting_time: 1,
      
      // Try all possible field names for From/To dates
      from_date: '2025-08-01',
      to_date: '2025-08-31',
      start_date: '2025-08-01',
      end_date: '2025-08-31',
      rental_start_date: '2025-08-01',
      rental_end_date: '2025-08-31',
      service_start_date: '2025-08-01',
      service_end_date: '2025-08-31',
      period_start_date: '2025-08-01',
      period_end_date: '2025-08-31',
      
      // Common ERPNext field names
      from: '2025-08-01',
      to: '2025-08-31',
      start: '2025-08-01',
      end: '2025-08-31',
      
      items: [{
        item_code: 'SERVICE',
        item_name: 'Test Rental Service',
        description: 'Test invoice to check field mapping',
        qty: 1,
        rate: 1000,
        amount: 1000,
        uom: 'Nos'
      }],
      
      currency: 'SAR',
      company: 'Samhan Naser Al-Dosri Est',
      selling_price_list: 'Standard Selling',
      price_list_currency: 'SAR',
      plc_conversion_rate: 1,
      conversion_rate: 1,
      
      // Set totals
      base_total: 1000,
      total: 1000,
      base_grand_total: 1000,
      grand_total: 1000,
      outstanding_amount: 1000,
      base_rounded_total: 1000,
      rounded_total: 1000
    };
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testInvoiceData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to create test invoice',
        status: response.status,
        details: responseData,
        sentData: testInvoiceData
      }, { status: response.status });
    }

    // Get the created invoice to see what fields were actually saved
    const invoiceId = responseData.data?.name || responseData.name;
    
    let createdInvoice = null;
    if (invoiceId) {
      try {
        const getResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice/${invoiceId}`, {
          headers
        });
        
        if (getResponse.ok) {
          const getData = await getResponse.json();
          createdInvoice = getData.data;
        }
      } catch (error) {
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoiceId,
      createdInvoice: createdInvoice,
      sentData: testInvoiceData,
      response: responseData
    });

  } catch (error) {
    console.error('Test invoice creation error:', error);
    return NextResponse.json({
      error: 'Failed to create test invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
