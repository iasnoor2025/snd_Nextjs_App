import { db } from '@/lib/db';
import { companyDocumentTypes } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Mock data for now - in a real implementation, you'd have a document_files table
const mockDocumentFiles = [
  {
    id: 1,
    documentTypeId: 1,
    fileName: 'commercial_registration.pdf',
    filePath: '/uploads/documents/commercial_registration.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    expiryDate: '2025-12-31',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'admin@example.com',
  },
  {
    id: 2,
    documentTypeId: 2,
    fileName: 'tax_registration.pdf',
    filePath: '/uploads/documents/tax_registration.pdf',
    fileSize: 2048000,
    mimeType: 'application/pdf',
    expiryDate: '2025-06-30',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'admin@example.com',
  },
];

export const GET = withPermission(async (request: NextRequest) => {
  try {
    // For now, return mock data
    // In a real implementation, you'd query the document_files table
    return NextResponse.json({
      success: true,
      data: mockDocumentFiles,
      message: 'Document files retrieved successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch document files: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.read);
