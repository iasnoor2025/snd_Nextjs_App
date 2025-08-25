import { authOptions } from '@/lib/auth-config';
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

    console.log('Combine PDF Supabase request:', { documentIds, type });

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    // For Supabase, we need to fetch the documents from the Supabase API first
    // to get their URLs and metadata
    const documents: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      fileName: string;
      filePath: string;
      mimeType: string;
      employeeName?: string;
      employeeFileNumber?: string;
      equipmentName?: string;
      equipmentModel?: string;
      equipmentSerial?: string;
    }> = [];

    try {
      // Fetch documents from Supabase API
      const response = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/documents/supabase?limit=1000&type=${type}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.data.documents) {
        throw new Error('Invalid response from documents API');
      }

      // Filter documents by the requested IDs
      const allDocuments = data.data.documents;
      const requestedDocuments = allDocuments.filter((doc: any) => 
        documentIds.includes(doc.id)
      );

      console.log('Found requested documents:', requestedDocuments.length);

      // Transform documents to the format expected by DocumentCombinerService
      documents.push(...requestedDocuments.map((doc: any) => ({
        id: doc.id,
        type: doc.type,
        name: doc.fileName,
        url: doc.url, // This is the Supabase public URL
        fileName: doc.fileName,
        filePath: doc.filePath,
        mimeType: doc.mimeType,
        employeeName: doc.employeeName,
        employeeFileNumber: doc.employeeFileNumber,
        equipmentName: doc.equipmentName,
        equipmentModel: doc.equipmentModel,
        equipmentSerial: doc.equipmentSerial,
      })));

    } catch (fetchError) {
      console.error('Error fetching documents from Supabase API:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch documents from Supabase',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        }, 
        { status: 500 }
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
          message: 'Check if document IDs exist in Supabase storage and match the correct type'
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
    console.error('Combine PDF Supabase error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to combine documents: ' + (error instanceof Error ? error.message : 'Unknown error'),
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
