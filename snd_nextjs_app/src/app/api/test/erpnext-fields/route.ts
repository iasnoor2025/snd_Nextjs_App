import { NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

export async function GET() {
  try {
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        error: 'ERPNext configuration missing'
      }, { status: 400 });
    }

    const headers = {
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Get existing invoices to see what fields are available
    const response = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice?limit_page_length=5`, {
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Failed to fetch invoices',
        status: response.status,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const invoices = data.data || [];

    // Analyze field structure
    const allFields = new Set();
    const dateFields = new Set();
    
    invoices.forEach((invoice: any) => {
      Object.keys(invoice).forEach(field => {
        allFields.add(field);
        
        // Check if field looks like a date field
        if (field.toLowerCase().includes('date') || 
            field.toLowerCase().includes('from') || 
            field.toLowerCase().includes('to') ||
            field.toLowerCase().includes('start') ||
            field.toLowerCase().includes('end') ||
            field.toLowerCase().includes('time')) {
          dateFields.add(field);
        }
      });
    });

    // Get a detailed view of one invoice
    let detailedInvoice = null;
    if (invoices.length > 0) {
      try {
        const detailResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice/${invoices[0].name}`, {
          headers
        });
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          detailedInvoice = detailData.data;
        }
      } catch (error) {
      }
    }

    return NextResponse.json({
      success: true,
      totalInvoices: invoices.length,
      allFields: Array.from(allFields).sort(),
      dateFields: Array.from(dateFields).sort(),
      sampleInvoices: invoices.map(inv => ({
        name: inv.name,
        posting_date: inv.posting_date,
        due_date: inv.due_date,
        // Show all date-related fields
        ...Object.fromEntries(
          Object.entries(inv).filter(([key, value]) => 
            key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('from') || 
            key.toLowerCase().includes('to') ||
            key.toLowerCase().includes('start') ||
            key.toLowerCase().includes('end') ||
            key.toLowerCase().includes('time')
          )
        )
      })),
      detailedInvoice: detailedInvoice ? {
        name: detailedInvoice.name,
        posting_date: detailedInvoice.posting_date,
        due_date: detailedInvoice.due_date,
        // Show all fields that might be From/To dates
        allFields: Object.keys(detailedInvoice).filter(key => 
          key.toLowerCase().includes('date') || 
          key.toLowerCase().includes('from') || 
          key.toLowerCase().includes('to') ||
          key.toLowerCase().includes('start') ||
          key.toLowerCase().includes('end') ||
          key.toLowerCase().includes('time')
        ).reduce((obj, key) => {
          obj[key] = detailedInvoice[key];
          return obj;
        }, {} as any)
      } : null
    });

  } catch (error) {
    console.error('ERPNext field analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze ERPNext fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
