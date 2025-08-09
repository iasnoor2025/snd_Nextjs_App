import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

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
      const existingDocs = await prisma.employeeDocument.findMany({
        where: { employee_id: employeeId, document_type: rawDocumentType },
      });
      for (const doc of existingDocs) {
        try {
          const absPath = join(process.cwd(), 'public', doc.file_path.replace(/^\//, ''));
          if (existsSync(absPath)) {
            await unlink(absPath);
          }
        } catch (e) {
          // ignore file deletion errors and proceed
        }
      }
      if (existingDocs.length > 0) {
        await prisma.employeeDocument.deleteMany({
          where: { employee_id: employeeId, document_type: rawDocumentType },
        });
      }
    }

    // Generate consistent filename: {fileNumber}_{DocumentType}_{timestamp}.{ext}
    const timestamp = Date.now();
    const originalExt = file.name.split('.').pop() || 'bin';
    const ext = originalExt.toLowerCase();

    const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel = documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    const fileNumber = employee.file_number || String(employeeId);
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
    const document = await prisma.employeeDocument.create({
      data: {
        employee_id: employeeId,
        document_type: rawDocumentType,
        file_path: relativePath,
        file_name: storedFileName,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        name: baseLabel,
        file_name: document.file_name,
        file_type: document.mime_type?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        size: document.file_size,
        url: document.file_path,
        mime_type: document.mime_type,
        document_type: document.document_type,
        description: document.description,
        created_at: document.created_at.toISOString(),
        updated_at: document.updated_at.toISOString(),
      }
    });
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
} 