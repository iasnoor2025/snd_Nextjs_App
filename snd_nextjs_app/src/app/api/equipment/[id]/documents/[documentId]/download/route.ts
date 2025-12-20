import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

import { db } from '@/lib/drizzle';
import { equipmentDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ensureHttps } from '@/lib/utils/url-utils';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

const handler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: equipmentId, documentId } = await params;
    const equipmentIdNum = parseInt(equipmentId);
    const documentIdNum = parseInt(documentId);
    
    if (!equipmentIdNum || !documentIdNum) {
      return NextResponse.json({ error: 'Invalid equipment ID or document ID' }, { status: 400 });
    }
    
    // Get document record from database
    const documentResult = await db
      .select()
      .from(equipmentDocuments)
      .where(eq(equipmentDocuments.id, documentIdNum))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentRecord = documentResult[0];

    // Verify the document belongs to the equipment
    if (documentRecord.equipmentId !== equipmentIdNum) {
      return NextResponse.json({ error: 'Document does not belong to this equipment' }, { status: 403 });
    }

    // If the document is stored in Supabase (URL starts with http/https)
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      // For Supabase URLs, redirect to the file or return the URL
      const url = new URL(request.url);
      const isPreview = !url.searchParams.has('download');
      
      if (isPreview) {
        // For preview, redirect to the HTTPS URL
        return NextResponse.redirect(ensureHttps(documentRecord.filePath));
      } else {
        // For download, return the HTTPS URL for the client to handle
        return NextResponse.json({
          success: true,
          downloadUrl: ensureHttps(documentRecord.filePath),
          fileName: documentRecord.fileName,
          mimeType: documentRecord.mimeType,
        });
      }
    }

    // Fallback for any remaining local files (shouldn't happen with Supabase)
    return NextResponse.json({ 
      error: 'Document not accessible',
      message: 'Document is not stored in the expected location'
    }, { status: 404 });

  } catch (error) {
    console.error('Error accessing equipment document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to access document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs['equipment-document'].read)(handler);
