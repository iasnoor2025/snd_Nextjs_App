/**
 * SIMPLIFIED Google Apps Script for Dual Save
 * This version has better error handling and debugging
 */

/**
 * Handle POST requests from Next.js API
 */
function doPost(e) {
  try {
    console.log('=== doPost START ===');
    console.log('Raw postData:', e.postData);
    console.log('PostData contents:', e.postData.contents);
    console.log('PostData type:', e.postData.type);
    
    if (!e.postData || !e.postData.contents) {
      console.error('No postData or contents found');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'No data received'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Parse the form data
    const params = decodeData(e.postData.contents);
    console.log('Decoded params:', params);
    
    // Extract parameters safely
    const empCode = params.empCode && params.empCode[0] ? params.empCode[0] : null;
    const month = params.month && params.month[0] ? params.month[0] : null;
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];
    
    console.log('Extracted data:', {
      empCode,
      month,
      datesCount: dates.length,
      workingHoursCount: workingHours.length,
      overtimeCount: overtime.length
    });
    
    if (!empCode || !month || dates.length === 0) {
      console.error('Missing required parameters');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Missing required parameters: empCode, month, or dates'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Process the data
    console.log('Calling submitMonthlyData...');
    const result = submitMonthlyData(e.postData.contents);
    console.log('submitMonthlyData result:', result);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('=== doPost ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error in doPost: ' + error.message,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Decode URL‐encoded form data into an object of arrays.
 */
function decodeData(data) {
  try {
    console.log('Decoding data:', data);
    
    if (!data || typeof data !== 'string') {
      console.error('Invalid data for decoding:', data);
      return {};
    }
    
    const result = data
      .split('&')
      .map(pair => pair.split('='))
      .reduce((acc, [rawKey, rawVal]) => {
        if (!rawKey) return acc;
        
        const key = decodeURIComponent(rawKey);
        const val = rawVal ? decodeURIComponent(rawVal.replace(/\+/g, ' ')) : '';
        
        if (!acc[key]) acc[key] = [];
        acc[key].push(val);
        
        return acc;
      }, {});
    
    console.log('Decoded result:', result);
    return result;
  } catch (error) {
    console.error('Error in decodeData:', error);
    return {};
  }
}

/**
 * Get (or create) the Drive folder "Employee Logs".
 */
function getOrCreateFolder() {
  try {
    const NAME = 'Employee Logs';
    const it = DriveApp.getFoldersByName(NAME);
    return it.hasNext() ? it.next() : DriveApp.createFolder(NAME);
  } catch (error) {
    console.error('Error in getOrCreateFolder:', error);
    throw error;
  }
}

/**
 * Inside that folder, open the spreadsheet named empCode,
 * or create it if it doesn't exist.
 */
function getOrCreateSpreadsheet(empCode, folder) {
  try {
    const files = folder.getFilesByName(empCode);
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
    // not found → create and move into folder
    const ss = SpreadsheetApp.create(empCode);
    const file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    return ss;
  } catch (error) {
    console.error('Error in getOrCreateSpreadsheet:', error);
    throw error;
  }
}

/**
 * MAIN FUNCTION: Save to both Google Sheets AND Database
 */
function submitMonthlyData(formData) {
  try {
    console.log('=== submitMonthlyData START ===');
    
    const params = decodeData(formData);
    const empCode = params.empCode && params.empCode[0] ? params.empCode[0] : null;
    const monthKey = params.month && params.month[0] ? params.month[0] : null;

    console.log('Processing for:', { empCode, monthKey });

    if (!empCode || !monthKey) {
      throw new Error('Missing empCode or monthKey');
    }

    // 1. Save to Google Sheets FIRST
    console.log('Starting Google Sheets save...');
    const googleSheetsResult = saveToGoogleSheets(empCode, monthKey, params);
    console.log('Google Sheets result:', googleSheetsResult);
    
    // 2. Try to save to Database (optional)
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
  } catch (error) {
    console.error('=== submitMonthlyData ERROR ===');
    console.error('Error details:', error);
    throw error;
  }
}

/**
 * Save to Google Sheets
 */
function saveToGoogleSheets(empCode, monthKey, params) {
  try {
    console.log('=== saveToGoogleSheets START ===');
    console.log('Parameters:', { empCode, monthKey });
    
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
    const dates = params['date[]'] || [];
    const whs = params['workingHours[]'] || [];
    const ots = params['overtime[]'] || [];

    console.log('Processing', dates.length, 'dates');

    for (let i = 0; i < dates.length; i++) {
      const dstr = dates[i];
      if (!dstr) continue;
      
      const dt = new Date(dstr);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
      const pretty = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
      
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
    }

    console.log('Google Sheets save completed successfully');

    return {
      success: true,
      message: isUpdate
        ? `Google Sheets: Data for ${monthKey} was successfully updated.`
        : `Google Sheets: Data for ${monthKey} was successfully saved.`,
      isUpdate
    };
  } catch (error) {
    console.error('=== saveToGoogleSheets ERROR ===');
    console.error('Error details:', error);
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
    console.log('=== saveToDatabase START ===');
    console.log('Input parameters:', { empCode, monthKey, params });
    
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/gas-submit';
    
    // Prepare data for API with validation
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];
    
    console.log('Data arrays:', {
      datesCount: dates.length,
      workingHoursCount: workingHours.length,
      overtimeCount: overtime.length,
      sampleDates: dates.slice(0, 3),
      sampleWorkingHours: workingHours.slice(0, 3),
      sampleOvertime: overtime.slice(0, 3)
    });
    
    const requestData = {
      empCode: empCode,
      month: monthKey,
      dates: dates,
      workingHours: workingHours,
      overtime: overtime
    };

    console.log('Request data prepared:', {
      url: apiUrl,
      empCode: requestData.empCode,
      month: requestData.month,
      datesCount: requestData.dates.length,
      workingHoursCount: requestData.workingHours.length,
      overtimeCount: requestData.overtime.length
    });

    const payload = JSON.stringify(requestData);
    console.log('Payload length:', payload.length);
    console.log('Payload preview:', payload.substring(0, 200) + '...');

    // Debug: Check if secret is being retrieved correctly
    const gasSharedSecret = PropertiesService.getScriptProperties().getProperty('GAS_SHARED_SECRET');
    console.log('Retrieved GAS_SHARED_SECRET:', gasSharedSecret ? 'FOUND (length: ' + gasSharedSecret.length + ')' : 'NOT FOUND');
    console.log('All script properties:', PropertiesService.getScriptProperties().getKeys());

    if (!gasSharedSecret) {
      throw new Error('GAS_SHARED_SECRET is not set in script properties. Please add it in Project Settings > Script Properties.');
    }

    console.log('Sending headers:', {
      'Content-Type': 'application/json',
      'User-Agent': 'GoogleAppsScript',
      'Accept': 'application/json',
      'x-gas-secret': gasSharedSecret.substring(0, 10) + '...' // Show first 10 chars for debugging
    });

    console.log('Exact User-Agent being sent:', 'GoogleAppsScript');
    console.log('Exact x-gas-secret being sent:', gasSharedSecret);
    
    // Debug: Check exact header values
    console.log('User-Agent char codes:', Array.from('GoogleAppsScript').map(c => c.charCodeAt(0)));
    console.log('Secret char codes (first 10):', Array.from(gasSharedSecret.substring(0, 10)).map(c => c.charCodeAt(0)));

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript',
        'Accept': 'application/json',
        // Shared secret header for server-to-server auth
        'x-gas-secret': gasSharedSecret || ''
      },
      payload: payload,
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('API response status:', statusCode);
    console.log('API response content length:', responseText.length);
    console.log('API response content preview:', responseText.substring(0, 500));

    if (statusCode !== 200) {
      console.error('API returned non-200 status:', statusCode);
      console.error('Full response:', responseText);
      throw new Error(`API Error (${statusCode}): ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('Parsed result:', result);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error(`JSON Parse Error: ${parseError.message}`);
    }
    
    if (!result.success) {
      console.error('API returned success: false');
      console.error('Result:', result);
      throw new Error(`API returned failure: ${result.message || 'Unknown error'}`);
    }
    
    return {
      success: true,
      message: `Database: ${result.message}`,
      data: result.data
    };
  } catch (error) {
    console.error('=== saveToDatabase ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error toString:', error.toString());
    
    return {
      success: false,
      message: `Database save failed: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Serve the HTML UI (for your existing interface)
 */
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('Monthly Work Log - Dual Save');
}

/**
 * Load existing data (for your existing interface)
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

// Test function to verify API authentication
function testAPIAuth() {
  try {
    console.log('=== Testing API Authentication ===');
    
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/gas-submit';
    const gasSharedSecret = PropertiesService.getScriptProperties().getProperty('GAS_SHARED_SECRET');
    
    console.log('Secret retrieved:', gasSharedSecret ? 'YES' : 'NO');
    console.log('Secret length:', gasSharedSecret ? gasSharedSecret.length : 0);
    
    // Debug: Check exact header values
    console.log('Test User-Agent char codes:', Array.from('GoogleAppsScript').map(c => c.charCodeAt(0)));
    console.log('Test Secret char codes (first 10):', Array.from(gasSharedSecret.substring(0, 10)).map(c => c.charCodeAt(0)));
    
    const testData = {
      empCode: '429',
      month: '2023-04',
      dates: ['2023-04-01'],
      workingHours: ['8'],
      overtime: ['0']
    };
    
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoogleAppsScript',
        'Accept': 'application/json',
        'x-gas-secret': gasSharedSecret
      },
      payload: JSON.stringify(testData),
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Test API Response Status:', statusCode);
    console.log('Test API Response:', responseText);
    
    return {
      success: statusCode === 200,
      statusCode: statusCode,
      response: responseText
    };
    
  } catch (error) {
    console.error('Test API Error:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}
