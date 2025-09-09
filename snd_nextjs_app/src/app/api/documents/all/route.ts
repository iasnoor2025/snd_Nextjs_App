import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees, equipment, equipmentDocuments } from '@/lib/drizzle/schema';
import { desc, eq, ilike, or, sql, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface Document {
  id: string | number;
  type: 'employee' | 'equipment';
  documentType: string;
  filePath: string;
  fileName: string;
  originalFileName?: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  employeeId?: number;
  employeeName?: string;
  employeeFileNumber?: string;
  equipmentId?: number;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  equipmentDoorNumber?: string;
  url: string;
  viewUrl?: string;
  searchableText: string;
  fileSizeFormatted?: string;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(_request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'employee', 'equipment'
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let employeeDocs: Document[] = [];
    let equipmentDocs: Document[] = [];

    // Fetch employee documents
    if (type === 'all' || type === 'employee') {
      const employeeQuery = db
        .select({
          id: employeeDocuments.id,
          documentType: employeeDocuments.documentType,
          filePath: employeeDocuments.filePath,
          fileName: employeeDocuments.fileName,
          fileSize: employeeDocuments.fileSize,
          mimeType: employeeDocuments.mimeType,
          description: employeeDocuments.description,
          createdAt: employeeDocuments.createdAt,
          updatedAt: employeeDocuments.updatedAt,
          employeeId: employeeDocuments.employeeId,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeFileNumber: employees.fileNumber,
        })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employees.id, employeeDocuments.employeeId));

      employeeQuery.where(
        search
          ? or(
              ilike(employees.firstName, `%${search}%`),
              ilike(employees.lastName, `%${search}%`),
              ilike(employees.fileNumber, `%${search}%`),
              ilike(employeeDocuments.fileName, `%${search}%`),
              ilike(employeeDocuments.documentType, `%${search}%`)
            )
          : sql`1=1` // Always true condition when no search
      );

      const employeeResults = await employeeQuery
        .orderBy(desc(employeeDocuments.createdAt)) // Now using proper timestamp ordering
        .limit(type === 'employee' ? limit : 1000) // Get more results if combining with other types
        .offset(type === 'employee' ? offset : 0);

      employeeDocs = employeeResults.map(doc => ({
        id: doc.id,
        type: 'employee' as const,
        documentType: doc.documentType,
        filePath: doc.filePath,
        fileName: doc.fileName,
        fileSize: doc.fileSize || 0,
        mimeType: doc.mimeType || 'application/octet-stream',
        description: doc.description || '',
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : (doc.createdAt as Date).toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : (doc.updatedAt as Date).toISOString(),
        employeeId: doc.employeeId,
        employeeName: `${doc.employeeFirstName || ''} ${doc.employeeLastName || ''}`.trim(),
        employeeFileNumber: doc.employeeFileNumber || '',
        url: (doc.filePath || '').replace(/^http:/, 'https:'), // Force HTTPS to prevent Mixed Content errors
        searchableText:
          `${doc.employeeFirstName || ''} ${doc.employeeLastName || ''} ${doc.employeeFileNumber || ''} ${doc.fileName} ${doc.documentType}`.toLowerCase(),
      }));
    }

    // Fetch equipment documents
    if (type === 'all' || type === 'equipment') {
      
      const equipmentQuery = db
        .select({
          id: equipmentDocuments.id,
          documentType: equipmentDocuments.documentType,
          fileName: equipmentDocuments.fileName,
          filePath: equipmentDocuments.filePath,
          fileSize: equipmentDocuments.fileSize,
          mimeType: equipmentDocuments.mimeType,
          description: equipmentDocuments.description,
          createdAt: equipmentDocuments.createdAt,
          updatedAt: equipmentDocuments.updatedAt,
          equipmentId: equipmentDocuments.equipmentId,
          equipmentName: equipment.name,
          equipmentModel: equipment.modelNumber,
          equipmentSerial: equipment.serialNumber,
          equipmentDoorNumber: equipment.doorNumber,
        })
        .from(equipmentDocuments)
        .leftJoin(equipment, eq(equipment.id, equipmentDocuments.equipmentId))
        .where(
          search
            ? or(
                ilike(equipment.name, `%${search}%`),
                ilike(equipment.modelNumber, `%${search}%`),
                ilike(equipment.serialNumber, `%${search}%`),
                ilike(equipment.doorNumber, `%${search}%`),
                ilike(equipmentDocuments.fileName, `%${search}%`),
                ilike(equipmentDocuments.documentType, `%${search}%`)
              )
            : sql`1=1` // Always true condition when no search
        );

      const equipmentResults = await equipmentQuery
        .orderBy(desc(equipmentDocuments.createdAt)) // Now using proper timestamp ordering
        .limit(type === 'equipment' ? limit : 1000) // Get more results if combining with other types
        .offset(type === 'equipment' ? offset : 0);

      equipmentDocs = equipmentResults.map(doc => ({
        id: doc.id,
        type: 'equipment' as const,
        documentType: doc.documentType,
        filePath: doc.filePath,
        fileName: doc.fileName,
        fileSize: doc.fileSize || 0,
        mimeType: doc.mimeType || 'application/octet-stream',
        description: doc.description || '',
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : (doc.createdAt as Date).toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : (doc.updatedAt as Date).toISOString(),
        equipmentId: doc.equipmentId,
        equipmentName: doc.equipmentName || '',
        equipmentModel: doc.equipmentModel || '',
        equipmentSerial: doc.equipmentSerial || '',
        equipmentDoorNumber: doc.equipmentDoorNumber || '',
        url: (doc.filePath || '').replace(/^http:/, 'https:'), // Force HTTPS to prevent Mixed Content errors
        searchableText:
          `${doc.equipmentName || ''} ${doc.equipmentModel || ''} ${doc.equipmentSerial || ''} ${doc.equipmentDoorNumber || ''} ${doc.fileName} ${doc.documentType}`.toLowerCase(),
      }));
    }

    // Combine and sort all documents
    let allDocuments = [...employeeDocs, ...equipmentDocs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Sort by creation date descending
    );

    // If only one type is requested, apply pagination to the combined results
    if (type === 'employee' || type === 'equipment') {
      // Pagination is already applied in the individual queries above
      // No additional pagination needed
    } else {
      // For 'all' type, we need to apply pagination to the combined results
      const startIndex = offset;
      const endIndex = startIndex + limit;
      allDocuments = allDocuments.slice(startIndex, endIndex);
    }

    // Get total counts for pagination
    let totalEmployeeDocs = 0;
    let totalEquipmentDocs = 0;

    if (type === 'all' || type === 'employee') {
      let employeeCountQuery;
      
      if (search) {
        // If searching, first get the employee IDs that match the search
        const matchingEmployeeIds = await db
          .select({ id: employees.id })
          .from(employees)
          .where(
            or(
              ilike(employees.firstName, `%${search}%`),
              ilike(employees.lastName, `%${search}%`),
              ilike(employees.fileNumber, `%${search}%`)
            )
          );
        
        const employeeIds = matchingEmployeeIds.map(e => e.id);
        
        // Then count documents that match either the employee IDs or the document fields
        employeeCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(employeeDocuments)
          .where(
            or(
              employeeIds.length > 0 ? inArray(employeeDocuments.employeeId, employeeIds) : undefined,
              ilike(employeeDocuments.fileName, `%${search}%`),
              ilike(employeeDocuments.documentType, `%${search}%`)
            )
          );
      } else {
        // If not searching, just count all employee documents directly
        employeeCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(employeeDocuments);
      }

      const employeeCountResult = await employeeCountQuery;
      totalEmployeeDocs = employeeCountResult[0]?.count || 0;
    }

    if (type === 'all' || type === 'equipment') {
      let equipmentCountQuery;
      
      if (search) {
        // If searching, first get the equipment IDs that match the search
        const matchingEquipmentIds = await db
          .select({ id: equipment.id })
          .from(equipment)
          .where(
            or(
              ilike(equipment.name, `%${search}%`),
              ilike(equipment.modelNumber, `%${search}%`),
              ilike(equipment.serialNumber, `%${search}%`),
              ilike(equipment.doorNumber, `%${search}%`)
            )
          );
        
        const equipmentIds = matchingEquipmentIds.map(e => e.id);
        
        // Then count documents that match either the equipment IDs or the document fields
        equipmentCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(equipmentDocuments)
          .where(
            or(
              equipmentIds.length > 0 ? inArray(equipmentDocuments.equipmentId, equipmentIds) : undefined,
              ilike(equipmentDocuments.fileName, `%${search}%`),
              ilike(equipmentDocuments.documentType, `%${search}%`)
            )
          );
      } else {
        // If not searching, just count all equipment documents directly
        equipmentCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(equipmentDocuments);
      }

      const equipmentCountResult = await equipmentCountQuery;
      totalEquipmentDocs = equipmentCountResult[0]?.count || 0;
    }

    const totalDocs = type === 'employee' ? totalEmployeeDocs : 
                     type === 'equipment' ? totalEquipmentDocs : 
                     totalEmployeeDocs + totalEquipmentDocs;

    // Format response to match what DocumentManager expects
    const formattedDocuments = allDocuments.map(doc => {
      // Create a user-friendly display name from the document type
      const displayName = doc.documentType
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      
      return {
        id: doc.id,
        name: displayName, // Use the friendly display name instead of filename
        file_name: doc.fileName || 'Unknown Document',
        file_type: doc.mimeType || 'application/octet-stream',
        size: doc.fileSize || 0,
        url: doc.filePath || '', // Use the Supabase URL directly
        mime_type: doc.mimeType || '',
        document_type: doc.documentType || '',
        description: doc.description || '',
        created_at: doc.createdAt || new Date().toISOString().split('T')[0],
        updated_at: doc.updatedAt || new Date().toISOString().split('T')[0],
        // Also include the original field names for backward compatibility
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        documentType: doc.documentType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        // Additional fields needed for DocumentManager
        typeLabel: displayName,
        employee_file_number: doc.employeeId, // Assuming employeeId is available in the doc object
      };
    });


    return NextResponse.json({
      success: true,
      data: {
        documents: formattedDocuments,
        pagination: {
          page,
          limit,
          total: totalDocs,
          totalPages: Math.ceil(totalDocs / limit),
          hasNext: page * limit < totalDocs,
          hasPrev: page > 1,
        },
        counts: {
          employee: totalEmployeeDocs,
          equipment: totalEquipmentDocs,
          total: totalDocs,
        },
      },
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
