import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: customer[0],
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch customer',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedCustomer = await db
      .update(customers)
      .set({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        companyName: body.companyName || null,
        contactPerson: body.contactPerson || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        postalCode: body.postalCode || null,
        country: body.country || null,
        website: body.website || null,
        taxNumber: body.taxNumber || null,
        vatNumber: body.vatNumber || null,
        creditLimit: body.creditLimit || null,
        creditLimitUsed: body.creditLimitUsed || null,
        creditLimitRemaining: body.creditLimitRemaining || null,
        paymentTerms: body.paymentTerms || null,
        currentDue: body.currentDue || null,
        totalValue: body.totalValue || null,
        outstandingAmount: body.outstandingAmount || null,
        currency: body.currency || 'SAR',
        customerType: body.customerType || null,
        customerGroup: body.customerGroup || null,
        territory: body.territory || null,
        salesPerson: body.salesPerson || null,
        defaultPriceList: body.defaultPriceList || null,
        defaultCurrency: body.defaultCurrency || 'SAR',
        language: body.language || 'en',
        notes: body.notes || null,
        remarks: body.remarks || null,
        status: body.status || 'active',
        isActive: body.isActive !== false,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (updatedCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer[0],
      message: 'Customer updated successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update customer',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deletedCustomer = await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)))
      .returning();

    if (deletedCustomer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete customer',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
