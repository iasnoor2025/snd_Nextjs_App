import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const syncCustomersHandler = async (_request: NextRequest) => {
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

          const customerInsertData = {
            name: String(customerData.name || customerData.customer_name || 'Unknown Customer'),
            companyName: customerData.company_name || customerData.name || 'Unknown Company',
            contactPerson: customerData.contact_person || customerData.contact_person_name || null,
            email: customerData.email || customerData.email_id || null,
            phone: customerData.phone || customerData.mobile_no || customerData.phone_no || null,
            address: customerData.address || customerData.primary_address || customerData.customer_address || null,
            city: customerData.city || null,
            state: customerData.state || customerData.province || null,
            postalCode: customerData.postal_code || customerData.pincode || null,
            country: customerData.country || null,
            website: customerData.website || null,
            taxNumber: customerData.tax_number || customerData.tax_id || null,
            vatNumber: customerData.vat_number || customerData.gst_number || null,
            creditLimit: customerData.credit_limit ? String(parseFloat(customerData.credit_limit)) : null,
            creditLimitUsed: customerData.credit_limit_used ? String(parseFloat(customerData.credit_limit_used)) : null,
            creditLimitRemaining: customerData.credit_limit_remaining ? String(parseFloat(customerData.credit_limit_remaining)) : null,
            paymentTerms: customerData.payment_terms || (customerData.payment_terms_days ? `${customerData.payment_terms_days} days` : null),
            currentDue: customerData.current_due ? String(parseFloat(customerData.current_due)) : null,
            totalValue: customerData.total_value ? String(parseFloat(customerData.total_value)) : null,
            outstandingAmount: customerData.outstanding_amount ? String(parseFloat(customerData.outstanding_amount)) : null,
            currency: customerData.currency || customerData.default_currency || 'SAR',
            customerType: customerData.customer_type || customerData.customer_group || null,
            customerGroup: customerData.customer_group || customerData.customer_type || null,
            territory: customerData.territory || customerData.sales_territory || null,
            salesPerson: customerData.sales_person || customerData.sales_partner || null,
            defaultPriceList: customerData.default_price_list || customerData.price_list || null,
            defaultCurrency: customerData.default_currency || customerData.currency || 'SAR',
            language: customerData.language || customerData.default_language || 'en',
            notes: customerData.notes || customerData.remarks || null,
            remarks: customerData.remarks || customerData.notes || null,
            isActive: customerData.is_active !== false,
            erpnextId: customerData.erpnext_id || customerData.name || null,
            status: customerData.status || 'active',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          };
          
          await db.insert(customers).values(customerInsertData);

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
              name: newData.name || newData.customer_name || '',
              companyName: newData.company_name || newData.name || '',
              contactPerson: newData.contact_person || newData.contact_person_name || null,
              email: newData.email || newData.email_id || null,
              phone: newData.phone || newData.mobile_no || newData.phone_no || null,
              address: newData.address || newData.primary_address || newData.customer_address || null,
              city: newData.city || null,
              state: newData.state || newData.province || null,
              postalCode: newData.postal_code || newData.pincode || null,
              country: newData.country || null,
              website: newData.website || null,
              taxNumber: newData.tax_number || newData.tax_id || null,
              vatNumber: newData.vat_number || newData.gst_number || null,
              creditLimit: newData.credit_limit ? String(parseFloat(newData.credit_limit)) : null,
              creditLimitUsed: newData.credit_limit_used ? String(parseFloat(newData.credit_limit_used)) : null,
              creditLimitRemaining: newData.credit_limit_remaining ? String(parseFloat(newData.credit_limit_remaining)) : null,
              paymentTerms: newData.payment_terms || (newData.payment_terms_days ? `${newData.payment_terms_days} days` : null),
              currentDue: newData.current_due ? String(parseFloat(newData.current_due)) : null,
              totalValue: newData.total_value ? String(parseFloat(newData.total_value)) : null,
              outstandingAmount: newData.outstanding_amount ? String(parseFloat(newData.outstanding_amount)) : null,
              currency: newData.currency || newData.default_currency || 'SAR',
              customerType: newData.customer_type || newData.customer_group || null,
              customerGroup: newData.customer_group || newData.customer_type || null,
              territory: newData.territory || newData.sales_territory || null,
              salesPerson: newData.sales_person || newData.sales_partner || null,
              defaultPriceList: newData.default_price_list || newData.price_list || null,
              defaultCurrency: newData.default_currency || newData.currency || 'SAR',
              language: newData.language || newData.default_language || 'en',
              notes: newData.notes || newData.remarks || null,
              remarks: newData.remarks || newData.notes || null,
              isActive: newData.is_active !== false,
              updatedAt: new Date().toISOString().split('T')[0] || null,
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
};

export const POST = withPermission(PermissionConfigs.customer.sync)(syncCustomersHandler);
