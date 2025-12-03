// Google Sheets Script with EXTENSIVE DEBUGGING
// This version will show you exactly what's happening

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

// EXTENSIVE DEBUGGING VERSION of update function
function updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked) {
  try {
    console.log('🚀 STARTING UPDATE PROCESS');
    console.log('📄 Input Parameters:');
    console.log('   Employee File Number:', employeeFileNumber, '(Type:', typeof employeeFileNumber, ')');
    console.log('   Date String:', dateStr, '(Type:', typeof dateStr, ')');
    console.log('   Overtime Hours:', overtimeHours, '(Type:', typeof overtimeHours, ')');
    console.log('   Hours Worked:', hoursWorked, '(Type:', typeof hoursWorked, ')');
    
    const updateUrl = 'https://myapp.snd-ksa.online/api/timesheets/google-sheets/update';
    
    const payload = {
      employeeFileNumber: employeeFileNumber,
      date: dateStr,
      overtimeHours: overtimeHours,
      hoursWorked: hoursWorked
    };

    console.log('📦 Payload being sent:');
    console.log(JSON.stringify(payload, null, 2));

    console.log('🌐 Making API request to:', updateUrl);

    const response = UrlFetchApp.fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript-Debug'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('📋 Response Details:');
    console.log('   Status Code:', responseCode);
    console.log('   Response Text:', responseText);
    
    if (responseCode === 200) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCESS - Parsed Response:');
        console.log(JSON.stringify(result, null, 2));
        return { success: true, message: 'Updated successfully!', details: result };
      } catch (parseError) {
        console.log('⚠️  Response was 200 but JSON parsing failed:', parseError);
        return { success: true, message: 'Updated (response parsing issue)', details: responseText };
      }
    } else {
      console.log('❌ ERROR - Non-200 Response:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('   Parsed Error:', JSON.stringify(errorData, null, 2));
        return { success: false, message: errorData.error || 'Update failed', details: errorData };
      } catch (parseError) {
        console.log('   Raw Error Text:', responseText);
        return { success: false, message: 'Server error (see logs)', details: responseText };
      }
    }
  } catch (error) {
    console.log('💥 EXCEPTION in updateTimesheetInDatabase:');
    console.log('   Error Name:', error.name);
    console.log('   Error Message:', error.message);
    console.log('   Error Stack:', error.stack);
    return { success: false, message: 'Connection error: ' + error.toString(), details: error };
  }
}

