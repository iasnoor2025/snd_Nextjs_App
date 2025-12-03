
import { db } from '@/lib/db';
import { timesheets, employees } from '@/lib/drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
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
  const employee = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.fileNumber, fileNumber))
    .limit(1);
  
  return employee[0]?.id;
}

/**
 * Apply Friday special logic from Google Sheets script
 */
function applyFridayLogic(dayName: string, workingHours: string, index: number, allWorkingHours: string[]) {
  if (dayName !== 'Friday') {
    return workingHours;
  }

  const prev = index > 0 ? (allWorkingHours[index - 1] || 'A') : 'A';
  const next = index < allWorkingHours.length - 1 ? (allWorkingHours[index + 1] || 'A') : 'A';
  
  if (prev === 'A' && next === 'A') {
    return 'A';
  } else if (workingHours === 'A') {
    return 'Fri';
  }
  
  return workingHours;
}

/**
 * Save to Google Sheets using your existing Google Apps Script
 */
async function saveToGoogleSheets(empCode: string, monthKey: string, timesheetData: TimesheetEntry[]) {
  try {
    // Option 1: Call your existing Google Apps Script (RECOMMENDED)
    // Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL' with your actual script URL
    const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzwSXLfHm791C5Z2MGtRVaKtzJSGJ7R1bJfWnTKRVIJjsyk24w3jzcTDB7gkEYQpmOj0w/exec';
    
    // Option 2: Use Google Sheets API directly (requires setup)
    // You would need to install: npm install googleapis
    // And set up service account credentials
    // const { google } = require('googleapis');
    // const sheets = google.sheets({ version: 'v4', auth: serviceAccount });
    
    // Prepare data in the format your Google Apps Script expects
    const formData = new URLSearchParams();
    formData.append('empCode', empCode);
    formData.append('month', monthKey);
    
    // Add dates, working hours, and overtime arrays
    timesheetData.forEach((entry) => {
      formData.append('date[]', entry.date);
      formData.append('workingHours[]', entry.hoursWorked);
      formData.append('overtime[]', entry.overtimeHours);
    });
    
    // Call your Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      throw new Error(`Google Apps Script call failed: ${response.status}`);
    }
    
    const result = await response.text();
    return {
      success: true,
      message: `Data saved to Google Sheets for ${monthKey}`,
      entriesCount: timesheetData.length
    };
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return {
      success: false,
      message: 'Failed to save to Google Sheets',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save to Database
 */
async function saveToDatabase(employeeId: number, monthKey: string, timesheetData: TimesheetEntry[]) {
  try {
    // Check if timesheets exist for this month (to determine if it's an update)
    const monthStart = new Date(monthKey + '-01');
    // Note: monthEnd kept previously for SQL bounds; JS filter below doesn't need it
    
    // Check if any timesheets exist for this employee in this month
    // First, let's check what dates actually exist for this employee
    const allEmployeeTimesheets = await db
      .select({ id: timesheets.id, date: timesheets.date })
      .from(timesheets)
      .where(eq(timesheets.employeeId, employeeId));
    
        // Now filter for the specific month
    const existingTimesheets = allEmployeeTimesheets.filter(t => {
      const timesheetDate = new Date(t.date);
      return timesheetDate.getFullYear() === monthStart.getFullYear() && 
             timesheetDate.getMonth() === monthStart.getMonth();
    });
    
        const isUpdate = existingTimesheets.length > 0;
    // If updating, delete existing timesheets for this month
    if (isUpdate) {
      // Delete each timesheet individually to avoid SQL complexity
      for (const timesheet of existingTimesheets) {
        await db
          .delete(timesheets)
          .where(eq(timesheets.id, timesheet.id));
      }
    }

    // Insert all timesheet entries
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
 * Bulk submit monthly timesheet data - saves to both Google Sheets and Database
 */
export async function POST(request: NextRequest) {
  try {
    // Check if this is a request from Google Apps Script
    const userAgent = request.headers.get('user-agent') || '';
    // Some environments send variations like 'Google-Apps-Script'
    const isGoogleAppsScript = /Google[- ]?Apps?Script/i.test(userAgent);

    // Shared secret header for server-to-server auth (set in .env)
    const incomingSecret = request.headers.get('x-gas-secret') || '';
    const expectedSecret = process.env.GAS_SHARED_SECRET;
    
        // Allow Google Apps Script requests that include the shared secret,
    // otherwise require a NextAuth session.
    const isTrustedGAS = isGoogleAppsScript && expectedSecret && incomingSecret === expectedSecret;
    
    // TEMPORARY DEBUG: Log authentication details
    if (!isTrustedGAS) {
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
    }

    const body = await request.json();
    
    // Support both JSON and form-encoded data
    let params: Record<string, string[]>;
    if (typeof body === 'string') {
      params = decodeData(body);
    } else {
      // Convert JSON to the expected format
      params = {
        empCode: [body.empCode || body.fileNumber],
        month: [body.month],
        'date[]': body.dates || [],
        'workingHours[]': body.workingHours || [],
        'overtime[]': body.overtime || []
      };
    }

    const empCode = params.empCode?.[0];
    const monthKey = params.month?.[0]; // e.g. "2025-04"

    if (!empCode || !monthKey) {
      return NextResponse.json({ 
        error: 'Employee code and month are required' 
      }, { status: 400 });
    }

    // Get employee ID by file number
    const employeeId = await getEmployeeByFileNumber(empCode);
    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee not found with file number: ' + empCode 
      }, { status: 404 });
    }

    // Get arrays
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtimeHours = params['overtime[]'] || [];

    if (dates.length === 0) {
      return NextResponse.json({ 
        error: 'No dates provided' 
      }, { status: 400 });
    }

    // Process each date and create timesheet entries
    const timesheetEntries: TimesheetEntry[] = [];
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      const dt = new Date(dateStr);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
      
      let wh = (workingHours[i] || '').trim() || 'A';
      const ot = overtimeHours[i] || '';

      // Apply Friday special logic
      wh = applyFridayLogic(dayName, wh, i, workingHours);

      // Convert working hours to numeric values
      let hoursWorked = 0;
      if (wh === 'A') {
        hoursWorked = 0; // Absent
      } else if (wh === 'Fri') {
        hoursWorked = 0; // Friday should be 0 or "Fri", not 4 hours
      } else {
        hoursWorked = parseFloat(wh) || 0;
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
        description: `${dayName} work log`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    // Save to both Google Sheets and Database
    const [googleSheetsResult, databaseResult] = await Promise.allSettled([
      saveToGoogleSheets(empCode, monthKey, timesheetEntries),
      saveToDatabase(employeeId, monthKey, timesheetEntries)
    ]);
    // Check if both saves were successful
    const googleSheetsSuccess = googleSheetsResult.status === 'fulfilled' && googleSheetsResult.value.success;
    const databaseSuccess = databaseResult.status === 'fulfilled' && databaseResult.value.success;
    
    // Determine overall success and message
    const overallSuccess = googleSheetsSuccess && databaseSuccess;
    let message = `Data processed for ${monthKey}`;
    
    if (!overallSuccess) {
      const failures = [];
      if (!googleSheetsSuccess) failures.push('Google Sheets');
      if (!databaseSuccess) failures.push('Database');
      message = `Data processed for ${monthKey} (${failures.join(' and ')} save failed)`;
    }

    // Prepare response
    const response = {
      success: overallSuccess,
      message: message,
      data: {
        month: monthKey,
        employeeCode: empCode,
        entriesCount: timesheetEntries.length,
        results: {
          googleSheets: googleSheetsResult.status === 'fulfilled' 
            ? googleSheetsResult.value 
            : { success: false, message: 'Google Sheets save failed', error: googleSheetsResult.reason },
          database: databaseResult.status === 'fulfilled' 
            ? databaseResult.value 
            : { success: false, message: 'Database save failed', error: databaseResult.reason }
        }
      }
    };

    if (!googleSheetsSuccess && !databaseSuccess) {
      return NextResponse.json({
        ...response,
        success: false,
        message: 'Failed to save to both Google Sheets and Database'
      }, { status: 500 });
    }

    if (!googleSheetsSuccess) {
      response.message += ' (Google Sheets save failed)';
    }
    if (!databaseSuccess) {
      response.message += ' (Database save failed)';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in bulk timesheet submission:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get monthly timesheet data
 */
export async function GET(request: NextRequest) {
  try {
    // Check if this is a request from Google Apps Script
    const userAgent = request.headers.get('user-agent') || '';
    const isGoogleAppsScript = userAgent.includes('GoogleAppsScript');
    // Allow Google Apps Script requests without session authentication
    if (!isGoogleAppsScript) {
      const session = await getServerSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const empCode = searchParams.get('empCode');
    const monthKey = searchParams.get('month');

    if (!empCode || !monthKey) {
      return NextResponse.json({ 
        error: 'Employee code and month are required' 
      }, { status: 400 });
    }

    // Get employee ID by file number
    const employeeId = await getEmployeeByFileNumber(empCode);
    if (!employeeId) {
      return NextResponse.json({ 
        error: 'Employee not found with file number: ' + empCode 
      }, { status: 404 });
    }

    // Get timesheets from database
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
          sql`${timesheets.date} >= ${monthStart.toISOString().split('T')[0]}`,
          sql`${timesheets.date} <= ${monthEnd.toISOString().split('T')[0]}`
        )
      )
      .orderBy(timesheets.date);

    // Format data similar to Google Sheets structure
    const formattedData = monthlyTimesheets.map(ts => ({
      date: ts.date,
      workingHours: ts.hoursWorked,
      overtime: ts.overtimeHours
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
      message: 'Data retrieved from database'
    });

  } catch (error) {
    console.error('Error fetching monthly timesheet data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
