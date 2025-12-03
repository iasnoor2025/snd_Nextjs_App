# Employee Details Google Sheets Auto-Sync

This document explains how to set up automatic syncing of employee details from your Next.js application to Google Sheets.

## Overview

The Google Apps Script (`google-sheets-employee-details-sync.js`) automatically syncs employee data to a Google Sheet named "Employees_Details" with the following columns:

- **File#**: Employee file number
- **Employees Full Name**: Full name in uppercase
- **Nationality**: Employee nationality
- **Category**: Employee designation
- **Basic Salary**: Basic salary amount
- **Status**: Employee status (color-coded: green for active, pink for inactive, gold for on leave)

## Features

1. **Manual Sync**: Run synchronization on-demand from the menu
2. **Auto-Sync**: Schedule daily automatic sync at 2 AM
3. **Auto-Formatting**: Automatically applies colors, borders, and formatting
4. **Data Filtering**: Adds filter controls to the header row
5. **Auto-Sort**: Automatically sorts data by File# in ascending order
6. **Auto-Resize**: Columns automatically resize to fit content
7. **Error Handling**: Graceful error handling with user notifications

## Setup Instructions

### Step 1: Copy the Script to Google Apps Script

1. Open your Google Spreadsheet where you want to sync employee data
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Copy the entire content from `google-sheets-employee-details-sync.js`
5. Paste it into the Apps Script editor
6. Click **Save** (Ctrl+S or Cmd+S)

### Step 2: Update the API URL (if needed)

In the script, find the `fetchEmployeesFromAPI()` function and update this line if your API URL is different:

```javascript
const apiUrl = 'https://myapp.snd-ksa.online/api/employees/public?all=true';
```

Replace `https://myapp.snd-ksa.online` with your actual domain if it's different.

### Step 3: Authorize the Script

1. Go to your Google Spreadsheet
2. You should see a new menu **"📊 Employee Manager"** in the toolbar
3. Click **📊 Employee Manager → 🔄 Sync Employee Details**
4. Google will ask for authorization:
   - Click **"Review Permissions"**
   - Select your Google account
   - Click **"Allow"** to authorize the script
   - You may see a warning about the app not being verified - click **"Advanced"** then **"Go to [Your Project] (unsafe)"**

### Step 4: Run the Sync

1. After authorization, click **📊 Employee Manager → 🔄 Sync Employee Details** again
2. Wait for the sync to complete
3. A sheet named **"Employees_Details"** will be created or updated

### Step 5: Enable Auto-Sync (Optional)

To automatically sync data daily at 2 AM:

1. Click **📊 Employee Manager → ⏰ Enable Auto-Sync**
2. A confirmation message will appear
3. The script will now automatically sync data every day at 2 AM

To disable auto-sync later:
1. Click **📊 Employee Manager → ⏸️ Disable Auto-Sync**

## API Endpoint Requirements

The script uses the `/api/employees/public` endpoint which should return data in this format:

```json
{
  "data": [
    {
      "file_number": "001",
      "first_name": "John",
      "middle_name": "M.",
      "last_name": "Doe",
      "nationality": "US",
      "desig_name": "Engineer",
      "basic_salary": "5000"
    }
  ]
}
```

**Note**: This is a public endpoint (no authentication required). If you need to add authentication, you'll need to modify the script to include authorization headers.

## How It Works

1. **Data Fetching**: The script calls your Next.js API to get all employee data
2. **Data Formatting**: Converts the API response to the required format with columns: File#, Full Name, Nationality, Category, Basic Salary, Status
3. **Sheet Update**: Creates or updates the "Employees_Details" sheet
4. **Formatting**: Applies colors, borders, and formatting to make the data readable
5. **Sorting**: Automatically sorts data by File# in ascending order
6. **Column Sizing**: Automatically resizes all columns to fit content

## Formatting Applied

