import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { db } from '@/lib/drizzle';
import { employees, equipment } from '@/lib/drizzle/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { cacheService } from '@/lib/redis/cache-service';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export with permission checks
export const GET = withPermission(PermissionConfigs.document.read)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
         const limit = parseInt(searchParams.get('limit') || '10');
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
            console.log(`No files in common subfolder ${subfolder}:`, error);
          }
        }

        // Process employee files - Bulk fetch employee data first
        console.log('All employee files before filtering:', employeeFiles);
        
        const validEmployeeFiles = employeeFiles.filter(item => item.name && !item.name.endsWith('/') && item.name.includes('.'));
        console.log('Valid employee files (with extensions):', validEmployeeFiles);
        
                 const employeeIds = [...new Set(
           validEmployeeFiles
             .map(item => {
               const pathParts = item.name.split('/');
               const firstPart = pathParts[0];
               // Extract ID from "employee-214" format
               const idMatch = firstPart.match(/employee-(\d+)/);
               const parsedId = idMatch ? parseInt(idMatch[1]) : 0;
               console.log(`File: ${item.name}, Path parts: ${pathParts}, First part: ${firstPart}, Parsed ID: ${parsedId}`);
               return parsedId;
             })
             .filter(id => id > 0)
         )];
        
        console.log('Employee IDs found in file paths:', employeeIds);
        console.log('Employee files:', employeeFiles.map(f => f.name));
        
        let employeeDataMap = new Map();
        
        // First, let's check if there are any employees in the database at all
        try {
          const totalEmployees = await db
            .select({ count: sql`count(*)` })
            .from(employees);
          console.log('Total employees in database:', totalEmployees[0]?.count);
          
          // Also get a sample of employees to see their IDs
          const sampleEmployees = await db
            .select({
              id: employees.id,
              firstName: employees.firstName,
              lastName: employees.lastName,
              fileNumber: employees.fileNumber,
            })
            .from(employees)
            .limit(5);
          console.log('Sample employees from database:', sampleEmployees);
        } catch (error) {
          console.error('Error checking database for employees:', error);
        }
        
        if (employeeIds.length > 0) {
          try {
            // Try to get from cache first
            const cacheKey = `employees:${employeeIds.sort().join(',')}`;
            let employeeData: any = await cacheService.get(cacheKey, 'employees');
            
            if (!employeeData) {
              console.log('Fetching employee data from database for IDs:', employeeIds);
              // Fetch from database if not in cache
              employeeData = await db
                .select({
                  id: employees.id,
                  firstName: employees.firstName,
                  lastName: employees.lastName,
                  fileNumber: employees.fileNumber,
                })
                .from(employees)
                .where(inArray(employees.id, employeeIds));
              
              console.log('Employee data fetched from database:', employeeData);
              
              // Cache for 5 minutes
              await cacheService.set(cacheKey, employeeData, { prefix: 'employees', ttl: 300 });
            } else {
              console.log('Employee data found in cache:', employeeData);
            }
            
            employeeData.forEach((emp: any) => {
              const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Employee';
              const employeeFileNumber = emp.fileNumber || 'No File #';
              console.log(`Setting employee ${emp.id}: ${employeeName} (${employeeFileNumber})`);
              employeeDataMap.set(emp.id, {
                name: employeeName,
                fileNumber: employeeFileNumber
              });
            });
            
            console.log('Final employee data map:', Object.fromEntries(employeeDataMap));
          } catch (error) {
            console.error('Error fetching employee data:', error);
          }
        } else {
          console.log('No valid employee IDs found in file paths');
        }
        
                 const employeeDocuments = employeeFiles
           .filter(item => item.name && !item.name.endsWith('/') && item.name.includes('.'))
           .map((item, index) => {
             const fileName = item.name.split('/').pop() || item.name;
             const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
             // Extract ID from "employee-214" format
             const firstPart = item.name.split('/')[0];
             const idMatch = firstPart.match(/employee-(\d+)/);
             const employeeId = idMatch ? parseInt(idMatch[1]) : 0;
            
            // Get employee data from the map
            console.log(`Processing document for employee ID: ${employeeId}`);
            console.log(`Available employee IDs in map:`, Array.from(employeeDataMap.keys()));
            const employeeInfo = employeeDataMap.get(employeeId) || {
              name: 'Unknown Employee',
              fileNumber: 'No File #'
            };
            console.log(`Employee info for ID ${employeeId}:`, employeeInfo);
            
            // Determine correct MIME type
            let mimeType = 'application/octet-stream';
            if (['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'SVG'].includes(documentType)) {
              mimeType = `image/${documentType.toLowerCase()}`;
            } else if (documentType === 'PDF') {
              mimeType = 'application/pdf';
            } else if (['DOC', 'DOCX'].includes(documentType)) {
              mimeType = 'application/msword';
            } else if (['XLS', 'XLSX'].includes(documentType)) {
              mimeType = 'application/vnd.ms-excel';
            }
            
            return {
              id: `emp_${employeeId}_${Date.now()}_${index}`,
              type: 'employee' as const,
              documentType,
              filePath: item.name,
              fileName,
              originalFileName: fileName,
              fileSize: item.size || 0,
              mimeType,
              description: `Employee document for ${employeeInfo.name}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              employeeId,
              employeeName: employeeInfo.name,
              employeeFileNumber: employeeInfo.fileNumber,
              url: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
              viewUrl: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
              searchableText: `${employeeInfo.name} ${employeeInfo.fileNumber} ${documentType} ${fileName}`.toLowerCase(),
            };
          });
        
        allDocuments.push(...employeeDocuments);
      }

      // Fetch equipment documents
      if (type === 'all' || type === 'equipment') {
        console.log('Fetching equipment documents from Supabase...');
        
        try {
          const equipmentResponse = await SupabaseStorageService.listFiles('equipment-documents');
          console.log('Equipment documents response:', equipmentResponse);
          
          if (equipmentResponse.success && equipmentResponse.files) {
                        // Bulk fetch equipment data first
            const equipmentIds = [...new Set(
              equipmentResponse.files
                .filter(item => item.name && !item.name.endsWith('/') && item.name.includes('.'))
                .map(item => parseInt(item.name.split('/')[0]) || 0)
                .filter(id => id > 0)
            )];
            
            let equipmentDataMap = new Map();
            if (equipmentIds.length > 0) {
              try {
                // Try to get from cache first
                const cacheKey = `equipment:${equipmentIds.sort().join(',')}`;
                let equipmentData: any = await cacheService.get(cacheKey, 'equipment');
                
                if (!equipmentData) {
                  // Fetch from database if not in cache
                  equipmentData = await db
                    .select({
                      id: equipment.id,
                      name: equipment.name,
                      modelNumber: equipment.modelNumber,
                      serialNumber: equipment.serialNumber,
                    })
                    .from(equipment)
                    .where(inArray(equipment.id, equipmentIds));
                  
                  // Cache for 5 minutes
                  await cacheService.set(cacheKey, equipmentData, { prefix: 'equipment', ttl: 300 });
                }
                
                equipmentData.forEach((eq: any) => {
                  equipmentDataMap.set(eq.id, {
                    name: eq.name || 'Unknown Equipment',
                    modelNumber: eq.modelNumber || 'No Model',
                    serialNumber: eq.serialNumber || 'No Serial'
                  });
                });
              } catch (error) {
                console.error('Error fetching equipment data:', error);
              }
            }
            
            const equipmentDocuments = equipmentResponse.files
              .filter(item => item.name && !item.name.endsWith('/') && item.name.includes('.'))
              .map((item, index) => {
                const fileName = item.name.split('/').pop() || item.name;
                const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
                const equipmentId = parseInt(item.name.split('/')[0]) || 0;
                
                // Get equipment data from the map
                const equipmentInfo = equipmentDataMap.get(equipmentId) || {
                  name: 'Unknown Equipment',
                  modelNumber: 'No Model',
                  serialNumber: 'No Serial'
                };
                
                // Determine correct MIME type
                let mimeType = 'application/octet-stream';
                if (['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'SVG'].includes(documentType)) {
                  mimeType = `image/${documentType.toLowerCase()}`;
                } else if (documentType === 'PDF') {
                  mimeType = 'application/pdf';
                } else if (['DOC', 'DOCX'].includes(documentType)) {
                  mimeType = 'application/msword';
                } else if (['XLS', 'XLSX'].includes(documentType)) {
                  mimeType = 'application/vnd.ms-excel';
                }
                
                return {
                  id: `eqp_${equipmentId}_${Date.now()}_${index}`,
                  type: 'equipment' as const,
                  documentType,
                  filePath: item.name,
                  fileName,
                  originalFileName: fileName,
                  fileSize: item.size || 0,
                  mimeType,
                  description: `Equipment document for ${equipmentInfo.name}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  equipmentId,
                  equipmentName: equipmentInfo.name,
                  equipmentModel: equipmentInfo.modelNumber,
                  equipmentSerial: equipmentInfo.serialNumber,
                  url: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
                  viewUrl: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
                  searchableText: `${equipmentInfo.name} ${equipmentInfo.modelNumber} ${equipmentInfo.serialNumber} ${documentType} ${fileName}`.toLowerCase(),
                };
              });
            
            allDocuments.push(...equipmentDocuments);
          }
        } catch (error) {
          console.log('No equipment documents found:', error);
        }
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

    // Server-side search: Only fetch and process documents that match the search criteria
    let filteredDocuments: any[] = [];
    let totalDocs = 0;
    let employeeCount = 0;
    let equipmentCount = 0;

    if (search) {
      console.log(`Performing server-side search for: "${search}"`);
      
      // Search in employee documents first
      if (type === 'all' || type === 'employee') {
        const searchLower = search.toLowerCase();
        
        // Get employees matching search criteria
        let searchableEmployees: any[] = [];
        try {
          searchableEmployees = await db
            .select({
              id: employees.id,
              firstName: employees.firstName,
              lastName: employees.lastName,
              fileNumber: employees.fileNumber,
            })
            .from(employees)
            .where(
              sql`LOWER(${employees.firstName} || ' ' || ${employees.lastName}) LIKE ${`%${searchLower}%`} OR 
                  LOWER(${employees.fileNumber}) LIKE ${`%${searchLower}%`}`
            )
            .limit(50); // Limit employee search results
          
          console.log(`Found ${searchableEmployees.length} employees matching search: "${search}"`);
        } catch (error) {
          console.error('Error searching employees:', error);
        }

        // Only process files for matching employees
        if (searchableEmployees.length > 0) {
          const employeeIds = searchableEmployees.map(emp => emp.id);
          const employeeDataMap = new Map();
          
          searchableEmployees.forEach((emp: any) => {
            const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Employee';
            const employeeFileNumber = emp.fileNumber || 'No File #';
            employeeDataMap.set(emp.id, {
              name: employeeName,
              fileNumber: employeeFileNumber
            });
          });

          // Get employee files and filter by matching employees
          try {
            const employeeResponse = await SupabaseStorageService.listFiles('employee-documents');
            if (employeeResponse.success && employeeResponse.files) {
                             // Process only files for matching employees
               const matchingEmployeeFiles = employeeResponse.files.filter(item => {
                 if (!item.name || item.name.endsWith('/') || !item.name.includes('.')) return false;
                 
                 const folderName = item.name.split('/')[0];
                 // Extract ID from "employee-214" format
                 const idMatch = folderName.match(/employee-(\d+)/);
                 if (idMatch) {
                   const employeeId = parseInt(idMatch[1]);
                   return employeeIds.includes(employeeId);
                 }
                 return false;
               });

              console.log(`Processing ${matchingEmployeeFiles.length} files for matching employees`);

                             const employeeDocuments = matchingEmployeeFiles.map((item, index) => {
                 const fileName = item.name.split('/').pop() || item.name;
                 const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
                 const folderName = item.name.split('/')[0];
                 // Extract ID from "employee-214" format
                 const idMatch = folderName.match(/employee-(\d+)/);
                 const employeeId = idMatch ? parseInt(idMatch[1]) : 0;
                const employeeInfo = employeeDataMap.get(employeeId) || {
                  name: 'Unknown Employee',
                  fileNumber: 'No File #'
                };

                // Determine MIME type
                let mimeType = 'application/octet-stream';
                if (['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'SVG'].includes(documentType)) {
                  mimeType = `image/${documentType.toLowerCase()}`;
                } else if (documentType === 'PDF') {
                  mimeType = 'application/pdf';
                } else if (['DOC', 'DOCX'].includes(documentType)) {
                  mimeType = 'application/msword';
                } else if (['XLS', 'XLSX'].includes(documentType)) {
                  mimeType = 'application/vnd.ms-excel';
                }

                return {
                  id: `emp_${employeeId}_${Date.now()}_${index}`,
                  type: 'employee' as const,
                  documentType,
                  filePath: item.name,
                  fileName,
                  originalFileName: fileName,
                  fileSize: item.size || 0,
                  mimeType,
                  description: `Employee document for ${employeeInfo.name}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  employeeId,
                  employeeName: employeeInfo.name,
                  employeeFileNumber: employeeInfo.fileNumber,
                  url: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
                  viewUrl: SupabaseStorageService.getPublicUrl('employee-documents', item.name),
                  searchableText: `${employeeInfo.name} ${employeeInfo.fileNumber} ${documentType} ${fileName}`.toLowerCase(),
                };
              });

              filteredDocuments.push(...employeeDocuments);
              employeeCount = employeeDocuments.length;
            }
          } catch (error) {
            console.error('Error processing employee files:', error);
          }
        }
      }

      // Search in equipment documents
      if (type === 'all' || type === 'equipment') {
        const searchLower = search.toLowerCase();
        
        // Get equipment matching search criteria
        let searchableEquipment: any[] = [];
        try {
          searchableEquipment = await db
            .select({
              id: equipment.id,
              name: equipment.name,
              modelNumber: equipment.modelNumber,
              serialNumber: equipment.serialNumber,
              doorNumber: equipment.doorNumber,
            })
            .from(equipment)
            .where(
              sql`LOWER(${equipment.name}) LIKE ${`%${searchLower}%`} OR 
                  LOWER(${equipment.modelNumber}) LIKE ${`%${searchLower}%`} OR
                  LOWER(${equipment.serialNumber}) LIKE ${`%${searchLower}%`} OR
                  LOWER(${equipment.doorNumber}) LIKE ${`%${searchLower}%`}`
            )
            .limit(50); // Limit equipment search results
          
          console.log(`Found ${searchableEquipment.length} equipment matching search: "${search}"`);
        } catch (error) {
          console.error('Error searching equipment:', error);
        }

        // Only process files for matching equipment
        if (searchableEquipment.length > 0) {
          const equipmentIds = searchableEquipment.map(eq => eq.id);
          const equipmentDataMap = new Map();
          
          searchableEquipment.forEach((eq: any) => {
            equipmentDataMap.set(eq.id, {
              name: eq.name || 'Unknown Equipment',
              modelNumber: eq.modelNumber || 'No Model',
              serialNumber: eq.serialNumber || 'No Serial',
              doorNumber: eq.doorNumber || 'No Door #'
            });
          });

          // Get equipment files and filter by matching equipment
          try {
            const equipmentResponse = await SupabaseStorageService.listFiles('equipment-documents');
            if (equipmentResponse.success && equipmentResponse.files) {
              const matchingEquipmentFiles = equipmentResponse.files.filter(item => {
                if (!item.name || item.name.endsWith('/') || !item.name.includes('.')) return false;
                
                const equipmentId = parseInt(item.name.split('/')[0]) || 0;
                return equipmentIds.includes(equipmentId);
              });

              console.log(`Processing ${matchingEquipmentFiles.length} files for matching equipment`);

              const equipmentDocuments = matchingEquipmentFiles.map((item, index) => {
                const fileName = item.name.split('/').pop() || item.name;
                const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
                const equipmentId = parseInt(item.name.split('/')[0]) || 0;
                const equipmentInfo = equipmentDataMap.get(equipmentId) || {
                  name: 'Unknown Equipment',
                  modelNumber: 'No Model',
                  serialNumber: 'No Serial',
                  doorNumber: 'No Door #'
                };

                // Determine MIME type
                let mimeType = 'application/octet-stream';
                if (['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'SVG'].includes(documentType)) {
                  mimeType = `image/${documentType.toLowerCase()}`;
                } else if (documentType === 'PDF') {
                  mimeType = 'application/pdf';
                } else if (['DOC', 'DOCX'].includes(documentType)) {
                  mimeType = 'application/msword';
                } else if (['XLS', 'XLSX'].includes(documentType)) {
                  mimeType = 'application/vnd.ms-excel';
                }

                return {
                  id: `eqp_${equipmentId}_${Date.now()}_${index}`,
                  type: 'equipment' as const,
                  documentType,
                  filePath: item.name,
                  fileName,
                  originalFileName: fileName,
                  fileSize: item.size || 0,
                  mimeType,
                  description: `Equipment document for ${equipmentInfo.name}`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  equipmentId,
                  equipmentName: equipmentInfo.name,
                  equipmentModel: equipmentInfo.modelNumber,
                  equipmentSerial: equipmentInfo.serialNumber,
                  url: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
                  viewUrl: SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
                  searchableText: `${equipmentInfo.name} ${equipmentInfo.modelNumber} ${equipmentInfo.serialNumber} ${equipmentInfo.doorNumber || ''} ${documentType} ${fileName}`.toLowerCase(),
                };
              });

              filteredDocuments.push(...equipmentDocuments);
              equipmentCount = equipmentDocuments.length;
            }
          } catch (error) {
            console.error('Error processing equipment files:', error);
          }
        }
      }

      // Also search in file names and document types for any remaining matches
      if (filteredDocuments.length === 0) {
        console.log('No matches found in employee/equipment data, searching in file names...');
        
        // Search in all files for filename/document type matches
        const allFiles = [...(await SupabaseStorageService.listFiles('employee-documents').then(res => res.success ? res.files || [] : [])), ...(await SupabaseStorageService.listFiles('equipment-documents').then(res => res.success ? res.files || [] : []))];
        
        const filenameMatches = allFiles.filter(item => {
          if (!item.name || item.name.endsWith('/') || !item.name.includes('.')) return false;
          
          const fileName = item.name.split('/').pop() || item.name;
          const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
          
          return fileName.toLowerCase().includes(search.toLowerCase()) || 
                 documentType.toLowerCase().includes(search.toLowerCase());
        });

        if (filenameMatches.length > 0) {
          console.log(`Found ${filenameMatches.length} files matching filename/document type search`);
          // Process these files with basic info (no employee/equipment details)
          const basicDocuments = filenameMatches.map((item, index) => {
            const fileName = item.name.split('/').pop() || item.name;
            const documentType = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
            
            return {
              id: `file_${Date.now()}_${index}`,
              type: 'unknown' as const,
              documentType,
              filePath: item.name,
              fileName,
              originalFileName: fileName,
              fileSize: item.size || 0,
              mimeType: 'application/octet-stream',
              description: `File: ${fileName}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              url: item.name.includes('employee') ? 
                SupabaseStorageService.getPublicUrl('employee-documents', item.name) :
                SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
              viewUrl: item.name.includes('employee') ? 
                SupabaseStorageService.getPublicUrl('employee-documents', item.name) :
                SupabaseStorageService.getPublicUrl('equipment-documents', item.name),
              searchableText: `${fileName} ${documentType}`.toLowerCase(),
            };
          });
          
          filteredDocuments.push(...basicDocuments);
        }
      }

      totalDocs = filteredDocuments.length;
      console.log(`Search completed. Found ${totalDocs} total documents matching "${search}"`);
      
         } else {
       // No search term - use the existing allDocuments array but apply pagination
       console.log('No search term provided, using existing documents with pagination');
       
       // Use the documents already fetched in allDocuments
       filteredDocuments = allDocuments;
       totalDocs = allDocuments.length;
       employeeCount = allDocuments.filter(doc => doc.type === 'employee').length;
       equipmentCount = allDocuments.filter(doc => doc.type === 'equipment').length;
       
       console.log(`Total documents available: ${totalDocs} (Employee: ${employeeCount}, Equipment: ${equipmentCount})`);
     }

    // Filter by type if specified
    if (type !== 'all') {
      filteredDocuments = filteredDocuments.filter(doc => doc.type === type);
    }

    // Sort by creation date
    filteredDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

         // Apply pagination (no maximum limit - show actual total)
     const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

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
});
