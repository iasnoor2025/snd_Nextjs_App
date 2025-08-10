import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { companies } from '@/lib/drizzle/schema';
import { eq, and, ne } from 'drizzle-orm';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: any) {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    email: company.email,
    phone: company.phone,
    logo: company.logo,
    legal_document: company.legalDocument,
    created_at: company.createdAt?.split('T')[0] || null,
    updated_at: company.updatedAt?.split('T')[0] || null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID'
        },
        { status: 400 }
      );
    }

    const companyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (companyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

    const company = companyRows[0];

    return NextResponse.json({
      success: true,
      data: formatCompanyForFrontend(company),
      message: 'Company retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/companies/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch company: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID'
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company name is required'
        },
        { status: 400 }
      );
    }

    // Check if company exists using Drizzle
    const existingCompanyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (existingCompanyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

    // Check if another company with same name exists using Drizzle
    const duplicateCompanyRows = await db
      .select()
      .from(companies)
      .where(
        and(
          eq(companies.name, body.name),
          ne(companies.id, id)
        )
      )
      .limit(1);

    if (duplicateCompanyRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company with this name already exists'
        },
        { status: 400 }
      );
    }

    // Update company using Drizzle
    const updatedCompanyRows = await db
      .update(companies)
      .set({
        name: body.name,
        address: body.address,
        email: body.email,
        phone: body.phone,
        logo: body.logo,
        legalDocument: body.legal_document,
        updatedAt: new Date().toISOString()
      })
      .where(eq(companies.id, id))
      .returning();

    const updatedCompany = updatedCompanyRows[0];

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully',
      data: formatCompanyForFrontend(updatedCompany)
    });
  } catch (error) {
    console.error('Error in PUT /api/companies/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update company: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);
    
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID'
        },
        { status: 400 }
      );
    }

    // Check if company exists using Drizzle
    const existingCompanyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    if (existingCompanyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

    // Delete company using Drizzle
    await db
      .delete(companies)
      .where(eq(companies.id, id));

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete company: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 