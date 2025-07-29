# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Database (if not already set)
DATABASE_URL="postgresql://postgres:password@localhost:5432/snd_nextjs_db"
```

## Test Credentials

The seeded database includes these test users:

- **Admin User**: admin@sndrental.com / password123
- **Manager User**: manager@sndrental.com / password123

## Features Implemented

1. **NextAuth.js Integration**: Credentials provider with Prisma
2. **Session Management**: JWT-based sessions
3. **Role-Based Access Control**: ADMIN and MANAGER roles
4. **Protected Routes**: Middleware and component-level protection
5. **User Interface**: Sign-in page and user dropdown in header
6. **Authentication Hooks**: Custom useAuth hook for easy access

## Usage

1. Start the development server: `npm run dev`
2. Navigate to any protected route
3. You'll be redirected to `/auth/signin`
4. Use the test credentials to sign in
5. Access will be granted based on user role

## Security Notes

- In production, use strong passwords and proper password hashing
- Change the NEXTAUTH_SECRET to a secure random string
- Implement proper password validation and reset functionality
- Consider adding rate limiting for login attempts 
