import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { db } from '@/lib/drizzle';
import { employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { cacheService } from '@/lib/redis/cache-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    console.log('Fetching documents from Supabase:', { type, search, limit, page });

    // Try to get from cache first (only for non-search queries to avoid cache fragmentation)
    if (!search && page === 1) {
      const cacheKey = `documents:${type}:${limit}`;
      const cachedDocuments = await cacheService.get(cacheKey, 'documents');
      
      if (cachedDocuments) {
        console.log(`Cache hit for documents: ${type}, limit: ${limit}`);
        return NextResponse.json(cachedDocuments);
      }
    }

    console.log(`Cache miss for documents, fetching from Supabase`);

    // Use static methods from SupabaseStorageService
    let allDocuments: any[] = [];

    try {
      // Fetch employee documents
      if (type === 'all' || type === 'employee') {
        console.log('Fetching employee documents from Supabase...');
        
        // Simple test: just list all files in employee-documents bucket
        try {
          const testResponse = await SupabaseStorageService.listFiles('employee-documents');
          console.log('TEST - All files in employee-documents bucket:', testResponse);
          
          if (testResponse.success && testResponse.files) {
            console.log('TEST - Found files:', testResponse.files.map(f => ({ name: f.name, size: f.size })));
          }
        } catch (error) {
          console.log('TEST - Error listing employee files:', error);
        }
        
        // Try to list files recursively from different paths
        let employeeFiles: any[] = [];
        
        // First try root level
        const rootResponse = await SupabaseStorageService.listFiles('employee-documents');
        console.log('Root employee response:', rootResponse);
        if (rootResponse.success && rootResponse.files) {
          employeeFiles.push(...rootResponse.files);
        }
        
        // Then try to find ALL employee folders dynamically (like we did for equipment)
        if (rootResponse.success && rootResponse.files) {
          const folders = rootResponse.files
            .filter(item => item.name.endsWith('/') || !item.name.includes('.'))
            .map(item => item.name.replace('/', ''));
          
          console.log('Found employee folders at root:', folders);
          
          // Check each folder for files
          for (const folder of folders) {
            try {
              console.log(`Checking employee folder: ${folder}`);
              const folderResponse = await SupabaseStorageService.listFiles('employee-documents', folder);
              console.log(`Folder ${folder} response:`, folderResponse);
              if (folderResponse.success && folderResponse.files) {
                employeeFiles.push(...folderResponse.files.map((f: any) => ({
                  ...f,
                  name: `${folder}/${f.name}` // Include folder in path
                })));
              }
            } catch (error) {
              console.log(`No files in employee folder ${folder}:`, error);
            }
          }
        }
        
        // Also try common subfolder patterns as fallback
        const commonSubfolders = ['employee-1', 'employee-2', 'employee-3', 'documents', 'files'];
        for (const subfolder of commonSubfolders) {
          try {
            console.log(`Checking common employee subfolder: ${subfolder}`);
            const subResponse = await SupabaseStorageService.listFiles('employee-documents', subfolder);
            console.log(`Common subfolder ${subfolder} response:`, subResponse);
            if (subResponse.success && subResponse.files) {
              // Only add if not already added
              const existingNames = employeeFiles.map(f => f.name);
              const newFiles = subResponse.files
                .filter(f => !existingNames.includes(`${subfolder}/${f.name}`))
                .map((f: any) => ({
                  ...f,
                  name: `${subfolder}/${f.name}` // Include subfolder in path
                }));
              employeeFiles.push(...newFiles);
            }
          } catch (error) {
            console.log(`No files in common employee subfolder ${subfolder}:`, error);
          }
        }
        
        console.log('Total employee files found (including all folders):', employeeFiles.length);
        console.log('Employee files:', employeeFiles.map(f => ({ name: f.name, size: f.size })));
        
        // Filter for actual files (not folders) and files with extensions
        const actualFiles = employeeFiles.filter((item: any) => {
          const hasExtension = item.name.includes('.');
          const notFolder = !item.name.endsWith('/');
          const hasSize = item.size > 0;
          console.log(`File ${item.name}: hasExtension=${hasExtension}, notFolder=${notFolder}, hasSize=${hasSize}, size=${item.size}`);
          // Only show actual files with content, not empty folder entries
          return hasExtension && notFolder && hasSize;
        });
          
        console.log('Actual employee files found:', actualFiles.length);
        
        // Process employee documents with database lookup
        const employeeDocuments = [];
        for (const item of actualFiles) {
          const fileName = item.name;
          
          // Parse the new descriptive filename format: "documenttype-context.extension"
          let documentType = 'document';
          let employeeId = 'unknown';
          let extractedEmployeeId = null;
          
          // Extract employee ID from the folder name (e.g., "employee-1" -> "1")
          if (fileName.includes('employee-')) {
            const match = fileName.match(/employee-(\d+)/);
            if (match) {
              extractedEmployeeId = parseInt(match[1]);
            }
          }
          
          // Parse the descriptive filename to extract document type and context
          if (fileName.includes('-')) {
            const parts = fileName.split('-');
            if (parts.length >= 2) {
              // Remove file extension from the last part
              const lastPart = parts[parts.length - 1].split('.')[0];
              documentType = parts[0] || 'document';
              
              // If we have more than 2 parts, the middle parts form the context
              if (parts.length > 2) {
                const contextParts = parts.slice(1, -1);
                employeeId = contextParts.join('-');
              } else {
                employeeId = lastPart;
              }
            }
          }
          
          // Fetch real employee data from database if we have an ID
          let employeeData = null;
          if (extractedEmployeeId) {
            try {
              employeeData = await db.select({
                id: employees.id,
                fileNumber: employees.fileNumber,
                firstName: employees.firstName,
                middleName: employees.middleName,
                lastName: employees.lastName,
              }).from(employees).where(eq(employees.id, extractedEmployeeId)).limit(1);
            } catch (error) {
              console.log(`Failed to fetch employee ${extractedEmployeeId}:`, error);
            }
          }
          
          // Use real employee data or fallback to extracted info
          const employee = employeeData?.[0];
          const employeeName = employee ? 
            `${employee.firstName} ${employee.middleName || ''} ${employee.lastName}`.trim() : 
            `Employee ${extractedEmployeeId || employeeId}`;
          const employeeFileNumber = employee?.fileNumber || `EMP${extractedEmployeeId || employeeId}`;
          
          // Infer file type from filename if no extension
          let mimeType = item.mime_type || 'application/octet-stream';
          if (fileName.includes('.pdf')) {
            mimeType = 'application/pdf';
          } else if (fileName.includes('.jpg') || fileName.includes('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (fileName.includes('.png')) {
            mimeType = 'image/png';
          } else if (fileName.includes('.doc') || fileName.includes('.docx')) {
            mimeType = 'application/msword';
          }
          
          // Format document type for display (capitalize and replace underscores)
          const displayDocumentType = documentType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          employeeDocuments.push({
            id: item.name, // Use the actual file path as ID instead of synthetic ID
            type: 'employee',
            documentType: displayDocumentType,
            filePath: item.name,
            fileName: fileName, // Use the actual descriptive filename
            originalFileName: fileName, // Keep original for reference
            fileSize: item.size || 0,
            fileSizeFormatted: formatFileSize(item.size || 0),
            mimeType: mimeType,
            description: `${displayDocumentType} document for ${employeeName}`,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            employeeId: extractedEmployeeId || parseInt(employeeId) || 1,
            employeeName: employeeName,
            employeeFileNumber: employeeFileNumber,
            url: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
            viewUrl: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
            searchableText: `${extractedEmployeeId || employeeId} ${displayDocumentType} ${fileName} ${employeeName}`.toLowerCase(),
          });
        }
        
        allDocuments.push(...employeeDocuments);
      }

      // Fetch equipment documents
      if (type === 'all' || type === 'equipment') {
        console.log('Fetching equipment documents from Supabase...');
        
        // Try to list files recursively from different paths
        let equipmentFiles: any[] = [];
        
        // First try root level
        const rootResponse = await SupabaseStorageService.listFiles('equipment-documents');
        console.log('Root equipment response:', rootResponse);
        if (rootResponse.success && rootResponse.files) {
          equipmentFiles.push(...rootResponse.files);
        }
        
        // Then try to find ALL equipment folders dynamically
        // First, let's see what folders exist at the root level
        if (rootResponse.success && rootResponse.files) {
          const folders = rootResponse.files
            .filter(item => item.name.endsWith('/') || !item.name.includes('.'))
            .map(item => item.name.replace('/', ''));
          
          console.log('Found equipment folders at root:', folders);
          
          // Check each folder for files
          for (const folder of folders) {
            try {
              console.log(`Checking equipment folder: ${folder}`);
              const folderResponse = await SupabaseStorageService.listFiles('equipment-documents', folder);
              console.log(`Folder ${folder} response:`, folderResponse);
              if (folderResponse.success && folderResponse.files) {
                equipmentFiles.push(...folderResponse.files.map((f: any) => ({
                  ...f,
                  name: `${folder}/${f.name}` // Include folder in path
                })));
              }
            } catch (error) {
              console.log(`No files in equipment folder ${folder}:`, error);
            }
          }
        }
        
        // Also try common subfolder patterns as fallback
        const commonSubfolders = ['equipment-1', 'equipment-119', 'equipment-120', 'documents', 'files'];
        for (const subfolder of commonSubfolders) {
          try {
            console.log(`Checking common subfolder: ${subfolder}`);
            const subResponse = await SupabaseStorageService.listFiles('equipment-documents', subfolder);
            console.log(`Common subfolder ${subfolder} response:`, subResponse);
            if (subResponse.success && subResponse.files) {
              // Only add if not already added
              const existingNames = equipmentFiles.map(f => f.name);
              const newFiles = subResponse.files
                .filter(f => !existingNames.includes(`${subfolder}/${f.name}`))
                .map((f: any) => ({
                  ...f,
                  name: `${subfolder}/${f.name}` // Include subfolder in path
                }));
              equipmentFiles.push(...newFiles);
            }
          } catch (error) {
            console.log(`No files in common subfolder ${subfolder}:`, error);
          }
        }
        
        console.log('Total equipment files found (including all folders):', equipmentFiles.length);
        console.log('Equipment files:', equipmentFiles.map(f => ({ name: f.name, size: f.size })));
        
        // Filter for actual files (not folders) and files with extensions
        const actualFiles = equipmentFiles.filter((item: any) => {
          const hasExtension = item.name.includes('.');
          const notFolder = !item.name.endsWith('/');
          const hasSize = item.size > 0;
          console.log(`File ${item.name}: hasExtension=${hasExtension}, notFolder=${notFolder}, hasSize=${hasSize}, size=${item.size}`);
          // Only show actual files with content, not empty folder entries
          return hasExtension && notFolder && hasSize;
        });
          
        console.log('Actual equipment files found:', actualFiles.length);
        
        const equipmentDocuments = actualFiles.map((item: any) => {
          const fileName = item.name;
          
          // Parse the new descriptive filename format: "documenttype-context.extension"
          let documentType = 'document';
          let equipmentId = 'unknown';
          
          // Extract equipment ID from the folder name first (e.g., "equipment-1" -> "1", "equipment-119" -> "119")
          let extractedEquipmentId = null;
          if (fileName.includes('equipment-')) {
            const match = fileName.match(/equipment-(\d+)/);
            if (match) {
              extractedEquipmentId = parseInt(match[1]);
              equipmentId = extractedEquipmentId.toString();
            }
          }
          
          // Parse the descriptive filename to extract document type and context
          if (fileName.includes('-')) {
            const parts = fileName.split('-');
            if (parts.length >= 2) {
              // Remove file extension from the last part
              const lastPart = parts[parts.length - 1].split('.')[0];
              documentType = parts[0] || 'document';
              
              // If we have more than 2 parts, the middle parts form the context
              if (parts.length > 2) {
                const contextParts = parts.slice(1, -1);
                equipmentId = contextParts.join('-');
              } else {
                equipmentId = lastPart;
              }
            }
          }
          
          // Infer file type from filename if no extension
          let mimeType = item.mime_type || 'application/octet-stream';
          if (fileName.includes('.pdf')) {
            mimeType = 'application/pdf';
          } else if (fileName.includes('.jpg') || fileName.includes('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (fileName.includes('.png')) {
            mimeType = 'image/png';
          } else if (fileName.includes('.doc') || fileName.includes('.docx')) {
            mimeType = 'application/msword';
          }
          
          // Format document type for display (capitalize and replace underscores)
          const displayDocumentType = documentType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          
          return {
            id: item.name, // Use the actual file path as ID instead of synthetic ID
            type: 'equipment',
            documentType: displayDocumentType,
            filePath: item.name,
            fileName: fileName, // Use the actual descriptive filename
            originalFileName: fileName, // Keep original for reference
            fileSize: item.size || 0,
            fileSizeFormatted: formatFileSize(item.size || 0),
            mimeType: mimeType,
            description: `${displayDocumentType} document for equipment ${equipmentId}`,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            equipmentId: extractedEquipmentId || parseInt(equipmentId) || 119,
            equipmentName: `Equipment ${equipmentId}`,
            equipmentModel: `Model ${equipmentId}`,
            equipmentSerial: `SN${equipmentId}`,
            url: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
            viewUrl: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
            searchableText: `${equipmentId} ${documentType} ${fileName}`.toLowerCase(),
          };
        });
        
        allDocuments.push(...equipmentDocuments);
      }

      console.log('Total documents fetched from Supabase:', allDocuments.length);

    } catch (supabaseError) {
      console.error('Error fetching from Supabase:', supabaseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch documents from Supabase',
        details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Filter by search term if provided
    let filteredDocuments = allDocuments;
    if (search) {
      filteredDocuments = allDocuments.filter(doc => 
        doc.searchableText.includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by type if specified
    if (type !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.type === type);
    }

    // Sort by creation date
    filteredDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const totalDocs = filteredDocuments.length;
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    const employeeCount = filteredDocuments.filter(doc => doc.type === 'employee').length;
    const equipmentCount = filteredDocuments.filter(doc => doc.type === 'equipment').length;

    const responseData = {
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
          employee: employeeCount,
          equipment: equipmentCount,
          total: totalDocs,
        },
      },
    };

    // Cache the response for non-search queries (only first page to avoid cache fragmentation)
    if (!search && page === 1) {
      const cacheKey = `documents:${type}:${limit}`;
      await cacheService.set(cacheKey, responseData, {
        ttl: 300, // 5 minutes
        prefix: 'documents',
        tags: ['documents', type]
      });
      console.log(`Cached documents response for ${type}, limit: ${limit}`);
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in documents API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
