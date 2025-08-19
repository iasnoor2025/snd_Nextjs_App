import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees, equipment, media } from '@/lib/drizzle/schema';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
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
        url: doc.filePath.startsWith('/') ? doc.filePath : `/uploads/documents/${doc.filePath}`,
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
        url: doc.filePath.startsWith('/') ? doc.filePath : `/uploads/documents/${doc.filePath}`,
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
      const employeeCountQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employees.id, employeeDocuments.employeeId))
        .where(
          search
            ? or(
                ilike(employees.firstName, `%${search}%`),
                ilike(employees.lastName, `%${search}%`),
                ilike(employees.fileNumber, `%${search}%`),
                ilike(employeeDocuments.fileName, `%${search}%`),
                ilike(employeeDocuments.documentType, `%${search}%`)
              )
            : undefined
        );

      const employeeCountResult = await employeeCountQuery;
      totalEmployeeDocs = employeeCountResult[0]?.count || 0;
    }

    if (type === 'all' || type === 'equipment') {
      const equipmentCountQuery = db
        .select({ count: sql<number>`count(*)` })
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

      const equipmentCountResult = await equipmentCountQuery;
      totalEquipmentDocs = equipmentCountResult[0]?.count || 0;
    }

    const totalDocs = totalEmployeeDocs + totalEquipmentDocs;

    return NextResponse.json({
      success: true,
      data: {
        documents: allDocuments,
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
