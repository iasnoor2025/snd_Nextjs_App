import { db } from '@/lib/db';
import { timesheets, employees } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

interface TimesheetEntry {
  employeeId: number;
  date: string;
  hoursWorked: string;
  overtimeHours: string;
  startTime: string;
  endTime: string | null;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Decode URL-encoded form data into an object of arrays.
 * This replicates the Google Sheets script functionality.
 */
function decodeData(data: string) {
  return data
    .split('&')
    .map(pair => pair.split('='))
    .reduce((acc, [rawKey, rawVal]) => {
      const key = decodeURIComponent(rawKey);
      const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
      (acc[key] = acc[key] || []).push(val);
      return acc;
    }, {} as Record<string, string[]>);
}

/**
 * Get employee ID by file number (employee code)
 */
async function getEmployeeByFileNumber(fileNumber: string) {
  try {
    const employee = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.fileNumber, fileNumber))
      .limit(1);

    return employee[0]?.id || null;
  } catch (error) {
    console.error('Error finding employee:', error);
    return null;
  }
}

/**
 * Apply Friday logic for working hours
 */
function applyFridayLogic(dayName: string, workingHours: string, index: number, allWorkingHours: string[]) {
  if (dayName === 'Fri') {
    if (workingHours === 'A' || workingHours === '' || workingHours === '0') {
      return 'Fri';
    }
    return workingHours;
  }
  return workingHours;
}

/**
 * Save timesheet data to database
 */
async function saveToDatabase(employeeId: number, monthKey: string, timesheetData: TimesheetEntry[]) {
  try {
    const monthStart = new Date(monthKey + '-01');
    
    // Get all timesheets for this employee
    const allEmployeeTimesheets = await db
      .select({ id: timesheets.id, date: timesheets.date })
      .from(timesheets)
      .where(eq(timesheets.employeeId, employeeId));
    
        // Filter to current month
    const existingTimesheets = allEmployeeTimesheets.filter(t => {
      const timesheetDate = new Date(t.date);
      return timesheetDate.getFullYear() === monthStart.getFullYear() && 
             timesheetDate.getMonth() === monthStart.getMonth();
    });
    
        const isUpdate = existingTimesheets.length > 0;
    // Delete existing timesheets for this month
    if (isUpdate) {
      for (const timesheet of existingTimesheets) {
        await db
          .delete(timesheets)
          .where(eq(timesheets.id, timesheet.id));
      }
    }

    // Insert new timesheets
    const insertedTimesheets = await db
      .insert(timesheets)
      .values(timesheetData)
      .returning();

    return {
      success: true,
      message: isUpdate 
        ? `Database updated for ${monthKey}`
        : `Database saved for ${monthKey}`,
      entriesCount: insertedTimesheets.length,
      isUpdate
    };
  } catch (error) {
    console.error('Error saving to database:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timesheetDataCount: timesheetData.length,
      employeeId,
      monthKey
    });
    return {
      success: false,
      message: 'Failed to save to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Google Apps Script dedicated endpoint - NO AUTHENTICATION REQUIRED
 * This endpoint is specifically designed for Google Apps Script calls
 */
export async function POST(request: NextRequest) {
  try {
        const body = await request.json();
    
    let params: Record<string, string[]>;
    if (typeof body === 'string') {
      params = decodeData(body);
    } else {
      params = {
        empCode: [body.empCode || body.fileNumber],
        month: [body.month],
        'date[]': body.dates || [],
        'workingHours[]': body.workingHours || [],
        'overtime[]': body.overtime || []
      };
    }

    const empCode = params.empCode?.[0];
    const monthKey = params.month?.[0];

        if (!empCode || !monthKey) {
      return NextResponse.json({ 
        error: 'Employee code and month are required' 
      }, { status: 400 });
    }

    const employeeId = await getEmployeeByFileNumber(empCode);
    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee not found with file number: ' + empCode 
      }, { status: 404 });
    }
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtimeHours = params['overtime[]'] || [];

    const timesheetEntries: TimesheetEntry[] = [];

    for (let i = 0; i < dates.length; i++) {
      const dt = new Date(dates[i]);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      const wh = workingHours[i] || '0';
      const ot = overtimeHours[i] || '0';

      let hoursWorked = 0;
      let description = `${dayName} work log`;
      
      // Apply same Friday logic as Google Apps Script
      if (dayName === 'Fri') {
        // If Friday and hours are 0, empty, or 'A', store as 0 but mark as Friday
        if (wh === '0' || wh === '' || wh === 'A' || wh === 'Fri') {
          hoursWorked = 0;
          description = 'Friday - Off Day';
        } else {
          // Friday with actual hours worked
          hoursWorked = parseFloat(wh) || 0;
        }
      } else {
        // Regular days
        if (wh === 'A') {
          hoursWorked = 0;
        } else {
          hoursWorked = parseFloat(wh) || 0;
        }
      }

      const overtime = parseFloat(ot) || 0;

      timesheetEntries.push({
        employeeId,
        date: dt.toISOString().split('T')[0],
        hoursWorked: hoursWorked.toString(),
        overtimeHours: overtime.toString(),
        startTime: dt.toISOString(),
        endTime: null,
        status: 'pending',
        description: description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    const databaseResult = await saveToDatabase(employeeId, monthKey, timesheetEntries);
    const response = {
      success: databaseResult.success,
      message: databaseResult.success 
        ? `Data processed for ${monthKey} - Database: Success`
        : `Data processed for ${monthKey} - Database: Failed`,
      data: {
        month: monthKey,
        employeeCode: empCode,
        entriesCount: timesheetEntries.length,
        database: databaseResult
      }
    };

    if (!databaseResult.success) {
      return NextResponse.json(response, { status: 500 });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/timesheets/gas-submit:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint for retrieving timesheet data (also no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empCode = searchParams.get('empCode');
    const monthKey = searchParams.get('month');

    if (!empCode || !monthKey) {
      return NextResponse.json({ 
        error: 'Employee code and month are required' 
      }, { status: 400 });
    }

    const employeeId = await getEmployeeByFileNumber(empCode);
    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee not found with file number: ' + empCode 
      }, { status: 404 });
    }

    const monthStart = new Date(monthKey + '-01');
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const monthlyTimesheets = await db
      .select({
        id: timesheets.id,
        date: timesheets.date,
        hoursWorked: timesheets.hoursWorked,
        overtimeHours: timesheets.overtimeHours,
        status: timesheets.status
      })
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, employeeId),
          sql`DATE(${timesheets.date}) >= DATE(${monthStart.toISOString().split('T')[0]})`,
          sql`DATE(${timesheets.date}) <= DATE(${monthEnd.toISOString().split('T')[0]})`
        )
      )
      .orderBy(timesheets.date);

    const formattedTimesheets = monthlyTimesheets.map(ts => {
      const date = new Date(ts.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      let workingHours = ts.hoursWorked;
      if (dayName === 'Fri' && parseFloat(workingHours) === 0) {
        workingHours = 'Fri';
      }
      return {
        date: ts.date,
        workingHours: workingHours,
        overtime: ts.overtimeHours
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: formattedTimesheets,
      source: 'database',
      message: 'Data retrieved from database'
    });
  } catch (error) {
    console.error('Error in GET /api/timesheets/gas-submit:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
