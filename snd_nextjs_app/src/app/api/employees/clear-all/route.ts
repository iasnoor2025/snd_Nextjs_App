import { db } from '@/lib/db';
import { employees as employeesTable } from '@/lib/drizzle/schema';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Simple approach: just delete all employees
    // This will fail if there are foreign key constraints, but let's try
    await db.delete(employeesTable);
    return NextResponse.json({
      success: true,
      message: 'All employees cleared successfully. Ready for fresh ERPNext sync.',
      nextStep: 'Run the sync API endpoint to import fresh data from ERPNext'
    });

  } catch (error) {
    console.error('❌ Error clearing employees:', error);
    
    // If deletion fails due to foreign key constraints, try to provide guidance
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete employees due to foreign key constraints. Please contact support to handle this manually.',
          error: errorMessage,
          suggestion: 'The system needs to be updated to handle foreign key relationships before clearing employees.'
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear employees',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
