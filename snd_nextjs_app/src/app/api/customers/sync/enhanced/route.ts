import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing. Please check your environment variables.');
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
 * Fetch all customers from ERPNext with detailed information
 */
async function fetchAllCustomersFromERPNext(): Promise<any[]> {
  try {
    const response = await makeERPNextRequest('/api/resource/Customer?limit_page_length=1000');

    // Handle different response structures
    let customerList: any[] = [];
    if (response.data && Array.isArray(response.data)) {
      customerList = response.data;
    } else if (response.results && Array.isArray(response.results)) {
      customerList = response.results;
    } else if (Array.isArray(response)) {
      customerList = response;
    } else {
      throw new Error('Invalid response structure from ERPNext');
    }

    // Filter out customers without names
    const validCustomers = customerList.filter(
      (customer: any) => customer && (customer.customer_name || customer.name)
    );

    // Fetch detailed information for each customer
    const detailedCustomers = [];
    for (const customer of validCustomers) {
      try {
        const customerName = customer.customer_name || customer.name;
        const detailResponse = await makeERPNextRequest(
          `/api/resource/Customer/${encodeURIComponent(customerName)}`
        );
        
        if (detailResponse.data) {
          detailedCustomers.push(detailResponse.data);
        }
      } catch (error) {
        console.warn(`Failed to fetch details for customer ${customer.customer_name || customer.name}:`, error);
        // Still include the basic customer info
        detailedCustomers.push(customer);
      }
    }

    return detailedCustomers;
  } catch (error) {
    throw error;
  }
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
    creditLimit: erpnextCustomer.credit_limit ? String(parseFloat(erpnextCustomer.credit_limit)) : null,
    creditLimitUsed: erpnextCustomer.credit_limit_used ? String(parseFloat(erpnextCustomer.credit_limit_used)) : null,
    creditLimitRemaining: erpnextCustomer.credit_limit_remaining ? String(parseFloat(erpnextCustomer.credit_limit_remaining)) : null,
    paymentTerms: erpnextCustomer.payment_terms || (erpnextCustomer.payment_terms_days ? `${erpnextCustomer.payment_terms_days} days` : null),
    currentDue: erpnextCustomer.current_due ? String(parseFloat(erpnextCustomer.current_due)) : null,
    totalValue: erpnextCustomer.total_value ? String(parseFloat(erpnextCustomer.total_value)) : null,
    outstandingAmount: erpnextCustomer.outstanding_amount ? String(parseFloat(erpnextCustomer.outstanding_amount)) : null,
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
    createdAt: new Date().toISOString().split('T')[0] || null,
    updatedAt: new Date().toISOString().split('T')[0] || null,
  };
}

const syncCustomersEnhancedHandler = async (_request: NextRequest) => {
  try {
    // Validate environment variables
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          message: 'ERPNext configuration is missing. Please check your environment variables.',
        },
        { status: 500 }
      );
    }

    // Test database connection
    try {
      await db.execute('select 1');
    } catch (dbError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Fetch customers from ERPNext
    const erpnextCustomers = await fetchAllCustomersFromERPNext();
    
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each customer
    for (const erpnextCustomer of erpnextCustomers) {
      try {
        const customerData = mapERPNextCustomerToLocal(erpnextCustomer);
        const erpnextId = customerData.erpnextId;

        if (!erpnextId) {
          errors.push(`Customer ${customerData.name} has no ERPNext ID, skipping`);
          continue;
        }

        // Check if customer already exists by ERPNext ID
        const existingCustomer = await db
          .select()
          .from(customers)
          .where(eq(customers.erpnextId, erpnextId));

        if (existingCustomer.length > 0) {
          // Update existing customer
          await db
            .update(customers)
            .set({
              ...customerData,
              id: undefined, // Remove id from update
            })
            .where(eq(customers.id, existingCustomer[0].id));

          updatedCount++;
        } else {
          // Create new customer
          await db.insert(customers).values(customerData);
          createdCount++;
        }

        processedCount++;
      } catch (error) {
        const customerName = erpnextCustomer.name || erpnextCustomer.customer_name || 'Unknown';
        errors.push(
          `Failed to process ${customerName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enhanced customer sync completed successfully. ${processedCount} customers processed.`,
      data: {
        processed: processedCount,
        created: createdCount,
        updated: updatedCount,
        total: erpnextCustomers.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Failed to sync customers from ERPNext: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.customer.sync)(syncCustomersEnhancedHandler);
