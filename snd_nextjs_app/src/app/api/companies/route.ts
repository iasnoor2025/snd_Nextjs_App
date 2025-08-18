import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { companies as companiesTable } from '@/lib/drizzle/schema';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: Record<string, any>) {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    email: company.email,
    phone: company.phone,
    logo: company.logo,
    legal_document: company.legalDocument,
            createdAt: company.createdAt?.toISOString().split('T')[0] || null,
        updatedAt: company.updatedAt?.toISOString().split('T')[0] || null,
  };
}

export const GET = withPermission(
  async (request: NextRequest) => {
  try {
    console.log('Companies API called');

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('Query parameters:', { search, status, page, limit });

    // Build where clause for filtering
    const filters: any[] = [];
    
    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(companiesTable.name, s),
          ilike(companiesTable.email, s),
          ilike(companiesTable.address, s as any),
        )
      );
    }

    const whereExpr = filters.length ? and(...filters) : undefined;

    // Get total count for pagination
    const totalCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(companiesTable)
      .where(whereExpr as any);
    const totalCount = Number(totalCountRow[0]?.count ?? 0);

    // Fetch companies from database
    const companies = await db
      .select({
        id: companiesTable.id,
        name: companiesTable.name,
        address: companiesTable.address,
        email: companiesTable.email,
        phone: companiesTable.phone,
        logo: companiesTable.logo,
        legalDocument: companiesTable.legalDocument,
        createdAt: companiesTable.createdAt,
        updatedAt: companiesTable.updatedAt,
      })
      .from(companiesTable)
      .where(whereExpr as any)
      .orderBy(asc(companiesTable.id))
      .offset(offset)
      .limit(limit);

    console.log(`Found ${companies.length} companies`);

    return NextResponse.json({
      success: true,
      data: companies.map(formatCompanyForFrontend),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      message: 'Companies retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/companies:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch companies: ' + (error as Error).message,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        }
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.company.read
);

export const POST = withPermission(
  async (request: NextRequest) => {
  try {
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

    // Check if company with same name already exists
    const existingCompanyRows = await db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.name, body.name))
      .limit(1);

    if (existingCompanyRows[0]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company with this name already exists'
        },
        { status: 400 }
      );
    }

    // Create company
    const nowIso = new Date().toISOString();
    const newCompanyRows = await db
      .insert(companiesTable)
      .values({
        name: body.name,
        address: body.address,
        email: body.email,
        phone: body.phone,
        logo: body.logo,
        legalDocument: body.legal_document,
        updatedAt: nowIso,
      })
      .returning({
        id: companiesTable.id,
        name: companiesTable.name,
        address: companiesTable.address,
        email: companiesTable.email,
        phone: companiesTable.phone,
        logo: companiesTable.logo,
        legalDocument: companiesTable.legalDocument,
        createdAt: companiesTable.createdAt,
        updatedAt: companiesTable.updatedAt,
      });

    const newCompany = newCompanyRows[0];
    
    if (!newCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create company'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company created successfully',
      data: formatCompanyForFrontend(newCompany)
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create company: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
  },
  PermissionConfigs.company.create
); 
