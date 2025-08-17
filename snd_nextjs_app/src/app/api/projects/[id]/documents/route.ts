import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { media } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const documents = await db
      .select()
      .from(media)
      .where(eq(media.modelId, parseInt(projectId)))
      .orderBy(desc(media.createdAt));

    // Transform the data to match the frontend expectations
    const transformedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      name: doc.fileName,
      type: doc.mimeType || 'Unknown',
      uploaded_by: 'Unknown', // Media model doesn't have uploader relation
      uploaded_at: doc.createdAt,
      size: doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown'
    }));

    return NextResponse.json({ data: transformedDocuments });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project documents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const documentRows = await db
      .insert(media)
      .values({
        fileName: body.name,
        filePath: body.file_path,
        fileSize: body.file_size,
        mimeType: body.file_type,
        modelType: 'Project',
        modelId: parseInt(projectId),
        collection: body.category || 'documents',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({ data: documentRows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating project document:', error);
    return NextResponse.json(
      { error: 'Failed to create project document' },
      { status: 500 }
    );
  }
}
