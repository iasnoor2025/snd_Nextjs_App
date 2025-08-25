import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'employee', 'equipment'
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    let allDocuments: any[] = [];
    let totalEmployeeDocs = 0;
    let totalEquipmentDocs = 0;

    // Fetch employee documents from Supabase
    if (type === 'all' || type === 'employee') {
      try {
        const employeeResult = await SupabaseStorageService.listFiles('employee-documents');
        if (employeeResult.success && employeeResult.files) {
          const employeeDocs = employeeResult.files.map(file => {
            // Extract employee ID from path (e.g., "employee-123/document.pdf" -> "123")
            const pathParts = file.path.split('/');
            const employeeId = pathParts[0]?.replace('employee-', '') || '0';
            
            // Extract document type from filename (e.g., "iqama_1234567890.pdf" -> "iqama")
            const fileNameParts = file.name.split('_');
            const documentType = fileNameParts[0] || 'document';
            
            // Create user-friendly display name
            const displayName = documentType
              .replace(/_/g, ' ')
              .replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

            // Construct the proper Supabase public URL
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong.snd-ksa.online';
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/employee-documents/${file.path}`;

            return {
              id: file.id || file.name,
              type: 'employee',
              documentType: documentType,
              filePath: file.path,
              fileName: displayName,
              originalFileName: file.name,
              fileSize: file.size || 0,
              mimeType: file.mime_type || 'application/octet-stream',
              description: '',
              createdAt: file.created_at || new Date().toISOString(),
              updatedAt: file.updated_at || new Date().toISOString(),
              employeeId: parseInt(employeeId) || 0,
              employeeName: `Employee ${employeeId}`,
              employeeFileNumber: employeeId,
              url: publicUrl,
              viewUrl: publicUrl,
              searchableText: `${employeeId} ${displayName} ${documentType}`.toLowerCase(),
            };
          });

          // Filter by search term if provided
          const filteredEmployeeDocs = search 
            ? employeeDocs.filter(doc => 
                doc.searchableText.includes(search.toLowerCase()) ||
                doc.employeeFileNumber.toString().includes(search) ||
                doc.fileName.toLowerCase().includes(search.toLowerCase())
              )
            : employeeDocs;

          allDocuments.push(...filteredEmployeeDocs);
          totalEmployeeDocs = filteredEmployeeDocs.length;
        }
      } catch (error) {
        console.error('Error fetching employee documents from Supabase:', error);
      }
    }

    // Fetch equipment documents from Supabase
    if (type === 'all' || type === 'equipment') {
      try {
        const equipmentResult = await SupabaseStorageService.listFiles('equipment-documents');
        if (equipmentResult.success && equipmentResult.files) {
          const equipmentDocs = equipmentResult.files.map(file => {
            // Extract equipment ID from path (e.g., "equipment-456/document.pdf" -> "456")
            const pathParts = file.path.split('/');
            const equipmentId = pathParts[0]?.replace('equipment-', '') || '0';
            
            // Extract document type from filename
            const fileNameParts = file.name.split('_');
            const documentType = fileNameParts[0] || 'equipment_document';
            
            // Create user-friendly display name
            const displayName = documentType
              .replace(/_/g, ' ')
              .replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

            // Construct the proper Supabase public URL
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong.snd-ksa.online';
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/equipment-documents/${file.path}`;

            return {
              id: file.id || file.name,
              type: 'equipment',
              documentType: documentType,
              filePath: file.path,
              fileName: displayName,
              originalFileName: file.name,
              fileSize: file.size || 0,
              mimeType: file.mime_type || 'application/octet-stream',
              description: '',
              createdAt: file.created_at || new Date().toISOString(),
              updatedAt: file.updated_at || new Date().toISOString(),
              equipmentId: parseInt(equipmentId) || 0,
              equipmentName: `Equipment ${equipmentId}`,
              equipmentModel: '',
              equipmentSerial: '',
              url: publicUrl,
              viewUrl: publicUrl,
              searchableText: `${equipmentId} ${displayName} ${documentType}`.toLowerCase(),
            };
          });

          // Filter by search term if provided
          const filteredEquipmentDocs = search 
            ? equipmentDocs.filter(doc => 
                doc.searchableText.includes(search.toLowerCase()) ||
                doc.equipmentId.toString().includes(search) ||
                doc.fileName.toLowerCase().includes(search.toLowerCase())
              )
            : equipmentDocs;

          allDocuments.push(...filteredEquipmentDocs);
          totalEquipmentDocs = filteredEquipmentDocs.length;
        }
      } catch (error) {
        console.error('Error fetching equipment documents from Supabase:', error);
      }
    }

    // Sort all documents by creation date
    allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const totalDocs = allDocuments.length;
    const paginatedDocuments = allDocuments.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        documents: paginatedDocuments,
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
    console.error('Error fetching documents from Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents from Supabase: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}
