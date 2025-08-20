import { db } from '@/lib/db';
import { companies as companiesTable } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: Record<string, any>) {
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
    createdAt: company.createdAt?.toISOString().split('T')[0] || null,
    updatedAt: company.updatedAt?.toISOString().split('T')[0] || null,
  };
}

export const GET = withPermission(async (request: NextRequest) => {
  try {

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where clause for filtering
    const filters: any[] = [];

    if (search) {
      const s = `%${search}%`;
      filters.push(
        or(
          ilike(companiesTable.name, s),
          ilike(companiesTable.email, s),
          ilike(companiesTable.address, s as any)
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
        // Saudi Law Required Documents
        commercialRegistration: companiesTable.commercialRegistration,
        commercialRegistrationExpiry: companiesTable.commercialRegistrationExpiry,
        taxRegistration: companiesTable.taxRegistration,
        taxRegistrationExpiry: companiesTable.taxRegistrationExpiry,
        municipalityLicense: companiesTable.municipalityLicense,
        municipalityLicenseExpiry: companiesTable.municipalityLicenseExpiry,
        chamberOfCommerce: companiesTable.chamberOfCommerce,
        chamberOfCommerceExpiry: companiesTable.chamberOfCommerceExpiry,
        laborOfficeLicense: companiesTable.laborOfficeLicense,
        laborOfficeLicenseExpiry: companiesTable.laborOfficeLicenseExpiry,
        gosiRegistration: companiesTable.gosiRegistration,
        gosiRegistrationExpiry: companiesTable.gosiRegistrationExpiry,
        saudiStandardsLicense: companiesTable.saudiStandardsLicense,
        saudiStandardsLicenseExpiry: companiesTable.saudiStandardsLicenseExpiry,
        environmentalLicense: companiesTable.environmentalLicense,
        environmentalLicenseExpiry: companiesTable.environmentalLicenseExpiry,
        // Additional Company Information
        website: companiesTable.website,
        contactPerson: companiesTable.contactPerson,
        contactPersonPhone: companiesTable.contactPersonPhone,
        contactPersonEmail: companiesTable.contactPersonEmail,
        companyType: companiesTable.companyType,
        industry: companiesTable.industry,
        employeeCount: companiesTable.employeeCount,
        // Legacy field for backward compatibility
        legalDocument: companiesTable.legalDocument,
        createdAt: companiesTable.createdAt,
        updatedAt: companiesTable.updatedAt,
      })
      .from(companiesTable)
      .where(whereExpr as any)
      .orderBy(asc(companiesTable.id))
      .offset(offset)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: companies.map(formatCompanyForFrontend),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Companies retrieved successfully',
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch companies: ' + (error as Error).message,
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
        },
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
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
          message: 'Company with this name already exists',
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
        updatedAt: nowIso,
      })
      .returning({
        id: companiesTable.id,
        name: companiesTable.name,
        address: companiesTable.address,
        email: companiesTable.email,
        phone: companiesTable.phone,
        logo: companiesTable.logo,
        // Saudi Law Required Documents
        commercialRegistration: companiesTable.commercialRegistration,
        commercialRegistrationExpiry: companiesTable.commercialRegistrationExpiry,
        taxRegistration: companiesTable.taxRegistration,
        taxRegistrationExpiry: companiesTable.taxRegistrationExpiry,
        municipalityLicense: companiesTable.municipalityLicense,
        municipalityLicenseExpiry: companiesTable.municipalityLicenseExpiry,
        chamberOfCommerce: companiesTable.chamberOfCommerce,
        chamberOfCommerceExpiry: companiesTable.chamberOfCommerceExpiry,
        laborOfficeLicense: companiesTable.laborOfficeLicense,
        laborOfficeLicenseExpiry: companiesTable.laborOfficeLicenseExpiry,
        gosiRegistration: companiesTable.gosiRegistration,
        gosiRegistrationExpiry: companiesTable.gosiRegistrationExpiry,
        saudiStandardsLicense: companiesTable.saudiStandardsLicense,
        saudiStandardsLicenseExpiry: companiesTable.saudiStandardsLicenseExpiry,
        environmentalLicense: companiesTable.environmentalLicense,
        environmentalLicenseExpiry: companiesTable.environmentalLicenseExpiry,
        // Additional Company Information
        website: companiesTable.website,
        contactPerson: companiesTable.contactPerson,
        contactPersonPhone: companiesTable.contactPersonPhone,
        contactPersonEmail: companiesTable.contactPersonEmail,
        companyType: companiesTable.companyType,
        industry: companiesTable.industry,
        employeeCount: companiesTable.employeeCount,
        // Legacy field for backward compatibility
        legalDocument: companiesTable.legalDocument,
        createdAt: companiesTable.createdAt,
        updatedAt: companiesTable.updatedAt,
      });

    const newCompany = newCompanyRows[0];

    if (!newCompany) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create company',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Company created successfully',
      data: formatCompanyForFrontend(newCompany),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create company: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.create);
