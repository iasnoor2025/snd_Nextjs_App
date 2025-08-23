import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing');
  }

  const url = `${ERPNEXT_URL}${endpoint}`;
  const defaultHeaders = {
    Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Map ERPNext customer data to our database schema
 */
function mapERPNextCustomerToLocal(erpnextCustomer: any) {
  return {
    name: erpnextCustomer.name || erpnextCustomer.customer_name || 'Unknown Customer',
    companyName: erpnextCustomer.company_name || erpnextCustomer.name || 'Unknown Company',
    contactPerson: erpnextCustomer.contact_person || erpnextCustomer.contact_person_name || null,
    email: erpnextCustomer.email || erpnextCustomer.email_id || null,
    phone: erpnextCustomer.phone || erpnextCustomer.mobile_no || erpnextCustomer.phone_no || null,
    address: erpnextCustomer.address || erpnextCustomer.primary_address || erpnextCustomer.customer_address || null,
    city: erpnextCustomer.city || null,
    state: erpnextCustomer.state || erpnextCustomer.province || null,
    postalCode: erpnextCustomer.postal_code || erpnextCustomer.pincode || null,
    country: erpnextCustomer.country || null,
    website: erpnextCustomer.website || null,
    taxNumber: erpnextCustomer.tax_number || erpnextCustomer.tax_id || null,
    vatNumber: erpnextCustomer.vat_number || erpnextCustomer.gst_number || null,
    creditLimit: erpnextCustomer.credit_limit ? parseFloat(erpnextCustomer.credit_limit) : null,
    creditLimitUsed: erpnextCustomer.credit_limit_used ? parseFloat(erpnextCustomer.credit_limit_used) : null,
    creditLimitRemaining: erpnextCustomer.credit_limit_remaining ? parseFloat(erpnextCustomer.credit_limit_remaining) : null,
    paymentTerms: erpnextCustomer.payment_terms || (erpnextCustomer.payment_terms_days ? `${erpnextCustomer.payment_terms_days} days` : null),
    currentDue: erpnextCustomer.current_due ? parseFloat(erpnextCustomer.current_due) : null,
    totalValue: erpnextCustomer.total_value ? parseFloat(erpnextCustomer.total_value) : null,
    outstandingAmount: erpnextCustomer.outstanding_amount ? parseFloat(erpnextCustomer.outstanding_amount) : null,
    currency: erpnextCustomer.currency || erpnextCustomer.default_currency || 'SAR',
    customerType: erpnextCustomer.customer_type || erpnextCustomer.customer_group || null,
    customerGroup: erpnextCustomer.customer_group || erpnextCustomer.customer_type || null,
    territory: erpnextCustomer.territory || erpnextCustomer.sales_territory || null,
    salesPerson: erpnextCustomer.sales_person || erpnextCustomer.sales_partner || null,
    defaultPriceList: erpnextCustomer.default_price_list || erpnextCustomer.price_list || null,
    defaultCurrency: erpnextCustomer.default_currency || erpnextCustomer.currency || 'SAR',
    language: erpnextCustomer.language || erpnextCustomer.default_language || 'en',
    notes: erpnextCustomer.notes || erpnextCustomer.remarks || null,
    remarks: erpnextCustomer.remarks || erpnextCustomer.notes || null,
    isActive: erpnextCustomer.is_active !== false,
    erpnextId: erpnextCustomer.erpnext_id || erpnextCustomer.name || null,
    status: erpnextCustomer.status || 'active',
    updatedAt: new Date().toISOString().split('T')[0] || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (you can implement this for security)
    const body = await request.json();
    
    // Extract customer data from webhook payload
    const customerData = body.data || body;
    const eventType = body.event_type || body.type || 'update'; // create, update, delete
    
    if (!customerData || !customerData.name) {
      return NextResponse.json(
        { success: false, message: 'Invalid customer data in webhook' },
        { status: 400 }
      );
    }

    console.log(`ERPNext webhook received: ${eventType} for customer ${customerData.name}`);

    // Fetch full customer details from ERPNext
    let fullCustomerData;
    try {
      const customerName = customerData.name;
      fullCustomerData = await makeERPNextRequest(
        `/api/resource/Customer/${encodeURIComponent(customerName)}`
      );
      
      if (fullCustomerData.data) {
        fullCustomerData = fullCustomerData.data;
      }
    } catch (error) {
      console.error(`Failed to fetch customer details for ${customerData.name}:`, error);
      // Use the webhook data if we can't fetch full details
      fullCustomerData = customerData;
    }

    // Map the data to our schema
    const mappedCustomer = mapERPNextCustomerToLocal(fullCustomerData);
    const erpnextId = mappedCustomer.erpnextId;

    if (!erpnextId) {
      return NextResponse.json(
        { success: false, message: 'Customer has no ERPNext ID' },
        { status: 400 }
      );
    }

    // Check if customer exists in our database
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.erpnextId, erpnextId));

    let result;
    if (existingCustomer.length > 0) {
      // Update existing customer
      if (eventType === 'delete') {
        // Mark as inactive instead of deleting
        await db
          .update(customers)
          .set({
            isActive: false,
            status: 'inactive',
            updatedAt: new Date().toISOString().split('T')[0],
          })
          .where(eq(customers.id, existingCustomer[0].id));
        
        result = { action: 'deactivated', customerId: existingCustomer[0].id };
      } else {
        // Update customer
        await db
          .update(customers)
          .set({
            ...mappedCustomer,
            id: undefined, // Remove id from update
          })
          .where(eq(customers.id, existingCustomer[0].id));
        
        result = { action: 'updated', customerId: existingCustomer[0].id };
      }
    } else {
      // Create new customer (only if not a delete event)
      if (eventType !== 'delete') {
        const insertedCustomer = await db.insert(customers).values({
          ...mappedCustomer,
          createdAt: new Date().toISOString().split('T')[0],
        }).returning();
        
        result = { action: 'created', customerId: insertedCustomer[0].id };
      } else {
        result = { action: 'skipped', reason: 'Customer not found for deletion' };
      }
    }

    // Send SSE notification to connected clients
    try {
      await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer_update',
          payload: {
            eventType,
            customerId: result.customerId,
            customerName: mappedCustomer.name,
            timestamp: new Date().toISOString(),
            action: result.action,
          },
        }),
      });
    } catch (sseError) {
      console.warn('Failed to send SSE notification:', sseError);
    }

    return NextResponse.json({
      success: true,
      message: `Customer ${result.action} successfully`,
      data: result,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'ERPNext Customer Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
