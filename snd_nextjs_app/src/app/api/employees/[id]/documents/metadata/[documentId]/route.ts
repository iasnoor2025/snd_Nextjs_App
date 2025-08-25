import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// DELETE - Remove employee document record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = parseInt(params.id);
    const documentId = parseInt(params.documentId);
    
    if (isNaN(employeeId) || isNaN(documentId)) {
      return NextResponse.json({ error: 'Invalid employee ID or document ID' }, { status: 400 });
    }

    // Delete document record from database
    const deletedDocuments = await db
      .delete(employeeDocuments)
      .where(
        and(
          eq(employeeDocuments.id, documentId),
          eq(employeeDocuments.employeeId, employeeId)
        )
      )
      .returning();

    if (deletedDocuments.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Document record deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting employee document record:', error);
    return NextResponse.json(
      { error: 'Failed to delete document record' },
      { status: 500 }
    );
  }
}
