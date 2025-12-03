# n8n Environment Variables Setup Guide

This guide explains how to set up environment variables in n8n for the SPSP Expiry WhatsApp Notification workflow.

## Required Environment Variables

The workflow needs these environment variables:

1. `APP_URL` - Your Next.js application URL
2. `N8N_API_KEY` - API key for authenticating with your Next.js API
3. `WHATSAPP_PHONE_NUMBER_ID` - WhatsApp Business Phone Number ID
4. `WHATSAPP_RECIPIENT_NUMBER` - Phone number to receive notifications (format: +966XXXXXXXXX)

---

## Method 1: Docker Deployment (Recommended for Production)

If you're running n8n with Docker, set environment variables in your `docker-compose.yml` or `.env` file:

### Option A: Using docker-compose.yml

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your-password
      # Your custom environment variables
      - APP_URL=https://your-app-domain.com
      - N8N_API_KEY=your-secure-random-key-here
      - WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
      - WHATSAPP_RECIPIENT_NUMBER=+966501234567
    volumes:
      - n8n_data:/home/node/.n8n
    env_file:
      - .env  # Optional: load from .env file

volumes:
  n8n_data:
```

### Option B: Using .env file with Docker

Create a `.env` file in the same directory as your `docker-compose.yml`:

```env
APP_URL=https://your-app-domain.com
N8N_API_KEY=your-secure-random-key-here
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_RECIPIENT_NUMBER=+966501234567
```

Then reference it in `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    env_file:
      - .env
```

---

## Method 2: npm/npx Installation

If you installed n8n via npm/npx, set environment variables before starting:

### Linux/macOS:

```bash
export APP_URL=https://your-app-domain.com
export N8N_API_KEY=your-secure-random-key-here
export WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
export WHATSAPP_RECIPIENT_NUMBER=+966501234567

n8n start
```

### Windows (PowerShell):

```powershell
$env:APP_URL="https://your-app-domain.com"
$env:N8N_API_KEY="your-secure-random-key-here"
$env:WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-number-id"
$env:WHATSAPP_RECIPIENT_NUMBER="+966501234567"

n8n start
```

### Windows (Command Prompt):

```cmd
set APP_URL=https://your-app-domain.com
set N8N_API_KEY=your-secure-random-key-here
set WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
set WHATSAPP_RECIPIENT_NUMBER=+966501234567

n8n start
```

---

## Method 3: Systemd Service (Linux)

If running n8n as a systemd service, edit `/etc/systemd/system/n8n.service`:

```ini
[Unit]
Description=n8n workflow automation
After=network.target

[Service]
Type=simple
User=your-user
Environment="APP_URL=https://your-app-domain.com"
Environment="N8N_API_KEY=your-secure-random-key-here"
Environment="WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id"
Environment="WHATSAPP_RECIPIENT_NUMBER=+966501234567"
ExecStart=/usr/bin/n8n start
Restart=always

[Install]
WantedBy=multi-user.target
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart n8n
```

---

## Method 4: n8n Cloud (n8n.io)

If using n8n Cloud:

1. Go to your n8n workspace
2. Click on **Settings** (gear icon)
3. Go to **Environment Variables**
4. Click **Add Variable** for each variable:
   - `APP_URL`
   - `N8N_API_KEY`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_RECIPIENT_NUMBER`

---

## Method 5: Using n8n UI (Workflow Settings)

You can also set environment variables per workflow:

1. Open your workflow in n8n
2. Click **Settings** (top right)
3. Scroll to **Environment Variables**
4. Add your variables here

**Note:** This method is workflow-specific and not recommended for shared variables.

---

## Verifying Environment Variables

To verify your environment variables are set correctly:

1. Create a test workflow
2. Add a **Code** node
3. Use this code:

```javascript
return [{
  json: {
    appUrl: $env.APP_URL,
    apiKey: $env.N8N_API_KEY ? 'Set (hidden)' : 'Not set',
    whatsappPhoneId: $env.WHATSAPP_PHONE_NUMBER_ID ? 'Set (hidden)' : 'Not set',
    recipientNumber: $env.WHATSAPP_RECIPIENT_NUMBER
  }
}];
```

4. Execute the workflow and check the output

---

## Security Best Practices

1. **Never commit `.env` files to Git**
   - Add `.env` to your `.gitignore`

2. **Use strong API keys**
   - Generate a secure random key: `openssl rand -hex 32`

3. **Restrict access**
   - Only expose necessary environment variables
   - Use different keys for different environments (dev/staging/prod)

4. **Rotate keys regularly**
   - Change `N8N_API_KEY` periodically

---

## Troubleshooting

### Variables not working?

1. **Check variable names** - They must match exactly (case-sensitive)
2. **Restart n8n** - After setting environment variables, restart n8n
3. **Check syntax** - In workflow, use `={{ $env.VARIABLE_NAME }}`
4. **Verify access** - Make sure n8n has permission to read environment variables

### Testing the API endpoint

Test your API endpoint directly:

```bash
curl "https://your-app-domain.com/api/employees/spsp-expiring?days=10&apiKey=your-api-key&limit=10"
```

---

## Example Values

Here's an example of what your environment variables should look like:

```env
APP_URL=https://app.yourcompany.com
N8N_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_RECIPIENT_NUMBER=+966501234567
```

**Important:** Replace these with your actual values!

