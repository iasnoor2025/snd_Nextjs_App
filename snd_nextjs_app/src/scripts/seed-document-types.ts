import { db } from '@/lib/db';
import { companyDocumentTypes } from '@/lib/drizzle/schema';

const initialDocumentTypes = [
  {
    key: 'commercial_registration',
    label: 'Commercial Registration',
    description: 'Required by Saudi law for all commercial entities',
    required: true,
    category: 'legal',
    sortOrder: 1,
  },
  {
    key: 'tax_registration',
    label: 'Tax Registration',
    description: 'Required by Saudi law for tax compliance',
    required: true,
    category: 'financial',
    sortOrder: 2,
  },
  {
    key: 'municipality_license',
    label: 'Municipality License',
    description: 'Required for certain business activities',
    required: false,
    category: 'legal',
    sortOrder: 3,
  },
  {
    key: 'chamber_of_commerce',
    label: 'Chamber of Commerce',
    description: 'Business association registration',
    required: false,
    category: 'legal',
    sortOrder: 4,
  },
  {
    key: 'labor_office_license',
    label: 'Labor Office License',
    description: 'Required for hiring employees',
    required: false,
    category: 'legal',
    sortOrder: 5,
  },
  {
    key: 'gosi_registration',
    label: 'GOSI Registration',
    description: 'Social insurance registration',
    required: false,
    category: 'financial',
    sortOrder: 6,
  },
  {
    key: 'saudi_standards_license',
    label: 'Saudi Standards License',
    description: 'Quality standards compliance',
    required: false,
    category: 'general',
    sortOrder: 7,
  },
  {
    key: 'environmental_license',
    label: 'Environmental License',
    description: 'Environmental compliance permit',
    required: false,
    category: 'general',
    sortOrder: 8,
  },
  {
    key: 'zakat_registration',
    label: 'Zakat Registration',
    description: 'Zakat and income tax registration',
    required: false,
    category: 'financial',
    sortOrder: 9,
  },
  {
    key: 'saudi_arabia_visa',
    label: 'Saudi Arabia Visa',
    description: 'Business visa for foreign companies',
    required: false,
    category: 'legal',
    sortOrder: 10,
  },
  {
    key: 'investment_license',
    label: 'Investment License',
    description: 'Foreign investment permit',
    required: false,
    category: 'financial',
    sortOrder: 11,
  },
  {
    key: 'import_export_license',
    label: 'Import/Export License',
    description: 'International trade permit',
    required: false,
    category: 'general',
    sortOrder: 12,
  },
  {
    key: 'pharmaceutical_license',
    label: 'Pharmaceutical License',
    description: 'Healthcare and pharmaceutical permit',
    required: false,
    category: 'healthcare',
    sortOrder: 13,
  },
  {
    key: 'food_safety_license',
    label: 'Food Safety License',
    description: 'Food and beverage safety permit',
    required: false,
    category: 'healthcare',
    sortOrder: 14,
  },
  {
    key: 'construction_license',
    label: 'Construction License',
    description: 'Construction and engineering permit',
    required: false,
    category: 'construction',
    sortOrder: 15,
  },
  {
    key: 'transportation_license',
    label: 'Transportation License',
    description: 'Transport and logistics permit',
    required: false,
    category: 'transportation',
    sortOrder: 16,
  },
  {
    key: 'banking_license',
    label: 'Banking License',
    description: 'Financial services permit',
    required: false,
    category: 'financial',
    sortOrder: 17,
  },
  {
    key: 'insurance_license',
    label: 'Insurance License',
    description: 'Insurance services permit',
    required: false,
    category: 'financial',
    sortOrder: 18,
  },
  {
    key: 'telecom_license',
    label: 'Telecommunications License',
    description: 'Telecom and IT services permit',
    required: false,
    category: 'technology',
    sortOrder: 19,
  },
  {
    key: 'energy_license',
    label: 'Energy License',
    description: 'Energy and utilities permit',
    required: false,
    category: 'energy',
    sortOrder: 20,
  },
  {
    key: 'mining_license',
    label: 'Mining License',
    description: 'Mining and natural resources permit',
    required: false,
    category: 'mining',
    sortOrder: 21,
  },
  {
    key: 'tourism_license',
    label: 'Tourism License',
    description: 'Tourism and hospitality permit',
    required: false,
    category: 'tourism',
    sortOrder: 22,
  },
  {
    key: 'education_license',
    label: 'Education License',
    description: 'Educational services permit',
    required: false,
    category: 'education',
    sortOrder: 23,
  },
  {
    key: 'healthcare_license',
    label: 'Healthcare License',
    description: 'Healthcare services permit',
    required: false,
    category: 'healthcare',
    sortOrder: 24,
  },
  {
    key: 'real_estate_license',
    label: 'Real Estate License',
    description: 'Real estate and property permit',
    required: false,
    category: 'real_estate',
    sortOrder: 25,
  },
  {
    key: 'legal_services_license',
    label: 'Legal Services License',
    description: 'Legal and consulting services permit',
    required: false,
    category: 'consulting',
    sortOrder: 26,
  },
  {
    key: 'accounting_license',
    label: 'Accounting License',
    description: 'Accounting and auditing services permit',
    required: false,
    category: 'consulting',
    sortOrder: 27,
  },
  {
    key: 'advertising_license',
    label: 'Advertising License',
    description: 'Marketing and advertising permit',
    required: false,
    category: 'media',
    sortOrder: 28,
  },
  {
    key: 'media_license',
    label: 'Media License',
    description: 'Media and broadcasting permit',
    required: false,
    category: 'media',
    sortOrder: 29,
  },
  {
    key: 'security_license',
    label: 'Security License',
    description: 'Security and protection services permit',
    required: false,
    category: 'security',
    sortOrder: 30,
  },
  {
    key: 'cleaning_license',
    label: 'Cleaning License',
    description: 'Cleaning and maintenance services permit',
    required: false,
    category: 'maintenance',
    sortOrder: 31,
  },
  {
    key: 'catering_license',
    label: 'Catering License',
    description: 'Food service and catering permit',
    required: false,
    category: 'healthcare',
    sortOrder: 32,
  },
  {
    key: 'warehouse_license',
    label: 'Warehouse License',
    description: 'Storage and warehousing permit',
    required: false,
    category: 'logistics',
    sortOrder: 33,
  },
  {
    key: 'logistics_license',
    label: 'Logistics License',
    description: 'Logistics and supply chain permit',
    required: false,
    category: 'logistics',
    sortOrder: 34,
  },
  {
    key: 'maintenance_license',
    label: 'Maintenance License',
    description: 'Equipment and facility maintenance permit',
    required: false,
    category: 'maintenance',
    sortOrder: 35,
  },
  {
    key: 'training_license',
    label: 'Training License',
    description: 'Professional training and development permit',
    required: false,
    category: 'education',
    sortOrder: 36,
  },
  {
    key: 'consulting_license',
    label: 'Consulting License',
    description: 'Business consulting services permit',
    required: false,
    category: 'consulting',
    sortOrder: 37,
  },
  {
    key: 'research_license',
    label: 'Research License',
    description: 'Research and development permit',
    required: false,
    category: 'research',
    sortOrder: 38,
  },
  {
    key: 'technology_license',
    label: 'Technology License',
    description: 'Technology and innovation permit',
    required: false,
    category: 'technology',
    sortOrder: 39,
  },
  {
    key: 'innovation_license',
    label: 'Innovation License',
    description: 'Innovation and startup permit',
    required: false,
    category: 'innovation',
    sortOrder: 40,
  },
];

async function seedDocumentTypes() {
  try {
    console.log('🌱 Seeding document types...');
    
    const nowIso = new Date().toISOString();
    
    for (const docType of initialDocumentTypes) {
      try {
        await db.insert(companyDocumentTypes).values({
          ...docType,
          isActive: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        console.log(`✅ Added: ${docType.label}`);
      } catch (error: any) {
        if (error.message.includes('duplicate key')) {
          console.log(`⏭️  Skipped (already exists): ${docType.label}`);
        } else {
          console.error(`❌ Error adding ${docType.label}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Document types seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedDocumentTypes();
