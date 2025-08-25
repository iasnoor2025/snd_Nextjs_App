import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function POST(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has EMPLOYEE role
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Access denied. Employee role required.' },
        { status: 403 }
      );
    }

    const formData = await _request.formData();
    // Support both field names for compatibility
    const employee_id = formData.get('employee_id') || formData.get('employeeId');
    const document_type = formData.get('document_type') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    // Validate required fields
    if (!employee_id || !document_type || !file) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: employee_id/employeeId, document_type, and file are required',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Upload file to Supabase storage
    const path = `employee-${employee_id}`;
    const uploadResult = await SupabaseStorageService.uploadFile(
      file,
      'employee-documents',
      path
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.message}` },
        { status: 500 }
      );
    }

    // Create document record in database using Drizzle
    const documentRows = await db
      .insert(employeeDocuments)
      .values({
        employeeId: parseInt(employee_id as string),
        documentType: document_type,
        fileName: file.name,
        filePath: uploadResult.url || '',
        description: description || '',
        fileSize: file.size,
        mimeType: file.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const document = documentRows[0];

    return NextResponse.json({
      message: 'Document uploaded successfully',
      document,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
