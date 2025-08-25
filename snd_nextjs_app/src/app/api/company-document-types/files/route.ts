import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data for company document types
  const documentTypes = [
    {
      id: 1,
      name: 'Commercial Registration',
      description: 'Official commercial registration document',
      isRequired: true,
      expiryDate: '2025-12-31',
      filePath: 'https://supabase.example.com/storage/v1/object/public/documents/company-documents/commercial_registration.pdf',
      status: 'active',
    },
    {
      id: 2,
      name: 'Tax Registration',
      description: 'Tax registration certificate',
      isRequired: true,
      expiryDate: '2025-06-30',
      filePath: 'https://supabase.example.com/storage/v1/object/public/documents/company-documents/tax_registration.pdf',
      status: 'active',
    },
    {
      id: 3,
      name: 'Labor Card',
      description: 'Labor card for company operations',
      isRequired: false,
      expiryDate: null,
      filePath: null,
      status: 'active',
    },
  ];

  return NextResponse.json({
    success: true,
    data: documentTypes,
  });
}
