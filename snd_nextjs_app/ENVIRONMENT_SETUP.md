# Environment Setup for Next.js App

## Overview

This document explains how to set up the environment variables for the Next.js application.

## Environment Variables

Create a `.env.local` file in the root of the Next.js app with the following variables:

```env
# ERPNext Integration
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# Laravel Backend
NEXT_PUBLIC_LARAVEL_URL=http://localhost:8000
```

## Variable Descriptions

### ERPNext Integration
- `NEXT_PUBLIC_ERPNEXT_URL`: The base URL of your ERPNext instance
- `ERPNEXT_API_KEY`: Your ERPNext API key (server-side only)
- `ERPNEXT_API_SECRET`: Your ERPNext API secret (server-side only)

### Laravel Backend
- `NEXT_PUBLIC_LARAVEL_URL`: The URL of your Laravel backend API

## Security Notes

1. **Never commit `.env.local` to version control** - It's already in `.gitignore`
2. **API credentials are server-side only** - The ERPNext API key and secret are only used in Next.js API routes
3. **Public variables** - Only variables prefixed with `NEXT_PUBLIC_` are available in the browser

## Getting ERPNext Credentials

1. Log into your ERPNext instance
2. Go to **Setup > Users and Permissions > Users**
3. Find or create a user with API access
4. Generate API key and secret for that user
5. Ensure the user has appropriate permissions for the resources you need to access

## Testing the Setup

After setting up the environment variables, you can test the ERPNext connection by:

1. Starting the development server: `npm run dev`
2. Visiting the ERPNext integration settings page
3. Clicking "Test Connection" to verify the setup

## Troubleshooting

If you encounter issues:

1. **Check environment variables** - Ensure all required variables are set
2. **Verify ERPNext credentials** - Test the API key and secret directly
3. **Check network connectivity** - Ensure the app can reach the ERPNext instance
4. **Review server logs** - Check the console for detailed error messages 
