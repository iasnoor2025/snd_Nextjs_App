// Google Apps Script for Employee Monthly Work Log
// Complete rewrite - clean and organized

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Main function to submit monthly data - saves to both Google Sheets and Database
 */
function submitMonthlyData(formData) {
  console.log('=== submitMonthlyData START ===');
  
  const params = decodeData(formData);
  const empCode = params.empCode && params.empCode[0] ? params.empCode[0] : null;
  const monthKey = params.month && params.month[0] ? params.month[0] : null;

  console.log('Processing for:', { empCode, monthKey });

  // Save to Google Sheets
  let googleSheetsResult = { success: false, message: 'Google Sheets save skipped' };
  try {
    googleSheetsResult = saveToGoogleSheets(empCode, monthKey, params);
    console.log('Google Sheets save completed:', googleSheetsResult);
  } catch (error) {
    console.error('Google Sheets save failed:', error);
    googleSheetsResult = { success: false, message: `Google Sheets save failed: ${error.message}` };
  }
  
  // Save to Database
  let databaseResult = { success: false, message: 'Database save skipped' };
  try {
    databaseResult = saveToDatabase(empCode, monthKey, params);
    console.log('Database save completed:', databaseResult);
  } catch (error) {
    console.error('Database save failed, but continuing:', error);
    databaseResult = { success: false, message: `Database save failed: ${error.message}` };
  }
  
  const message = `Data processed for ${monthKey} - Google Sheets: ${googleSheetsResult.success ? 'Success' : ('Failed: ' + (googleSheetsResult.message || ''))}, Database: ${databaseResult.success ? 'Success' : ('Failed: ' + (databaseResult.message || ''))}`;
  
  return { message, results: { googleSheets: googleSheetsResult, database: databaseResult } };
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

/**
 * Serve the HTML UI (for your existing interface)
 */
function doGet(e) {
  try {
    console.log('=== doGet START ===');
    console.log('GET request parameters:', e.parameter);
    
    // Serve your existing HTML interface
    return HtmlService
      .createHtmlOutputFromFile('index')
      .setTitle('Employee Monthly Work Log - Dual Save');
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error in doGet: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests from Next.js API
 */
function doPost(e) {
  try {
    console.log('=== doPost START ===');
    console.log('Raw postData:', { contents: e.postData.contents, type: e.postData.type });

    const params = decodeData(e.postData.contents);
    
    const empCode = params.empCode && params.empCode[0] ? params.empCode[0] : null;
    const month = params.month && params.month[0] ? params.month[0] : null;
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];

    console.log('Decoded params:', params);
    console.log('Extracted data:', { empCode, month, datesCount: dates.length });
    
    if (!empCode || !month || dates.length === 0) {
      console.error('Missing required parameters in doPost');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Missing required parameters'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const summary = submitMonthlyData(e.postData.contents);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: (summary.results?.googleSheets?.success && summary.results?.database?.success) === true,
        ...summary
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Error processing request in doPost: ' + error.toString(),
        errorStack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// GOOGLE SHEETS FUNCTIONS
// ============================================================================

/**
 * Save to Google Sheets
 */
function saveToGoogleSheets(empCode, monthKey, params) {
  try {
    console.log('=== saveToGoogleSheets START ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      console.log('No active spreadsheet found, trying to get spreadsheet by ID');
      try {
        const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (spreadsheetId) {
          const ssById = SpreadsheetApp.openById(spreadsheetId);
          return saveToSpreadsheet(ssById, empCode, monthKey, params);
        }
      } catch (error) {
        console.log('Could not open spreadsheet by ID:', error);
      }
      
      console.log('No spreadsheet available, skipping Google Sheets save');
      return {
        success: false,
        message: 'No spreadsheet available for Google Sheets save',
        error: 'No active spreadsheet'
      };
    }
    
    return saveToSpreadsheet(ss, empCode, monthKey, params);
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return {
      success: false,
      message: 'Failed to save to Google Sheets',
      error: error.toString()
    };
  }
}

/**
 * Helper function to save data to spreadsheet
 */
function saveToSpreadsheet(ss, empCode, monthKey, params) {
  try {
    const sheet = ss.getSheetByName('Monthly Work Log') || ss.insertSheet('Monthly Work Log');
    
    // Clear existing data for this employee and month
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i][0] === empCode && values[i][1] === monthKey) {
        sheet.deleteRow(i + 1);
      }
    }
    
    // Add new data
    const dates = params['date[]'] || [];
    const workingHours = params['workingHours[]'] || [];
    const overtime = params['overtime[]'] || [];
    
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const wh = workingHours[i] || '0';
      const ot = overtime[i] || '0';
      
      // Apply Friday logic
      const dt = new Date(date);
      const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
      let finalWh = wh;
      
      if (dayName === 'Fri') {
        if (wh === 'A' || wh === '' || wh === '0') {
          finalWh = 'Fri';
        }
      }
      
      sheet.appendRow([empCode, monthKey, date, finalWh, ot]);
    }
    
    return {
      success: true,
      message: `Google Sheets: Data saved for ${monthKey}`,
      entriesCount: dates.length
    };
  } catch (error) {
    console.error('Error saving to spreadsheet:', error);
    return {
      success: false,
      message: 'Failed to save to spreadsheet',
      error: error.toString()
    };
  }
}

/**
 * Get monthly data from Google Sheets
 */
function getMonthlyData(empCode, monthKey) {
  try {
    console.log('=== getMonthlyData START ===');
    console.log('Parameters:', { empCode, monthKey });
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      console.log('No active spreadsheet found, trying to get spreadsheet by ID');
      try {
        const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
        if (spreadsheetId) {
          const ssById = SpreadsheetApp.openById(spreadsheetId);
          return getDataFromSpreadsheet(ssById, empCode, monthKey);
        }
      } catch (error) {
        console.log('Could not open spreadsheet by ID:', error);
      }
      
      console.log('No spreadsheet available, returning empty array');
      return [];
    }
    
    return getDataFromSpreadsheet(ss, empCode, monthKey);
  } catch (error) {
    console.error('getMonthlyData error:', error);
    return [];
  }
}