- **Headers**: Dark blue background (#1f4e79) with white bold text
- **Alternating Rows**: Light gray (#f8f9fa) and white backgrounds
- **Borders**: All cells have borders
- **Employee Name**: Bold font for employee names
- **Auto-Sort**: Data automatically sorted by File# in ascending order
- **Auto-Resize**: Columns automatically resize to fit content
- **Filters**: Filter controls added to the header row
- **Status Column**: Color-coded based on status:
  - 🟢 **Active**: Light green background (#90EE90) with bold text
  - 🟣 **Inactive**: Light pink background (#FFB6C1) with bold text
  - 🟡 **On Leave**: Gold background (#FFD700) with bold text
  - ⚪ **Other**: Light gray background (#DDD)

## Troubleshooting

### Issue: "API Error" or "Failed to fetch data"

**Solution**: 
- Check that your API URL is correct and accessible
- Verify that the `/api/employees/public` endpoint exists and returns data
- Check the browser console in Apps Script for detailed error messages

### Issue: "No employee data found to sync"

**Solution**:
- Verify that the API is returning data
- Check the Apps Script console logs (View → Logs) for more details
- Make sure the API endpoint doesn't require authentication

### Issue: "Permission denied" or authorization errors

**Solution**:
- Re-authorize the script by running any function manually
- Go to Apps Script → View → Executions, check for errors
- Make sure you're signed in to the correct Google account

### Issue: Sheet not updating

**Solution**:
- Manually run the sync from the menu
- Check the Apps Script console for errors
- Verify that the sheet name is exactly "Employees_Details"

### Issue: Wrong data format

**Solution**:
- Check that your API response structure matches the expected format
- You may need to modify the `formatEmployeeData()` function to match your API response structure

## Manual Trigger

You can also set up manual triggers by:

1. Going to **Apps Script → Triggers** (clock icon on the left)
2. Click **"+ Add Trigger"**
3. Configure:
   - **Function to run**: `syncEmployeeDetails`
   - **Event source**: Time-driven
   - **Type of time-based trigger**: Day timer
   - **Time of day**: 2am to 3am (or your preferred time)
4. Click **Save**

## Testing

1. Open your Google Spreadsheet
2. Click **📊 Employee Manager → ℹ️ About** to see instructions
3. Click **📊 Employee Manager → 🔄 Sync Employee Details** to test the sync
4. Check the "Employees_Details" sheet for the synced data

## API Response Mapping

The script maps the API response fields as follows:

| Google Sheet Column | API Field | Fallback |
|---------------------|-----------|----------|
| File# | `file_number` | `fileNumber`, `employee_id` |
| Employees Full Name | `first_name` + `middle_name` + `last_name` | `fullName`, `name` |
| Nationality | `nationality` | - |
| Category | `desig_name` | `designation`, `category` |
| Basic Salary | `basic_salary` | `basicSalary` |
| Status | `status` | - |

## Customization

### Change Sync Time

Edit the `createAutoSyncTrigger()` function:

```javascript
ScriptApp.newTrigger('syncEmployeeDetails')
  .timeBased()
  .atHour(14) // Change to 2 PM (24-hour format)
  .everyDays(1)
  .create();
```

### Change Sheet Name

Edit the sheet name in `syncEmployeeDetails()`:

```javascript
let employeeDetailsSheet = spreadsheet.getSheetByName("MyEmployees"); // Change this
```

### Add More Columns

Modify the `formatEmployeeData()` function to include additional fields:

```javascript
return {
  fileNumber: fileNumber.toString(),
  fullName: fullName.toUpperCase(),
  nationality: nationality,
  category: category,
  basicSalary: basicSalary,
  email: emp.email || '', // Add new field
  phone: emp.phone || ''  // Add new field
};
```

Don't forget to update the headers array in `updateEmployeeDetailsSheet()`:

```javascript
const headers = ['File#', 'Employees Full Name', 'Nationality', 'Category', 'Basic Salary', 'Email', 'Phone'];
```

## Security Considerations

1. **Public API**: The current setup uses a public endpoint without authentication. If you need security:
   - Add OAuth authentication to the script
   - Use API keys in the request headers
   - Consider using Google Service Accounts

2. **Sensitive Data**: Employee salary data is sensitive - ensure proper access controls on the Google Sheet

3. **Permissions**: The script requires access to:
   - Read from your spreadsheet
   - Write to your spreadsheet
   - Make external HTTP requests to your API

## Support

For issues or questions:
1. Check the Apps Script console (View → Logs)
2. Review the error messages in the alert dialogs
3. Verify your API endpoint is working
4. Check that all permissions are granted

## Version History

- **v1.0** (Initial Release)
  - Manual sync functionality
  - Auto-sync with daily trigger
  - Auto-formatting and styling
  - Error handling and user notifications

