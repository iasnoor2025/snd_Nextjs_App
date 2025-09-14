import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { employeeDocuments, employees, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '@/lib/rbac/permission-service';
import { ensureHttps } from '@/lib/utils/url-utils';

// GET /api/profile/documents - Get current user's employee documents
export async function GET(_request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Check if user has permission to read their own profile documents
    const permissionCheck = await checkUserPermission(userId.toString(), 'read', 'own-profile');
    
    if (!permissionCheck.hasPermission) {
      console.log('❌ User does not have permission to read profile documents:', permissionCheck.reason);
      return NextResponse.json(
        { error: 'Access denied. Permission required to read profile documents.' },
        { status: 403 }
      );
    }

    console.log('✅ User has permission to read profile documents');

    // First, find the employee record linked to this user
    let employeeRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        iqamaNumber: employees.iqamaNumber,
      })
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);

    // If no employee found by userId, try to find by National ID from user record
    if (employeeRows.length === 0) {
      console.log('No employee found by userId, trying National ID match...');
      
      // Get user's National ID
      const userRows = await db
        .select({ nationalId: users.nationalId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userRows.length > 0 && userRows[0].nationalId) {
        console.log('Looking for employee with National ID:', userRows[0].nationalId);
        
        employeeRows = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            iqamaNumber: employees.iqamaNumber,
          })
          .from(employees)
          .where(eq(employees.iqamaNumber, userRows[0].nationalId))
          .limit(1);
        
        console.log('National ID search results:', {
          foundCount: employeeRows.length,
          employees: employeeRows.map(emp => ({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            iqamaNumber: emp.iqamaNumber
          }))
        });
      }
    }

    if (employeeRows.length === 0) {
      return NextResponse.json({ 
        error: 'No employee record found for this user',
        documents: []
      }, { status: 404 });
    }

    const employee = employeeRows[0];

    // Get employee documents
    const documentRows = await db
      .select({
        id: employeeDocuments.id,
        documentType: employeeDocuments.documentType,
        fileName: employeeDocuments.fileName,
        filePath: employeeDocuments.filePath,
        description: employeeDocuments.description,
        fileSize: employeeDocuments.fileSize,
        mimeType: employeeDocuments.mimeType,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
      })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employee.id))
      .orderBy(employeeDocuments.createdAt);

    // Transform documents to include file type information
    const documents = documentRows.map(doc => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      filePath: ensureHttps(doc.filePath), // Force HTTPS to prevent Mixed Content errors
      description: doc.description || '',
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      isImage: doc.mimeType?.startsWith('image/') || false,
      isPhoto: doc.documentType?.toLowerCase().includes('photo') || 
               doc.documentType?.toLowerCase().includes('picture') ||
               doc.documentType?.toLowerCase().includes('image'),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        iqamaNumber: employee.iqamaNumber,
      },
      documents,
      totalDocuments: documents.length,
    });

  } catch (error) {
    console.error('Error fetching employee documents:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch employee documents',
      documents: []
    }, { status: 500 });
  }
}
