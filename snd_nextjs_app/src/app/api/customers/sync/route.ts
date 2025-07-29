import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET;

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
 * Map ERPNext customer fields to local fields
 */
function mapERPNextToLocal(erpCustomer: any) {
  return {
    name: erpCustomer.customer_name || erpCustomer.name || null,
    company_name: erpCustomer.customer_name || erpCustomer.name || null,
    contact_person: erpCustomer.contact_person || null,
    email: erpCustomer.email_id || erpCustomer.email || null,
    phone: erpCustomer.mobile_no || erpCustomer.phone || null,
    address: erpCustomer.customer_address || erpCustomer.address_line1 || erpCustomer.address || null,
    city: erpCustomer.city || null,
    state: erpCustomer.state || null,
    postal_code: erpCustomer.pincode || erpCustomer.postal_code || null,
    country: erpCustomer.country || null,
    tax_number: erpCustomer.tax_id || erpCustomer.vat || null,
    credit_limit: erpCustomer.credit_limit ? parseFloat(erpCustomer.credit_limit) : null,
    payment_terms: erpCustomer.payment_terms || null,
    notes: erpCustomer.notes || null,
    is_active: (erpCustomer.disabled || 0) == 0,
    erpnext_id: erpCustomer.name || null,
  };
}

/**
 * Fetch all customers from ERPNext
 */
async function fetchAllCustomersFromERPNext(): Promise<any[]> {
  try {
    console.log('Fetching customers from ERPNext...');
    
    const response = await makeERPNextRequest('/api/resource/Customer?limit_page_length=1000');
    console.log('ERPNext raw customer response:', response);
    
    const customers = [];
    
    if (response.data && Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.name) {
          const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            customers.push(detailResponse.data);
          }
        }
      }
      return customers;
    }
    
    if (response.results && Array.isArray(response.results)) {
      for (const item of response.results) {
        if (item.name) {
          const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            customers.push(detailResponse.data);
          }
        }
      }
      return customers;
    }
    
    if (Array.isArray(response)) {
      for (const item of response) {
        if (item.name) {
          const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            customers.push(detailResponse.data);
          }
        }
      }
      return customers;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching customers from ERPNext:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check if database has existing customers
    const existingCustomerCount = await prisma.customer.count();
    console.log(`Database has ${existingCustomerCount} existing customers`);

    // Fetch customers from ERPNext
    console.log('Fetching customers from ERPNext...');
    const erpnextCustomers = await fetchAllCustomersFromERPNext();
    console.log(`Fetched ${erpnextCustomers.length} customers from ERPNext`);

    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    // Process each customer
    for (const erpCustomer of erpnextCustomers) {
      try {
        const mappedData = mapERPNextToLocal(erpCustomer);
        
        // Skip if no ERPNext ID
        if (!mappedData.erpnext_id) {
          console.log('Skipping customer without ERPNext ID:', erpCustomer);
          continue;
        }

        // Fallback: if company_name is missing, use ERPNext 'name' field
        if (empty(mappedData.company_name) && erpCustomer.name) {
          mappedData.company_name = erpCustomer.name;
          mappedData.name = erpCustomer.name;
        }

        // Always set erpnext_id from ERPNext 'name' field
        mappedData.erpnext_id = erpCustomer.name || null;
        
        if (empty(mappedData.erpnext_id)) {
          console.log('Skipping customer without valid ERPNext ID');
          continue;
        }

        // Update or create customer
        const customer = await prisma.customer.upsert({
          where: { erpnext_id: mappedData.erpnext_id },
          update: mappedData,
          create: mappedData,
        });

        if (customer) {
          processedCount++;
          // Check if this was a create or update operation
          const existingCustomer = await prisma.customer.findUnique({
            where: { erpnext_id: mappedData.erpnext_id }
          });
          
          if (existingCustomer && existingCustomer.id !== customer.id) {
            updatedCount++;
          } else {
            createdCount++;
          }
        }

      } catch (error) {
        console.error('Error processing customer:', erpCustomer, error);
        // Continue with next customer
      }
    }

    console.log(`ERPNext Customer Sync: ${processedCount} customers processed.`);
    console.log(`Created: ${createdCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      message: `ERPNext Customer Sync complete. ${processedCount} customers processed.`,
      data: {
        processed: processedCount,
        created: createdCount,
        updated: updatedCount,
        total: erpnextCustomers.length
      }
    });

  } catch (error) {
    console.error('Error in customer sync:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync customers from ERPNext'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to check if value is empty
function empty(value: any): boolean {
  return value === null || value === undefined || value === '';
} 