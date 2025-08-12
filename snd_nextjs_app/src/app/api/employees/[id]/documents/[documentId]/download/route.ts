import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);
    const documentId = parseInt(resolvedParams.documentId);

    if (!employeeId || !documentId) {
      return NextResponse.json(
        { error: "Invalid employee ID or document ID" },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await db
      .select()
      .from(employeeDocuments)
      .where(
        and(
          eq(employeeDocuments.id, documentId),
          eq(employeeDocuments.employeeId, employeeId)
        )
      )
      .limit(1);
    
    const documentRecord = document[0];

    if (!documentRecord) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = join(process.cwd(), 'public', documentRecord.filePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found on server" },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': documentRecord.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${documentRecord.fileName}"`,
        'Content-Length': documentRecord.fileSize?.toString() || fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/documents/[documentId]/download:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to download document: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 