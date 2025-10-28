// Google Apps Script for Employee Details Auto-Sync
// This script syncs employee data from your Next.js app to Google Sheets

/**
 * Main function to sync employee details to Google Sheets
 * Run this function manually or set up a time-based trigger to run automatically
 */
function syncEmployeeDetails() {
  try {
    console.log('=== Starting Employee Details Sync ===');
    
    // Get or create the spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create the "Employees_Details" sheet
    let employeeDetailsSheet = spreadsheet.getSheetByName("Employees_Details");
    if (!employeeDetailsSheet) {
      employeeDetailsSheet = spreadsheet.insertSheet("Employees_Details");
      console.log('Created new sheet: Employees_Details');
    }
    
    // Fetch employee data from your API
    const employeeData = fetchEmployeesFromAPI();
    
    if (!employeeData || employeeData.length === 0) {
      SpreadsheetApp.getUi().alert('No Data', 'No employee data found to sync.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    console.log(`Fetched ${employeeData.length} employees from API`);
    
    // Format data for the sheet
    const formattedData = formatEmployeeData(employeeData);
    
    // Update the sheet
    const result = updateEmployeeDetailsSheet(employeeDetailsSheet, formattedData);
    
    const alertMessage = result.newRecords > 0
      ? `Sync Complete!\n\nAdded ${result.newRecords} new record(s).\nTotal records: ${result.totalRecords}`
      : `Sync Complete!\n\nNo new records to add.\nTotal records: ${result.totalRecords}`;
    
    SpreadsheetApp.getUi().alert('Sync Complete', alertMessage, SpreadsheetApp.getUi().ButtonSet.OK);
    
    console.log('=== Employee Details Sync Complete ===');
    
  } catch (error) {
    console.error('Error during sync:', error);
    SpreadsheetApp.getUi().alert('Sync Error', 
      'Failed to sync employee details: ' + error.toString(), 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Fetch employee data from your Next.js API
 */
function fetchEmployeesFromAPI() {
  try {
    // Update this URL to match your API endpoint
    // Using the public employees endpoint without authentication for simplicity
    // If you need authentication, you'll need to add headers
    const apiUrl = 'https://myapp.snd-ksa.online/api/employees/public?all=true';
    
    console.log('Fetching from:', apiUrl);
    
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript',
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    console.log('API Response Code:', responseCode);
    
    if (responseCode !== 200) {
      console.error('API Error:', response.getContentText());
      throw new Error(`API returned status code ${responseCode}`);
    }
    
    const responseText = response.getContentText();
    const data = JSON.parse(responseText);
    
    console.log('API Response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Check if the response has the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      console.log(`Received ${data.data.length} employees from API`);
      return data.data;
    } else if (Array.isArray(data)) {
      console.log(`Received ${data.length} employees from API (array format)`);
      return data;
    } else {
      console.error('Unexpected API response structure:', data);
      throw new Error('Unexpected API response structure');
    }
    
  } catch (error) {
    console.error('Error fetching from API:', error);
    throw error;
  }
}

/**
 * Format employee data for the sheet columns:
 * File#, Employees Full Name, Nationality, Category, Basic Salary
 */
function formatEmployeeData(employees) {
  return employees.map(emp => {
    // Build full name
    const firstName = emp.first_name || emp.firstName || '';
    const middleName = emp.middle_name || emp.middleName || '';
    const lastName = emp.last_name || emp.lastName || '';
    
    let fullName = [firstName, middleName, lastName]
      .filter(name => name && name.trim())
      .join(' ');
    
    if (!fullName) {
      fullName = emp.fullName || emp.name || 'Unknown';
    }
    
    // Get file number
    const fileNumber = emp.file_number || emp.fileNumber || emp.employee_id || '';
    
    // Get nationality
    const nationality = emp.nationality || '';
    
    // Get category (designation)
    const category = emp.desig_name || emp.designation || emp.category || '';
    
    // Get basic salary
    let basicSalary = '';
    if (emp.basic_salary) {
      const salary = parseFloat(emp.basic_salary);
      if (!isNaN(salary)) {
        basicSalary = salary.toString();
      }
    } else if (emp.basicSalary) {
      const salary = parseFloat(emp.basicSalary);
      if (!isNaN(salary)) {
        basicSalary = salary.toString();
      }
    }
    
    // Get status
    const status = emp.status || '';
    
    return {
      fileNumber: fileNumber.toString(),
      fullName: fullName.toUpperCase(),
      nationality: nationality,
      category: category,
      basicSalary: basicSalary,
      status: status
    };
  });
}

/**
 * Update the Employees_Details sheet with formatted data
 * Only syncs new records that don't already exist
 */
function updateEmployeeDetailsSheet(sheet, data) {
  try {
    const headers = ['File#', 'Employees Full Name', 'Nationality', 'Category', 'Basic Salary', 'Status'];
    
    // Check if sheet is empty or needs headers
    const lastRow = sheet.getLastRow();
    const hasData = lastRow > 0;
    
    // Setup headers if sheet is empty
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Style headers
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1f4e79');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      
      console.log('Initialized sheet with headers');
    }
    
    // Get existing File# values from column 1 (skip header row)
    const existingFileNumbers = new Set();
    if (hasData && lastRow > 1) {
      const fileNumberRange = sheet.getRange(2, 1, lastRow - 1, 1);
      const fileNumbers = fileNumberRange.getValues();
      fileNumbers.forEach(row => {
        if (row[0]) {
          existingFileNumbers.add(String(row[0]).trim());
        }
      });
    }
    
    console.log(`Found ${existingFileNumbers.size} existing records`);
    
    // Prepare data rows and filter out existing records
    const newRows = [];
    const newEmployeeData = [];
    
    data.forEach(emp => {
      const fileNumber = String(emp.fileNumber).trim();
      if (!existingFileNumbers.has(fileNumber)) {
        newRows.push([
          emp.fileNumber,
          emp.fullName,
          emp.nationality,
          emp.category,
          emp.basicSalary,
          emp.status
        ]);
        newEmployeeData.push(emp);
      }
    });
    
    console.log(`Adding ${newRows.length} new records`);
    
    // Sort new rows numerically by File#
    newRows.sort((rowA, rowB) => {
      const a = parseInt(String(rowA[0]).replace(/[^0-9]/g, ''), 10);
      const b = parseInt(String(rowB[0]).replace(/[^0-9]/g, ''), 10);
      if (isNaN(a) && isNaN(b)) return 0;
      if (isNaN(a)) return 1;
      if (isNaN(b)) return -1;
      return a - b;
    });
    
    // Write new data if there are any new rows
    if (newRows.length > 0) {
      const nextRow = lastRow + 1;
      const dataRange = sheet.getRange(nextRow, 1, newRows.length, headers.length);
      dataRange.setValues(newRows);
      
      // Apply formatting only to new rows
      applySheetFormatting(sheet, newRows.length, nextRow - 1);
      
      console.log(`Added ${newRows.length} new records`);
    } else {
      console.log('No new records to add');
    }
    
    // Add or refresh filter
    try {
      const existingFilter = sheet.getFilter();
      if (existingFilter) {
        existingFilter.remove();
      }
    } catch (e) {
      // No existing filter
    }
    
    // Re-create filter to include all rows
    if (sheet.getLastRow() > 1) {
      sheet.getRange(1, 1, 1, headers.length).createFilter();
    }
    
    // Auto-resize columns to fit data
    for (var c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
    
    console.log(`Sheet now has ${sheet.getLastRow() - 1} total employee records`);
    
    return {
      newRecords: newRows.length,
      totalRecords: sheet.getLastRow() - 1
    };
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

/**
 * Apply formatting to the sheet
 * @param {Sheet} sheet The sheet to format
 * @param {number} rowCount Number of rows to format
 * @param {number} startRow Starting row number (default: 2, after header)
 */
function applySheetFormatting(sheet, rowCount, startRow = 2) {
  if (rowCount === 0) return;
  
  // Apply alternating row colors
  const dataRange = sheet.getRange(startRow, 1, rowCount, 6);
  
  for (let i = 0; i < rowCount; i++) {
    const row = startRow + i;
    const range = sheet.getRange(row, 1, 1, 6);
    
    // Alternate background color
    if (i % 2 === 0) {
      range.setBackground('#f8f9fa'); // Light gray
    } else {
      range.setBackground('#ffffff'); // White
    }
  }
  
    // Set borders
    dataRange.setBorder(true, true, true, true, true, true);
    
    // Format numeric columns (File# and Basic Salary)
    if (rowCount > 0) {
      // Format File# column (1) and Basic Salary column (5) as numbers
      const fileNumberRange = sheet.getRange(startRow, 1, rowCount, 1);
      const basicSalaryRange = sheet.getRange(startRow, 5, rowCount, 1);
      
      // File numbers - ensure they're treated as text to preserve formatting
      fileNumberRange.setNumberFormat('@');
      
      // Basic Salary - format as currency
      basicSalaryRange.setNumberFormat('#,##0');
    }
    
    // Set text alignment
    const allDataRange = sheet.getRange(startRow, 1, rowCount, 6);
    allDataRange.setHorizontalAlignment('left');
    allDataRange.setVerticalAlignment('middle');
    
    // Color-code the status column based on status value
    if (rowCount > 0) {
      const statusRange = sheet.getRange(startRow, 6, rowCount, 1);
      const statusValues = sheet.getRange(startRow, 6, rowCount, 1).getValues();
      
      for (let i = 0; i < rowCount; i++) {
        const status = statusValues[i][0];
        const statusCell = sheet.getRange(startRow + i, 6);
        
        // Apply color coding based on status
        if (status === 'active' || status === 'Active') {
          statusCell.setBackground('#1F5A1C'); // Dark green
          statusCell.setFontWeight('bold');
          statusCell.setFontColor('white');
        } else if (status === 'inactive' || status === 'Inactive') {
          statusCell.setBackground('#FFB6C1'); // Light pink
          statusCell.setFontWeight('bold');
        } else if (status === 'on_leave' || status === 'On Leave') {
          statusCell.setBackground('#FFD700'); // Gold
          statusCell.setFontWeight('bold');
        } else {
          statusCell.setBackground('#DDD'); // Light gray for other statuses
        }
      }
    }
  
  // Bold the employee name column
  const nameColumnRange = sheet.getRange(startRow, 2, rowCount, 1);
  nameColumnRange.setFontWeight('bold');
}

/**
 * Create time-based trigger to auto-sync employee details
 * This will sync the data every day at 2 AM
 * Run this once to set up the automatic sync
 */
function createAutoSyncTrigger() {
  try {
    // Delete existing triggers for this function
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncEmployeeDetails') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create a daily trigger at 2 AM
    ScriptApp.newTrigger('syncEmployeeDetails')
      .timeBased()
      .atHour(2)
      .everyDays(1)
      .create();
    
    SpreadsheetApp.getUi().alert('Trigger Created', 
      'Auto-sync trigger created! Employee details will sync daily at 2 AM.', 
      SpreadsheetApp.getUi().ButtonSet.OK);
    
    console.log('Auto-sync trigger created successfully');
    
  } catch (error) {
    console.error('Error creating trigger:', error);
    SpreadsheetApp.getUi().alert('Error', 
      'Failed to create auto-sync trigger: ' + error.toString(), 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Remove auto-sync trigger
 */
function removeAutoSyncTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let deleted = 0;
    
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncEmployeeDetails') {
        ScriptApp.deleteTrigger(trigger);
        deleted++;
      }
    });
    
    SpreadsheetApp.getUi().alert('Trigger Removed', 
      `Removed ${deleted} auto-sync trigger(s).`, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    
    console.log(`Removed ${deleted} trigger(s)`);
    
  } catch (error) {
    console.error('Error removing trigger:', error);
    SpreadsheetApp.getUi().alert('Error', 
      'Failed to remove auto-sync trigger: ' + error.toString(), 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Menu setup when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Employee Manager')
    .addItem('🔄 Sync Employee Details', 'syncEmployeeDetails')
    .addSeparator()
    .addItem('⏰ Enable Auto-Sync', 'createAutoSyncTrigger')
    .addItem('⏸️ Disable Auto-Sync', 'removeAutoSyncTrigger')
    .addSeparator()
    .addItem('ℹ️ About', 'showInstructions')
    .addToUi();
}

/**
 * Show instructions
 */
function showInstructions() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📝 Employee Details Sync',
    'This tool automatically syncs employee data from your Next.js application to Google Sheets.\n\n' +
    '🔄 Sync Employee Details: Manually sync all employee data\n\n' +
    '⏰ Enable Auto-Sync: Set up daily automatic sync at 2 AM\n\n' +
    '⏸️ Disable Auto-Sync: Remove automatic sync trigger\n\n' +
    'Features:\n' +
    '• Automatically sorts by File#\n' +
    '• Auto-resizes columns to fit data\n' +
    '• Color-coded status (green=active, pink=inactive, gold=on leave)\n' +
    '• Alternating row colors for readability\n\n' +
    'The "Employees_Details" sheet will be created/updated with:\n' +
    '• File#\n' +
    '• Employees Full Name\n' +
    '• Nationality\n' +
    '• Category (Designation)\n' +
    '• Basic Salary\n' +
    '• Status',
    ui.ButtonSet.OK
  );
}