// Trigger function when cells are edited
function onEdit(e) {
  try {
    console.log('🎯 onEdit triggered');
    
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const row = range.getRow();
    const col = range.getColumn();
    const value = range.getValue();

    console.log('📍 Edit Details:');
    console.log('   Sheet Name:', sheet.getName());
    console.log('   Row:', row);
    console.log('   Column:', col);
    console.log('   New Value:', value);

    // Check if edit was in the "appdatatimsheet" sheet
    if (sheet.getName() === "appdatatimsheet") {
      console.log('✅ Edit is in appdatatimsheet sheet');
      
      // Check if edit was in column C (Overtime Hours) or column B (Hours Worked)
      if ((col === 3 || col === 2) && row >= 9) {
        console.log('✅ Edit is in the correct column and row');
        
        // Get the employee file number from Time Card sheet
        const timeCardSheet = e.source.getSheetByName("Time Card");
        const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
        console.log('👤 Employee File Number from C5:', employeeFileNumber);
        
        // Get the date from the same row (column A)
        const dateCell = sheet.getRange(row, 1).getDisplayValue();
        console.log('📅 Date Cell Value:', dateCell);
        
        // Parse the formatted date back to YYYY-MM-DD format
        const dateMatch = dateCell.match(/(\w+), (\w+) (\d+), (\d+)/);
        console.log('🔍 Date Match Result:', dateMatch);
        
        if (dateMatch) {
          const monthName = dateMatch[2];
          const day = dateMatch[3];
          const year = dateMatch[4];
          
          console.log('📊 Parsed Date Components:');
          console.log('   Month Name:', monthName);
          console.log('   Day:', day);
          console.log('   Year:', year);
          
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
          const monthIndex = monthNames.indexOf(monthName);
          
          console.log('   Month Index:', monthIndex);
          
          if (monthIndex !== -1) {
            const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log('🗓️  Final Date String:', dateStr);
            
            // Get current values from the row
            const hoursWorked = sheet.getRange(row, 2).getValue();
            const overtimeHours = sheet.getRange(row, 3).getValue();
            
            console.log('📈 Current Values:');
            console.log('   Hours Worked:', hoursWorked);
            console.log('   Overtime Hours:', overtimeHours);
            
            // Update database
            console.log('🚀 Starting database update...');
            const result = updateTimesheetInDatabase(employeeFileNumber, dateStr, overtimeHours, hoursWorked);
            
            console.log('🏁 Update Result:', JSON.stringify(result, null, 2));
            
            // Show detailed result
            const ui = SpreadsheetApp.getUi();
            if (result.success) {
              const message = `✅ DATABASE UPDATE SUCCESSFUL!

📊 Updated Values:
• Employee: ${employeeFileNumber}
• Date: ${dateStr}
• Hours Worked: ${hoursWorked}
• Overtime Hours: ${overtimeHours}

🔗 Server Response:
${JSON.stringify(result.details, null, 2)}`;
              
              ui.alert('Success!', message, ui.ButtonSet.OK);
            } else {
              const message = `❌ DATABASE UPDATE FAILED!

📊 Attempted Values:
• Employee: ${employeeFileNumber}
• Date: ${dateStr}  
• Hours Worked: ${hoursWorked}
• Overtime Hours: ${overtimeHours}

❗ Error Details:
${result.message}

🔍 Full Details:
${JSON.stringify(result.details, null, 2)}

💡 Check the logs for more information.`;
              
              ui.alert('Update Failed', message, ui.ButtonSet.OK);
            }
          } else {
            console.log('❌ Invalid month name');
          }
        } else {
          console.log('❌ Could not parse date from cell');
        }
      } else {
        console.log('ℹ️  Edit not in target columns/rows');
      }
    } else {
      console.log('ℹ️  Edit not in appdatatimsheet');
    }
    
    // Also refresh when changing employee file number or month
    if (sheet.getName() === "Time Card") {
      if ((row === 5 && col === 3) || (row === 7 && col === 35)) { // C5 or AI7
        console.log('🔄 Refreshing data due to employee/month change');
        Utilities.sleep(1000);
        fetchTimesheetDataFromSheet();
      }
    }
  } catch (error) {
    console.log('💥 ERROR in onEdit:');
    console.log('   Error:', error.toString());
    console.log('   Stack:', error.stack);
    
    SpreadsheetApp.getUi().alert('Script Error', 
      `An error occurred in onEdit:\n\n${error.toString()}\n\nCheck the logs for details.`, 
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Timesheet Data (Debug)')
    .addItem('🔄 Refresh Timesheet Data', 'fetchTimesheetDataFromSheet')
    .addItem('ℹ️ How to Edit', 'showEditInstructions')
    .addItem('🐛 Test Update Function', 'testUpdateFunction')
    .addToUi();
}

function showEditInstructions() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    '📝 How to Edit Timesheet Data (Debug Mode)',
    'To update overtime hours or hours worked:\n\n' +
    '1. Click on any cell in the "Hours Worked" or "Overtime Hours" columns\n' +
    '2. Enter the new value\n' +
    '3. Press Enter\n' +
    '4. The database will be updated automatically!\n\n' +
    '🐛 DEBUG MODE: You will see detailed logs and results!\n' +
    '✅ Check the Apps Script logs (Ctrl+` or View > Logs) for detailed debugging information.',
    ui.ButtonSet.OK
  );
}

// Test function to manually test the update
function testUpdateFunction() {
  console.log('🧪 Running manual test of update function...');
  
  // Get employee file number from Time Card sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const timeCardSheet = spreadsheet.getSheetByName("Time Card");
  const employeeFileNumber = timeCardSheet.getRange("C5").getValue();
  
  // Test with a sample date
  const testDate = '2025-09-04';
  const testOvertimeHours = 2;
  const testHoursWorked = 8;
  
  console.log('🧪 Test Parameters:');
  console.log('   Employee:', employeeFileNumber);
  console.log('   Date:', testDate);
  console.log('   Overtime Hours:', testOvertimeHours);
  console.log('   Hours Worked:', testHoursWorked);
  
  const result = updateTimesheetInDatabase(employeeFileNumber, testDate, testOvertimeHours, testHoursWorked);
  
  const ui = SpreadsheetApp.getUi();
  const message = `🧪 Test Update Result:

Success: ${result.success}
Message: ${result.message}

Details:
${JSON.stringify(result.details, null, 2)}`;
  
  ui.alert('Test Results', message, ui.ButtonSet.OK);
}
