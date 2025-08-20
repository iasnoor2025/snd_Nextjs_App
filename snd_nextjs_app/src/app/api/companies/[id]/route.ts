import { db } from '@/lib/db';
import { companies } from '@/lib/drizzle/schema';
import { and, eq, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: any) {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    email: company.email,
    phone: company.phone,
    logo: company.logo,
    // Saudi Law Required Documents
    commercial_registration: company.commercialRegistration,
    commercial_registration_expiry: company.commercialRegistrationExpiry?.toISOString().split('T')[0] || null,
    tax_registration: company.taxRegistration,
    tax_registration_expiry: company.taxRegistrationExpiry?.toISOString().split('T')[0] || null,
    municipality_license: company.municipalityLicense,
    municipality_license_expiry: company.municipalityLicenseExpiry?.toISOString().split('T')[0] || null,
    chamber_of_commerce: company.chamberOfCommerce,
    chamber_of_commerce_expiry: company.chamberOfCommerceExpiry?.toISOString().split('T')[0] || null,
    labor_office_license: company.laborOfficeLicense,
    labor_office_license_expiry: company.laborOfficeLicenseExpiry?.toISOString().split('T')[0] || null,
    gosi_registration: company.gosiRegistration,
    gosi_registration_expiry: company.gosiRegistrationExpiry?.toISOString().split('T')[0] || null,
    saudi_standards_license: company.saudiStandardsLicense,
    saudi_standards_license_expiry: company.saudiStandardsLicenseExpiry?.toISOString().split('T')[0] || null,
    environmental_license: company.environmentalLicense,
    environmental_license_expiry: company.environmentalLicenseExpiry?.toISOString().split('T')[0] || null,
    // Additional Company Information
    website: company.website,
    contact_person: company.contactPerson,
    contact_person_phone: company.contactPersonPhone,
    contact_person_email: company.contactPersonEmail,
    company_type: company.companyType,
    industry: company.industry,
    employee_count: company.employeeCount,
    // Legacy field for backward compatibility
    legal_document: company.legalDocument,
    created_at: company.createdAt?.toISOString().split('T')[0] || null,
    updated_at: company.updatedAt?.toISOString().split('T')[0] || null,
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID',
        },
        { status: 400 }
      );
    }

    const companyRows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);

    if (companyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    const company = companyRows[0];

    return NextResponse.json({
      success: true,
      data: formatCompanyForFrontend(company),
      message: 'Company retrieved successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch company: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID',
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
          message: 'Company name is required',
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
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    // Check if another company with same name exists using Drizzle
    const duplicateCompanyRows = await db
      .select()
      .from(companies)
      .where(and(eq(companies.name, body.name), ne(companies.id, id)))
      .limit(1);

    if (duplicateCompanyRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company with this name already exists',
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
        // Saudi Law Required Documents
        commercialRegistration: body.commercial_registration,
        commercialRegistrationExpiry: body.commercial_registration_expiry || null,
        taxRegistration: body.tax_registration,
        taxRegistrationExpiry: body.tax_registration_expiry || null,
        municipalityLicense: body.municipality_license,
        municipalityLicenseExpiry: body.municipality_license_expiry || null,
        chamberOfCommerce: body.chamber_of_commerce,
        chamberOfCommerceExpiry: body.chamber_of_commerce_expiry || null,
        laborOfficeLicense: body.labor_office_license,
        laborOfficeLicenseExpiry: body.labor_office_license_expiry || null,
        gosiRegistration: body.gosi_registration,
        gosiRegistrationExpiry: body.gosi_registration_expiry || null,
        saudiStandardsLicense: body.saudi_standards_license,
        saudiStandardsLicenseExpiry: body.saudi_standards_license_expiry || null,
        environmentalLicense: body.environmental_license,
        environmentalLicenseExpiry: body.environmental_license_expiry || null,
        // Additional Company Information
        website: body.website,
        contactPerson: body.contact_person,
        contactPersonPhone: body.contact_person_phone,
        contactPersonEmail: body.contact_person_email,
        companyType: body.company_type,
        industry: body.industry,
        employeeCount: body.employee_count ? parseInt(body.employee_count) : null,
        // Legacy field for backward compatibility
        legalDocument: body.legal_document,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(companies.id, id))
      .returning();

    const updatedCompany = updatedCompanyRows[0];

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully',
      data: formatCompanyForFrontend(updatedCompany),
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update company: ' + (error as Error).message,
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
    const { id: companyId } = await params;
    const id = parseInt(companyId);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID',
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
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    // Delete company using Drizzle
    await db.delete(companies).where(eq(companies.id, id));

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete company: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
