# Fix: "Authorization failed" Error in n8n

## Problem
Error: "Authorization failed - please check your credentials"  
Cause: Bearer Token field has placeholder value instead of actual API key

## Solution

### Step 1: Get Your API Key
Check your Next.js `.env` file for:
```env
N8N_API_KEY=your-actual-api-key-here
```

### Step 2: Configure Bearer Auth Credential

1. **Open the Bearer Auth credential modal**
2. **In "Bearer Token" field:**
   - ❌ Remove: `__n8n_BLANK_VALUE_e5362baf-c777-4d57-a609-6eaf1f9e87f6`
   - ✅ Enter: Your actual API key (just the key, no "Bearer " prefix)
3. **Click "Save"**

### Step 3: Configure HTTP Request Node

1. **Open "Fetch Expiring SPSP Licenses" node**
2. **Authentication dropdown:**
   - Select: **"Bearer Auth"**
   - Credential: Select your **"Bearer Auth account"**
3. **Remove manual headers:**
   - If you see "Authorization" in Headers section, remove it
   - The Bearer Auth credential handles this automatically
4. **Save the node**

### Step 4: Test

1. **Execute the workflow manually**
2. **Check the response:**
   - ✅ Success: Should return JSON with employee data
   - ❌ Error: Check that API key matches in both places

## Important Notes

- **Bearer Token = Just the key** (n8n adds "Bearer " automatically)
- **API key must match** in:
  - n8n Bearer Auth credential
  - Next.js `.env` file (`N8N_API_KEY`)
- **No manual headers needed** when using Bearer Auth credential

## Example

**Bearer Token field should contain:**
```
5bb6d0ad689714c86b04e7e33b8a75e6af69b469488df7f7d60d47b5c005d722
```

**NOT:**
```
Bearer 5bb6d0ad689714c86b04e7e33b8a75e6af69b469488df7f7d60d47b5c005d722
```

