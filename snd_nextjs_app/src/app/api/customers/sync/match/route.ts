import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';
/**
 * Map ERPNext customer fields to local fields
 */
function mapERPNextToLocal(erpCustomer: any) {

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
    address:
      address ||
      erpCustomer.customer_address ||
      erpCustomer.address_line1 ||
      erpCustomer.address ||
      null,
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

  return mappedData;
}

function empty(value: any): boolean {
  return value === null || value === undefined || value === '' || value === 0;
}

export async function POST(_request: NextRequest) {
  try {

    // Parse request body
    const body = await _request.json();
    const { erpnextData } = body;

    if (!erpnextData || !erpnextData.erpnextCustomers) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request: erpnextData is required',
        },
        { status: 400 }
      );
    }

    const erpnextCustomers = erpnextData.erpnextCustomers;

    // Get existing customers from database
    const dbCustomers = await db.select().from(customers);

    // Prepare matching results
    const matchResults: {
      toCreate: Array<{ data: any; originalCustomer: any }>;
      toUpdate: Array<{ existingId: number; existingData: any; newData: any; changes: any }>;
      toSkip: Array<{
        reason: string;
        customer: any;
        mappedData?: any;
        existingId?: number;
        error?: string;
      }>;
      summary: { total: number; toCreate: number; toUpdate: number; toSkip: number };
    } = {
      toCreate: [],
      toUpdate: [],
      toSkip: [],
      summary: {
        total: erpnextCustomers.length,
        toCreate: 0,
        toUpdate: 0,
        toSkip: 0,
      },
    };

    // Process each ERPNext customer
    for (const erpCustomer of erpnextCustomers) {
      try {

        const mappedData = mapERPNextToLocal(erpCustomer);

        // Skip if no ERPNext ID
        if (!mappedData.erpnext_id) {
          
          matchResults.toSkip.push({
            reason: 'No ERPNext ID',
            customer: erpCustomer,
            mappedData,
          });
          matchResults.summary.toSkip++;
          continue;
        }

        // Ensure we have a valid name
        if (empty(mappedData.name)) {
          mappedData.name = mappedData.company_name || erpCustomer.name || 'Unknown Customer';
        }

        // Ensure we have a valid company name
        if (empty(mappedData.company_name)) {
          mappedData.company_name = mappedData.name;
        }

        // Validate that we have essential data
        if (empty(mappedData.name) || empty(mappedData.erpnext_id)) {
          
          matchResults.toSkip.push({
            reason: 'Missing essential data',
            customer: erpCustomer,
            mappedData,
          });
          matchResults.summary.toSkip++;
          continue;
        }

        // Check if customer already exists by ERPNext ID
        const existingCustomer = dbCustomers.find(
          (dbCustomer: any) => dbCustomer.erpnextId === mappedData.erpnext_id
        );

        if (existingCustomer) {
          // Customer exists - check if update is needed
          const needsUpdate =
            existingCustomer.name !== mappedData.name ||
            existingCustomer.email !== mappedData.email ||
            existingCustomer.phone !== mappedData.phone ||
            existingCustomer.companyName !== mappedData.company_name;

          if (needsUpdate) {
            
            matchResults.toUpdate.push({
              existingId: existingCustomer.id,
              existingData: existingCustomer,
              newData: mappedData,
              changes: {
                name: existingCustomer.name !== mappedData.name,
                email: existingCustomer.email !== mappedData.email,
                phone: existingCustomer.phone !== mappedData.phone,
                company_name: existingCustomer.companyName !== mappedData.company_name,
              },
            });
            matchResults.summary.toUpdate++;
          } else {
            
            matchResults.toSkip.push({
              reason: 'Already up to date',
              customer: erpCustomer,
              mappedData,
              existingId: existingCustomer.id,
            });
            matchResults.summary.toSkip++;
          }
        } else {
          // New customer to create
          
          matchResults.toCreate.push({
            data: mappedData,
            originalCustomer: erpCustomer,
          });
          matchResults.summary.toCreate++;
        }
      } catch (error) {
        
        matchResults.toSkip.push({
          reason: 'Processing error',
          customer: erpCustomer,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        matchResults.summary.toSkip++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Matching completed. ${matchResults.summary.toCreate} to create, ${matchResults.summary.toUpdate} to update, ${matchResults.summary.toSkip} to skip.`,
      data: matchResults,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: `Failed to match data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  } finally {
    // No explicit disconnect needed for Drizzle, it's managed by the ORM
  }
}
