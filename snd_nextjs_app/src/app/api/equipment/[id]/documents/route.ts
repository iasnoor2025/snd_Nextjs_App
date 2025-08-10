import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { media, equipment } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';
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
    const documents = await db
      .select()
      .from(media)
      .where(eq(media.modelId, equipmentId))
      .orderBy(desc(media.createdAt));

    // Transform documents to match expected format
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.fileName,
      file_name: doc.fileName,
      file_type: doc.mimeType,
      size: doc.fileSize,
      url: `/uploads/documents/${doc.filePath}`,
      created_at: doc.createdAt.toISOString()
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
    const equipmentData = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentData.length) {
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
    const [document] = await db.insert(media).values({
      fileName: documentName || originalName,
      filePath: fileName,
      fileSize: file.size,
      mimeType: file.type,
      collection: 'documents',
      modelType: 'Equipment',
      modelId: equipmentId
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          name: document.fileName,
          file_name: document.fileName,
          file_type: document.mimeType,
          size: document.fileSize,
          url: `/uploads/documents/${document.filePath}`,
          created_at: document.createdAt.toISOString()
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
