/**
 * Complete Google Apps Script for Dual Save (Google Sheets + Database)
 * Copy and paste this ENTIRE code into your Google Apps Script project
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
    console.log('doPost called with data:', e.postData.contents);
    
    // Parse the form data
    const params = decodeData(e.postData.contents);
    
    // Extract parameters
    const empCode = params.empCode;
    const month = params.month;
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];
    
    console.log('Parsed parameters:', { empCode, month, datesCount: dates.length });
    
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
      .createTextOutput(JSON.stringify({
        success: true,
        message: result
      }))
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
 * MAIN FUNCTION: Save to both Google Sheets AND Database
 */
function submitMonthlyData(formData) {
  console.log('submitMonthlyData called');
  
  const params = decodeData(formData);
  const empCode = params.empCode[0];
  const monthKey = params.month[0];

  console.log('Processing for:', { empCode, monthKey });

  // 1. Save to Google Sheets FIRST (original functionality)
  console.log('Starting Google Sheets save...');
  const googleSheetsResult = saveToGoogleSheets(empCode, monthKey, params);
  console.log('Google Sheets result:', googleSheetsResult);
  
  // 2. Try to save to Database via API (but don't let it break Google Sheets)
  console.log('Starting Database save...');
  let databaseResult = { success: false, message: 'Database save skipped' };
  try {
    databaseResult = saveToDatabase(empCode, monthKey, params);
    console.log('Database result:', databaseResult);
  } catch (error) {
    console.error('Database save failed, but continuing:', error);
    databaseResult = { success: false, message: `Database save failed: ${error.message}` };
  }
  
  // Return combined result message
  const message = `Data processed for ${monthKey} - Google Sheets: ${googleSheetsResult.success ? 'Success' : 'Failed'}, Database: ${databaseResult.success ? 'Success' : 'Failed'}`;
  console.log('Final result:', message);
  
  return message;
}

/**
 * Save to Google Sheets (your original functionality)
 */
function saveToGoogleSheets(empCode, monthKey, params) {
  try {
    console.log('saveToGoogleSheets called for:', { empCode, monthKey });
    
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

    console.log('Processing', dates.length, 'dates');

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

    console.log('Google Sheets save completed successfully');

    return {
      success: true,
      message: isUpdate
        ? `Google Sheets: Data for ${monthKey} was successfully updated.`
        : `Google Sheets: Data for ${monthKey} was successfully saved.`,
      isUpdate
    };
  } catch (error) {
    console.error('Google Sheets save error:', error);
    return {
      success: false,
      message: `Google Sheets save failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Save to Database via API
 */
function saveToDatabase(empCode, monthKey, params) {
  try {
    console.log('saveToDatabase called for:', { empCode, monthKey });
    
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/bulk-submit';
    
    // Prepare data for API
    const requestData = {
      empCode: empCode,
      month: monthKey,
      dates: params['date[]'],
      workingHours: params['workingHours[]'],
      overtime: params['overtime[]']
    };

    console.log('Sending to API:', { url: apiUrl, empCode, monthKey, datesCount: params['date[]'].length });

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript'
      },
      payload: JSON.stringify(requestData),
      muteHttpExceptions: true
    });

    console.log('API response:', {
      statusCode: response.getResponseCode(),
      content: response.getContentText()
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`API Error (${response.getResponseCode()}): ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    
    return {
      success: result.success,
      message: `Database: ${result.message}`,
      data: result.data
    };
  } catch (error) {
    console.error('Database save error:', error);
    return {
      success: false,
      message: `Database save failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Load existing data (optional - for your HTML interface)
 */
function getMonthlyData(empCode, monthKey) {
  try {
    console.log('getMonthlyData called for:', { empCode, monthKey });
    
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
    console.error('getMonthlyData error:', error);
    return [];
  }
}
