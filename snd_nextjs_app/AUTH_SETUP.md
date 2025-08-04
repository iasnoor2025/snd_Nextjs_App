# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database (if not already set)
DATABASE_URL="postgresql://postgres:password@localhost:5432/snd_nextjs_db"
```

## Google OAuth Setup

To enable Google OAuth authentication:

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client IDs**
   - Choose **Web application** as the application type
   - Add authorized origins: `http://localhost:3000`
   - Add redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Note down your **Client ID** and **Client Secret**

2. **Configure Environment Variables:**
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env.local`
   - See `GOOGLE_OAUTH_SETUP.md` for detailed instructions

## Test Credentials

The seeded database includes these test users:

- **Admin User**: admin@sndrental.com / password123
- **Manager User**: manager@sndrental.com / password123

## Features Implemented

1. **NextAuth.js Integration**: Credentials provider with Prisma
2. **Google OAuth**: One-click sign-in with Google accounts
3. **Session Management**: JWT-based sessions
4. **Role-Based Access Control**: ADMIN and MANAGER roles
5. **Protected Routes**: Middleware and component-level protection
6. **User Interface**: Sign-in page with both Google and credentials options
7. **Authentication Hooks**: Custom useAuth hook for easy access
8. **Automatic User Creation**: New Google users are automatically created

## Usage

1. Start the development server: `npm run dev`
2. Navigate to any protected route
3. You'll be redirected to `/login`
4. Choose between:
   - **Google OAuth**: Click "Sign in with Google" for one-click login
   - **Credentials**: Use email/password for traditional login
5. Access will be granted based on user role

## Security Notes

- In production, use strong passwords and proper password hashing
- Change the NEXTAUTH_SECRET to a secure random string
- Implement proper password validation and reset functionality
- Consider adding rate limiting for login attempts
- Never commit OAuth secrets to version control
- Always use HTTPS in production

## Google OAuth Features

- **Automatic User Creation**: New Google users are created with USER role
- **Existing User Support**: Users with existing accounts can sign in with Google
- **Role Assignment**: Proper role mapping for OAuth users
- **Email Verification**: Google accounts are automatically verified
- **Hybrid Authentication**: Supports both OAuth and credentials simultaneously 
