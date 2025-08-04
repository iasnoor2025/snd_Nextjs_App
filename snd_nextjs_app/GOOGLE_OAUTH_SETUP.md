# Google OAuth Setup Guide

## Overview

This guide will help you set up Google OAuth authentication for your Next.js application. The implementation includes:

- Google OAuth provider integration with NextAuth.js
- Automatic user creation for new Google users
- Role-based access control for Google users
- Seamless integration with existing credentials authentication

## Prerequisites

1. A Google Cloud Console account
2. Your Next.js application running locally
3. Access to your application's environment variables

## Step 1: Create Google OAuth Credentials

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Fill in the following details:

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com (when deployed)
   ```

   **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.com/api/auth/callback/google (when deployed)
   ```

5. Click **Create**
6. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Existing NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

## Step 3: Database Schema Requirements

The implementation expects the following user table structure:

```sql
-- Ensure your users table has these fields:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255), -- Can be empty for OAuth users
  isActive BOOLEAN DEFAULT true,
  role_id INTEGER DEFAULT 1,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 4: Testing the Implementation

### 4.1 Start the Development Server

```bash
npm run dev
```

### 4.2 Test Google Login

1. Navigate to `http://localhost:3000/login`
2. Click the "Sign in with Google" button
3. Complete the Google OAuth flow
4. Verify that you're redirected to the dashboard

### 4.3 Verify User Creation

Check your database to confirm that new users are created with:
- Email from Google account
- Name from Google account (or email prefix if name not available)
- `role_id` set to 1 (USER role)
- `isActive` set to true
- `email_verified_at` set to current timestamp

## Step 5: Role Management

### 5.1 Default Role Assignment

New Google OAuth users are assigned the `USER` role by default. To change this:

1. Modify the `signIn` callback in `src/app/api/auth/[...nextauth]/route.ts`
2. Update the `role_id` value in the user creation logic

### 5.2 Admin Role Assignment

To assign admin roles to specific Google accounts:

1. Add logic in the `signIn` callback to check for specific email domains or addresses
2. Update the `role_id` accordingly

Example:
```typescript
// In the signIn callback
if (user.email?.endsWith('@yourcompany.com')) {
  newUser = await prisma.user.create({
    data: {
      // ... other fields
      role_id: 5, // ADMIN role
    },
  });
}
```

## Step 6: Production Deployment

### 6.1 Update Redirect URIs

When deploying to production:

1. Update your Google OAuth credentials in Google Cloud Console
2. Add your production domain to authorized origins and redirect URIs
3. Update environment variables with production values

### 6.2 Environment Variables

Ensure these are set in your production environment:

```env
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your_secure_production_secret
```

## Features Implemented

### ✅ Authentication Methods
- **Google OAuth**: One-click sign-in with Google accounts
- **Credentials**: Traditional email/password authentication
- **Hybrid Support**: Users can use either method

### ✅ User Management
- **Automatic User Creation**: New Google users are automatically created
- **Existing User Support**: Existing users can sign in with Google
- **Role Assignment**: Proper role assignment for OAuth users
- **Account Status**: Respects user active/inactive status

### ✅ Security Features
- **Email Verification**: Google accounts are automatically verified
- **Session Management**: JWT-based sessions with proper expiration
- **Error Handling**: Comprehensive error handling and user feedback

### ✅ User Experience
- **Loading States**: Visual feedback during authentication
- **Error Messages**: Clear error messages for failed attempts
- **Success Feedback**: Toast notifications for successful login
- **Responsive Design**: Works on all device sizes

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure your redirect URI exactly matches what's configured in Google Cloud Console
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error**
   - Verify your `GOOGLE_CLIENT_ID` environment variable is correct
   - Ensure the OAuth credentials are properly configured

3. **User not created in database**
   - Check database connection and schema
   - Verify Prisma is properly configured
   - Check server logs for detailed error messages

4. **Role assignment issues**
   - Verify the `roleMap` configuration in the auth route
   - Check that the user table has the correct `role_id` field

### Debug Mode

Enable debug mode by setting:
```env
NODE_ENV=development
```

This will provide detailed logs for authentication issues.

## Security Considerations

1. **Environment Variables**: Never commit OAuth secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Session Security**: Use strong, unique secrets for NEXTAUTH_SECRET
4. **User Validation**: Implement additional validation if needed for your use case
5. **Rate Limiting**: Consider implementing rate limiting for authentication endpoints

## Support

For issues or questions:
1. Check the NextAuth.js documentation
2. Review Google OAuth documentation
3. Check server logs for detailed error messages
4. Verify all environment variables are properly set 