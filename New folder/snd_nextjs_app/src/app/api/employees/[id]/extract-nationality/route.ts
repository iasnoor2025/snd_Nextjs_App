import { db } from '@/lib/db';
import { employees as employeesTable, employeeDocuments } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, and, or, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { IqamaOCRService } from '@/lib/services/iqama-ocr-service';

/**
 * POST /api/employees/[id]/extract-nationality
 * Extract nationality from employee's Iqama image and update employee record
 */
const extractNationalityHandler = async (
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
        nationality: employeesTable.nationality,
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

    // Extract nationality from Iqama image with timeout handling
    console.log(`Extracting nationality from Iqama for employee ${employeeId}...`);
    
    // Add timeout wrapper (35 seconds total)
    const extractionPromise = IqamaOCRService.extractNationalityFromIqama(
      iqamaDoc.filePath,
      iqamaDoc.mimeType || undefined
    );
    
    const timeoutPromise = new Promise<{ nationality: null; extractedText: string; confidence: 'low' }>((_, reject) => {
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
            message: 'The image processing took too long. Please try with a smaller or clearer image, or set nationality manually.',
          },
          { status: 408 }
        );
      }
      throw error;
    }

    if (!extractionResult.nationality) {
      return NextResponse.json(
        {
          error: 'Could not extract nationality from Iqama image',
          message: 'Please manually set the nationality or ensure the Iqama image is clear and readable',
          extractedText: extractionResult.extractedText,
          confidence: extractionResult.confidence,
        },
        { status: 400 }
      );
    }

    // Update employee nationality
    const updatedEmployeeRows = await db
      .update(employeesTable)
      .set({
        nationality: extractionResult.nationality,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeesTable.id, employeeId))
      .returning({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        nationality: employeesTable.nationality,
      });

    if (updatedEmployeeRows.length === 0) {
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }

    const updatedEmployee = updatedEmployeeRows[0];

    return NextResponse.json({
      success: true,
      message: 'Nationality extracted and updated successfully',
      employee: {
        id: updatedEmployee.id,
        name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        nationality: updatedEmployee.nationality,
        previousNationality: employee.nationality,
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
    console.error('Error extracting nationality from Iqama:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract nationality from Iqama',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

/**
 * PUT /api/employees/[id]/extract-nationality
 * Manually set nationality (alternative to OCR extraction)
 */
const setNationalityHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();
    const { nationality } = body;

    if (!employeeId) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    if (!nationality || typeof nationality !== 'string') {
      return NextResponse.json({ error: 'Nationality is required' }, { status: 400 });
    }

    // Map country name to nationality if needed
    const mappedNationality = IqamaOCRService.mapCountryToNationality(nationality) || nationality;

    // Check if employee exists
    const employeeRows = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        nationality: employeesTable.nationality,
      })
      .from(employeesTable)
      .where(eq(employeesTable.id, employeeId))
      .limit(1);

    if (employeeRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employeeRows[0];

    // Update employee nationality
    const updatedEmployeeRows = await db
      .update(employeesTable)
      .set({
        nationality: mappedNationality,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(employeesTable.id, employeeId))
      .returning({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        nationality: employeesTable.nationality,
      });

    if (updatedEmployeeRows.length === 0) {
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }

    const updatedEmployee = updatedEmployeeRows[0];

    return NextResponse.json({
      success: true,
      message: 'Nationality updated successfully',
      employee: {
        id: updatedEmployee.id,
        name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        nationality: updatedEmployee.nationality,
        previousNationality: employee.nationality,
      },
    });
  } catch (error) {
    console.error('Error updating nationality:', error);
    return NextResponse.json(
      {
        error: 'Failed to update nationality',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

export const POST = withPermission(PermissionConfigs.employee.update)(extractNationalityHandler);
export const PUT = withPermission(PermissionConfigs.employee.update)(setNationalityHandler);

