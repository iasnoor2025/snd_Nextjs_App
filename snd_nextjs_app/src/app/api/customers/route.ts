import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

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

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('customers', 'list', { page, limit, search, status, sortBy, sortOrder });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Get total count
        const totalResult = await db
          .select({ count: customers.id })
          .from(customers)
          .where(whereCondition);
        const total = totalResult.length;

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
              .orderBy(desc(customers.createdAt))
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
              .orderBy(desc(customers.createdAt))
              .limit(limit)
              .offset(offset);
          }
        } catch (error) {
          console.error('Error fetching customers:', error);
          customersResult = [];
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
      },
      {
        ttl: 300, // 5 minutes
        tags: [CACHE_TAGS.CUSTOMERS],
      }
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Customer name is required and must be a string' },
        { status: 400 }
      );
    }

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
      createdAt: new Date().toISOString().split('T')[0] || null,
      updatedAt: new Date().toISOString().split('T')[0] || null as string,
    };

    const newCustomer = await db.insert(customers).values(insertData).returning();

    return NextResponse.json({
      success: true,
      customer: newCustomer[0],
      message: 'Customer created successfully',
    });
  } catch (error) {
    
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
