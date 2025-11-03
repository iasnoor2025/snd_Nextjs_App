import { db } from '@/lib/db';
import { companies as companiesTable, employees } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to format company data for frontend
function formatCompanyForFrontend(company: Record<string, any>) {
  // Helper function to safely format dates
  const formatDate = (dateValue: any): string | null => {
    if (!dateValue) return null;
    
    // If it's already a string, return as is
    if (typeof dateValue === 'string') {
      return dateValue;
    }
    
    // If it's a Date object, convert to ISO string and extract date part
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0] || null || null;
    }
    
    // If it's a Date object from Drizzle (might be a custom type), try to convert
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] || null;
      }
    } catch (e) {
      // If conversion fails, return null
    }
    
    return null;
  };

  return {
    id: company.id,
    name: company.name,
    address: company.address,
    email: company.email,
    phone: company.phone,
    logo: company.logo,
    // Saudi Law Required Documents
    commercial_registration: company.commercialRegistration,
    commercial_registration_expiry: formatDate(company.commercialRegistrationExpiry),
    tax_registration: company.taxRegistration,
    tax_registration_expiry: formatDate(company.taxRegistrationExpiry),
    municipality_license: company.municipalityLicense,
    municipality_license_expiry: formatDate(company.municipalityLicenseExpiry),
    chamber_of_commerce: company.chamberOfCommerce,
    chamber_of_commerce_expiry: formatDate(company.chamberOfCommerceExpiry),
    labor_office_license: company.laborOfficeLicense,
    labor_office_license_expiry: formatDate(company.laborOfficeLicenseExpiry),
    gosi_registration: company.gosiRegistration,
    gosi_registration_expiry: formatDate(company.gosiRegistrationExpiry),
    saudi_standards_license: company.saudiStandardsLicense,
    saudi_standards_license_expiry: formatDate(company.saudiStandardsLicenseExpiry),
    environmental_license: company.environmentalLicense,
    environmental_license_expiry: formatDate(company.environmentalLicenseExpiry),
    // Additional Saudi Law Documents
    zakat_registration: company.zakatRegistration,
    zakat_registration_expiry: formatDate(company.zakatRegistrationExpiry),
    saudi_arabia_visa: company.saudiArabiaVisa,
    saudi_arabia_visa_expiry: formatDate(company.saudiArabiaVisaExpiry),
    investment_license: company.investmentLicense,
    investment_license_expiry: formatDate(company.investmentLicenseExpiry),
    import_export_license: company.importExportLicense,
    import_export_license_expiry: formatDate(company.importExportLicenseExpiry),
    pharmaceutical_license: company.pharmaceuticalLicense,
    pharmaceutical_license_expiry: formatDate(company.pharmaceuticalLicenseExpiry),
    food_safety_license: company.foodSafetyLicense,
    food_safety_license_expiry: formatDate(company.foodSafetyLicenseExpiry),
    construction_license: company.constructionLicense,
    construction_license_expiry: formatDate(company.constructionLicenseExpiry),
    transportation_license: company.transportationLicense,
    transportation_license_expiry: formatDate(company.transportationLicenseExpiry),
    banking_license: company.bankingLicense,
    banking_license_expiry: formatDate(company.bankingLicenseExpiry),
    insurance_license: company.insuranceLicense,
    insurance_license_expiry: formatDate(company.insuranceLicenseExpiry),
    telecom_license: company.telecomLicense,
    telecom_license_expiry: formatDate(company.telecomLicenseExpiry),
    energy_license: company.energyLicense,
    energy_license_expiry: formatDate(company.energyLicenseExpiry),
    mining_license: company.miningLicense,
    mining_license_expiry: formatDate(company.miningLicenseExpiry),
    tourism_license: company.tourismLicense,
    tourism_license_expiry: formatDate(company.tourismLicenseExpiry),
    education_license: company.educationLicense,
    education_license_expiry: formatDate(company.educationLicenseExpiry),
    healthcare_license: company.healthcareLicense,
    healthcare_license_expiry: formatDate(company.healthcareLicenseExpiry),
    real_estate_license: company.realEstateLicense,
    real_estate_license_expiry: formatDate(company.realEstateLicenseExpiry),
    legal_services_license: company.legalServicesLicense,
    legal_services_license_expiry: formatDate(company.legalServicesLicenseExpiry),
    accounting_license: company.accountingLicense,
    accounting_license_expiry: formatDate(company.accountingLicenseExpiry),
    advertising_license: company.advertisingLicense,
    advertising_license_expiry: formatDate(company.advertisingLicenseExpiry),
    media_license: company.mediaLicense,
    media_license_expiry: formatDate(company.mediaLicenseExpiry),
    security_license: company.securityLicense,
    security_license_expiry: formatDate(company.securityLicenseExpiry),
    cleaning_license: company.cleaningLicense,
    cleaning_license_expiry: formatDate(company.cleaningLicenseExpiry),
    catering_license: company.cateringLicense,
    catering_license_expiry: formatDate(company.cateringLicenseExpiry),
    warehouse_license: company.warehouseLicense,
    warehouse_license_expiry: formatDate(company.warehouseLicenseExpiry),
    logistics_license: company.logisticsLicense,
    logistics_license_expiry: formatDate(company.logisticsLicenseExpiry),
    maintenance_license: company.maintenanceLicense,
    maintenance_license_expiry: formatDate(company.maintenanceLicenseExpiry),
    training_license: company.trainingLicense,
    training_license_expiry: formatDate(company.trainingLicenseExpiry),
    consulting_license: company.consultingLicense,
    consulting_license_expiry: formatDate(company.consultingLicenseExpiry),
    research_license: company.researchLicense,
    research_license_expiry: formatDate(company.researchLicenseExpiry),
    technology_license: company.technologyLicense,
    technology_license_expiry: formatDate(company.technologyLicenseExpiry),
    innovation_license: company.innovationLicense,
    innovation_license_expiry: formatDate(company.innovationLicenseExpiry),
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
    createdAt: formatDate(company.createdAt),
    updatedAt: formatDate(company.updatedAt),
  };
}

