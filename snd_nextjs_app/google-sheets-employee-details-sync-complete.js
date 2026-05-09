// =============================================================================
// COMPLETE GOOGLE APPS SCRIPT - EMPLOYEE DETAILS SYNC + ALL PAYROLL FUNCTIONS
// =============================================================================

// =============================================================================
// PART 1: EMPLOYEE DETAILS SYNC FROM NEXT.JS API
// =============================================================================

/**
 * Main function to sync employee details to Google Sheets
 */
function syncEmployeeDetails() {
  try {
    console.log('=== Starting Employee Details Sync ===');
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let employeeDetailsSheet = spreadsheet.getSheetByName("Employees_Details");
    if (!employeeDetailsSheet) {
      employeeDetailsSheet = spreadsheet.insertSheet("Employees_Details");
      console.log('Created new sheet: Employees_Details');
    }
    
    const employeeData = fetchEmployeesFromAPI();
    
    if (!employeeData || employeeData.length === 0) {
      SpreadsheetApp.getUi().alert('No Data', 'No employee data found to sync.', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    console.log(`Fetched ${employeeData.length} employees from API`);
    
    const formattedData = formatEmployeeData(employeeData);
    const result = updateEmployeeDetailsSheet(employeeDetailsSheet, formattedData);
    
    let alertMessage = result.newRecords > 0
      ? `Sync Complete!\n\nAdded ${result.newRecords} new record(s).\nTotal records: ${result.totalRecords}`
      : `Sync Complete!\n\nNo new records to add.\nTotal records: ${result.totalRecords}`;
    if (result.removedDuplicateRows > 0) {
      alertMessage += `\n\nRemoved ${result.removedDuplicateRows} duplicate row(s) (same File#).`;
    }
    
    SpreadsheetApp.getUi().alert('Sync Complete', alertMessage, SpreadsheetApp.getUi().ButtonSet.OK);
    console.log('=== Employee Details Sync Complete ===');
    
  } catch (error) {
    console.error('Error during sync:', error);
    SpreadsheetApp.getUi().alert('Sync Error', 'Failed to sync employee details: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function fetchEmployeesFromAPI() {
  try {
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
 * Same logical employee must map to one key whether the value came from the API
 * (string with leading zeros) or from Sheets (numeric cell).
 */
function normalizeEmployeeFileKey(raw) {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  return s.toLowerCase();
}

function dedupeFormattedEmployeesByFileKey(data) {
  const out = [];
  const seen = new Set();
  data.forEach(function (emp) {
    const key = normalizeEmployeeFileKey(emp.fileNumber);
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(emp);
  });
  return out;
}

/**
 * Removes extra sheet rows that share the same normalized File# (keeps first row).
 */
function removeDuplicateEmployeeRowsByFileKey(sheet, writeColumns) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const numDataRows = lastRow - 1;
  const values = sheet.getRange(2, 1, numDataRows, writeColumns).getValues();
  const keyToFirstRow = new Map();
  const rowsToDelete = [];

  for (var i = 0; i < values.length; i++) {
    var sheetRow = 2 + i;
    var key = normalizeEmployeeFileKey(values[i][0]);
    if (!key) continue;
    if (keyToFirstRow.has(key)) {
      rowsToDelete.push(sheetRow);
    } else {
      keyToFirstRow.set(key, sheetRow);
    }
  }

  rowsToDelete.sort(function (a, b) {
    return b - a;
  });
  rowsToDelete.forEach(function (r) {
    sheet.deleteRow(r);
  });
  return rowsToDelete.length;
}

function formatEmployeeData(employees) {
  return employees.map(emp => {
    const firstName = emp.first_name || emp.firstName || '';
    const middleName = emp.middle_name || emp.middleName || '';
    const lastName = emp.last_name || emp.lastName || '';
    
    let fullName = [firstName, middleName, lastName]
      .filter(name => name && name.trim())
      .join(' ');
    
    if (!fullName) {
      fullName = emp.fullName || emp.name || 'Unknown';
    }
    
    const fileNumber = emp.file_number || emp.fileNumber || emp.employee_id || '';
    const nationality = emp.nationality || '';
    const category = emp.desig_name || emp.designation || emp.category || '';
    
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
    
    // Normalize status labels for display
    let statusRaw = (emp.status || '').toString().trim().toLowerCase();
    let status;
    switch (statusRaw) {
      case 'active':
        status = 'Active';
        break;
      case 'on_leave':
      case 'on-leave':
      case 'on leave':
        status = 'On Leave';
        break;
      case 'inactive':
        status = 'Inactive';
        break;
      default:
        status = emp.status || '';
    }
    
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

function updateEmployeeDetailsSheet(sheet, data) {
  try {
    const WRITE_COLUMNS = 12;
    const headers = ['File#', 'Employees Full Name', 'Nationality', 'Category', 'Basic Salary', 'Food Money', 'OT Rates', 'Gosi', 'Advance', 'Other', 'Bonus', 'Status'];
    
    let lastRow = sheet.getLastRow();
    const hasData = lastRow > 0;
    
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, WRITE_COLUMNS).setValues([headers]);
      const headerRange = sheet.getRange(1, 1, 1, WRITE_COLUMNS);
      headerRange.setBackground('#1f4e79');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      console.log('Initialized sheet with headers');
    }

    data = dedupeFormattedEmployeesByFileKey(data);
    var removedDuplicateRows = 0;
    if (sheet.getLastRow() > 1) {
      removedDuplicateRows = removeDuplicateEmployeeRowsByFileKey(sheet, WRITE_COLUMNS);
      if (removedDuplicateRows > 0) {
        console.log('Removed duplicate sheet rows by File#:', removedDuplicateRows);
      }
    }
    lastRow = sheet.getLastRow();
    
    // Build map of existing rows: normalized fileNumber -> { rowIndex, values }
    const existingFileNumbers = new Set();
    const existingMap = new Map();
    if (lastRow > 1) {
      const numDataRows = lastRow - 1;
      const existingRange = sheet.getRange(2, 1, numDataRows, WRITE_COLUMNS).getValues();
      for (let i = 0; i < existingRange.length; i++) {
        const row = existingRange[i];
        const fileNum = row[0];
        if (fileNum) {
          const rowIndex = 2 + i; // actual row in sheet
          const mapKey = normalizeEmployeeFileKey(fileNum);
          if (!mapKey) continue;
          existingFileNumbers.add(mapKey);
          // Store only the columns we auto-manage: 1..5 and 12
          existingMap.set(mapKey, {
            rowIndex,
            a: row[0], // File#
            b: row[1], // Name
            c: row[2], // Nationality
            d: row[3], // Category
            e: row[4], // Basic Salary
            l: row[11], // Status (col 12)
          });
        }
      }
    }
    
    console.log(`Found ${existingFileNumbers.size} existing records`);
    
    const newRows = [];
    let updatedCells = 0;
    
    data.forEach(emp => {
      const mapKey = normalizeEmployeeFileKey(emp.fileNumber);
      if (!mapKey) {
        console.warn('Skipping employee with empty File# after normalize:', emp.fullName || '');
        return;
      }
      if (!existingFileNumbers.has(mapKey)) {
        newRows.push([
          emp.fileNumber,
          emp.fullName,
          emp.nationality,
          emp.category,
          emp.basicSalary,
          '',
          '',
          '',
          '',
          '',
          '',
          emp.status
        ]);
      }
      else {
        // Update only changed cells for existing row
        const current = existingMap.get(mapKey);
        if (current) {
          // Columns: 1..5 and 12
          if (String(current.a || '') !== String(emp.fileNumber || '')) {
            sheet.getRange(current.rowIndex, 1).setValue(emp.fileNumber); updatedCells++;
          }
          if (String(current.b || '') !== String(emp.fullName || '')) {
            sheet.getRange(current.rowIndex, 2).setValue(emp.fullName); updatedCells++;
          }
          if (String(current.c || '') !== String(emp.nationality || '')) {
            sheet.getRange(current.rowIndex, 3).setValue(emp.nationality); updatedCells++;
          }
          if (String(current.d || '') !== String(emp.category || '')) {
            sheet.getRange(current.rowIndex, 4).setValue(emp.category); updatedCells++;
          }
          if (String(current.e || '') !== String(emp.basicSalary || '')) {
            sheet.getRange(current.rowIndex, 5).setValue(emp.basicSalary); updatedCells++;
          }
          if (String(current.l || '') !== String(emp.status || '')) {
            sheet.getRange(current.rowIndex, 12).setValue(emp.status); updatedCells++;
            // Re-color status cell
            formatStatusCell(sheet, current.rowIndex);
          }
        }
      }
    });
    
    console.log(`Adding ${newRows.length} new records`);
    
    newRows.sort((rowA, rowB) => {
      const a = parseInt(String(rowA[0]).replace(/[^0-9]/g, ''), 10);
      const b = parseInt(String(rowB[0]).replace(/[^0-9]/g, ''), 10);
      if (isNaN(a) && isNaN(b)) return 0;
      if (isNaN(a)) return 1;
      if (isNaN(b)) return -1;
      return a - b;
    });
    
    if (newRows.length > 0) {
      let nextRow = 2;
      
      if (hasData) {
        let foundEmptyRow = false;
        for (let row = 2; row <= lastRow; row++) {
          const fileNumberCell = sheet.getRange(row, 1).getValue();
          if (!fileNumberCell || String(fileNumberCell).trim() === '') {
            nextRow = row;
            foundEmptyRow = true;
            console.log(`Found empty row at ${nextRow}`);
            break;
          }
        }
        
        if (!foundEmptyRow) {
          nextRow = lastRow + 1;
          console.log(`Appending to end at row ${nextRow}`);
        }
      }
      
      const dataRange = sheet.getRange(nextRow, 1, newRows.length, WRITE_COLUMNS);
      dataRange.setValues(newRows);
      applySheetFormatting(sheet, newRows.length, nextRow);
      console.log(`Added ${newRows.length} new records starting at row ${nextRow}`);
    }
    
    try {
      const existingFilter = sheet.getFilter();
      if (existingFilter) {
        existingFilter.remove();
      }
    } catch (e) {
    }
    
    if (sheet.getLastRow() > 1) {
      sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), WRITE_COLUMNS)).createFilter();
    }
    
    for (var c = 1; c <= WRITE_COLUMNS; c++) {
      sheet.autoResizeColumn(c);
    }
    
    console.log(`Sheet now has ${sheet.getLastRow() - 1} total employee records`);
    
    return {
      newRecords: newRows.length,
      updatedCells,
      totalRecords: sheet.getLastRow() - 1,
      removedDuplicateRows: removedDuplicateRows
    };
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    throw error;
  }
}

// Format only the status cell for a single row
function formatStatusCell(sheet, rowIndex) {
  const cell = sheet.getRange(rowIndex, 12);
  const status = (cell.getDisplayValue() || '').toString();
  if (status === 'Active') {
    cell.setBackground('#1F5A1C').setFontColor('white').setFontWeight('bold');
  } else if (status === 'Inactive') {
    cell.setBackground('#FFB6C1').setFontWeight('bold');
  } else if (status === 'On Leave') {
    cell.setBackground('#FFD700').setFontWeight('bold');
  } else {
    cell.setBackground('#DDD');
  }
}

function applySheetFormatting(sheet, rowCount, startRow = 2) {
  if (rowCount === 0) return;
  
  const dataRange = sheet.getRange(startRow, 1, rowCount, 12);
  
  for (let i = 0; i < rowCount; i++) {
    const row = startRow + i;
    const range = sheet.getRange(row, 1, 1, 12);
    
    if (i % 2 === 0) {
      range.setBackground('#f8f9fa');
    } else {
      range.setBackground('#ffffff');
    }
  }
  
  dataRange.setBorder(true, true, true, true, true, true);
  
  if (rowCount > 0) {
    const fileNumberRange = sheet.getRange(startRow, 1, rowCount, 1);
    const basicSalaryRange = sheet.getRange(startRow, 5, rowCount, 1);
    fileNumberRange.setNumberFormat('@');
    basicSalaryRange.setNumberFormat('#,##0');
  }
  
  const allDataRange = sheet.getRange(startRow, 1, rowCount, 12);
  allDataRange.setHorizontalAlignment('left');
  allDataRange.setVerticalAlignment('middle');
  
  if (rowCount > 0) {
    const statusValues = sheet.getRange(startRow, 12, rowCount, 1).getValues();
    
    for (let i = 0; i < rowCount; i++) {
      const status = statusValues[i][0];
      const statusCell = sheet.getRange(startRow + i, 12);
      
      if (status === 'active' || status === 'Active') {
        statusCell.setBackground('#1F5A1C');
        statusCell.setFontWeight('bold');
        statusCell.setFontColor('white');
      } else if (status === 'inactive' || status === 'Inactive') {
        statusCell.setBackground('#FFB6C1');
        statusCell.setFontWeight('bold');
      } else if (status === 'on_leave' || status === 'On Leave') {
        statusCell.setBackground('#FFD700');
        statusCell.setFontWeight('bold');
      } else {
        statusCell.setBackground('#DDD');
      }
    }
  }
  
  const nameColumnRange = sheet.getRange(startRow, 2, rowCount, 1);
  nameColumnRange.setFontWeight('bold');
}

function createAutoSyncTrigger() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncEmployeeDetails') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    ScriptApp.newTrigger('syncEmployeeDetails')
      .timeBased()
      .atHour(2)
      .everyDays(1)
      .create();
    
    SpreadsheetApp.getUi().alert('Trigger Created', 'Auto-sync trigger created! Employee details will sync daily at 2 AM.', SpreadsheetApp.getUi().ButtonSet.OK);
    console.log('Auto-sync trigger created successfully');
    
  } catch (error) {
    console.error('Error creating trigger:', error);
    SpreadsheetApp.getUi().alert('Error', 'Failed to create auto-sync trigger: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

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
    
    SpreadsheetApp.getUi().alert('Trigger Removed', `Removed ${deleted} auto-sync trigger(s).`, SpreadsheetApp.getUi().ButtonSet.OK);
    console.log(`Removed ${deleted} trigger(s)`);
    
  } catch (error) {
    console.error('Error removing trigger:', error);
    SpreadsheetApp.getUi().alert('Error', 'Failed to remove auto-sync trigger: ' + error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

// =============================================================================
// PART 2: PAYROLL MANAGEMENT FUNCTIONS
// =============================================================================

function calculateDeductionForRange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const advanceSheet = ss.getSheetByName("Advance");
  const deductionSheet = ss.getSheetByName("Deduction");

  if (!advanceSheet || !deductionSheet) return;

  const lastRow = advanceSheet.getLastRow();
  if (lastRow < 2) return;

  const refValues = advanceSheet.getRange("A2:A" + lastRow).getValues();
  const mainValues = advanceSheet.getRange("B2:B" + lastRow).getValues();

  const deductionLastRow = deductionSheet.getLastRow();
  const deductions = deductionSheet.getRange("A2:B" + deductionLastRow).getValues();

  const results = refValues.map(([ref], i) => {
    if (!ref) return [""];
    const totalDeduction = deductions
      .filter(d => d[0] === ref)
      .reduce((acc, d) => acc + Number(d[1] || 0), 0);

    const newValue = Number(mainValues[i][0]) - totalDeduction;
    return [isNaN(newValue) ? 0 : newValue];
  });

  advanceSheet.getRange(2, 3, results.length, 1).setValues(results);
}

function getEmployeeDetail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const timeCardSheet = ss.getSheetByName("Time Card");
  const employeesSheet = ss.getSheetByName("Employees_Details");

  if (!timeCardSheet || !employeesSheet) return;

  const empId = timeCardSheet.getRange("C5").getValue();
  const employeesData = employeesSheet.getRange("A:F").getValues();

  const employee = employeesData.find(row => row[0] === empId) || [];

  const [ , name, nationality, category, basicSalary, foodAllowance ] = employee;

  timeCardSheet.getRange("C6").setValue(name || "Not Found");
  timeCardSheet.getRange("C7").setValue(nationality || "");
  timeCardSheet.getRange("C8").setValue(category || "");
  timeCardSheet.getRange("C9").setValue(basicSalary || "Not Found");
  timeCardSheet.getRange("I9").setValue(foodAllowance || "0");
}

function populateAdvanceDetails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const empSheet = ss.getSheetByName("Employees_Details");
  const advanceSheet = ss.getSheetByName("Advance");

  if (!empSheet || !advanceSheet) return;

  const empIDs = empSheet.getRange("A2:A" + empSheet.getLastRow()).getValues();
  const advanceData = advanceSheet.getRange("A2:C" + advanceSheet.getLastRow()).getValues();

  const results = empIDs.map(([empId]) => {
    const match = advanceData.find(row => row[0] === empId);
    return [match ? match[2] : ""];
  });

  empSheet.getRange(2, 9, results.length, 1).setValues(results);
}

function fetchEmployeeData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summarySheet = ss.getSheetByName("Auto Time log");
  const timeCardSheet = ss.getSheetByName("Time Card");

  if (!summarySheet || !timeCardSheet) return;

  const employeeCode = timeCardSheet.getRange("C5").getValue();
  const rawDate = timeCardSheet.getRange("AI7").getValue();

  if (!employeeCode) {
    SpreadsheetApp.getUi().alert("Employee code in C5 is empty.");
    return;
  }
  if (!(rawDate instanceof Date)) {
    SpreadsheetApp.getUi().alert("Invalid date in AI7. Please enter a valid date.");
    return;
  }

  let year = rawDate.getFullYear();
  let month = rawDate.getMonth() + 1;
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const formattedMonth = month < 10 ? `0${month}` : month.toString();
  const targetMonth = `${year}-${formattedMonth}`;

  const folderId = "1RGOIS8qFeiLN6XLSTnvjSbGQCij7pOc-";
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByName(employeeCode);

  if (!files.hasNext()) {
    SpreadsheetApp.getUi().alert(`No file found for employee code: ${employeeCode}`);
    return;
  }

  const file = files.next();
  const empSS = SpreadsheetApp.open(file);
  const monthSheet = empSS.getSheetByName(targetMonth);

  if (!monthSheet) {
    SpreadsheetApp.getUi().alert(`No sheet named "${targetMonth}" found in the employee file.`);
    return;
  }

  const data = monthSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert(`No data rows found in sheet "${targetMonth}".`);
    return;
  }

  const dataWithoutHeader = data.slice(1);

  const lastRow = summarySheet.getLastRow();
  if (lastRow > 1) {
    summarySheet.getRange(2, 1, lastRow - 1, summarySheet.getLastColumn()).clearContent();
  }

  summarySheet.getRange(2, 2, dataWithoutHeader.length, dataWithoutHeader[0].length).setValues(dataWithoutHeader);
}

