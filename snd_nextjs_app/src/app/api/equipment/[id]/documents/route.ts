import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// GET /api/equipment/[id]/documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentId = parseInt(id);
    
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Get documents for this equipment
    const documents = await prisma.media.findMany({
      where: {
        model_type: 'Equipment',
        model_id: equipmentId,
        collection: 'documents'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform documents to match expected format
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.file_name,
      file_name: doc.file_name,
      file_type: doc.mime_type,
      size: doc.file_size,
      url: `/uploads/documents/${doc.file_path}`,
      created_at: doc.created_at.toISOString()
    }));



    return NextResponse.json({
      success: true,
      data: {
        documents: formattedDocuments
      }
    });
  } catch (error) {
    console.error('Error fetching equipment documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch equipment documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/equipment/[id]/documents
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const equipmentId = parseInt(id);
    
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Verify equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentName = formData.get('document_name') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document info to database
    const document = await prisma.media.create({
      data: {
        file_name: documentName || originalName,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        collection: 'documents',
        model_type: 'Equipment',
        model_id: equipmentId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          name: document.file_name,
          file_name: document.file_name,
          file_type: document.mime_type,
          size: document.file_size,
          url: `/uploads/documents/${document.file_path}`,
          created_at: document.created_at.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error uploading equipment document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload equipment document',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
