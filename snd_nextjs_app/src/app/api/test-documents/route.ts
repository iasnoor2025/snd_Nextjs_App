import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Testing documents API...');
    
    // Test 1: Check if we can connect to the database
    console.log('Testing database connection...');
    
    // Test 2: Check if employee 284 exists
    console.log('Checking if employee 284 exists...');
    const employeeCheck = await db
      .select({ id: employees.id, name: employees.firstName })
      .from(employees)
      .where(eq(employees.id, 284));
    
    console.log('Employee check result:', employeeCheck);
    
    // Test 3: Check if there are any documents for employee 284
    console.log('Checking documents for employee 284...');
    const documentsCheck = await db
      .select({ id: employeeDocuments.id, employeeId: employeeDocuments.employeeId })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, 284));
    
    console.log('Documents check result:', documentsCheck);
    
    // Test 4: Check total documents count
    console.log('Checking total documents count...');
    const totalDocs = await db
      .select({ count: sql`count(*)` })
      .from(employeeDocuments);
    
    console.log('Total documents count:', totalDocs);
    
    // Test 5: Check the actual structure of a document
    console.log('Checking document structure...');
    if (documentsCheck.length > 0) {
      const firstDoc = documentsCheck[0];
      if (firstDoc) {
        // Test individual fields to see which ones exist
        try {
          console.log('Testing basic fields...');
          const basicFields = await db
            .select({
              id: employeeDocuments.id,
              employeeId: employeeDocuments.employeeId,
              documentType: employeeDocuments.documentType,
              fileName: employeeDocuments.fileName,
            })
            .from(employeeDocuments)
            .where(eq(employeeDocuments.id, firstDoc.id))
            .limit(1);
          
          console.log('Basic fields test successful:', basicFields);
        } catch (basicError) {
          console.error('Basic fields test failed:', basicError);
        }
        
        try {
          console.log('Testing file path field...');
          const filePathTest = await db
            .select({
              id: employeeDocuments.id,
              filePath: employeeDocuments.filePath,
            })
            .from(employeeDocuments)
            .where(eq(employeeDocuments.id, firstDoc.id))
            .limit(1);
          
          console.log('File path test successful:', filePathTest);
        } catch (filePathError) {
          console.error('File path test failed:', filePathError);
        }
        
        try {
          console.log('Testing file size field...');
          const fileSizeTest = await db
            .select({
              id: employeeDocuments.id,
              fileSize: employeeDocuments.fileSize,
            })
            .from(employeeDocuments)
            .where(eq(employeeDocuments.id, firstDoc.id))
            .limit(1);
          
          console.log('File size test successful:', fileSizeTest);
        } catch (fileSizeError) {
          console.error('File size test failed:', fileSizeError);
        }
        
        try {
          console.log('Testing mime type field...');
          const mimeTypeTest = await db
            .select({
              id: employeeDocuments.id,
              mimeType: employeeDocuments.mimeType,
            })
            .from(employeeDocuments)
            .where(eq(employeeDocuments.id, firstDoc.id))
            .limit(1);
          
          console.log('Mime type test successful:', mimeTypeTest);
        } catch (mimeTypeError) {
          console.error('Mime type test failed:', mimeTypeError);
        }
        
        try {
          console.log('Testing description field...');
          const descriptionTest = await db
            .select({
              id: employeeDocuments.id,
              description: employeeDocuments.description,
            })
            .from(employeeDocuments)
            .where(eq(employeeDocuments.id, firstDoc.id))
            .limit(1);
          
          console.log('Description test successful:', descriptionTest);
        } catch (descriptionError) {
          console.error('Description test failed:', descriptionError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      employee: employeeCheck,
      documents: documentsCheck,
      totalDocuments: totalDocs,
      message: 'All tests completed successfully'
    });
    
  } catch (error) {
    console.error('Error in test documents API:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
