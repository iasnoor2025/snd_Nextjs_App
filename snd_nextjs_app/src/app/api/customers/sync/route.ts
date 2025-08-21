import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {

    // Parse request body to get matched data
    const body = await _request.json();
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
      await db.execute('select 1');
      
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

    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process customers to create
    if (matchedData.toCreate && matchedData.toCreate.length > 0) {

      for (const createItem of matchedData.toCreate) {
        try {
          const customerData = createItem.data;

          // Check if customer already exists by ERPNext ID
          if (customerData.erpnext_id) {
            const existingCustomer = await db
              .select()
              .from(customers)
              .where(eq(customers.erpnextId, customerData.erpnext_id));

            if (existingCustomer.length > 0) {
              
              continue;
            }
          }

          await db.insert(customers).values({
            name: customerData.name || 'Unknown Customer',
            companyName: customerData.company_name || customerData.name || 'Unknown Company',
            contactPerson: customerData.contact_person || null,
            email: customerData.email || null,
            phone: customerData.phone || null,
            address: customerData.address || null,
            city: customerData.city || null,
            state: customerData.state || null,
            postalCode: customerData.postal_code || null,
            country: customerData.country || null,
            taxNumber: customerData.tax_number || null,
            creditLimit: customerData.credit_limit ? customerData.credit_limit : null,
            paymentTerms: customerData.payment_terms || null,
            notes: customerData.notes || null,
            isActive: customerData.is_active !== false,
            erpnextId: customerData.erpnext_id || null,
            status: 'active',
            createdAt: new Date().toISOString().split('T')[0] || null,
            updatedAt: new Date().toISOString().split('T')[0] || null as string,
          });

          createdCount++;
          processedCount++;
          
        } catch (error) {
          
          const customerName = createItem.data?.name || 'Unknown';
          errors.push(
            `Failed to create ${customerName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Process customers to update
    if (matchedData.toUpdate && matchedData.toUpdate.length > 0) {

      for (const updateItem of matchedData.toUpdate) {
        try {
          const { existingId, newData } = updateItem;

          await db
            .update(customers)
            .set({
              name: newData.name || '',
              companyName: newData.company_name || newData.name || '',
              contactPerson: newData.contact_person || '',
              email: newData.email || null,
              phone: newData.phone || null,
              address: newData.address || null,
              city: newData.city || null,
              state: newData.state || null,
              postalCode: newData.postal_code || null,
              country: newData.country || null,
              taxNumber: newData.tax_number || null,
              creditLimit: newData.credit_limit ? newData.credit_limit : null,
              paymentTerms: newData.payment_terms || null,
              notes: newData.notes || null,
              isActive: newData.is_active !== false,
              updatedAt: new Date().toISOString().split('T')[0] || null as string,
            })
            .where(eq(customers.id, existingId));

          updatedCount++;
          processedCount++;
          
        } catch (error) {
          
          const customerName = updateItem.newData?.name || 'Unknown';
          errors.push(
            `Failed to update ${customerName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    if (errors.length > 0) {
      
    }

    return NextResponse.json({
      success: true,
      message: `Customer sync completed successfully. ${processedCount} customers processed.`,
      data: {
        processed: processedCount,
        created: createdCount,
        updated: updatedCount,
        total: (matchedData.toCreate?.length || 0) + (matchedData.toUpdate?.length || 0),
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync customers from ERPNext',
      },
      { status: 500 }
    );
  }
}
