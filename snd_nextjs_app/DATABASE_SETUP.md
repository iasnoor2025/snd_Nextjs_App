# PostgreSQL Database Setup for Next.js App

This guide will help you set up PostgreSQL for the Next.js rental management application.

## Prerequisites

1. **PostgreSQL Installation**
   - Install PostgreSQL on your system
   - For Windows: Download from https://www.postgresql.org/download/windows/
   - For macOS: `brew install postgresql`
   - For Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Node.js and npm**
   - Ensure you have Node.js 18+ installed

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE snd_rental_db;

# Create user (optional)
CREATE USER snd_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE snd_rental_db TO snd_user;

# Exit psql
\q
```

### 2. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/snd_nextjs_db?schema=public"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

**Replace the following:**
- `username`: Your PostgreSQL username (default: postgres)
- `password`: Your PostgreSQL password
- `your-secret-key-here`: A secure random string for NextAuth

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (recommended for production)
npm run db:migrate
```

### 4. Seed Database

```bash
# Populate database with initial data
npm run db:seed
```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

## Database Schema

The application includes the following models:

### Users
- Authentication and authorization
- Role-based access control (ADMIN, USER, MANAGER)

### Customers
- Customer information and contact details
- Company information
- Rental history

### Equipment
- Equipment inventory
- Categories and status tracking
- Daily rental rates

### Rentals
- Rental agreements
- Customer and equipment relationships
- Status tracking (ACTIVE, COMPLETED, CANCELLED, OVERDUE)

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer by ID
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Equipment
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create new equipment
- `GET /api/equipment/[id]` - Get equipment by ID
- `PUT /api/equipment/[id]` - Update equipment
- `DELETE /api/equipment/[id]` - Delete equipment

### Rentals
- `GET /api/rentals` - List all rentals
- `POST /api/rentals` - Create new rental
- `GET /api/rentals/[id]` - Get rental by ID
- `PUT /api/rentals/[id]` - Update rental
- `DELETE /api/rentals/[id]` - Delete rental

## Development

### Prisma Studio
Access the database GUI:
```bash
npm run db:studio
```

### Database Reset
To reset the database during development:
```bash
# Drop and recreate database
npx prisma migrate reset

# Or manually
npx prisma db push --force-reset
npm run db:seed
```

## Production Deployment

1. **Environment Variables**
   - Set `DATABASE_URL` to your production PostgreSQL instance
   - Use strong passwords and secure connection strings
   - Consider using connection pooling for better performance

2. **Database Migrations**
   - Always run migrations before deploying
   - Test migrations in staging environment first
   - Backup database before major schema changes

3. **Security**
   - Use SSL connections in production
   - Implement proper authentication
   - Regular database backups
   - Monitor database performance

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL is running
   - Verify connection string format
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check pg_hba.conf configuration
   - Ensure user has proper permissions

3. **Schema Issues**
   - Run `npm run db:generate` after schema changes
   - Check for conflicting migrations
   - Verify database URL format

### Useful Commands

```bash
# Check database connection
npx prisma db pull

# View database schema
npx prisma format

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name migration_name
```

## Support

For database-related issues:
1. Check Prisma documentation: https://www.prisma.io/docs
2. Review PostgreSQL logs
3. Verify environment variables
4. Test with Prisma Studio 
