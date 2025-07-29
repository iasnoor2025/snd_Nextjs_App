import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Mock document data
    const documents = [
      {
        id: 1,
        name: 'Iqama Document',
        type: 'iqama',
        file_url: '/documents/iqama_1234567890.pdf',
        uploaded_at: '2024-01-15',
        expiry_date: '2025-12-31'
      },
      {
        id: 2,
        name: 'Passport Copy',
        type: 'passport',
        file_url: '/documents/passport_A12345678.pdf',
        uploaded_at: '2024-01-15',
        expiry_date: '2026-06-30'
      },
      {
        id: 3,
        name: 'Driving License',
        type: 'driving_license',
        file_url: '/documents/driving_license_DL123456.pdf',
        uploaded_at: '2024-02-01',
        expiry_date: '2025-08-15'
      },
      {
        id: 4,
        name: 'Employment Contract',
        type: 'contract',
        file_url: '/documents/contract_EMP001.pdf',
        uploaded_at: '2024-01-10'
      },
      {
        id: 5,
        name: 'Medical Certificate',
        type: 'medical',
        file_url: '/documents/medical_cert_2024.pdf',
        uploaded_at: '2024-01-20',
        expiry_date: '2025-01-20'
      },
      {
        id: 6,
        name: 'TUV Certification',
        type: 'tuv_certification',
        file_url: '/documents/tuv_cert_TUV123456.pdf',
        uploaded_at: '2024-03-01',
        expiry_date: '2025-09-30'
      }
    ];

    return NextResponse.json({
      success: true,
      data: documents,
      message: 'Documents retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Mock create response
    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: { id: Math.floor(Math.random() * 1000), employee_id: parseInt(id), ...body }
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