/**
 * Helper function to get data from spreadsheet
 */
function getDataFromSpreadsheet(ss, empCode, monthKey) {
  try {
    const sheet = ss.getSheetByName('Monthly Work Log');
    
    if (!sheet) {
      console.log('No Monthly Work Log sheet found, returning empty array');
      return [];
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    console.log('All sheet data rows:', values.length);
    
    const filteredRows = values.filter(row => 
      row[0] === empCode && row[1] === monthKey
    );
    
    console.log('Filtered rows for employee and month:', filteredRows.length);
    console.log('Sample filtered row:', filteredRows[0]);
    
    const result = filteredRows.map(row => ({
      date: row[2],
      workingHours: row[3],
      overtime: row[4]
    }));
    
    console.log('Final result:', result);
    return result;
  } catch (error) {
    console.error('Error getting data from spreadsheet:', error);
    return [];
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Save to Database using dedicated endpoint
 */
function saveToDatabase(empCode, monthKey, params) {
  try {
    console.log('=== saveToDatabase START ===');
    console.log('Input parameters:', { empCode, monthKey, params });
    
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/gas-submit';
    
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

    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
 * Get monthly data from database (fallback)
 */
function getMonthlyDataFromDatabase(empCode, monthKey) {
  try {
    console.log('=== getMonthlyDataFromDatabase START ===');
    
    const apiUrl = `https://myapp.snd-ksa.online/api/timesheets/gas-submit?empCode=${empCode}&month=${monthKey}`;
    
    const response = UrlFetchApp.fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Database API response status:', statusCode);
    console.log('Database API response:', responseText);

    if (statusCode !== 200) {
      console.error('Database API returned non-200 status:', statusCode);
      return [];
    }

    const result = JSON.parse(responseText);
    console.log('Database API parsed result:', result);
    
    if (!result.success) {
      console.error('Database API returned success: false');
      return [];
    }
    
    return result.data || [];
  } catch (error) {
    console.error('Error in getMonthlyDataFromDatabase:', error);
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode URL-encoded data
 */
function decodeData(data) {
  return data
    .split('&')
    .map(pair => pair.split('='))
    .reduce((acc, [rawKey, rawVal]) => {
      const key = decodeURIComponent(rawKey);
      const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
      (acc[key] = acc[key] || []).push(val);
      return acc;
    }, {});
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test function to verify API connection
 */
function testAPIConnection() {
  try {
    console.log('=== Testing API Connection ===');
    
    const apiUrl = 'https://myapp.snd-ksa.online/api/timesheets/gas-submit';
    
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
        'Accept': 'application/json'
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
