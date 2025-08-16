import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/drizzle'
import { employeeDocuments, employees } from '@/lib/drizzle/schema'
import { eq, and } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth-config'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user has EMPLOYEE role
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { error: 'Access denied. Employee role required.' },
        { status: 403 }
      )
    }

    const { documentId } = await params

    // Get the document to check ownership and file path
    const document = await db
      .select()
      .from(employeeDocuments)
      .leftJoin(employees, eq(employeeDocuments.employeeId, employees.id))
      .where(
        and(
          eq(employeeDocuments.id, parseInt(documentId)),
          eq(employees.userId, parseInt(session.user.id))
        )
      )
      .limit(1);

    if (!document.length) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the physical file if it exists
    if (document[0].employeeDocument.filePath) {
      const filePath = path.join(process.cwd(), 'public', document[0].employeeDocument.filePath)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError)
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the document record from database
    await db
      .delete(employeeDocuments)
      .where(eq(employeeDocuments.id, parseInt(documentId)));

    return NextResponse.json(
      { message: 'Document deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