function updateSalaryIncrement() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const empSheet = ss.getSheetByName("Employees_Details");
  const incSheet = ss.getSheetByName("Salary Increment");

  if (!empSheet || !incSheet) return;

  const empData = empSheet.getDataRange().getValues();
  const incData = incSheet.getDataRange().getValues();

  const empHeaders = empData[0];
  const incHeaders = incData[0];

  const empFileIdx = empHeaders.indexOf("File");
  const empSalaryIdx = empHeaders.indexOf("Basic Salary");
  const incFileIdx = incHeaders.indexOf("File");
  const incAmountIdx = incHeaders.indexOf("Increment Amount");
  const incTimestampIdx = incHeaders.indexOf("Timestamp");

  const incrementsMap = new Map();
  for (let i = 1; i < incData.length; i++) {
    const fileId = incData[i][incFileIdx];
    const amount = incData[i][incAmountIdx];
    const timestamp = incData[i][incTimestampIdx];
    if (fileId && amount && !timestamp) {
      incrementsMap.set(fileId, { amount: amount, row: i + 1 });
    }
  }

  for (let i = 1; i < empData.length; i++) {
    const fileId = empData[i][empFileIdx];
    const currentSalary = empData[i][empSalaryIdx];

    if (incrementsMap.has(fileId)) {
      const { amount, row } = incrementsMap.get(fileId);
      empSheet.getRange(i + 1, empSalaryIdx + 1).setValue(currentSalary + amount);
      incSheet.getRange(row, incTimestampIdx + 1).setValue(new Date());
    }
  }
}

