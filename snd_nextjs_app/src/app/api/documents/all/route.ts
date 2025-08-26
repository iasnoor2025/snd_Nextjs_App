import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees, equipment, media } from '@/lib/drizzle/schema';
import { and, desc, eq, ilike, or, sql, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

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

    let employeeDocs: any[] = [];
    let equipmentDocs: any[] = [];

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

      if (search) {
        employeeQuery.where(
          or(
            ilike(employees.firstName, `%${search}%`),
            ilike(employees.lastName, `%${search}%`),
            ilike(employees.fileNumber, `%${search}%`),
            ilike(employeeDocuments.fileName, `%${search}%`),
            ilike(employeeDocuments.documentType, `%${search}%`)
          )
        );
      }

      const employeeResults = await employeeQuery
        .orderBy(desc(employeeDocuments.createdAt))
        .limit(limit)
        .offset(offset);

      employeeDocs = employeeResults.map(doc => ({
        id: doc.id,
        type: 'employee',
        documentType: doc.documentType,
        filePath: doc.filePath,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        employeeId: doc.employeeId,
        employeeName: `${doc.employeeFirstName || ''} ${doc.employeeLastName || ''}`.trim(),
        employeeFileNumber: doc.employeeFileNumber,
        url: (doc.filePath || '').replace(/^http:/, 'https:'), // Force HTTPS to prevent Mixed Content errors
        searchableText:
          `${doc.employeeFirstName || ''} ${doc.employeeLastName || ''} ${doc.employeeFileNumber || ''} ${doc.fileName} ${doc.documentType}`.toLowerCase(),
      }));
    }

    // Fetch equipment documents
    if (type === 'all' || type === 'equipment') {
      
      const equipmentQuery = db
        .select({
          id: media.id,
          fileName: media.fileName,
          filePath: media.filePath,
          fileSize: media.fileSize,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
          updatedAt: media.updatedAt,
          modelId: media.modelId,
          equipmentName: equipment.name,
          equipmentModel: equipment.modelNumber,
          equipmentSerial: equipment.serialNumber,
        })
        .from(media)
        .leftJoin(equipment, eq(equipment.id, media.modelId))
        .where(
          search
            ? and(
                eq(media.modelType, 'Equipment'),
                or(
                  ilike(equipment.name, `%${search}%`),
                  ilike(equipment.modelNumber, `%${search}%`),
                  ilike(equipment.serialNumber, `%${search}%`),
                  ilike(media.fileName, `%${search}%`)
                )
              )
            : eq(media.modelType, 'Equipment')
        );

      const equipmentResults = await equipmentQuery
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset);

      equipmentDocs = equipmentResults.map(doc => ({
        id: doc.id,
        type: 'equipment',
        documentType: 'equipment_document',
        filePath: doc.filePath,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: '',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        equipmentId: doc.modelId,
        equipmentName: doc.equipmentName,
        equipmentModel: doc.equipmentModel,
        equipmentSerial: doc.equipmentSerial,
        url: (doc.filePath || '').replace(/^http:/, 'https:'), // Force HTTPS to prevent Mixed Content errors
        searchableText:
          `${doc.equipmentName || ''} ${doc.equipmentModel || ''} ${doc.equipmentSerial || ''} ${doc.fileName}`.toLowerCase(),
      }));
    }

    // Combine and sort all documents
    const allDocuments = [...employeeDocs, ...equipmentDocs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
              ilike(equipment.serialNumber, `%${search}%`)
            )
          );
        
        const equipmentIds = matchingEquipmentIds.map(e => e.id);
        
        // Then count documents that match either the equipment IDs or the document fields
        equipmentCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(media)
          .where(
            and(
              eq(media.modelType, 'Equipment'),
              or(
                equipmentIds.length > 0 ? inArray(media.modelId, equipmentIds) : undefined,
                ilike(media.fileName, `%${search}%`)
              )
            )
          );
      } else {
        // If not searching, just count all equipment documents directly
        equipmentCountQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(media)
          .where(eq(media.modelType, 'Equipment'));
      }

      const equipmentCountResult = await equipmentCountQuery;
      totalEquipmentDocs = equipmentCountResult[0]?.count || 0;
    }

    const totalDocs = totalEmployeeDocs + totalEquipmentDocs;

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
        created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
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
