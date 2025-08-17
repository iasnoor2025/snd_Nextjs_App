import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { media, equipment } from '@/lib/drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { writeFile, mkdir, unlink } from 'fs/promises';
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
      created_at: doc.createdAt
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
    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      console.log('Database connection test successful');
      
      // Test if media table exists
      const tableExists = await db.execute(sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'media')`);
      console.log('Media table exists:', tableExists);
      
      // Test media table structure
      const tableStructure = await db.execute(sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'media' ORDER BY ordinal_position`);
      console.log('Media table structure:', tableStructure);
    } catch (dbTestError) {
      console.error('Database connection test failed:', dbTestError);
      throw new Error('Database connection failed');
    }

    const { id } = await params;
    const equipmentId = parseInt(id);
    
    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Verify equipment exists
    console.log('Checking if equipment exists with ID:', equipmentId);
    const equipmentData = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentData.length) {
      console.log('Equipment not found with ID:', equipmentId);
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }
    
    const equipmentItem = equipmentData[0];
    if (!equipmentItem) {
      console.log('Equipment data not found');
      return NextResponse.json(
        { success: false, error: 'Equipment data not found' },
        { status: 404 }
      );
    }
    
    console.log('Equipment found:', equipmentItem.name);

    const formData = await request.formData();
    console.log('Form data received:', Array.from(formData.entries()).map(([key, value]) => [key, value instanceof File ? `${value.name} (${value.size} bytes)` : value]));
    
    const file = formData.get('file') as File;
    const documentName = formData.get('document_name') as string;

    if (!file) {
      console.log('No file provided in form data');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate that file is actually a File object
    if (!(file instanceof File)) {
      console.log('Invalid file object received:', typeof file, file);
      return NextResponse.json(
        { success: false, error: 'Invalid file object' },
        { status: 400 }
      );
    }
    
    // Additional file validation
    if (!file.name || file.name.trim() === '') {
      console.log('File has no name');
      return NextResponse.json(
        { success: false, error: 'File must have a name' },
        { status: 400 }
      );
    }
    
    if (file.size === 0) {
      console.log('File is empty');
      return NextResponse.json(
        { success: false, error: 'File cannot be empty' },
        { status: 400 }
      );
    }
    
    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

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
    console.log('Uploads directory:', uploadsDir);
    console.log('Current working directory:', process.cwd());
    
    try {
      if (!existsSync(uploadsDir)) {
        console.log('Creating uploads directory...');
        await mkdir(uploadsDir, { recursive: true });
        console.log('Uploads directory created successfully');
      }
      
      // Verify directory is writable
      const testFile = join(uploadsDir, '.test');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      console.log('Directory is writable');
    } catch (dirError) {
      console.error('Error with uploads directory:', dirError);
      throw new Error(`Uploads directory error: ${dirError instanceof Error ? dirError.message : 'Unknown error'}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);
    
    console.log('File path:', filePath);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    // Save file to disk
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log('File saved successfully to disk');
    } catch (fileError) {
      console.error('Error saving file to disk:', fileError);
      throw new Error(`Failed to save file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
    }

    // Save document info to database
    let insertedDocument;
    try {
      console.log('Inserting document into database...');
      const [document] = await db.insert(media).values({
        fileName: documentName || originalName,
        filePath: fileName,
        fileSize: file.size,
        mimeType: file.type,
        collection: 'documents',
        modelType: 'Equipment',
        modelId: equipmentId,
        updatedAt: new Date().toISOString()
      }).returning();
      insertedDocument = document;
      if (!insertedDocument) {
        throw new Error('Failed to insert document into database');
      }
      console.log('Document inserted successfully:', insertedDocument);
    } catch (dbError) {
      console.error('Error inserting document into database:', dbError);
      // Try to clean up the uploaded file if database insert fails
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log('Cleaned up uploaded file after database error');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file after database error:', cleanupError);
      }
      throw new Error(`Failed to save document to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document uploaded successfully',
        document: {
          id: insertedDocument.id,
          name: insertedDocument.fileName,
          file_name: insertedDocument.fileName,
          file_type: insertedDocument.mimeType,
          size: insertedDocument.fileSize,
          url: `/uploads/documents/${insertedDocument.filePath}`,
          created_at: insertedDocument.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error uploading equipment document:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
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


