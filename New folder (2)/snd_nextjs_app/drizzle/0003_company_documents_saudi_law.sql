-- Migration: Add Saudi Law Required Document Fields to Companies Table
-- This migration adds comprehensive document management fields required by Saudi Arabian law

ALTER TABLE companies 
ADD COLUMN commercial_registration TEXT,
ADD COLUMN commercial_registration_expiry DATE,
ADD COLUMN tax_registration TEXT,
ADD COLUMN tax_registration_expiry DATE,
ADD COLUMN municipality_license TEXT,
ADD COLUMN municipality_license_expiry DATE,
ADD COLUMN chamber_of_commerce TEXT,
ADD COLUMN chamber_of_commerce_expiry DATE,
ADD COLUMN labor_office_license TEXT,
ADD COLUMN labor_office_license_expiry DATE,
ADD COLUMN gosi_registration TEXT,
ADD COLUMN gosi_registration_expiry DATE,
ADD COLUMN saudi_standards_license TEXT,
ADD COLUMN saudi_standards_license_expiry DATE,
ADD COLUMN environmental_license TEXT,
ADD COLUMN environmental_license_expiry DATE,
ADD COLUMN website TEXT,
ADD COLUMN contact_person TEXT,
ADD COLUMN contact_person_phone TEXT,
ADD COLUMN contact_person_email TEXT,
ADD COLUMN company_type TEXT,
ADD COLUMN industry TEXT,
ADD COLUMN employee_count INTEGER;

-- Add comments to document the purpose of each field
COMMENT ON COLUMN companies.commercial_registration IS 'Commercial Registration Number - Required by Saudi Law';
COMMENT ON COLUMN companies.commercial_registration_expiry IS 'Commercial Registration Expiry Date';
COMMENT ON COLUMN companies.tax_registration IS 'Tax Registration Number - Required by Saudi Law';
COMMENT ON COLUMN companies.tax_registration_expiry IS 'Tax Registration Expiry Date';
COMMENT ON COLUMN companies.municipality_license IS 'Municipality License Number - Required by Saudi Law';
COMMENT ON COLUMN companies.municipality_license_expiry IS 'Municipality License Expiry Date';
COMMENT ON COLUMN companies.chamber_of_commerce IS 'Chamber of Commerce Registration - Required by Saudi Law';
COMMENT ON COLUMN companies.chamber_of_commerce_expiry IS 'Chamber of Commerce Expiry Date';
COMMENT ON COLUMN companies.labor_office_license IS 'Labor Office License - Required by Saudi Law';
COMMENT ON COLUMN companies.labor_office_license_expiry IS 'Labor Office License Expiry Date';
COMMENT ON COLUMN companies.gosi_registration IS 'GOSI Registration Number - Required by Saudi Law';
COMMENT ON COLUMN companies.gosi_registration_expiry IS 'GOSI Registration Expiry Date';
COMMENT ON COLUMN companies.saudi_standards_license IS 'Saudi Standards License - Required by Saudi Law';
COMMENT ON COLUMN companies.saudi_standards_license_expiry IS 'Saudi Standards License Expiry Date';
COMMENT ON COLUMN companies.environmental_license IS 'Environmental License - Required by Saudi Law';
COMMENT ON COLUMN companies.environmental_license_expiry IS 'Environmental License Expiry Date';
COMMENT ON COLUMN companies.website IS 'Company Website URL';
COMMENT ON COLUMN companies.contact_person IS 'Primary Contact Person Name';
COMMENT ON COLUMN companies.contact_person_phone IS 'Primary Contact Person Phone';
COMMENT ON COLUMN companies.contact_person_email IS 'Primary Contact Person Email';
COMMENT ON COLUMN companies.company_type IS 'Type of Company (LLC, Joint Stock, etc.)';
COMMENT ON COLUMN companies.industry IS 'Industry/Sector Classification';
COMMENT ON COLUMN companies.employee_count IS 'Total Number of Employees';
