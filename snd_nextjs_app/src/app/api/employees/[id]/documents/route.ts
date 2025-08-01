import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
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

    // Fetch documents from database
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employee_id: employeeId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format documents to match Laravel response
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      name: doc.file_name,
      file_name: doc.file_name,
      file_type: doc.mime_type?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
      size: doc.file_size || 0,
      url: doc.file_path,
      mime_type: doc.mime_type,
      document_type: doc.document_type,
      description: doc.description,
      created_at: doc.created_at.toISOString(),
      updated_at: doc.updated_at.toISOString(),
    }));

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

    // Create document in database
    const document = await prisma.employeeDocument.create({
      data: {
        employee_id: employeeId,
        document_type: body.document_type || 'general',
        file_path: body.file_path,
        file_name: body.file_name,
        file_size: body.file_size,
        mime_type: body.mime_type,
        description: body.description,
      },
    });

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
