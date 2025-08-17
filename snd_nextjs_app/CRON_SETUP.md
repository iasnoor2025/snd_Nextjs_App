# Cron Service Setup for Timesheet Auto-Generation

This document explains how to set up and use the cron service for automatic timesheet generation.

## Overview

The cron service automatically generates timesheets at 4 AM every morning (Saudi Arabia timezone) based on employee assignments.

## Setup

### 1. Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```bash
# Cron Jobs
CRON_SECRET=snd-cron-secret-key-2024
```

### 2. Installation

The required packages are already installed:
- `node-cron` - For scheduling cron jobs
- `@types/node-cron` - TypeScript types

## Usage

### Option 1: Manual Initialization via UI

1. Go to the Timesheet Management page
2. Click the "Init Cron" button to start the cron service
3. Use "Cron Status" to check if the service is running
4. Use "Test Auto-Gen" to manually trigger timesheet generation
5. Use "Test DB" to verify database connectivity

### Option 2: Command Line

Run the cron service independently:

```bash
npm run cron:start
```

This will:
- Initialize the cron service
- Schedule timesheet auto-generation at 4 AM daily
- Schedule employee status updates at 5 AM daily
- In development mode, also run a test every 5 minutes

### Option 3: API Endpoints

- `POST /api/init-cron` - Initialize the cron service
- `GET /api/init-cron` - Get cron service status
- `POST /api/timesheets/auto-generate` - Manually trigger timesheet generation
- `GET /api/test-db` - Test database connection

## Cron Schedule

- **Timesheet Auto-Generation**: 4:00 AM daily (Asia/Riyadh timezone)
- **Employee Status Update**: 5:00 AM daily (Asia/Riyadh timezone)
- **Development Test**: Every 5 minutes (development mode only)

## How It Works

1. **Assignment Detection**: The service finds all active employee assignments
2. **Date Range**: Generates timesheets from assignment start date to end date (or today)
3. **Duplicate Prevention**: Skips dates where timesheets already exist
4. **Work Schedule**: 
   - Friday: Rest day (0 hours)
   - Saturday-Thursday: Regular workday (8 hours)

## Troubleshooting

### Common Issues

1. **Database Connection**: Use "Test DB" button to verify connectivity
2. **Environment Variables**: Check that CRON_SECRET is set
3. **Permissions**: Ensure the service has proper database permissions
4. **Timezone**: The service uses Asia/Riyadh timezone
5. **No Employee Assignments**: The service needs employee assignments to generate timesheets

### Debugging Steps

1. **Test Database**: Click "Test DB" to verify database connection
2. **Check Tables**: Ensure `employee_assignments`, `timesheets`, and `employees` tables exist
3. **Verify Data**: Check if there are employee assignments in the database
4. **Manual Test**: Use "Test Auto-Gen" to manually trigger generation
5. **Check Logs**: Look at server console for any error messages

## Production Deployment

For production deployment:

1. Set a strong CRON_SECRET
2. Use the `npm run cron:start` command in a separate process
3. Consider using a process manager like PM2
4. Monitor logs for any errors
5. Call `/api/init-cron` on server startup to initialize the service

## Security

- The cron service requires authentication in production
- Use the CRON_SECRET for API authentication
- The service only runs on the server side
- Client components cannot access the cron service directly

## Manual Startup

Since the cron service is not auto-initialized to prevent client-side bundling issues:

1. **On Application Start**: Call `POST /api/init-cron` to start the service
2. **Check Status**: Use `GET /api/init-cron` to verify the service is running
3. **Monitor**: Watch server logs for cron job execution messages
4. **Restart**: If the service stops, call the init endpoint again
