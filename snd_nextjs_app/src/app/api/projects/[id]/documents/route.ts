import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const documents = await prisma.media.findMany({
      where: { 
        model_type: 'Project',
        model_id: parseInt(projectId)
      },
      orderBy: { created_at: 'desc' }
    });

    // Transform the data to match the frontend expectations
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.file_name,
      type: doc.mime_type || 'Unknown',
      uploaded_by: 'Unknown', // Media model doesn't have uploader relation
      uploaded_at: doc.created_at.toISOString(),
      size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'
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

    const document = await prisma.media.create({
      data: {
        file_name: body.name,
        file_path: body.file_path,
        file_size: body.file_size,
        mime_type: body.file_type,
        model_type: 'Project',
        model_id: parseInt(projectId),
        collection: body.category || 'documents'
      }
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error('Error creating project document:', error);
    return NextResponse.json(
      { error: 'Failed to create project document' },
      { status: 500 }
    );
  }
}
