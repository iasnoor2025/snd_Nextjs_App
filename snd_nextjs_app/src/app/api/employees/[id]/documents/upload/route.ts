import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employees, employeeDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { withAuth } from "@/lib/rbac/api-middleware";
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const uploadDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!params || !params.id) {
      console.error('Invalid params received:', params);
      return NextResponse.json({ error: "Invalid route parameters" }, { status: 400 });
    }
    
    const { id } = params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employeeResult = await db.select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!employeeResult[0]) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = employeeResult[0];

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawDocumentType = (formData.get('document_type') as string) || 'general';
    const documentName = (formData.get('document_name') as string) || '';
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // document type is optional now; default handled above

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documents', employeeId.toString());
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // If the document type is specific (not general), remove any existing document(s) of the same type
    if (rawDocumentType && rawDocumentType !== 'general') {
      const existingDocsResult = await db.select()
        .from(employeeDocuments)
        .where(eq(employeeDocuments.employeeId, employeeId));
      
      const existingDocs = existingDocsResult.filter(doc => doc.documentType === rawDocumentType);
      
      for (const doc of existingDocs) {
        try {
          const absPath = join(process.cwd(), 'public', doc.filePath.replace(/^\//, ''));
          if (existsSync(absPath)) {
            await unlink(absPath);
          }
        } catch (e) {
          // ignore file deletion errors and proceed
        }
      }
      if (existingDocs.length > 0) {
        await db.delete(employeeDocuments)
          .where(eq(employeeDocuments.employeeId, employeeId));
      }
    }

    // Generate consistent filename: {fileNumber}_{DocumentType}_{timestamp}.{ext}
    const timestamp = Date.now();
    const originalExt = file.name.split('.').pop() || 'bin';
    const ext = originalExt.toLowerCase();

    const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel = documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    const fileNumber = employee.fileNumber || String(employeeId);
    const baseName = `${fileNumber}_${baseLabel}`
      .replace(/\s+/g, '_')
      .replace(/[^A-Za-z0-9_\-]/g, '');

    const storedFileName = `${baseName}_${timestamp}.${ext}`;
    const filePath = join(uploadDir, storedFileName);
    const relativePath = `/uploads/documents/${employeeId}/${storedFileName}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document record to database (use the new file name)
    console.log('Inserting document with values:', {
      employeeId,
      documentType: rawDocumentType,
      filePath: relativePath,
      fileName: storedFileName,
      fileSize: file.size,
      mimeType: file.type,
      description: description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const documentResult = await db.insert(employeeDocuments)
      .values({
        employeeId: employeeId,
        documentType: rawDocumentType,
        filePath: relativePath,
        fileName: storedFileName,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }) 
      .returning();

    console.log('Document inserted successfully:', documentResult);
    const document = documentResult[0];
    
    if (!document) {
      throw new Error('Failed to insert document into database');
    }

    const responseData = {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        name: baseLabel,
        fileName: document.fileName,
        fileType: document.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        size: document.fileSize,
        url: document.filePath,
        mimeType: document.mimeType,
        documentType: document.documentType,
        description: document.description,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }
    };

    console.log('Returning response:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/documents/upload:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
};

export const POST = withAuth(uploadDocumentsHandler); 