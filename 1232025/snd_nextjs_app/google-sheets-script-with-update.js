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

      appDataSheet.getRange("A8:C8").setBackground("#1f4e79");
      appDataSheet.getRange("A8:C8").setFontColor("white");
      appDataSheet.getRange("A8:C8").setFontWeight("bold");

      // Process data - API returns in correct order (August 1-31)
      const rows = [];
      for (let i = 0; i < data.data.length; i++) {
        const ts = data.data[i];
        const dateStr = ts.date; // This should be "2025-08-01", "2025-08-02", etc.
        
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
        rows.push([formattedDate, ts.hoursWorked, ts.overtimeHours]);
      }

      if (rows.length > 0) {
        // Display all rows starting from row 9
        appDataSheet.getRange(9, 1, rows.length, 3).setValues(rows);
        appDataSheet.getRange(9, 1, rows.length, 3).setBorder(true, true, true, true, true, true);

        // Highlight Fridays
        for (let i = 0; i < rows.length; i++) {
          const dateStr = data.data[i].date;
          const [year, month, day] = dateStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          
          if (date.getDay() === 5) { // Friday
            appDataSheet.getRange(9 + i, 1, 1, 3).setBackground("#FFA500");
          }
        }
        
        // Auto-resize columns
        appDataSheet.autoResizeColumns(1, 3);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Function to update database when overtime hours are changed
function updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked) {
  try {
    const updateUrl = 'https://myapp.snd-ksa.online/api/timesheets/google-sheets/update';
    
    const payload = {
      employeeFileNumber: employeeFileNumber,
      date: dateStr,
      overtimeHours: overtimeHours,
      hoursWorked: hoursWorked
    };

    console.log('Updating database with:', payload);

    const response = UrlFetchApp.fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    console.log('Response code:', response.getResponseCode());
    console.log('Response content:', response.getContentText());

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log('Database updated successfully:', result);
      return { success: true, message: 'Updated successfully!' };
    } else {
      const errorData = JSON.parse(response.getContentText());
      console.error('Database update failed:', errorData);
      return { success: false, message: errorData.error || 'Update failed' };
    }
  } catch (error) {
    console.error('Error updating database:', error);
    return { success: false, message: 'Connection error: ' + error.toString() };
  }
}

// Trigger function when cells are edited
function onEdit(e) {
  try {
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const row = range.getRow();
    const col = range.getColumn();
    const value = range.getValue();

    // Check if edit was in the "appdatatimsheet" sheet
    if (sheet.getName() === "appdatatimsheet") {
      // Check if edit was in column C (Overtime Hours) or column B (Hours Worked)
      if ((col === 3 || col === 2) && row >= 9) {
        // Get the employee file number from Time Card sheet
        const timeCardSheet = e.source.getSheetByName("Time Card");
        const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
        
        // Get the date from the same row (column A)
        const dateCell = sheet.getRange(row, 1).getDisplayValue();
        
        // Parse the formatted date back to YYYY-MM-DD format
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
            
            // Get current values from the row
            const hoursWorked = sheet.getRange(row, 2).getValue();
            const overtimeHours = sheet.getRange(row, 3).getValue();
            
            // Update database
            const result = updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked);
            
            if (result.success) {
              // Show success message
              SpreadsheetApp.getUi().alert('✅ Database updated successfully!');
            } else {
              // Show detailed error message
              SpreadsheetApp.getUi().alert('❌ Failed to update database.\n\nError: ' + result.message + '\n\nPlease check the logs for more details.');
            }
          }
        }
      }
    }
    
    // Also refresh when changing employee file number or month
    if (sheet.getName() === "Time Card") {
      if ((row === 5 && col === 3) || (row === 7 && col === 35)) { // C5 or AI7
        Utilities.sleep(1000);
        fetchTimesheetDataFromSheet();
      }
    }
  } catch (error) {
    console.error('Error in onEdit:', error);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Timesheet Data')
    .addItem('🔄 Refresh Timesheet Data', 'fetchTimesheetDataFromSheet')
    .addItem('ℹ️ How to Edit', 'showEditInstructions')
    .addToUi();
}

function showEditInstructions() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📝 How to Edit Timesheet Data',
    'To update overtime hours or hours worked:\n\n' +
    '1. Click on any cell in the "Hours Worked" or "Overtime Hours" columns\n' +
    '2. Enter the new value\n' +
    '3. Press Enter\n' +
    '4. The database will be updated automatically!\n\n' +
    '✅ You will see a confirmation message when the update is successful.',
    ui.ButtonSet.OK
  );
}
