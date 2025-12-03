import { NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || process.env.ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY || process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET || process.env.ERPNEXT_API_SECRET;

export async function GET() {
  try {
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json({
        error: 'ERPNext configuration missing',
        missing: {
          url: !ERPNEXT_URL,
          apiKey: !ERPNEXT_API_KEY,
          apiSecret: !ERPNEXT_API_SECRET
        }
      }, { status: 400 });
    }

    // Test ERPNext connection
    const url = `${ERPNEXT_URL}/api/resource/Sales Invoice`;
    const headers = {
      Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Try multiple approaches to get Sales Invoice structure
    let fields = [];
    let doctypeData = null;

    // Approach 1: Try to get doctype structure
    try {
      const response = await fetch(`${ERPNEXT_URL}/api/method/frappe.desk.form.load.getdoctype`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          doctype: 'Sales Invoice',
          with_children: 1
        })
      });

      if (response.ok) {
        doctypeData = await response.json();
        fields = doctypeData.message?.fields || [];
      }
    } catch (error) {
    }

    // Approach 2: Try to get fields from meta
    if (fields.length === 0) {
      try {
        const metaResponse = await fetch(`${ERPNEXT_URL}/api/method/frappe.client.get_meta`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            doctype: 'Sales Invoice'
          })
        });

        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          fields = metaData.message?.fields || [];
        }
      } catch (error) {
      }
    }

    // Approach 3: Try to get from resource endpoint
    if (fields.length === 0) {
      try {
        const resourceResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice?fields=["*"]&limit_page_length=1`, {
          headers
        });

        if (resourceResponse.ok) {
          const resourceData = await resourceResponse.json();
          if (resourceData.data && resourceData.data.length > 0) {
            // Get all field names from the sample data
            const sampleFields = Object.keys(resourceData.data[0]);
            fields = sampleFields.map(fieldname => ({
              fieldname: fieldname,
              fieldtype: 'Unknown',
              label: fieldname
            }));
          }
        }
      } catch (error) {
      }
    }

    const dateFields = fields.filter((field: any) => 
      field.fieldtype === 'Date' || 
      field.fieldtype === 'Datetime' ||
      field.fieldname?.toLowerCase().includes('date') ||
      field.fieldname?.toLowerCase().includes('from') ||
      field.fieldname?.toLowerCase().includes('to') ||
      field.fieldname?.toLowerCase().includes('start') ||
      field.fieldname?.toLowerCase().includes('end')
    );

    // Also try to get a sample invoice to see actual field structure
    let sampleInvoice = null;
    try {
      const sampleResponse = await fetch(`${ERPNEXT_URL}/api/resource/Sales Invoice?limit_page_length=1`, {
        headers
      });
      
      if (sampleResponse.ok) {
        const sampleData = await sampleResponse.json();
        sampleInvoice = sampleData.data?.[0] || null;
      }
    } catch (error) {
    }

    return NextResponse.json({
      success: true,
      doctype: 'Sales Invoice',
      totalFields: fields.length,
      dateFields: dateFields.map((field: any) => ({
        fieldname: field.fieldname,
        label: field.label,
        fieldtype: field.fieldtype,
        options: field.options,
        reqd: field.reqd,
        description: field.description
      })),
      sampleInvoiceFields: sampleInvoice ? Object.keys(sampleInvoice) : null,
      sampleInvoice: sampleInvoice ? {
        name: sampleInvoice.name,
        posting_date: sampleInvoice.posting_date,
        due_date: sampleInvoice.due_date,
        // Look for any date fields that might be From/To
        ...Object.fromEntries(
          Object.entries(sampleInvoice).filter(([key, value]) => 
            key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('from') || 
            key.toLowerCase().includes('to') ||
            key.toLowerCase().includes('start') ||
            key.toLowerCase().includes('end')
          )
        )
      } : null
    });

  } catch (error) {
    console.error('ERPNext structure test error:', error);
    return NextResponse.json({
      error: 'Failed to test ERPNext structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
