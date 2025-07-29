# ERPNext API Setup Guide

## Current Status
✅ ERPNext URL: https://erp.snd-ksa.online  
✅ API Key: 4f15149f23e29b8  
❌ API Secret: Missing (needs to be generated)

## Steps to Get Your API Secret

### 1. Access ERPNext
1. Go to: https://erp.snd-ksa.online
2. Login with your admin credentials

### 2. Navigate to API Access
1. Go to **Setup** in the sidebar
2. Click on **Integration**
3. Click on **API Access**

### 3. Generate API Secret
1. Find your API Key: `4f15149f23e29b8`
2. Click on the **Generate Secret** button next to it
3. Copy the generated secret

### 4. Update Environment Variables
1. Open `.env.local` file in your project
2. Replace `your_api_secret_here` with your actual API secret:

```env
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_actual_secret_here
```

### 5. Restart Development Server
```bash
npm run dev
```

### 6. Test the Connection
1. Go to your employee management page
2. Click "Sync from ERPNext"
3. Check if real employees are synced

## Troubleshooting

### If you get "ERPNext configuration missing" error:
- Make sure all three variables are set in `.env.local`:
  - `NEXT_PUBLIC_ERPNEXT_URL`
  - `NEXT_PUBLIC_ERPNEXT_API_KEY`
  - `NEXT_PUBLIC_ERPNEXT_API_SECRET`

### If you get "ERPNext API error" error:
- Check if your API key and secret are correct
- Verify that the API user has permissions to access Employee data
- Check if ERPNext is accessible from your network

### If no employees are synced:
- Check if there are employees in your ERPNext system
- Verify the API user has access to Employee doctype
- Check the server console for detailed error messages

## API Permissions Required

Make sure your ERPNext API user has these permissions:
- **Employee**: Read access
- **Department**: Read access  
- **Designation**: Read access

## Test the Setup

After setting up the API secret, you can test the connection:

```bash
# Test environment variables
curl http://localhost:3000/api/test-env

# Test ERPNext connection
curl http://localhost:3000/api/erpnext/test-connection

# Test employee sync
curl -X POST http://localhost:3000/api/employees/sync
``` 
