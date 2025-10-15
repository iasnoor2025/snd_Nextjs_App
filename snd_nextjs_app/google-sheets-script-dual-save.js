/**
 * Enhanced Google Apps Script with Dual Save (Google Sheets + Database)
 * This script saves data to both Google Sheets and your Next.js database
 * 
 * Instructions:
 * 1. Replace your existing submitMonthlyData function with the enhanced version below
 * 2. Add the new saveToDatabase function
 * 3. Optionally update getMonthlyData function for enhanced data loading
 * 4. Your existing HTML interface will work without any changes!
 */

/**
 * Serve the HTML UI.
 */
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('Monthly Work Log - Dual Save');
}

/**
 * Handle POST requests from Next.js API
 */
function doPost(e) {
  try {
    // Parse the form data
    const params = decodeData(e.postData.contents);
    
    // Extract parameters
    const empCode = params.empCode;
    const month = params.month;
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];
    
    if (!empCode || !month || dates.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Missing required parameters'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Process the data using existing logic
    const result = submitMonthlyData(e.postData.contents);
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error processing request: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Decode URL‐encoded form data into an object of arrays.
 */
function decodeData(data) {
  return data
    .split('&')
    .map(pair => pair.split('='))
    .reduce((acc, [rawKey, rawVal]) => {
      const key = decodeURIComponent(rawKey);
      const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
      (acc[key] = acc[key]||[]).push(val);
      return acc;
    }, {});
}

/**
 * Get (or create) the Drive folder "Employee Logs".
 */
function getOrCreateFolder() {
  const NAME = 'Employee Logs';
  const it = DriveApp.getFoldersByName(NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NAME);
}

/**
 * Inside that folder, open the spreadsheet named empCode,
 * or create it if it doesn't exist.
 */
function getOrCreateSpreadsheet(empCode, folder) {
  const files = folder.getFilesByName(empCode);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  // not found → create and move into folder
  const ss   = SpreadsheetApp.create(empCode);
  const file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return ss;
}

/**
 * ENHANCED: Save to both Google Sheets AND Database
 * This replaces your existing submitMonthlyData function
 */
function submitMonthlyData(formData) {
  const params = decodeData(formData);
  const empCode = params.empCode[0];
  const monthKey = params.month[0]; // e.g. "2025-04"

  // 1. Save to Google Sheets (original functionality)
  const googleSheetsResult = saveToGoogleSheets(empCode, monthKey, params);
  
  // 2. Save to Database via API
  const databaseResult = saveToDatabase(empCode, monthKey, params);
  
  // Return combined result message
  const message = `Data processed for ${monthKey} - Google Sheets: ${googleSheetsResult.success ? 'Success' : 'Failed'}, Database: ${databaseResult.success ? 'Success' : 'Failed'}`;
  
  return message;
}

/**
 * Save to Google Sheets (your original functionality)
 */
function saveToGoogleSheets(empCode, monthKey, params) {
  try {
    const folder = getOrCreateFolder();
    const ss = getOrCreateSpreadsheet(empCode, folder);

    let sheet = ss.getSheetByName(monthKey);
    const isUpdate = !!(sheet && sheet.getLastRow() > 1);

    if (!sheet) {
      sheet = ss.insertSheet(monthKey);
    } else {
      sheet.clearContents();
    }

    // write header
    sheet.appendRow([
      'Employee Code',
      'Date',
      'Working Hours',
      'Overtime Hours'
    ]);

    // pull arrays
    const dates = params['date[]'];
    const whs = params['workingHours[]'];
    const ots = params['overtime[]'];

    dates.forEach((dstr, i) => {
      const dt = new Date(dstr);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
      const pretty = Utilities.formatDate(dt,
        Session.getScriptTimeZone(),
        'MMMM dd, yyyy');
      let wh = (whs[i] || '').trim() || 'A';
      const ot = ots[i] || '';

      // Friday special logic
      if (dayName === 'Friday') {
        const prev = i > 0 ? (whs[i - 1] || 'A') : 'A';
        const next = i < dates.length - 1 ? (whs[i + 1] || 'A') : 'A';
        if (prev === 'A' && next === 'A') {
          wh = 'A';
        } else if (wh === 'A') {
          wh = 'Fri';
        }
      }

      sheet.appendRow([
        empCode,
        `${dayName}, ${pretty}`,
        wh,
        ot
      ]);
    });

    return {
      success: true,
      message: isUpdate
        ? `Google Sheets: Data for ${monthKey} was successfully updated.`
        : `Google Sheets: Data for ${monthKey} was successfully saved.`,
      isUpdate
    };
  } catch (error) {
    return {
      success: false,
      message: `Google Sheets save failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * NEW: Save to Database via API
 */
function saveToDatabase(empCode, monthKey, params) {
  try {
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/bulk-submit';
    
    // Prepare data for API
    const requestData = {
      empCode: empCode,
      month: monthKey,
      dates: params['date[]'],
      workingHours: params['workingHours[]'],
      overtime: params['overtime[]']
    };

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript'
      },
      payload: JSON.stringify(requestData),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`API Error: ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    
    return {
      success: result.success,
      message: `Database: ${result.message}`,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Database save failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * ENHANCED: Load an existing month's rows from both sources
 * This is optional - you can keep your existing getMonthlyData function
 */
function getMonthlyData(empCode, monthKey) {
  // Try to load from Google Sheets first (your original functionality)
  const googleSheetsData = getMonthlyDataFromSheets(empCode, monthKey);
  
  // If no data in Google Sheets, try to load from Database
  if (!googleSheetsData || googleSheetsData.length === 0) {
    const databaseData = getMonthlyDataFromDatabase(empCode, monthKey);
    if (databaseData && !databaseData.error) {
      return databaseData;
    }
  }
  
  return googleSheetsData;
}

/**
 * Load from Google Sheets (your original functionality)
 */
function getMonthlyDataFromSheets(empCode, monthKey) {
  try {
    const folder = getOrCreateFolder();
    const files = folder.getFilesByName(empCode);
    if (!files.hasNext()) {
      return [];
    }
    const ss = SpreadsheetApp.open(files.next());
    const sheet = ss.getSheetByName(monthKey);
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    const allRows = sheet.getDataRange().getValues();
    allRows.shift(); // drop header
    return allRows.map(r => ({
      date: r[1],
      workingHours: r[2],
      overtime: r[3]
    }));
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * NEW: Load from Database via API
 */
function getMonthlyDataFromDatabase(empCode, monthKey) {
  try {
    const apiUrl = `https://myapp.snd-ksa.online/api/timesheets/bulk-submit?empCode=${empCode}&month=${monthKey}`;
    
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript'
      },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`API Error: ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    return result.success ? result.data : { error: result.error };
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * 1. Open your Google Apps Script project
 * 2. Replace your existing submitMonthlyData function with the enhanced version above
 * 3. Add the new saveToDatabase function
 * 4. Optionally replace getMonthlyData with the enhanced version
 * 5. Save and deploy your script
 * 6. Test with your existing HTML interface
 * 
 * Your HTML interface will work exactly the same, but now it saves to both systems!
 */
