import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: Record<string, any>) {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    email: company.email,
    phone: company.phone,
    logo: company.logo,
    legal_document: company.legal_document,
    created_at: company.created_at?.toISOString().split('T')[0] || null,
    updated_at: company.updated_at?.toISOString().split('T')[0] || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    console.log('Companies API called');

    // Test database connection first
    try {
      await prisma.$connect();
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.log('Query parameters:', { search, status, page, limit });

    // Build where clause for filtering
    const where: Record<string, any> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch companies from database
    const companies = await prisma.company.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { id: 'asc' }
      ]
    });

    console.log(`Found ${companies.length} companies`);

    // Get total count for pagination
    const totalCount = await prisma.company.count({ where });

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
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
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
    const existingCompany = await prisma.company.findFirst({
      where: { name: body.name }
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company with this name already exists'
        },
        { status: 400 }
      );
    }

    // Create company
    const newCompany = await prisma.company.create({
      data: {
        name: body.name,
        address: body.address,
        email: body.email,
        phone: body.phone,
        logo: body.logo,
        legal_document: body.legal_document
      }
    });

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
} 