import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(_request: NextRequest) {
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
      // Drizzle pool is initialized at import; try a trivial query
      await db.execute(sql`select 1`);
      
    } catch (dbError) {
      
      return NextResponse.json(
        {
          success: false,
          message:
            'Database connection failed: ' +
            (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Fetch customers from ERPNext
    
    const erpnextCustomers = await fetchAllCustomersFromERPNext();

    // Get existing customers count for comparison
    const countRows = await db.execute(sql`select count(*)::int as count from customers`);
    const existingCustomerCount = Number((countRows as any)?.rows?.[0]?.count ?? 0);

    // Prepare check result
    const checkResult = {
      erpnextCustomers: erpnextCustomers,
      existingCustomerCount,
      erpnextCustomerCount: erpnextCustomers.length,
      timestamp: new Date().toISOString(),
      summary: {
        total: erpnextCustomers.length,
        withEmail: erpnextCustomers.filter(c => c.email_id || c.email).length,
        withPhone: erpnextCustomers.filter(c => c.mobile_no || c.phone).length,
        withAddress: erpnextCustomers.filter(c => c.primary_address || c.customer_address).length,
      },
    };

    return NextResponse.json({
      success: true,
      message: `Successfully checked ERPNext data. Found ${erpnextCustomers.length} customers.`,
      data: checkResult,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to check ERPNext data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  } finally {
    // nothing to disconnect with Drizzle
  }
}
