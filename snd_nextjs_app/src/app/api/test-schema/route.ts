import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can import the schema
    const { employeeAssignments, timesheets } = await import('../../../../drizzle/schema');
    
    return NextResponse.json({
      success: true,
      message: 'Schema imports successful',
      employeeAssignments: typeof employeeAssignments,
      timesheets: typeof timesheets
    });
  } catch (error) {
    console.error('Schema import error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Schema import failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
