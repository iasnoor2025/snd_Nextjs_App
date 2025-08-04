# Quick Database Setup Guide

## Environment Variables Required

Create a `.env.local` file in the root of your Next.js app with the following variables:

```env
# Database Configuration (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/snd_nextjs_db"

# Next.js Configuration
NEXT_PUBLIC_API_URL="/api"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Development
NODE_ENV="development"
```

## Database Connection Issues

If you're getting 500 errors when loading employees, check:

1. **DATABASE_URL is set correctly** - Make sure your `.env.local` file has the correct database URL
2. **Database is running** - Ensure your PostgreSQL database is running and accessible
3. **Database exists** - Make sure the database `snd_nextjs_db` exists
4. **Prisma migrations are applied** - Run `npx prisma migrate dev` to apply migrations

## Quick Fix Steps

1. Create `.env.local` file with the DATABASE_URL
2. Run database migrations: `npx prisma migrate dev`
3. Restart your development server: `npm run dev`

## Testing Database Connection

You can test the database connection by visiting `/api/employees` in your browser or using curl:

```bash
curl http://localhost:3000/api/employees
```

If you see a JSON response with employee data, the connection is working. 