export const GET = withPermission(PermissionConfigs.company.read)(async (request: NextRequest) => {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
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

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case 'name':
        orderByClause = sortOrder === 'asc' ? asc(companiesTable.name) : desc(companiesTable.name);
        break;
      case 'createdAt':
      case 'created_at':
        orderByClause = sortOrder === 'asc' ? asc(companiesTable.createdAt) : desc(companiesTable.createdAt);
        break;
      case 'updatedAt':
      case 'updated_at':
        orderByClause = sortOrder === 'asc' ? asc(companiesTable.updatedAt) : desc(companiesTable.updatedAt);
        break;
      case 'employee_count':
      case 'employeeCount':
        // For employee count sorting, we'll use a subquery in ORDER BY
        // Note: We need to reference the alias in ORDER BY, so we'll sort after fetching
        // For now, sort by name as fallback - we can sort by employee count in memory if needed
        orderByClause = asc(companiesTable.name);
        break;
      case 'industry':
        orderByClause = sortOrder === 'asc' ? asc(companiesTable.industry) : desc(companiesTable.industry);
        break;
      default:
        orderByClause = asc(companiesTable.name);
    }

    // Fetch companies from database with dynamic employee count calculation
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
        // Additional Saudi Law Documents
        zakatRegistration: companiesTable.zakatRegistration,
        zakatRegistrationExpiry: companiesTable.zakatRegistrationExpiry,
        saudiArabiaVisa: companiesTable.saudiArabiaVisa,
        saudiArabiaVisaExpiry: companiesTable.saudiArabiaVisaExpiry,
        investmentLicense: companiesTable.investmentLicense,
        investmentLicenseExpiry: companiesTable.investmentLicenseExpiry,
        importExportLicense: companiesTable.importExportLicense,
        importExportLicenseExpiry: companiesTable.importExportLicenseExpiry,
        pharmaceuticalLicense: companiesTable.pharmaceuticalLicense,
        pharmaceuticalLicenseExpiry: companiesTable.pharmaceuticalLicenseExpiry,
        foodSafetyLicense: companiesTable.foodSafetyLicense,
        foodSafetyLicenseExpiry: companiesTable.foodSafetyLicenseExpiry,
        constructionLicense: companiesTable.constructionLicense,
        constructionLicenseExpiry: companiesTable.constructionLicenseExpiry,
        transportationLicense: companiesTable.transportationLicense,
        transportationLicenseExpiry: companiesTable.transportationLicenseExpiry,
        bankingLicense: companiesTable.bankingLicense,
        bankingLicenseExpiry: companiesTable.bankingLicenseExpiry,
        insuranceLicense: companiesTable.insuranceLicense,
        insuranceLicenseExpiry: companiesTable.insuranceLicenseExpiry,
        telecomLicense: companiesTable.telecomLicense,
        telecomLicenseExpiry: companiesTable.telecomLicenseExpiry,
        energyLicense: companiesTable.energyLicense,
        energyLicenseExpiry: companiesTable.energyLicenseExpiry,
        miningLicense: companiesTable.miningLicense,
        miningLicenseExpiry: companiesTable.miningLicenseExpiry,
        tourismLicense: companiesTable.tourismLicense,
        tourismLicenseExpiry: companiesTable.tourismLicenseExpiry,
        educationLicense: companiesTable.educationLicense,
        educationLicenseExpiry: companiesTable.educationLicenseExpiry,
        healthcareLicense: companiesTable.healthcareLicense,
        healthcareLicenseExpiry: companiesTable.healthcareLicenseExpiry,
        realEstateLicense: companiesTable.realEstateLicense,
        realEstateLicenseExpiry: companiesTable.realEstateLicenseExpiry,
        legalServicesLicense: companiesTable.legalServicesLicense,
        legalServicesLicenseExpiry: companiesTable.legalServicesLicenseExpiry,
        accountingLicense: companiesTable.accountingLicense,
        accountingLicenseExpiry: companiesTable.accountingLicenseExpiry,
        advertisingLicense: companiesTable.advertisingLicense,
        advertisingLicenseExpiry: companiesTable.advertisingLicenseExpiry,
        mediaLicense: companiesTable.mediaLicense,
        mediaLicenseExpiry: companiesTable.mediaLicenseExpiry,
        securityLicense: companiesTable.securityLicense,
        securityLicenseExpiry: companiesTable.securityLicenseExpiry,
        cleaningLicense: companiesTable.cleaningLicense,
        cleaningLicenseExpiry: companiesTable.cleaningLicenseExpiry,
        cateringLicense: companiesTable.cateringLicense,
        cateringLicenseExpiry: companiesTable.cateringLicenseExpiry,
        warehouseLicense: companiesTable.warehouseLicense,
        warehouseLicenseExpiry: companiesTable.warehouseLicenseExpiry,
        logisticsLicense: companiesTable.logisticsLicense,
        logisticsLicenseExpiry: companiesTable.logisticsLicenseExpiry,
        maintenanceLicense: companiesTable.maintenanceLicense,
        maintenanceLicenseExpiry: companiesTable.maintenanceLicenseExpiry,
        trainingLicense: companiesTable.trainingLicense,
        trainingLicenseExpiry: companiesTable.trainingLicenseExpiry,
        consultingLicense: companiesTable.consultingLicense,
        consultingLicenseExpiry: companiesTable.consultingLicenseExpiry,
        researchLicense: companiesTable.researchLicense,
        researchLicenseExpiry: companiesTable.researchLicenseExpiry,
        technologyLicense: companiesTable.technologyLicense,
        technologyLicenseExpiry: companiesTable.technologyLicenseExpiry,
        innovationLicense: companiesTable.innovationLicense,
        innovationLicenseExpiry: companiesTable.innovationLicenseExpiry,
        // Additional Company Information
        website: companiesTable.website,
        contactPerson: companiesTable.contactPerson,
        contactPersonPhone: companiesTable.contactPersonPhone,
        contactPersonEmail: companiesTable.contactPersonEmail,
        companyType: companiesTable.companyType,
        industry: companiesTable.industry,
        // Calculate employee count dynamically.
        // Special rule: For "Samhan Naser Al-Dosary", include employees with NULL/blank companyName as in-house staff.
        employeeCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${employees}
          WHERE ${employees.deletedAt} IS NULL
            AND (
              (
                lower(trim(${companiesTable.name})) = 'samhan naser al-dosary'
                AND (
                  ${employees.companyName} IS NULL
                  OR trim(${employees.companyName}) = ''
                  OR lower(trim(${employees.companyName})) ILIKE '%' || lower(trim(${companiesTable.name})) || '%'
                )
              )
              OR (
                lower(trim(${companiesTable.name})) <> 'samhan naser al-dosary'
                AND ${employees.companyName} IS NOT NULL
                AND lower(trim(${employees.companyName})) ILIKE '%' || lower(trim(${companiesTable.name})) || '%'
              )
            )
        )`.as('employee_count'),
        // Legacy field for backward compatibility
        legalDocument: companiesTable.legalDocument,
        createdAt: companiesTable.createdAt,
        updatedAt: companiesTable.updatedAt,
      })
      .from(companiesTable)
      .where(whereExpr as any)
      .orderBy(orderByClause)
      .offset(offset)
      .limit(limit);

    // Sort by employee count in memory if needed (since it's a calculated field)
    let sortedCompanies = companies;
    if (sortBy === 'employee_count' || sortBy === 'employeeCount') {
      sortedCompanies = [...companies].sort((a, b) => {
        const aCount = Number(a.employeeCount || 0);
        const bCount = Number(b.employeeCount || 0);
        return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
      });
    }

    return NextResponse.json({
      success: true,
      data: sortedCompanies.map(formatCompanyForFrontend),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Companies retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    
    // Return a proper error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch companies: ' + (error instanceof Error ? error.message : 'Unknown error'),
        error: {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
});

export const POST = withPermission(PermissionConfigs.company.create)(async (request: NextRequest) => {
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
    console.error('Error creating company:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create company: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
});
