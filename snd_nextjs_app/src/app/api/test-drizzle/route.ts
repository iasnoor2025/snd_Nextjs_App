import { db } from '@/lib/drizzle';
import { employeeDocuments, employees, salaryIncrements } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Drizzle functionality...');

    // Test 1: Basic employees query
    console.log('Testing employees query...');
    let employeesResult;
    try {
      employeesResult = await db
        .select({ id: employees.id, firstName: employees.firstName })
        .from(employees)
        .limit(1);
      console.log('Employees query successful:', employeesResult);
    } catch (error) {
      console.log('Employees query failed:', error);
      employeesResult = { error: error instanceof Error ? error.message : String(error) };
    }

    // Test 2: Basic salary increments query
    console.log('Testing salary increments query...');
    let salaryResult;
    try {
      salaryResult = await db
        .select({ id: salaryIncrements.id, employeeId: salaryIncrements.employeeId })
        .from(salaryIncrements)
        .limit(1);
      console.log('Salary increments query successful:', salaryResult);
    } catch (error) {
      console.log('Salary increments query failed:', error);
      salaryResult = { error: error instanceof Error ? error.message : String(error) };
    }

    // Test 3: Test specific salary increment fields that might be causing issues
    console.log('Testing specific salary increment fields...');
    let salaryFieldsResult;
    try {
      salaryFieldsResult = await db
        .select({
          id: salaryIncrements.id,
          employeeId: salaryIncrements.employeeId,
          currentBaseSalary: salaryIncrements.currentBaseSalary,
          currentFoodAllowance: salaryIncrements.currentFoodAllowance,
          incrementType: salaryIncrements.incrementType,
          effectiveDate: salaryIncrements.effectiveDate,
          status: salaryIncrements.status,
          requestedBy: salaryIncrements.requestedBy,
          requestedAt: salaryIncrements.requestedAt,
        })
        .from(salaryIncrements)
        .limit(1);
      console.log('Salary fields query successful:', salaryFieldsResult);
    } catch (error) {
      console.log('Salary fields query failed:', error);
      salaryFieldsResult = { error: error instanceof Error ? error.message : String(error) };
    }

    // Test 4: Basic documents query
    console.log('Testing documents query...');
    let documentsResult;
    try {
      documentsResult = await db
        .select({ id: employeeDocuments.id, employeeId: employeeDocuments.employeeId })
        .from(employeeDocuments)
        .limit(1);
      console.log('Documents query successful:', documentsResult);
    } catch (error) {
      console.log('Documents query failed:', error);
      documentsResult = { error: error instanceof Error ? error.message : String(error) };
    }

    // Test 5: Test documents with join
    console.log('Testing documents with join...');
    let documentsJoinResult;
    try {
      documentsJoinResult = await db
        .select({
          id: employeeDocuments.id,
          employeeId: employeeDocuments.employeeId,
          documentType: employeeDocuments.documentType,
          fileName: employeeDocuments.fileName,
          employeeFileNumber: employees.fileNumber,
        })
        .from(employeeDocuments)
        .leftJoin(employees, eq(employees.id, employeeDocuments.employeeId))
        .limit(1);
      console.log('Documents join query successful:', documentsJoinResult);
    } catch (error) {
      console.log('Documents join query failed:', error);
      documentsJoinResult = { error: error instanceof Error ? error.message : String(error) };
    }

    return NextResponse.json({
      success: true,
      message: 'Drizzle test completed',
      data: {
        employees: employeesResult,
        salaryIncrements: salaryResult,
        salaryFields: salaryFieldsResult,
        documents: documentsResult,
        documentsJoin: documentsJoinResult,
      },
    });
  } catch (error) {
    console.error('Drizzle test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Drizzle test failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
