import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { employeeDocuments, employees as employeesTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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

    // Fetch documents from database using Drizzle
    const documentsRows = await db
      .select({
        id: employeeDocuments.id,
        employeeId: employeeDocuments.employeeId,
        documentType: employeeDocuments.documentType,
        filePath: employeeDocuments.filePath,
        fileName: employeeDocuments.fileName,
        fileSize: employeeDocuments.fileSize,
        mimeType: employeeDocuments.mimeType,
        description: employeeDocuments.description,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
        employeeFileNumber: employeesTable.fileNumber,
      })
      .from(employeeDocuments)
      .leftJoin(employeesTable, eq(employeesTable.id, employeeDocuments.employeeId))
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(employeeDocuments.createdAt);

    // Format documents to match Laravel response
    const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const formattedDocuments = documentsRows.map(doc => {
      const typeLabel = doc.documentType && doc.documentType !== 'general'
        ? toTitleCase(doc.documentType.replace(/_/g, ' '))
        : undefined;
      return {
        id: doc.id,
        name: typeLabel || doc.fileName,
        file_name: doc.fileName,
        file_type: doc.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        size: doc.fileSize || 0,
        url: doc.filePath,
        mime_type: doc.mimeType,
        document_type: doc.documentType,
        description: doc.description,
        file_number: doc.employeeFileNumber || null,
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
      };
    });

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Create document in database using Drizzle
    const documentRows = await db
      .insert(employeeDocuments)
      .values({
        employeeId: employeeId,
        documentType: body.document_type || 'general',
        filePath: body.file_path,
        fileName: body.file_name,
        fileSize: body.file_size,
        mimeType: body.mime_type,
        description: body.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const document = documentRows[0];

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Error in POST /api/employees/[id]/documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}
