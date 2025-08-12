import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(
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

    // Delete file from filesystem
    const filePath = join(process.cwd(), 'public', documentRecord.filePath);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file from filesystem:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete document from database
    await db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, documentId));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/employees/[id]/documents/[documentId]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
} 