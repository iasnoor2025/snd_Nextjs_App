# n8n Authentication Setup Guide (No .env Required)

This guide shows you how to configure Bearer token authentication in n8n **without using .env files**. You'll configure the API key directly in the n8n workflow node.

---

## Method 1: Using n8n Credentials (Recommended)

### Step 1: Create HTTP Header Auth Credential

1. Open your n8n instance
2. Go to **Credentials** → **New Credential**
3. Select **HTTP Header Auth**
4. Configure:
   - **Name**: `SPSP API Auth`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_API_KEY_HERE`
     - Replace `YOUR_API_KEY_HERE` with your actual API key
5. Click **Save**

### Step 2: Configure HTTP Request Node

1. Open your workflow
2. Click on the **"Fetch Expiring SPSP Licenses"** HTTP Request node
3. In the node settings:
   - **Method**: `GET`
   - **URL**: `{{ $env.APP_URL }}/api/employees/spsp-expiring`
   - **Authentication**: Select **HTTP Header Auth**
   - **Credential**: Select `SPSP API Auth` (the credential you just created)
4. In **Query Parameters**:
   - `days`: `10`
   - `limit`: `100`
5. Click **Save**

---

## Method 2: Direct Header Configuration (No Credentials)

### Step 1: Configure HTTP Request Node

1. Open your workflow
2. Click on the **"Fetch Expiring SPSP Licenses"** HTTP Request node
3. In the node settings:
   - **Method**: `GET`
   - **URL**: `{{ $env.APP_URL }}/api/employees/spsp-expiring`
   - **Send Headers**: Toggle **ON**
4. In **Headers** section, click **Add Header**:
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_API_KEY_HERE`
     - Replace `YOUR_API_KEY_HERE` with your actual API key
5. In **Query Parameters**:
   - `days`: `10`
   - `limit`: `100`
6. Click **Save**

---

## Method 3: Using n8n Environment Variables (If Available)

If your n8n instance supports environment variables:

1. In n8n settings, add environment variable:
   - **Name**: `N8N_API_KEY`
   - **Value**: Your API key (e.g., `5bb6d0ad689714c86b04e7e33b8a75e6af69b469488df7f7d60d47b5c005d722`)

2. In the HTTP Request node:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer {{ $env.N8N_API_KEY }}`

---

## Visual Guide: Configuring in n8n UI

### HTTP Request Node Configuration:

```
┌─────────────────────────────────────────┐
│ HTTP Request Node                       │
├─────────────────────────────────────────┤
│ Method: GET                              │
│ URL: {{ $env.APP_URL }}/api/employees/  │
│      spsp-expiring                       │
│                                          │
│ ☑ Send Headers                          │
│   Headers:                               │
│   ┌───────────────────────────────────┐ │
│   │ Name: Authorization                │ │
│   │ Value: Bearer YOUR_API_KEY        │ │
│   └───────────────────────────────────┘ │
│                                          │
│ ☑ Send Query                            │
│   Query Parameters:                      │
│   ┌───────────────────────────────────┐ │
│   │ days: 10                           │ │
│   │ limit: 100                         │ │
│   └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Generate Your API Key

If you need to generate a new API key, use one of these methods:

### Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### PowerShell (Windows):
```powershell
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### OpenSSL:
```bash
openssl rand -hex 32
```

---

## Setting the API Key in Your Next.js App

Add to your Next.js `.env` file (this is the only place you need it):

```env
N8N_API_KEY=your-generated-api-key-here
```

**Important**: The API key in your Next.js `.env` file must match the one you configure in n8n.

---

## Testing the Authentication

### Test 1: Using cURL

```bash
curl -X GET "https://your-app-domain.com/api/employees/spsp-expiring?days=10&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Test 2: Using n8n Test Workflow

1. Create a simple test workflow
2. Add HTTP Request node
3. Configure with your API key
4. Execute and check response

### Expected Response:

```json
{
  "success": true,
  "data": [...],
  "summary": {
    "totalExpiring": 2,
    "daysWindow": 10,
    "generatedAt": "2025-12-01T..."
  }
}
```

### Error Response (if authentication fails):

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## Security Best Practices

1. **Never commit API keys to Git**
   - Keep them in environment variables or n8n credentials
   - Use different keys for dev/staging/production

2. **Rotate keys regularly**
   - Change API keys periodically
   - Update both Next.js and n8n when rotating

3. **Use HTTPS**
   - Always use HTTPS in production
   - Never send API keys over unencrypted connections

4. **Restrict access**
   - Only give API key access to authorized workflows
   - Monitor API usage for suspicious activity

---

## Troubleshooting

### Issue: "Unauthorized" error

**Solutions:**
1. Check that the API key in n8n matches the one in Next.js `.env`
2. Verify the header format: `Bearer YOUR_API_KEY` (with space after "Bearer")
3. Ensure the header name is exactly `Authorization` (case-sensitive)
4. Check that `N8N_API_KEY` is set in your Next.js environment

### Issue: Header not being sent

**Solutions:**
1. Make sure "Send Headers" is toggled ON in the HTTP Request node
2. Verify the header is added correctly in the Headers section
3. Check n8n execution logs to see what headers are being sent

### Issue: Environment variable not working

**Solutions:**
1. If using `{{ $env.N8N_API_KEY }}`, ensure n8n supports environment variables
2. Restart n8n after setting environment variables
3. Use Method 1 or Method 2 instead (direct configuration)

---

## Summary

✅ **No .env file needed in n8n** - Configure API key directly in the workflow node  
✅ **Secure** - API key stored in n8n credentials or workflow configuration  
✅ **Easy to manage** - Update API key in one place (n8n) when needed  
✅ **Works with all n8n deployments** - Docker, npm, cloud, etc.

The API key only needs to be in your Next.js `.env` file for the API endpoint to validate requests.

