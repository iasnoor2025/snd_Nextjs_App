// Final Working Google Sheets Script - No Triggers, Manual Updates Only
// This avoids the Google Apps Script trigger permission issues

function fetchTimesheetDataFromSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const timeCardSheet = spreadsheet.getSheetByName("Time Card");
    const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
    
    // Get the date from AI7 and convert it properly
    let month;
    const cellValue = timeCardSheet.getRange("AI7").getDisplayValue();
    console.log('Raw cell value:', cellValue);
    
    if (cellValue && cellValue !== '') {
      // Parse the display value directly
      const dateParts = cellValue.split('/');
      if (dateParts.length === 3) {
        const monthNum = parseInt(dateParts[0]);
        const day = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        // Use the month and year from the cell
        month = `${year}-${monthNum.toString().padStart(2, '0')}`;
        console.log('Parsed month:', month);
      } else {
        // Fallback to current month
        const today = new Date();
        const year = today.getFullYear();
        const monthNum = today.getMonth() + 1;
        month = `${year}-${monthNum.toString().padStart(2, '0')}`;
      }
    } else {
      // Fallback to current month
      const today = new Date();
      const year = today.getFullYear();
      const monthNum = today.getMonth() + 1;
      month = `${year}-${monthNum.toString().padStart(2, '0')}`;
    }

    const apiUrl = `https://myapp.snd-ksa.online/api/timesheets/google-sheets?month=${month}&employeeFileNumber=${employeeFileNumber}&limit=1000`;
    console.log('API URL:', apiUrl);

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript'
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      console.error("API Error:", response.getContentText());
      SpreadsheetApp.getUi().alert('API Error', 'Failed to fetch data: ' + response.getContentText(), SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }

    const data = JSON.parse(response.getContentText());
    console.log('API returned', data.data.length, 'records');
    
    if (data.data.length > 0) {
      console.log('First record date:', data.data[0].date);
      console.log('Last record date:', data.data[data.data.length - 1].date);
    }

    const appDataSheet = spreadsheet.getSheetByName("appdatatimsheet") || spreadsheet.insertSheet("appdatatimsheet");
    appDataSheet.clear();

    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      const employeeName = `${firstRecord.employee?.firstName || ''} ${firstRecord.employee?.lastName || ''}`.trim();
      const fileNumber = firstRecord.employee?.fileNumber || '';
      const nationality = firstRecord.employee?.nationality || '';
      const designation = firstRecord.employee?.designation || '';
      const basicSalary = firstRecord.employee?.basicSalary || '';
      const advanceMoney = firstRecord.employee?.advanceMoney || '';

      // Display employee information
      appDataSheet.getRange("A1").setValue("File #");
      appDataSheet.getRange("B1").setValue(fileNumber);
      appDataSheet.getRange("A2").setValue("Name");
      appDataSheet.getRange("B2").setValue(employeeName);
      appDataSheet.getRange("A3").setValue("Nationality");
      appDataSheet.getRange("B3").setValue(nationality);
      appDataSheet.getRange("A4").setValue("Designation");
      appDataSheet.getRange("B4").setValue(designation);
      appDataSheet.getRange("A5").setValue("Basic Salary");
      appDataSheet.getRange("B5").setValue(basicSalary);
      appDataSheet.getRange("A6").setValue("Advance Money");
      appDataSheet.getRange("B6").setValue(advanceMoney);

      appDataSheet.getRange("A1:B6").setBackground("#90EE90");

      // Set table headers
      appDataSheet.getRange("A8").setValue("Date");
      appDataSheet.getRange("B8").setValue("Hours Worked");
      appDataSheet.getRange("C8").setValue("Overtime Hours");
      appDataSheet.getRange("D8").setValue("Actions"); // Add actions column

      appDataSheet.getRange("A8:D8").setBackground("#1f4e79");
      appDataSheet.getRange("A8:D8").setFontColor("white");
      appDataSheet.getRange("A8:D8").setFontWeight("bold");

      // Process data
      const rows = [];
      for (let i = 0; i < data.data.length; i++) {
        const ts = data.data[i];
        const dateStr = ts.date;
        
        // Parse the date string directly
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[date.getMonth()];
        const dayNum = date.getDate();
        const yearNum = date.getFullYear();

        const formattedDate = `${dayName}, ${monthName} ${dayNum}, ${yearNum}`;
        rows.push([formattedDate, ts.hoursWorked, ts.overtimeHours, 'Click Update →']);
      }

      if (rows.length > 0) {
        // Display all rows starting from row 9
        appDataSheet.getRange(9, 1, rows.length, 4).setValues(rows);
        appDataSheet.getRange(9, 1, rows.length, 4).setBorder(true, true, true, true, true, true);

        // Highlight Fridays
        for (let i = 0; i < rows.length; i++) {
          const dateStr = data.data[i].date;
          const [year, month, day] = dateStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          if (date.getDay() === 5) { // Friday
            appDataSheet.getRange(9 + i, 1, 1, 4).setBackground("#FFA500");
          }
        }
        
        // Make actions column blue and clickable-looking
        appDataSheet.getRange(9, 4, rows.length, 1).setBackground("#4285f4");
        appDataSheet.getRange(9, 4, rows.length, 1).setFontColor("white");
        appDataSheet.getRange(9, 4, rows.length, 1).setFontWeight("bold");
        
        // Auto-resize columns
        appDataSheet.autoResizeColumns(1, 4);
      }
      
      SpreadsheetApp.getUi().alert('✅ Data Loaded!', 
        `Loaded ${rows.length} timesheet records for employee ${fileNumber}.\n\n` +
        `📝 To update values:\n` +
        `1. Edit Hours Worked or Overtime Hours\n` +
        `2. Click "Update Selected Row" from the menu\n` +
        `3. Select the row you want to update`, 
        SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    console.error("Error:", error);
    SpreadsheetApp.getUi().alert('Error', 'Failed to load data: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// Manual update function - no triggers needed
function updateSelectedRow() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const appDataSheet = spreadsheet.getSheetByName("appdatatimsheet");
    
    if (!appDataSheet) {
      SpreadsheetApp.getUi().alert('Error', 'Please load timesheet data first!', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Get the currently selected cell
    const selection = appDataSheet.getSelection();
    const activeRange = selection.getActiveRange();
    const row = activeRange.getRow();
    
    if (row < 9) {
      SpreadsheetApp.getUi().alert('Invalid Selection', 'Please select a row with timesheet data (row 9 or below).', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    // Get employee file number from Time Card sheet
    const timeCardSheet = spreadsheet.getSheetByName("Time Card");
    const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
    
    // Get data from the selected row
    const dateCell = appDataSheet.getRange(row, 1).getDisplayValue();
    const hoursWorked = appDataSheet.getRange(row, 2).getValue();
    const overtimeHours = appDataSheet.getRange(row, 3).getValue();
    
    console.log('Manual update for row:', row);
    console.log('Date:', dateCell);
    console.log('Hours:', hoursWorked);
    console.log('Overtime:', overtimeHours);
    
    // Parse the formatted date back to YYYY-MM-DD format
    const dateMatch = dateCell.match(/(\w+), (\w+) (\d+), (\d+)/);
    if (!dateMatch) {
      SpreadsheetApp.getUi().alert('Error', 'Could not parse date from selected row.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const monthName = dateMatch[2];
    const day = dateMatch[3];
    const year = dateMatch[4];
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(monthName);
    
    if (monthIndex === -1) {
      SpreadsheetApp.getUi().alert('Error', 'Invalid month name in date.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Show confirmation dialog
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('Confirm Update', 
      `Update database with these values?\n\n` +
      `Employee: ${employeeFileNumber}\n` +
      `Date: ${dateStr}\n` +
      `Hours Worked: ${hoursWorked}\n` +
      `Overtime Hours: ${overtimeHours}`, 
      ui.ButtonSet.YES_NO);
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    // Perform the update
    const result = updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked);
    
    if (result.success) {
      // Highlight the updated row temporarily
      appDataSheet.getRange(row, 1, 1, 4).setBackground("#90EE90");
      
      ui.alert('✅ Success!', 
        `Database updated successfully!\n\n` +
        `Employee: ${employeeFileNumber}\n` +
        `Date: ${dateStr}\n` +
        `Hours Worked: ${hoursWorked}\n` +
        `Overtime Hours: ${overtimeHours}`, 
        ui.ButtonSet.OK);
        
      // Reset background after 2 seconds
      Utilities.sleep(2000);
      
      // Restore original background (Friday highlighting)
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (date.getDay() === 5) { // Friday
        appDataSheet.getRange(row, 1, 1, 4).setBackground("#FFA500");
      } else {
        appDataSheet.getRange(row, 1, 1, 4).setBackground("white");
      }
    } else {
      ui.alert('❌ Update Failed', 
        `Failed to update database:\n\n${result.message}\n\nCheck the logs for details.`, 
        ui.ButtonSet.OK);
    }
    
  } catch (error) {
    console.error('Error in updateSelectedRow:', error);
    SpreadsheetApp.getUi().alert('Error', 'Update failed: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// Simple update function without complex error handling
function updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked) {
  try {
    const updateUrl = 'https://myapp.snd-ksa.online/api/timesheets/google-sheets/update';
    
    const payload = {
      employeeFileNumber: employeeFileNumber,
      date: dateStr,
      overtimeHours: overtimeHours,
      hoursWorked: hoursWorked
    };

    console.log('Sending update:', JSON.stringify(payload, null, 2));

    const response = UrlFetchApp.fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript-Manual'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Response code:', responseCode);
    console.log('Response text:', responseText);
    
    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      console.log('Success:', result);
      return { success: true, message: 'Updated successfully!', details: result };
    } else {
      const errorData = JSON.parse(responseText);
      console.log('Error:', errorData);
      return { success: false, message: errorData.error || 'Update failed', details: errorData };
    }
  } catch (error) {
    console.error('Exception:', error);
    return { success: false, message: error.toString(), details: error };
  }
}

// Bulk update function for multiple rows
function updateAllEditedRows() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert('Bulk Update', 
      'This will update ALL rows in the timesheet. Are you sure?', 
      ui.ButtonSet.YES_NO);
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const appDataSheet = spreadsheet.getSheetByName("appdatatimsheet");
    const timeCardSheet = spreadsheet.getSheetByName("Time Card");
    const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
    
    if (!appDataSheet) {
      ui.alert('Error', 'Please load timesheet data first!', ui.ButtonSet.OK);
      return;
    }
    
    // Get all data rows
    const lastRow = appDataSheet.getLastRow();
    let successCount = 0;
    let errorCount = 0;
    
    for (let row = 9; row <= lastRow; row++) {
      const dateCell = appDataSheet.getRange(row, 1).getDisplayValue();
      const hoursWorked = appDataSheet.getRange(row, 2).getValue();
      const overtimeHours = appDataSheet.getRange(row, 3).getValue();
      
      // Parse date
      const dateMatch = dateCell.match(/(\w+), (\w+) (\d+), (\d+)/);
      if (dateMatch) {
        const monthName = dateMatch[2];
        const day = dateMatch[3];
        const year = dateMatch[4];
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex !== -1) {
          const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
          
          const result = updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked);
          
          if (result.success) {
            successCount++;
            appDataSheet.getRange(row, 4).setValue('✅ Updated');
            appDataSheet.getRange(row, 4).setBackground('#90EE90');
          } else {
            errorCount++;
            appDataSheet.getRange(row, 4).setValue('❌ Failed');
            appDataSheet.getRange(row, 4).setBackground('#ff9999');
          }
          
          // Small delay to avoid rate limiting
          Utilities.sleep(100);
        }
      }
    }
    
    ui.alert('Bulk Update Complete', 
      `✅ Successfully updated: ${successCount} rows\n❌ Failed: ${errorCount} rows`, 
      ui.ButtonSet.OK);
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    SpreadsheetApp.getUi().alert('Error', 'Bulk update failed: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Timesheet Manager')
    .addItem('🔄 Load Timesheet Data', 'fetchTimesheetDataFromSheet')
    .addSeparator()
    .addItem('💾 Update Selected Row', 'updateSelectedRow')
    .addItem('🔄 Update All Rows', 'updateAllEditedRows')
    .addSeparator()
    .addItem('ℹ️ How to Use', 'showInstructions')
    .addToUi();
}

function showInstructions() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📝 How to Use Timesheet Manager',
    '1️⃣ Load Data: Click "Load Timesheet Data" to fetch current data\n\n' +
    '2️⃣ Edit Values: Change any Hours Worked or Overtime Hours\n\n' +
    '3️⃣ Update Single Row:\n' +
    '   • Click on the row you want to update\n' +
    '   • Click "Update Selected Row"\n' +
    '   • Confirm the update\n\n' +
    '4️⃣ Update All Rows: Click "Update All Rows" to save all changes\n\n' +
    '✅ No permission issues - everything works manually!',
    ui.ButtonSet.OK
  );
}
