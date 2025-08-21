import { db } from '@/lib/drizzle';
import { customers } from '@/lib/drizzle/schema';
import { desc, eq, like } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereCondition = undefined;
    if (search) {
      whereCondition = like(customers.name, `%${search}%`);
    }

    // Get total count
    let total = 0;
    try {
      if (whereCondition) {
        const countResult = await db.select().from(customers).where(whereCondition);
        total = countResult.length;
      } else {
        const countResult = await db.select().from(customers);
        total = countResult.length;
      }
    } catch (error) {
      
      total = 0;
    }

    // Get customers with pagination
    let customersResult: {
      id: number;
      name: string;
      email: string | null;
      phone: string | null;
      companyName: string | null;
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
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch customers',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
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
