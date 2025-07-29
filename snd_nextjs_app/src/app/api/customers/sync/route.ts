import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
 * Map ERPNext customer fields to local fields
 */
function mapERPNextToLocal(erpCustomer: Record<string, any>) {
  console.log('Mapping customer:', erpCustomer.name || erpCustomer.customer_name);
  
  // Extract address from primary_address if it's HTML
  let address = null;
  if (erpCustomer.primary_address) {
    // Remove HTML tags and clean up the address
    address = erpCustomer.primary_address
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  const mappedData = {
    name: erpCustomer.customer_name || erpCustomer.name || null,
    company_name: erpCustomer.customer_name || erpCustomer.name || null,
    contact_person: erpCustomer.contact_person || null,
    email: erpCustomer.email_id || erpCustomer.email || null,
    phone: erpCustomer.mobile_no || erpCustomer.phone || null,
    address: address || erpCustomer.customer_address || erpCustomer.address_line1 || erpCustomer.address || null,
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
  
  console.log('Mapped data:', mappedData);
  return mappedData;
}

/**
 * Fetch all customers from ERPNext
 */
async function fetchAllCustomersFromERPNext(): Promise<any[]> {
  try {
    console.log('Fetching customers from ERPNext...');
    
    const response = await makeERPNextRequest('/api/resource/Customer?limit_page_length=1000');
    console.log('ERPNext raw customer response:', response);
    console.log('Response structure:', {
      hasData: !!response.data,
      dataLength: response.data?.length || 0,
      hasResults: !!response.results,
      resultsLength: response.results?.length || 0,
      isArray: Array.isArray(response),
      responseKeys: Object.keys(response)
    });
    
    // Handle different response structures
    let customerList = [];
    if (response.data && Array.isArray(response.data)) {
      customerList = response.data;
    } else if (response.results && Array.isArray(response.results)) {
      customerList = response.results;
    } else if (Array.isArray(response)) {
      customerList = response;
    } else {
      console.log('No valid customer list found in response');
      return [];
    }
    
    console.log(`Found ${customerList.length} customers in list`);
    
    const customers: any[] = [];
    
    // Process each customer
    for (const item of customerList) {
      console.log('Processing item:', item.name || item.customer_name);
      
      if (item.name) {
        try {
          const detailResponse = await makeERPNextRequest(`/api/resource/Customer/${encodeURIComponent(item.name)}`);
          if (detailResponse.data) {
            customers.push(detailResponse.data);
            console.log('Added customer:', detailResponse.data.name || detailResponse.data.customer_name);
          } else {
            console.log('No detail data for customer:', item.name);
          }
        } catch (error) {
          console.error('Error fetching customer details for:', item.name, error);
        }
      } else {
        console.log('Skipping item without name:', item);
      }
    }
    
    console.log(`Successfully fetched ${customers.length} customer details`);
    return customers;
  } catch (error) {
    console.error('Error fetching customers from ERPNext:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting sync process with matched data...');

    // Parse request body to get matched data
    const body = await request.json();
    const { matchedData } = body;

    if (!matchedData) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request: matchedData is required',
        },
        { status: 400 }
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

    console.log('Processing matched data:', {
      toCreate: matchedData.toCreate?.length || 0,
      toUpdate: matchedData.toUpdate?.length || 0,
      toSkip: matchedData.toSkip?.length || 0,
    });

    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    // Process customers to create
    if (matchedData.toCreate && matchedData.toCreate.length > 0) {
      console.log(`Creating ${matchedData.toCreate.length} new customers...`);
      
      for (const createItem of matchedData.toCreate) {
        try {
          const customerData = createItem.data;
          console.log('Creating customer:', customerData.name);
          
          await prisma.customer.create({
            data: {
              name: customerData.name,
              company_name: customerData.company_name,
              contact_person: customerData.contact_person,
              email: customerData.email,
              phone: customerData.phone,
              address: customerData.address,
              city: customerData.city,
              state: customerData.state,
              postal_code: customerData.postal_code,
              country: customerData.country,
              tax_number: customerData.tax_number,
              credit_limit: customerData.credit_limit,
              payment_terms: customerData.payment_terms,
              notes: customerData.notes,
              is_active: customerData.is_active,
              erpnext_id: customerData.erpnext_id,
            }
          });
          
          createdCount++;
          processedCount++;
          console.log('Successfully created customer:', customerData.name);
          
        } catch (error) {
          console.error('Error creating customer:', error);
        }
      }
    }

    // Process customers to update
    if (matchedData.toUpdate && matchedData.toUpdate.length > 0) {
      console.log(`Updating ${matchedData.toUpdate.length} existing customers...`);
      
      for (const updateItem of matchedData.toUpdate) {
        try {
          const { existingId, newData } = updateItem;
          console.log('Updating customer:', newData.name);
          
          await prisma.customer.update({
            where: { id: existingId },
            data: {
              name: newData.name,
              company_name: newData.company_name,
              contact_person: newData.contact_person,
              email: newData.email,
              phone: newData.phone,
              address: newData.address,
              city: newData.city,
              state: newData.state,
              postal_code: newData.postal_code,
              country: newData.country,
              tax_number: newData.tax_number,
              credit_limit: newData.credit_limit,
              payment_terms: newData.payment_terms,
              notes: newData.notes,
              is_active: newData.is_active,
            }
          });
          
          updatedCount++;
          processedCount++;
          console.log('Successfully updated customer:', newData.name);
          
        } catch (error) {
          console.error('Error updating customer:', error);
        }
      }
    }

    console.log(`Sync completed: ${processedCount} customers processed.`);
    console.log(`Created: ${createdCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      message: `Sync completed successfully. ${processedCount} customers processed.`,
      data: {
        processed: processedCount,
        created: createdCount,
        updated: updatedCount,
        total: (matchedData.toCreate?.length || 0) + (matchedData.toUpdate?.length || 0)
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
function empty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
} 