import { db } from '@/lib/db';
import { employees as employeesTable, employeeDocuments } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and, or, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { IqamaOCRService } from '@/lib/services/iqama-ocr-service';

/**
 * POST /api/employees/[id]/extract-designation
 * Extract designation from employee's Iqama image and update employee record
 */
const extractDesignationHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Check if employee exists
    const employeeRows = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        iqamaNumber: employeesTable.iqamaNumber,
        designationId: employeesTable.designationId,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employeeRows[0];

    // Find Iqama document for this employee
    const iqamaDocs = await db
      .select({
        id: employeeDocuments.id,
        filePath: employeeDocuments.filePath,
        fileName: employeeDocuments.fileName,
        mimeType: employeeDocuments.mimeType,
        documentType: employeeDocuments.documentType,
      })
      .from(employeeDocuments)
      .where(
        and(
          eq(employeeDocuments.employeeId, employeeId),
          or(
            eq(employeeDocuments.documentType, 'iqama'),
            ilike(employeeDocuments.documentType, '%iqama%'),
            ilike(employeeDocuments.fileName, '%iqama%')
          )
        )
      )
      .orderBy(employeeDocuments.createdAt)
      .limit(1);

    if (iqamaDocs.length === 0) {
      return NextResponse.json(
        {
          error: 'Iqama document not found',
          message: 'Please upload an Iqama image for this employee first',
        },
        { status: 404 }
      );
    }

    const iqamaDoc = iqamaDocs[0];

    // Check if it's an image file
    const isImage = iqamaDoc.mimeType?.startsWith('image/') || false;
    if (!isImage) {
      return NextResponse.json(
        {
          error: 'Iqama document is not an image',
          message: 'Please upload an image file (JPG, PNG) of the Iqama',
        },
        { status: 400 }
      );
    }

    // Extract designation from Iqama image with timeout handling
    console.log(`Extracting designation from Iqama for employee ${employeeId}...`);
    
    // Add timeout wrapper (35 seconds total)
    const extractionPromise = IqamaOCRService.extractDesignationFromIqama(
      iqamaDoc.filePath,
      iqamaDoc.mimeType || undefined
    );
    
    const timeoutPromise = new Promise<{ designationId: null; designationName: null; extractedText: string; confidence: 'low' }>((_, reject) => {
      setTimeout(() => reject(new Error('Extraction timeout after 35 seconds')), 35000);
    });
    
    let extractionResult;
    try {
      extractionResult = await Promise.race([extractionPromise, timeoutPromise]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'OCR processing timeout',
            message: 'The image processing took too long. Please try with a smaller or clearer image, or set designation manually.',
          },
          { status: 408 }
        );
      }
      throw error;
    }

    if (!extractionResult.designationId || !extractionResult.designationName) {
      return NextResponse.json(
        {
          error: 'Could not extract designation from Iqama image',
          message: 'Please manually set the designation or ensure the Iqama image is clear and readable',
          extractedText: extractionResult.extractedText,
          confidence: extractionResult.confidence,
        },
        { status: 400 }
      );
    }

    // Update employee designation
    const updatedEmployeeRows = await db
      .update(employeesTable)
      .set({
        designationId: extractionResult.designationId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeesTable.id, employeeId))
      .returning({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        designationId: employeesTable.designationId,
      });

    if (updatedEmployeeRows.length === 0) {
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }

    const updatedEmployee = updatedEmployeeRows[0];

    return NextResponse.json({
      success: true,
      message: 'Designation extracted and updated successfully',
      employee: {
        id: updatedEmployee.id,
        name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        designationId: updatedEmployee.designationId,
        designationName: extractionResult.designationName,
        previousDesignationId: employee.designationId,
      },
      extraction: {
        extractedText: extractionResult.extractedText,
        confidence: extractionResult.confidence,
        iqamaDocument: {
          id: iqamaDoc.id,
          fileName: iqamaDoc.fileName,
        },
      },
    });
  } catch (error) {
    console.error('Error extracting designation from Iqama:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract designation from Iqama',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.employee.update)(extractDesignationHandler);