function updateBonusCheckboxBasedOnMonth() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bonusSheet = ss.getSheetByName("Bonus");
  const empSheet = ss.getSheetByName("Employees_Details");
  const timeCardSheet = ss.getSheetByName("Time Card");

  if (!bonusSheet || !empSheet || !timeCardSheet) return;

  const selectedDate = timeCardSheet.getRange("AI7").getValue();
  if (!(selectedDate instanceof Date)) return;

  const selectedMonth = selectedDate.getMonth();

  const bonusData = bonusSheet.getDataRange().getValues();
  const empData = empSheet.getDataRange().getValues();

  const bonusDateIdx = bonusData[0].indexOf("Date");
  const bonusFileIdx = bonusData[0].indexOf("File");
  const empFileIdx = empData[0].indexOf("File");
  const empBonusColIdx = empData[0].indexOf("Bonus");

  for (let i = 1; i < empData.length; i++) {
    empSheet.getRange(i + 1, empBonusColIdx + 1).setValue(false);
  }

  bonusData.slice(1).forEach(row => {
    const bonusDate = new Date(row[bonusDateIdx]);
    if (bonusDate.getMonth() === selectedMonth) {
      const fileId = row[bonusFileIdx];
      const empRowIdx = empData.findIndex((r, idx) => idx > 0 && r[empFileIdx] === fileId);
      if (empRowIdx > -1) {
        empSheet.getRange(empRowIdx + 1, empBonusColIdx + 1).setValue(true);
      }
    }
  });
}

