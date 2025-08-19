import { db } from '@/lib/drizzle';
import { media } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';

// DELETE /api/equipment/[id]/documents/[documentId]
export async function DELETE({ params }: { params: Promise<{ id: string; documentId: string }> }) {
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
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const documentData = document[0];
    if (!documentData) {
      return NextResponse.json(
        { success: false, error: 'Document data not found' },
        { status: 404 }
      );
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', 'documents', documentData.filePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from database
    await db.delete(media).where(eq(media.id, docId));

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document deleted successfully',
      },
    });
  } catch (error) {
    
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
