# Bulk Timesheet Submission - Dual Save Implementation

## Overview
This implementation provides dual-save functionality for timesheet data, saving to both Google Sheets and your Next.js database simultaneously.

## Files Created/Updated

### 1. API Endpoint
**File:** `src/app/api/timesheets/bulk-submit/route.ts`
- Handles bulk timesheet submission
- Saves to both Google Sheets and Database
- Implements Friday special logic
- Supports both JSON and form-encoded data

### 2. React Component
**File:** `src/components/timesheet/BulkTimesheetForm.tsx`
- Modern React interface for bulk timesheet submission
- Replicates your HTML interface functionality
- Real-time data loading and updates
- Friday highlighting and logic

### 3. Page Route
**File:** `src/app/[locale]/modules/timesheet-management/bulk-submit/page.tsx`
- Protected route with RBAC permissions
- Accessible at `/modules/timesheet-management/bulk-submit`

### 4. Google Apps Script
**File:** `google-sheets-script-dual-save.js`
- Enhanced version of your existing Google Apps Script
- Saves to both Google Sheets and Database
- Maintains compatibility with your existing HTML interface

## How to Access Bulk Submit

### Option 1: From Timesheet Management Dashboard
1. Go to **Timesheet Management** page (`/modules/timesheet-management`)
2. Look for the **"Bulk Submit"** button in the top action bar (with Upload icon)
3. Click the button to navigate to bulk submission page
4. Enter employee code (file number) and select month
5. Fill in timesheet data and click "Save Log" - saves to both systems

### Option 2: Direct URL Access
1. Navigate directly to `/modules/timesheet-management/bulk-submit`
2. Enter employee code (file number) and select month
3. Fill in timesheet data and click "Save Log" - saves to both systems

### Option 3: Google Apps Script Interface
1. Update your Google Apps Script with the provided code
2. Use your existing HTML interface
3. Data automatically saves to both Google Sheets and Database

## Key Features

✅ **Dual Save**: Data saved to both Google Sheets and Database
✅ **Friday Logic**: Same Friday special handling as your original script
✅ **Error Handling**: Comprehensive error handling for both systems
✅ **Data Sync**: Both systems stay synchronized
✅ **Permission Control**: Uses existing RBAC system
✅ **Real-time Updates**: Loads existing data automatically
✅ **Responsive Design**: Works on all screen sizes

## Friday Logic Implementation
- If Friday is between two absent days (A), it becomes absent (A)
- If Friday is marked as absent (A) but not between two absent days, it becomes half day (Fri)
- Otherwise, Friday follows normal working hours

## API Endpoints

### POST `/api/timesheets/bulk-submit`
Submit bulk timesheet data
```json
{
  "empCode": "EMP123",
  "month": "2025-01",
  "dates": ["2025-01-01", "2025-01-02"],
  "workingHours": ["8", "8"],
  "overtime": ["0", "2"]
}
```

### GET `/api/timesheets/bulk-submit?empCode=EMP123&month=2025-01`
Retrieve existing timesheet data

## Google Apps Script Integration

Replace your existing `submitMonthlyData` function with the enhanced version that:
1. Saves to Google Sheets (original functionality)
2. Saves to Database via API call
3. Returns combined success/failure message

Your existing HTML interface will work without any changes!

## Testing

1. **Test Next.js Interface:**
   - Go to `/modules/timesheet-management/bulk-submit`
   - Enter test data and submit
   - Check both Google Sheets and Database

2. **Test Google Apps Script:**
   - Update your script with the provided code
   - Use your existing HTML interface
   - Verify data appears in both systems

## Benefits

- **Data Redundancy**: Data backed up in two systems
- **System Independence**: If one system fails, the other works
- **Consistent Logic**: Same Friday logic applied to both systems
- **User Choice**: Use either interface (Next.js or Google Apps Script)
- **Seamless Integration**: Works with existing workflows