function updateOTRatesWithTimestamp() {
  // Helpers below are nested so this function can be copied alone into macros.gs
  // without separate global definitions (avoids ReferenceError).
  function normalizeFileKeyForOt(raw) {
    if (raw === null || raw === undefined) return '';
    const s = String(raw).trim();
    if (!s) return '';
    if (/^\d+$/.test(s)) return String(parseInt(s, 10));
    return s.toLowerCase();
  }
  function parseSpreadsheetDateLoose(raw, timeZone) {
    if (raw === null || raw === undefined || raw === '') return null;
    if (raw instanceof Date) {
      return isNaN(raw.getTime()) ? null : raw;
    }
    if (typeof raw === 'number') {
      if (raw > 0 && raw < 1e7) {
        const fromSerial = new Date(Math.round((raw - 25569) * 86400 * 1000));
        if (!isNaN(fromSerial.getTime())) return fromSerial;
      }
      const asMs = new Date(raw);
      return isNaN(asMs.getTime()) ? null : asMs;
    }
    const s = String(raw).trim();
    if (!s) return null;
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    if (timeZone) {
      const fmts = ['dd/MM/yyyy', 'd/M/yyyy', 'dd/MM/yy', 'd/M/yy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'M/d/yyyy'];
      for (let i = 0; i < fmts.length; i++) {
        try {
          d = Utilities.parseDate(s, timeZone, fmts[i]);
          if (d && !isNaN(d.getTime())) return d;
        } catch (e) { /* try next */ }
      }
    }
    return null;
  }
  function monthKeyFromDate(d, timeZone) {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    return Utilities.formatDate(first, timeZone, 'yyyy-MM');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const empSheet = ss.getSheetByName("Employees_Details");
  const otSheet = ss.getSheetByName("OT_Rates");
  const timeCardSheet = ss.getSheetByName("Time Card");

  if (!empSheet || !otSheet || !timeCardSheet) return;

  const rawDate = timeCardSheet.getRange("AI7").getValue();
  const anchorDate = parseSpreadsheetDateLoose(rawDate, tz);
  if (!anchorDate) {
    SpreadsheetApp.getUi().alert(
      'Invalid month in AI7',
      'Enter a date in Time Card cell AI7 (any day in the target month). Text like 15/04/2026 or a real date cell both work.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const targetDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const targetMonth = Utilities.formatDate(targetDate, tz, 'yyyy-MM');

  const empData = empSheet.getDataRange().getValues();
  const otData = otSheet.getDataRange().getValues();

  const empHeaders = empData[0];
  const otHeaders = otData[0];

  const empFileCol = empHeaders.indexOf("File#");
  const empOTRateCol = empHeaders.indexOf("OT Rates");

  const otFileCol = otHeaders.findIndex(h => String(h).trim().toLowerCase() === "file");
  const otRateCol = otHeaders.findIndex(h => String(h).trim().toLowerCase().includes("ot rate"));
  const otDateCol = otHeaders.findIndex(h => String(h).trim().toLowerCase() === "date");

  console.log('Target month:', targetMonth);
  console.log('OT_Rates headers:', otHeaders);
  console.log('OT_Rates sheet columns:', otFileCol, otRateCol, otDateCol);

  if (otFileCol === -1 || otRateCol === -1 || otDateCol === -1) {
    SpreadsheetApp.getUi().alert(
      'Invalid Headers',
      'OT_Rates sheet must have headers: File, OT Rate, Date',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    console.error('Missing headers in OT_Rates sheet');
    return;
  }

  if (empFileCol === -1 || empOTRateCol === -1) {
    SpreadsheetApp.getUi().alert(
      'Invalid Headers',
      'Employees_Details must include columns: File#, OT Rates',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const candidates = [];
  for (let i = 1; i < otData.length; i++) {
    const fileId = otData[i][otFileCol];
    const rate = otData[i][otRateCol];
    const dateValue = otData[i][otDateCol];
    if (!fileId || rate === '' || rate === null || rate === undefined) continue;

    const fileKey = normalizeFileKeyForOt(fileId);
    if (!fileKey) continue;

    const parsed = parseSpreadsheetDateLoose(dateValue, tz);
    if (!parsed) continue;

    candidates.push({ fileKey: fileKey, rate: rate, parsed: parsed, row: i + 1 });
  }

  if (candidates.length === 0) {
    SpreadsheetApp.getUi().alert(
      'No dated OT rows',
      'OT_Rates has no rows with File, OT Rate, and a readable Date. Dates can be cells, serial numbers, or text (e.g. dd/MM/yyyy).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }

  const byFile = new Map();
  candidates.forEach(c => {
    if (!byFile.has(c.fileKey)) byFile.set(c.fileKey, []);
    byFile.get(c.fileKey).push(c);
  });

  const otMap = new Map();
  byFile.forEach((rows, fileKey) => {
    const exact = rows.filter(c => monthKeyFromDate(c.parsed, tz) === targetMonth);
    let chosen;
    if (exact.length) {
      exact.sort((a, b) => b.parsed - a.parsed || b.row - a.row);
      chosen = exact[0];
    } else {
      rows.sort((a, b) => b.parsed - a.parsed || b.row - a.row);
      chosen = rows[0];
    }
    otMap.set(fileKey, { rate: chosen.rate, row: chosen.row });
  });

  console.log(`Built OT map for ${otMap.size} file number(s) from ${candidates.length} dated row(s); target ${targetMonth}`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (let i = 1; i < empData.length; i++) {
    const fileKey = normalizeFileKeyForOt(empData[i][empFileCol]);
    const currentRate = empData[i][empOTRateCol];

    if (!fileKey) continue;

    if (otMap.has(fileKey)) {
      const otEntry = otMap.get(fileKey);
      if (String(otEntry.rate) !== String(currentRate)) {
        empSheet.getRange(i + 1, empOTRateCol + 1).setValue(otEntry.rate);
        updatedCount++;
        console.log(`Updated File# ${fileKey}: ${currentRate} -> ${otEntry.rate}`);
      } else {
        console.log(`File# ${fileKey}: already has rate ${otEntry.rate}`);
      }
    } else {
      notFoundCount++;
    }
  }

  let message =
    `Updated ${updatedCount} OT rate(s); calendar month from AI7 is ${targetMonth}.\n` +
    `For each File#, the row dated in that month is used when present; otherwise the latest dated OT row for that File (any month).`;
  if (notFoundCount > 0) {
    message += `\n\n${notFoundCount} employee row(s) had no matching OT_Rates entry (by File#).`;
  }

  SpreadsheetApp.getUi().alert('OT Rates Updated', message, SpreadsheetApp.getUi().ButtonSet.OK);

  console.log(`Updated ${updatedCount} OT rates for month ${targetMonth}`);
  console.log(`Total employees checked: ${empData.length - 1}`);
}

function runAllMainTasks() {
  calculateDeductionForRange();
  getEmployeeDetail();
  populateAdvanceDetails();
  fetchEmployeeData();
  updateSalaryIncrement();
  updateBonusCheckboxBasedOnMonth();
  updateOTRatesWithTimestamp();
}

function generateAllPayslips() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const empSheet = ss.getSheetByName("Employees_Details");
  const payslipSheet = ss.getSheetByName("Time Card");
  const parentFolderName = "Payslips";

  if (!empSheet || !payslipSheet) {
    SpreadsheetApp.getUi().alert("❌ Missing 'Employees_Details' or 'Time Card' sheet.");
    return;
  }

  const lastRow = empSheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("⚠️ No employee data found in Employees_Details.");
    return;
  }

  const rawDate = payslipSheet.getRange("AI7").getValue();
  let monthTag = "UnknownMonth";

  if (rawDate instanceof Date) {
    const tz = ss.getSpreadsheetTimeZone();
    const localDate = new Date(Utilities.formatDate(rawDate, tz, "yyyy-MM-dd'T'HH:mm:ss"));
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthName = monthNames[localDate.getMonth()];
    const year = localDate.getFullYear();
    monthTag = `${monthName}-${year}`;
  }

  let parentFolder;
  const parentFolders = DriveApp.getFoldersByName(parentFolderName);
  parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.createFolder(parentFolderName);

  let monthFolder;
  const subFolders = parentFolder.getFoldersByName(monthTag);
  monthFolder = subFolders.hasNext() ? subFolders.next() : parentFolder.createFolder(monthTag);

  const empData = empSheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const ui = SpreadsheetApp.getUi();
  const total = empData.length;
  let processed = 0, skipped = 0, errors = [];

  ui.alert("📄 Payslip generation started", `Processing ${total} employees for ${monthTag}...`, ui.ButtonSet.OK);

  for (let i = 0; i < empData.length; i++) {
    const fileNo = empData[i][0];
    const empName = empData[i][1];
    if (!fileNo || !empName) {
      skipped++;
      continue;
    }

    try {
      payslipSheet.getRange("C5").setValue(fileNo);
      SpreadsheetApp.flush();

      try {
        getEmployeeDetail();
        fetchEmployeeData();
        updateBonusCheckboxBasedOnMonth();
      } catch (e) {
        Logger.log(`⚠️ Data update issue for ${fileNo} (${empName}) - ${e}`);
      }

      Utilities.sleep(1500);

      const pdfName = `Payslip_${fileNo}_${empName}_${monthTag}`;
      const pdfBlob = exportSheetAsLandscapePDF(ss, payslipSheet, pdfName);
      monthFolder.createFile(pdfBlob);
      processed++;

      if (processed % 10 === 0) {
        ui.alert("⏳ Progress Update", `Generated ${processed} of ${total} payslips...`, ui.ButtonSet.OK);
      }

    } catch (err) {
      errors.push(`❌ ${fileNo} - ${empName}: ${err.message}`);
      Logger.log(`❌ Error for ${fileNo} - ${empName}: ${err}`);
    }
  }

  let summary = `✅ Completed: ${processed}\n🚫 Skipped: ${skipped}`;
  if (errors.length > 0) {
    summary += `\n⚠️ Errors (${errors.length}):\n` + errors.slice(0, 5).join("\n");
    if (errors.length > 5) summary += `\n... (${errors.length - 5} more)`;
  }

  ui.alert(`📊 Payslip Generation for ${monthTag} Finished`, summary, ui.ButtonSet.OK);
}

function exportSheetAsLandscapePDF(ss, sheet, pdfName) {
  const sheetId = sheet.getSheetId();
  const url = ss.getUrl().replace(/edit$/, '');

  const exportUrl = `${url}export?format=pdf` +
    `&size=A4` +
    `&portrait=false` +
    `&fitw=true` +
    `&scale=2` +
    `&horizontal_alignment=CENTER` +
    `&vertical_alignment=MIDDLE` +
    `&sheetnames=false` +
    `&printtitle=false` +
    `&pagenumbers=false` +
    `&gridlines=false` +
    `&fzr=false` +
    `&top_margin=0.4` +
    `&bottom_margin=0.4` +
    `&left_margin=0.5` +
    `&right_margin=0.5` +
    `&gid=${sheetId}`;

  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(exportUrl, {
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true
  });

  return response.getBlob().setName(pdfName + ".pdf");
}

// =============================================================================
// PART 3: TRIGGERS & MENU
// =============================================================================

function createTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('calculateDeductionForRange')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();
}

/**
 * Single onOpen function with all menus merged
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('📊 Employee Manager')
    .addItem('🔄 Sync Employee Details', 'syncEmployeeDetails')
    .addSeparator()
    .addItem('⏰ Enable Auto-Sync', 'createAutoSyncTrigger')
    .addItem('⏸️ Disable Auto-Sync', 'removeAutoSyncTrigger')
    .addSeparator()
    .addItem('ℹ️ About Sync', 'showInstructions')
    .addToUi();
  
  ui.createMenu('💰 Payroll Tools')
    .addItem('🔄 Run All Tasks', 'runAllMainTasks')
    .addItem('📄 Generate All Payslips', 'generateAllPayslips')
    .addSeparator()
    .addItem('⏰ Update OT Rates (Current Month)', 'updateOTRatesWithTimestamp')
    .addSeparator()
    .addItem('📊 Calculate Deductions', 'calculateDeductionForRange')
    .addItem('👤 Get Employee Details', 'getEmployeeDetail')
    .addItem('💵 Populate Advance Details', 'populateAdvanceDetails')
    .addItem('📅 Fetch Employee Data', 'fetchEmployeeData')
    .addItem('📈 Update Salary Increment', 'updateSalaryIncrement')
    .addItem('🎁 Update Bonus Checkbox', 'updateBonusCheckboxBasedOnMonth')
    .addToUi();
}

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
    '• File#, Name, Nationality, Category, Basic Salary, Status\n' +
    '• Plus 6 manual columns: Food Money, OT Rates, Gosi, Advance, Other, Bonus',
    ui.ButtonSet.OK
  );
}

