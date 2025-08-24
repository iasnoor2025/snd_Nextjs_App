import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { media, equipment } from '@/lib/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const equipmentId = parseInt(resolvedParams.id);
    const documentId = parseInt(resolvedParams.documentId);

    if (!equipmentId || !documentId) {
      return NextResponse.json({ error: 'Invalid equipment ID or document ID' }, { status: 400 });
    }

    // Get document from database
    const document = await db
      .select()
      .from(media)
      .where(
        and(
          eq(media.id, documentId), 
          eq(media.modelId, equipmentId),
          eq(media.modelType, 'Equipment'),
          eq(media.collection, 'documents')
        )
      )
      .limit(1);

    const documentRecord = document[0];

    if (!documentRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Construct file path - remove leading slash if present
    const cleanFilePath = documentRecord.filePath.startsWith('/') 
      ? documentRecord.filePath.slice(1) 
      : documentRecord.filePath;
    const filePath = join(process.cwd(), 'public', 'uploads', 'documents', cleanFilePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      console.error(`Original filePath: ${documentRecord.filePath}`);
      console.error(`Clean filePath: ${cleanFilePath}`);
      return NextResponse.json({ 
        error: 'File not found on server',
        debug: {
          originalPath: documentRecord.filePath,
          cleanPath: cleanFilePath,
          fullPath: filePath
        }
      }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Check if this is a preview request (no download parameter)
    const url = new URL(request.url);
    const isPreview = !url.searchParams.has('download');
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': documentRecord.mimeType || 'application/octet-stream',
        'Content-Disposition': isPreview 
          ? `inline; filename="${documentRecord.fileName}"`
          : `attachment; filename="${documentRecord.fileName}"`,
        'Content-Length': documentRecord.fileSize?.toString() || fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading equipment document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to download document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
