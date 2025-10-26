import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis/cache-service';
import { CACHE_TAGS } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any[] = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.companyName, `%${search}%`),
          ilike(customers.contactPerson, `%${search}%`),
          ilike(customers.email, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )
      );
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(customers.status, status));
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Test: Check total customers in DB without any filters
    const allCustomersTest = await db
      .select({ id: customers.id, name: customers.name, erpnextId: customers.erpnextId })
      .from(customers);
    console.log('🔍 TOTAL CUSTOMERS IN DB:', allCustomersTest.length);
    console.log('🔍 Sample customers:', allCustomersTest.slice(0, 5));
    
    // Get total count with filters
    console.log('📊 Fetching customers with conditions:', { 
      whereCondition: !!whereCondition, 
      search, 
      status, 
      page, 
      limit,
      sortBy,
      sortOrder 
    });
    
    const totalResult = await db
      .select({ count: customers.id })
      .from(customers)
      .where(whereCondition);
    const total = totalResult.length;
    
    console.log('📊 Total customers found in DB:', total);

    // Get customers with pagination
    let customersResult: {
      id: number;
      name: string;
      email: string;
      phone: string;
      companyName: string;
      status: string;
      createdAt: string;
      isActive: boolean;
    }[];
    
    // Determine sort column and order
    let sortColumn;
    switch (sortBy) {
      case 'name':
        sortColumn = customers.name;
        break;
      case 'email':
        sortColumn = customers.email;
        break;
      case 'company':
        sortColumn = customers.companyName;
        break;
      case 'status':
        sortColumn = customers.status;
        break;
      case 'created_at':
      default:
        sortColumn = customers.createdAt;
        break;
    }
    
    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
    
    try {
      if (whereCondition) {
        customersResult = await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
            companyName: customers.companyName,
            status: customers.status,
            createdAt: customers.createdAt,
            isActive: customers.isActive,
          })
          .from(customers)
          .where(whereCondition)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);
      } else {
        customersResult = await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
            companyName: customers.companyName,
            status: customers.status,
            createdAt: customers.createdAt,
            isActive: customers.isActive,
          })
          .from(customers)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      customersResult = [];
    }

    console.log('📊 Fetched customers:', customersResult.length);
    if (customersResult.length > 0) {
      console.log('📊 First customer:', customersResult[0]);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      customers: customersResult,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      statistics: {
        totalCustomers: total,
        activeCustomers: total,
        erpnextSyncedCustomers: 0,
        localOnlyCustomers: total,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating customer with data:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Customer name is required and must be a string' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    
    const insertData = {
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
      creditLimit: body.creditLimit ? String(body.creditLimit) : null,
      creditLimitUsed: body.creditLimitUsed ? String(body.creditLimitUsed) : null,
      creditLimitRemaining: body.creditLimitRemaining ? String(body.creditLimitRemaining) : null,
      paymentTerms: body.paymentTerms || null,
      currentDue: body.currentDue ? String(body.currentDue) : null,
      totalValue: body.totalValue ? String(body.totalValue) : null,
      outstandingAmount: body.outstandingAmount ? String(body.outstandingAmount) : null,
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
      isActive: body.isActive !== undefined ? body.isActive : true,
      updatedAt: today,
    };

    console.log('📝 Inserting customer with data:', JSON.stringify(insertData, null, 2));
    
    try {
      const newCustomer = await db.insert(customers).values(insertData).returning();
      console.log('✅ Customer created successfully:', JSON.stringify(newCustomer, null, 2));
      
      if (!newCustomer || newCustomer.length === 0) {
        console.error('❌ No customer returned from insert');
        throw new Error('Customer insert returned empty result');
      }

      // Verify the customer was actually saved
      const verifyCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, newCustomer[0].id))
        .limit(1);
      
      console.log('🔍 Verifying customer in DB:', JSON.stringify(verifyCustomer, null, 2));
      
      // Invalidate the customers list cache
      try {
        await cacheService.invalidateCacheByTag(CACHE_TAGS.CUSTOMERS);
        console.log('🗑️ Invalidated customers cache');
      } catch (cacheError) {
        console.warn('⚠️ Failed to invalidate cache:', cacheError);
      }

      return NextResponse.json({
        success: true,
        customer: newCustomer[0],
        message: 'Customer created successfully',
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      if (dbError instanceof Error) {
        console.error('Error message:', dbError.message);
        console.error('Error stack:', dbError.stack);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create customer',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields for update
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Customer name is required and must be a string' },
        { status: 400 }
      );
    }

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
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date().toISOString().split('T')[0] || null,
      })
      .where(eq(customers.id, body.id))
      .returning();

    if (updatedCustomer.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const deletedCustomer = await db.delete(customers).where(eq(customers.id, body.id)).returning();

    if (deletedCustomer.length === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
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
