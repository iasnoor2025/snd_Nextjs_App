import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { media } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// DELETE /api/equipment/[id]/documents/[documentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { id, documentId } = await params;
    const equipmentId = parseInt(id);
    const docId = parseInt(documentId);
    
    if (isNaN(equipmentId) || isNaN(docId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID or document ID' },
        { status: 400 }
      );
    }

    // Find the document
    const document = await db
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, docId),
          eq(media.modelType, 'Equipment'),
          eq(media.modelId, equipmentId),
          eq(media.collection, 'documents')
        )
      )
      .limit(1);

    if (!document.length) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', 'documents', document[0].filePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from database
    await db
      .delete(media)
      .where(eq(media.id, docId));

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting equipment document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete equipment document',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
