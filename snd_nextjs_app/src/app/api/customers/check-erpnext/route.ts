import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { ERPNextClient } from '@/lib/erpnext-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get('name') || 'AKFA UNITED COMPANY LTD';
    // Find customer in local database
    const localCustomer = await db
      .select()
      .from(customers)
      .where(ilike(customers.name, `%${customerName}%`))
      .limit(1);
    
    if (localCustomer.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Customer not found in local database',
      });
    }
    
    const customer = localCustomer[0];
    
    const result: any = {
      success: true,
      localCustomer: {
        id: customer.id,
        name: customer.name,
        erpnextId: customer.erpnextId,
      },
    };
    
    // Check if customer has erpnextId and fetch data from ERPNext
    if (customer.erpnextId) {
      try {
        const erpnextClient = new ERPNextClient();
        const erpnextData = await erpnextClient.getCustomerFinancialData(customer.erpnextId);
        
        if (erpnextData) {
          result.erpnextData = erpnextData;
          result.hasERPNextData = true;
        } else {
          result.hasERPNextData = false;
          result.error = 'Failed to fetch data from ERPNext';
        }
      } catch (error) {
        result.hasERPNextData = false;
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      result.hasERPNextData = false;
      result.message = 'Customer has no erpnextId - not synced to ERPNext';
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking customer:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
