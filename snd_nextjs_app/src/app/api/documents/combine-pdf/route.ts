import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees, equipment, media } from '@/lib/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { DocumentCombinerService } from '@/lib/services/document-combiner-service';

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await _request.json();
    const { documentIds, type = 'all' } = body;

    console.log('Combine PDF request:', { documentIds, type });

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    const documents: Array<{
      id: number;
      name: string;
      url: string;
      type: string;
      fileName: string;
      filePath: string;
      mimeType: string;
    }> = [];

    // Fetch employee documents
    if (type === 'all' || type === 'employee') {
      console.log('Fetching employee documents with IDs:', documentIds);
      const employeeDocs = await db
        .select({
          id: employeeDocuments.id,
          documentType: employeeDocuments.documentType,
          filePath: employeeDocuments.filePath,
          fileName: employeeDocuments.fileName,
          fileSize: employeeDocuments.fileSize,
          mimeType: employeeDocuments.mimeType,
          description: employeeDocuments.description,
          createdAt: employeeDocuments.createdAt,
          employeeId: employeeDocuments.employeeId,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          employeeFileNumber: employees.fileNumber,
        })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employees.id, employeeDocuments.employeeId))
        .where(inArray(employeeDocuments.id, documentIds));

      console.log('Found employee documents:', employeeDocs.length);

      documents.push(
        ...employeeDocs.map(doc => ({
          ...doc,
          type: 'employee',
          name: doc.fileName,
          url: (doc.filePath || '').replace(/^http:/, 'https:'), // Force HTTPS to prevent Mixed Content errors
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
          employeeName: `${doc.employeeFirstName || ''} ${doc.employeeLastName || ''}`.trim(),
          employeeFileNumber: doc.employeeFileNumber,
        }))
      );
    }

    // Fetch equipment documents
    if (type === 'all' || type === 'equipment') {
      console.log('Fetching equipment documents with IDs:', documentIds);
      const equipmentDocs = await db
        .select({
          id: media.id,
          fileName: media.fileName,
          filePath: media.filePath,
          fileSize: media.fileSize,
          mimeType: media.mimeType,
          createdAt: media.createdAt,
          modelId: media.modelId,
          equipmentName: equipment.name,
          equipmentModel: equipment.modelNumber,
          equipmentSerial: equipment.serialNumber,
        })
        .from(media)
        .leftJoin(equipment, eq(equipment.id, media.modelId))
        .where(inArray(media.id, documentIds));

      console.log('Found equipment documents:', equipmentDocs.length);

      documents.push(
        ...equipmentDocs.map(doc => ({
          ...doc,
          type: 'equipment',
          name: doc.fileName,
          url: doc.filePath, // This should be the file path, not the full URL
          fileName: doc.fileName,
          filePath: doc.filePath,
          mimeType: doc.mimeType,
          equipmentName: doc.equipmentName,
          equipmentModel: doc.equipmentModel,
          equipmentSerial: doc.equipmentSerial,
        }))
      );
    }

    console.log('Total documents found:', documents.length);
    console.log('Document details:', documents.map(d => ({ id: d.id, name: d.name, type: d.type, url: d.url })));

    if (documents.length === 0) {
      return NextResponse.json({ 
        error: 'No documents found for the provided IDs',
        debug: {
          requestedIds: documentIds,
          type: type,
          message: 'Check if document IDs exist in the database and match the correct type'
        }
      }, { status: 404 });
    }

    // Generate combined PDF using the document combiner service
    const combinedPdfBuffer = await DocumentCombinerService.combineDocuments(documents);

    // Generate descriptive filename with employee numbers and equipment names
    const timestamp = Date.now();
    const filename = generateDescriptiveFilename(documents, timestamp);

    console.log('Generated combined PDF, size:', combinedPdfBuffer.length, 'filename:', filename);

    // Return the PDF data directly for download (no file saving)
    return new NextResponse(combinedPdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': combinedPdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Combine PDF error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to combine documents: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Generates a descriptive filename based on the documents being combined
 */
function generateDescriptiveFilename(documents: any[], timestamp: number): string {
  const employeeNumbers = new Set<string>();
  const equipmentNames = new Set<string>();

  documents.forEach(doc => {
    if (doc.type === 'employee' && doc.employeeFileNumber) {
      employeeNumbers.add(doc.employeeFileNumber);
    } else if (doc.type === 'equipment' && doc.equipmentName) {
      equipmentNames.add(doc.equipmentName);
    }
  });

  let filename = '';

  // Add employee numbers
  if (employeeNumbers.size > 0) {
    filename += `employee_${Array.from(employeeNumbers).join('_')}`;
  }

  // Add equipment names
  if (equipmentNames.size > 0) {
    if (filename) filename += '_';
    filename += `equipment_${Array.from(equipmentNames).join('_')}`;
  }

  // If no descriptive info, use generic name
  if (!filename) {
    filename = 'documents';
  }

  // Add timestamp and extension
  filename += `_combined_${timestamp}.pdf`;

  // Clean filename (remove special characters, replace spaces with underscores)
  filename = filename.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');

  return filename;
}
