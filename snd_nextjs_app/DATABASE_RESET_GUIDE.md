# Database Reset and Schema Fix Guide

This guide provides comprehensive instructions for resetting the database and fixing schema inconsistencies using Drizzle ORM.

## Overview

The application has been migrated from Prisma to Drizzle ORM. This guide helps you:
1. Reset the database completely
2. Fix schema inconsistencies
3. Validate the current schema
4. Set up a clean database with proper structure

## Prerequisites

1. **Environment Setup**: Ensure you have a `.env.local` file with your database connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   ```

2. **Dependencies**: Ensure all required packages are installed:
   ```bash
   npm install
   ```

## Available Scripts

### 1. Schema Analysis
```bash
npm run db:fix-schema
```
This script analyzes the current database schema and identifies inconsistencies with the Drizzle schema.

### 2. Complete Database Reset
```bash
npm run db:reset:complete
```
This script completely resets the database by:
- Dropping all existing tables
- Creating new tables from the Drizzle schema
- Setting up initial data (admin user, roles, permissions)

### 3. API-Based Reset
```bash
# Via the admin reset endpoint (requires authentication)
POST /api/admin/reset-db
```

### 4. Drizzle Commands
```bash
# Generate migration files
npm run drizzle:generate

# Push schema changes to database
npm run drizzle:push

# Open Drizzle Studio (database GUI)
npm run drizzle:studio
```

## Step-by-Step Reset Process

### Option 1: Complete Reset (Recommended)

1. **Stop the application** if it's running
2. **Run the complete reset script**:
   ```bash
   npm run db:reset:complete
   ```
3. **Verify the reset** by checking the database
4. **Start the application**:
   ```bash
   npm run dev
   ```

### Option 2: API-Based Reset

1. **Start the application**:
   ```bash
   npm run dev
   ```
2. **Navigate to the admin reset page**: `/admin/reset`
3. **Click "Reset Database"** button
4. **Wait for completion** and check the response

### Option 3: Manual Drizzle Reset

1. **Generate fresh migration**:
   ```bash
   npm run drizzle:generate
   ```
2. **Drop existing database**:
   ```bash
   npm run drizzle:drop
   ```
3. **Push new schema**:
   ```bash
   npm run drizzle:push
   ```

## Schema Validation

After resetting, validate the schema:

```bash
npm run db:fix-schema
```

This will show you:
- Missing tables
- Extra tables
- Table structure issues
- Foreign key relationships

## Expected Tables

The Drizzle schema should create the following tables:

### Core Tables
- `users` - User authentication and management
- `employees` - Employee information
- `customers` - Customer data
- `equipment` - Equipment inventory
- `rentals` - Rental agreements
- `projects` - Project management

### Supporting Tables
- `departments` - Department information
- `designations` - Job designations
- `locations` - Location data
- `timesheets` - Time tracking
- `payrolls` - Payroll information
- `advance_payments` - Advance payment records

### System Tables
- `roles` - Role definitions
- `permissions` - Permission definitions
- `model_has_roles` - Role assignments
- `role_has_permissions` - Permission assignments

## Initial Data

After reset, the following data is automatically created:

### Admin User
- **Email**: admin@ias.com
- **Password**: password
- **Role**: Admin (ID: 1)

### Basic Roles
- Admin
- Manager  
- Employee

### Basic Permissions
- create
- read
- update
- delete

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check DATABASE_URL in .env.local
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Permission Denied**
   - Ensure database user has sufficient privileges
   - Check if database exists

3. **Schema Mismatch**
   - Run `npm run drizzle:generate` first
   - Check for conflicting migrations

4. **Foreign Key Errors**
   - Tables are dropped in dependency order
   - Check the reset script for proper order

### Error Recovery

If the reset fails partway through:

1. **Check the logs** for specific error messages
2. **Manually drop remaining tables** if needed
3. **Run the reset script again**
4. **Verify database state** with schema analysis

## Verification Steps

After successful reset:

1. **Check table count**:
   ```bash
   npm run db:fix-schema
   ```

2. **Verify admin user**:
   - Login with admin@ias.com / password
   - Check admin dashboard access

3. **Test basic functionality**:
   - Create a new employee
   - Add equipment
   - Create a rental

4. **Check foreign keys**:
   - Verify relationships between tables
   - Test cascade operations

## Security Notes

- **Change default password** after first login
- **Review permissions** for production use
- **Backup database** before major changes
- **Test in development** before production

## Production Considerations

For production deployments:

1. **Backup existing data** before reset
2. **Schedule maintenance window** for reset
3. **Test reset process** in staging environment
4. **Have rollback plan** ready
5. **Monitor application** after reset

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Run schema analysis to identify specific problems
3. Review the troubleshooting section above
4. Check database connection and permissions
5. Verify environment variables are set correctly

## Migration Notes

This reset process is designed for:
- Development environments
- Testing scenarios
- Schema migration from Prisma to Drizzle
- Clean slate deployments

For production data migration, consider:
- Data export/import procedures
- Incremental schema updates
- Zero-downtime migration strategies
