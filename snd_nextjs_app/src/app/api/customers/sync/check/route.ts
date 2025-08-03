import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
    'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
 * Fetch all customers from ERPNext
 */
async function fetchAllCustomersFromERPNext(): Promise<any[]> {
  try {
    console.log('Fetching customers from ERPNext...');
    
    const response = await makeERPNextRequest('/api/resource/Customer?limit_page_length=1000');
    console.log('ERPNext raw customer response:', response);
    
    // Handle different response structures
    let customerList = [];
    if (response.data && Array.isArray(response.data)) {
      customerList = response.data;
    } else if (response.results && Array.isArray(response.results)) {
      customerList = response.results;
    } else if (Array.isArray(response)) {
      customerList = response;
    } else {
      console.error('Unexpected ERPNext response structure:', response);
      throw new Error('Invalid response structure from ERPNext');
    }
    
    console.log(`Found ${customerList.length} customers in ERPNext response`);
    
    // Filter out customers without names
    const validCustomers = customerList.filter((customer: any) => 
      customer && (customer.customer_name || customer.name)
    );
    
    console.log(`Filtered to ${validCustomers.length} valid customers`);
    
    return validCustomers;
  } catch (error) {
    console.error('Error fetching customers from ERPNext:', error);
    throw error;
  }
}

export async function POST(_request: NextRequest) {
  try {
    console.log('Starting ERPNext data check...');

    // Validate environment variables
    if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
      console.log('ERPNext configuration missing:', {
        hasUrl: !!ERPNEXT_URL,
        hasKey: !!ERPNEXT_API_KEY,
        hasSecret: !!ERPNEXT_API_SECRET
      });

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
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'),
        },
        { status: 500 }
      );
    }

    // Fetch customers from ERPNext
    console.log('Fetching customers from ERPNext...');
    const erpnextCustomers = await fetchAllCustomersFromERPNext();
    console.log(`Fetched ${erpnextCustomers.length} customers from ERPNext`);
    
    // Get existing customers count for comparison
    const existingCustomerCount = await prisma.customer.count();
    console.log(`Database has ${existingCustomerCount} existing customers`);

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
      }
    };

    console.log('Check result summary:', checkResult.summary);

    return NextResponse.json({
      success: true,
      message: `Successfully checked ERPNext data. Found ${erpnextCustomers.length} customers.`,
      data: checkResult
    });

  } catch (error) {
    console.error('Error during ERPNext check:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Failed to check ERPNext data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 