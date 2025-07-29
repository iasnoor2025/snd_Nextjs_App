import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: any) {
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

    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

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

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

    // Check if another company with same name exists
    const duplicateCompany = await prisma.company.findFirst({
      where: {
        name: body.name,
        id: { not: id }
      }
    });

    if (duplicateCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company with this name already exists'
        },
        { status: 400 }
      );
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id },
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

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id }
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found'
        },
        { status: 404 }
      );
    }

    // Delete company
    await prisma.company.delete({
      where: { id }
    });

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