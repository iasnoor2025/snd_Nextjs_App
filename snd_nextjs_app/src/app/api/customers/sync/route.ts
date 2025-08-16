import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';








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
      await db.execute('select 1');
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
          
          await db.insert(customers).values({
            name: customerData.name,
            companyName: customerData.company_name,
            contactPerson: customerData.contact_person,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            postalCode: customerData.postal_code,
            country: customerData.country,
            taxNumber: customerData.tax_number,
            creditLimit: customerData.credit_limit as any,
            paymentTerms: customerData.payment_terms,
            notes: customerData.notes,
            isActive: customerData.is_active,
            erpnextId: customerData.erpnext_id,
            status: 'active',
            updatedAt: new Date().toISOString(),
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
          
          await db
            .update(customers)
            .set({
              name: newData.name,
              companyName: newData.company_name,
              contactPerson: newData.contact_person,
              email: newData.email,
              phone: newData.phone,
              address: newData.address,
              city: newData.city,
              state: newData.state,
              postalCode: newData.postal_code,
              country: newData.country,
              taxNumber: newData.tax_number,
              creditLimit: newData.credit_limit as any,
              paymentTerms: newData.payment_terms,
              notes: newData.notes,
              isActive: newData.is_active,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(customers.id, existingId));
          
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
    // Drizzle pool stays connected
  }
}

 