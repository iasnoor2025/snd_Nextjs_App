import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// GET /api/profile/documents - Get current user's documents
export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Documents API: Starting request...');
    
    // Get the current user session
    const session = await getServerSession(authConfig);
    
    console.log('🔍 Documents API: Session data:', session);
    console.log('🔍 Documents API: Session user:', session?.user);
    console.log('🔍 Documents API: User ID:', session?.user?.id);
    console.log('🔍 Documents API: National ID:', session?.user?.national_id);
    
    if (!session?.user?.id) {
      console.log('❌ Documents API: No session or user ID found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    console.log('✅ Documents API: Parsed user ID:', userId);

    // First, try to find employee by user_id
    console.log('🔍 Documents API: Searching for employee by user_id:', userId);
    let employee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);

    console.log('🔍 Documents API: Employee by user_id result:', employee);

    // If not found, try to find by national_id (Iqama number)
    if (employee.length === 0 && session.user.national_id) {
      console.log('🔍 Documents API: Searching for employee by national_id:', session.user.national_id);
      employee = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.iqamaNumber, session.user.national_id))
        .limit(1);
      console.log('🔍 Documents API: Employee by national_id result:', employee);
    }

    if (employee.length === 0) {
      console.log('❌ Documents API: No employee found for user');
      return NextResponse.json([]);
    }

    const employeeId = employee[0]?.id;
    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }
    console.log('✅ Documents API: Found employee ID:', employeeId);

    // Fetch documents for the employee
    console.log('🔍 Documents API: Fetching documents for employee:', employeeId);
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

    console.log('🔍 Documents API: Raw documents from database:', documentsRows);

    // Format documents to match the expected structure
    const formattedDocuments = documentsRows.map(doc => ({
      id: doc.id,
      name: doc.documentType === 'iqama' ? 'Iqama Document' : 
            doc.documentType === 'passport' ? 'Passport' :
            doc.documentType === 'driving_license' ? 'Driving License' :
            doc.documentType === 'operator_license' ? 'Operator License' :
            doc.documentType === 'contract' ? 'Employment Contract' :
            doc.documentType === 'medical' ? 'Medical Certificate' :
            doc.documentType === 'general' ? 'General Document' :
            doc.documentType,
      file_name: doc.fileName,
      file_size: doc.fileSize,
      mime_type: doc.mimeType,
      document_type: doc.documentType,
      url: doc.filePath,
      description: doc.description,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt
    }));

    console.log('✅ Documents API: Formatted documents:', formattedDocuments);
    console.log('✅ Documents API: Total documents found:', formattedDocuments.length);
    
    // Check specifically for Iqama documents
    const iqamaDocs = formattedDocuments.filter(doc => doc.document_type === 'iqama');
    console.log('🔍 Documents API: Iqama documents found:', iqamaDocs.length);

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error('❌ Documents API: Error fetching profile documents:', error);
    console.error('❌ Documents API: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
