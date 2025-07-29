import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const documents = await prisma.projectDocument.findMany({
      where: { projectId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the frontend expectations
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.fileType || 'Unknown',
      uploaded_by: doc.uploader?.name || 'Unknown',
      uploaded_at: doc.createdAt.toISOString(),
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

    const document = await prisma.projectDocument.create({
      data: {
        projectId,
        userId: body.user_id,
        name: body.name,
        description: body.description,
        category: body.category,
        filePath: body.file_path,
        fileSize: body.file_size,
        fileType: body.file_type,
        uploadedBy: body.uploaded_by,
        isShared: body.is_shared || false,
        metadata: body.metadata || {}
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
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
