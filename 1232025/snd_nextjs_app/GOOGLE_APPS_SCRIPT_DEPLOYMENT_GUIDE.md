# Google Apps Script Deployment Guide

## Issue: "تعذر العثور على دالة النص البرمجي: doPost"
**Translation**: "Script function not found: doPost"

This error occurs because your deployed Google Apps Script doesn't have the `doPost` function that handles HTTP POST requests from the Next.js API.

## Solution: Deploy Updated Script

### Step 1: Open Your Google Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Open your existing timesheet project

### Step 2: Replace Your Code
1. **Delete all existing code** in your script editor
2. **Copy and paste** the entire content from `google-sheets-script-dual-save.js`
3. **Save** the project (Ctrl+S)

### Step 3: Deploy the Script
1. Click **"Deploy"** → **"New deployment"**
2. Choose **"Web app"** as the type
3. Set **"Execute as"** to **"Me"**
4. Set **"Who has access"** to **"Anyone"**
5. Click **"Deploy"**
6. **Copy the deployment URL** (it should look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### Step 4: Update Environment Variable
1. In your Next.js project, update the `.env.local` file:
```bash
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Step 5: Test
1. Restart your Next.js development server
2. Try submitting timesheet data
3. Check the terminal logs - you should see successful Google Sheets saves

## Alternative: Quick Fix (If you don't want to redeploy)

If you don't want to redeploy right now, you can temporarily disable Google Sheets saving by commenting out the Google Sheets call in the API:

```typescript
// In src/app/api/timesheets/bulk-submit/route.ts
// Comment out this line:
// const [googleSheetsResult, databaseResult] = await Promise.allSettled([
//   saveToGoogleSheets(empCode, monthKey, timesheetEntries),
//   saveToDatabase(employeeId, monthKey, timesheetEntries)
// ]);

// Replace with:
const [databaseResult] = await Promise.allSettled([
  saveToDatabase(employeeId, monthKey, timesheetEntries)
]);

const googleSheetsResult = { status: 'fulfilled', value: { success: true, message: 'Skipped' } };
```

## Verification
After deployment, the terminal should show:
```
Google Apps Script response: {"success":true,"message":"Data processed for 2023-04 - Google Sheets: Success, Database: Success"}
```

Instead of the HTML error page.
