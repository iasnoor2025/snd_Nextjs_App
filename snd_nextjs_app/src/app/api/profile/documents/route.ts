import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { ensureHttps } from '@/lib/utils/url-utils';

// GET /api/profile/documents - Get current user's documents
export async function GET(_request: NextRequest) {
  try {

    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // First, try to find employee by user_id
    
    let employee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);

    // If not found, try to find by national_id (Iqama number)
    if (employee.length === 0 && session.user.national_id) {
      
      employee = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, session.user.national_id))
        .limit(1);
      
    }

    if (employee.length === 0) {
      
      return NextResponse.json([]);
    }

    const employeeId = employee[0]?.id;
    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    // Fetch documents for the employee
    
    const documentsRows = await db
      .select({
        id: employeeDocuments.id,
        documentType: employeeDocuments.documentType,
        fileName: employeeDocuments.fileName,
        fileSize: employeeDocuments.fileSize,
        mimeType: employeeDocuments.mimeType,
        filePath: employeeDocuments.filePath,
        description: employeeDocuments.description,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
      })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(employeeDocuments.createdAt);

    // Format documents to match the expected structure
    const formattedDocuments = documentsRows.map(doc => ({
      id: doc.id,
      name:
        doc.documentType === 'iqama'
          ? 'Iqama Document'
          : doc.documentType === 'passport'
            ? 'Passport'
            : doc.documentType === 'driving_license'
              ? 'Driving License'
              : doc.documentType === 'operator_license'
                ? 'Operator License'
                : doc.documentType === 'contract'
                  ? 'Employment Contract'
                  : doc.documentType === 'medical'
                    ? 'Medical Certificate'
                    : doc.documentType === 'general'
                      ? 'General Document'
                      : doc.documentType,
      file_name: doc.fileName,
      file_size: doc.fileSize,
      mime_type: doc.mimeType,
      document_type: doc.documentType,
      url: ensureHttps(doc.filePath), // Force HTTPS to prevent Mixed Content errors
      description: doc.description,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    }));

    // Check specifically for Iqama documents
    const iqamaDocs = formattedDocuments.filter(doc => doc.document_type === 'iqama');

    return NextResponse.json(formattedDocuments);
  } catch (error) {

    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
