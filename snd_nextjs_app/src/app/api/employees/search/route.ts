import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json(
        { success: false, message: 'Please provide a search term' },
        { status: 400 }
      );
    }

    // Search by first name, last name, or file number
    const employees = await db
      .select({
        id: employeesTable.id,
        firstName: employeesTable.firstName,
        lastName: employeesTable.lastName,
        fileNumber: employeesTable.fileNumber,
        erpnextId: employeesTable.erpnextId
      })
      .from(employeesTable)
      .where(
        sql`first_name ILIKE ${`%${searchTerm}%`} OR last_name ILIKE ${`%${searchTerm}%`} OR file_number ILIKE ${`%${searchTerm}%`}`
      )
      .limit(20);

    return NextResponse.json({
      success: true,
      employees: employees,
      count: employees.length
    });

  } catch (error) {
    console.error('❌ Error searching employees:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to search employees',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
