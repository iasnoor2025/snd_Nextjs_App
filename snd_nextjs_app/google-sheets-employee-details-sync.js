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
    updateEmployeeDetailsSheet(employeeDetailsSheet, formattedData);
    
    SpreadsheetApp.getUi().alert('Sync Complete', 
      `Successfully synced ${formattedData.length} employee records to Employees_Details sheet.`, 
      SpreadsheetApp.getUi().ButtonSet.OK);
    
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
 */
function updateEmployeeDetailsSheet(sheet, data) {
  try {
    // Clear existing data
    sheet.clear();
    
    // Set headers
    const headers = ['File#', 'Employees Full Name', 'Nationality', 'Category', 'Basic Salary', 'Status'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1f4e79'); // Dark blue
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    
    // Prepare data rows
    const rows = data.map(emp => [
      emp.fileNumber,
      emp.fullName,
      emp.nationality,
      emp.category,
      emp.basicSalary,
      emp.status
    ]);
    
    // Write data if there are rows
    if (rows.length > 0) {
      const dataRange = sheet.getRange(2, 1, rows.length, headers.length);
      dataRange.setValues(rows);
      
      // Apply formatting
      applySheetFormatting(sheet, data.length);
    }
    
    // Add filter to header row
    sheet.getRange(1, 1, 1, headers.length).createFilter();
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    console.log(`Updated sheet with ${rows.length} employee records`);
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

/**
 * Apply formatting to the sheet
 */
function applySheetFormatting(sheet, rowCount) {
  if (rowCount === 0) return;
  
  // Apply alternating row colors
  const dataRange = sheet.getRange(2, 1, rowCount, 6);
  
  for (let i = 0; i < rowCount; i++) {
    const row = i + 2; // Start from row 2 (after headers)
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
      const fileNumberRange = sheet.getRange(2, 1, rowCount, 1);
      const basicSalaryRange = sheet.getRange(2, 5, rowCount, 1);
      
      // File numbers - ensure they're treated as text to preserve formatting
      fileNumberRange.setNumberFormat('@');
      
      // Basic Salary - format as currency
      basicSalaryRange.setNumberFormat('#,##0');
    }
    
    // Set text alignment
    const allDataRange = sheet.getRange(2, 1, rowCount, 6);
    allDataRange.setHorizontalAlignment('left');
    allDataRange.setVerticalAlignment('middle');
    
    // Color-code the status column based on status value
    if (rowCount > 0) {
      const statusRange = sheet.getRange(2, 6, rowCount, 1);
      const statusValues = sheet.getRange(2, 6, rowCount, 1).getValues();
      
      for (let i = 0; i < rowCount; i++) {
        const status = statusValues[i][0];
        const statusCell = sheet.getRange(i + 2, 6);
        
        // Apply color coding based on status
        if (status === 'active' || status === 'Active') {
          statusCell.setBackground('#90EE90'); // Light green
          statusCell.setFontWeight('bold');
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
  const nameColumnRange = sheet.getRange(2, 2, rowCount, 1);
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
    'The "Employees_Details" sheet will be created/updated with:\n' +
    '• File#\n' +
    '• Employees Full Name\n' +
    '• Nationality\n' +
    '• Category (Designation)\n' +
    '• Basic Salary\n' +
    '• Status (with color coding: green=active, pink=inactive, gold=on leave)',
    ui.ButtonSet.OK
  );
}

