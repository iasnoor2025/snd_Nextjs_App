# Equipment Status Monitor - Integrated Cron System

This system automatically monitors and fixes equipment status inconsistencies in your database. **It's already integrated with your existing cron system** - no external cron setup required!

## What It Monitors

The system provides **immediate real-time updates** plus **automated monitoring**:

### 🚀 **Immediate Real-Time Updates** (No Waiting!)
- **Equipment Assignment**: Status changes to 'assigned' instantly when equipment is assigned
- **Equipment Unassignment**: Status changes to 'available' instantly when assignment ends
- **Maintenance Start**: Status changes to 'under_maintenance' instantly when maintenance begins
- **Maintenance Complete**: Status changes to 'available' instantly when maintenance ends

### 🔍 **Automated Monitoring** (Backup System)
The cron job checks for and fixes any inconsistencies:

1. **Equipment with 'under_maintenance' status but no maintenance records**
   - Action: Set status to 'available'

2. **Equipment with 'assigned' status but no active rental/assignment records**
   - Action: Set status to 'available'

3. **Equipment with 'available' status but has active maintenance records**
   - Action: Set status to 'under_maintenance'

4. **Equipment with 'available' status but has active rental/assignment records**
   - Action: Set status to 'assigned'

## API Endpoints

### 1. Cron Job Endpoint (Automated - Already Integrated!)
```
POST /api/cron/equipment-status-monitor
Authorization: Bearer {CRON_SECRET}
```
**✅ This is already running automatically via your existing cron system!**

### 2. Admin Manual Trigger (Immediate Fix)
```
POST /api/admin/fix-equipment-status
GET /api/admin/fix-equipment-status
```
Requires: SUPER_ADMIN or ADMIN role

### 3. Admin Immediate Status Update (Real-Time Sync)
```
POST /api/admin/update-all-equipment-status
GET /api/admin/update-all-equipment-status
```
Requires: SUPER_ADMIN or ADMIN role
**Updates ALL equipment statuses immediately based on current assignments and maintenance**

## Environment Variables

Add this to your `.env.local`:

```bash
# Cron job authentication secret
CRON_SECRET=your-secure-cron-secret-here
```

## Cron Job Setup

### ✅ **Already Integrated - No Setup Required!**

The equipment status monitor is **already integrated** with your existing cron system in `src/lib/services/cron-service.ts`. It runs automatically:

- **Every Hour**: Equipment status monitoring for critical issues
- **Daily at 6 AM**: Comprehensive equipment status check  
- **Timezone**: Asia/Riyadh (Saudi Arabia)

### Manual Setup (Optional - Only if you want external cron)

If you prefer to use external cron services instead of the integrated system:

### Option 2: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 15 minutes)
4. Action: Start a program
5. Program: `curl.exe`
6. Arguments: `-X POST "https://yourdomain.com/api/cron/equipment-status-monitor" -H "Authorization: Bearer your-secure-cron-secret-here"`

### Option 3: Cloud Cron Services

#### GitHub Actions (Free tier: 2000 minutes/month)
Create `.github/workflows/equipment-monitor.yml`:

```yaml
name: Equipment Status Monitor
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Monitor Equipment Status
        run: |
          curl -X POST "https://yourdomain.com/api/cron/equipment-status-monitor" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

#### Vercel Cron Jobs (Pro plan required)
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/equipment-status-monitor",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Current Status & Testing

### 🎯 **Current Issue Found & Fixed**

The system has already identified that **LOADER 1886 AAA** equipment has incorrect status:
- **Current Status**: `available` ❌
- **Should Be**: `assigned` ✅ (because it has active rental records)
- **Fix**: The monitor will automatically correct this

### Testing the System

#### 1. Check Current Status
```bash
curl -X GET "https://yourdomain.com/api/admin/fix-equipment-status" \
  -H "Authorization: Bearer your-admin-token"
```

#### 2. Manual Fix (Immediate)
```bash
curl -X POST "https://yourdomain.com/api/admin/fix-equipment-status" \
  -H "Authorization: Bearer your-admin-token"
```

#### 3. Test Cron Endpoint
```bash
curl -X POST "https://yourdomain.com/api/cron/equipment-status-monitor" \
  -H "Authorization: Bearer your-cron-secret"
```

#### 4. Verify Fix
After running the fix, check the equipment inventory page - LOADER 1886 AAA should show status "Assigned" instead of "Available".

### Testing Immediate Status Updates

#### 5. Test Real-Time Assignment
```bash
# Create a new equipment assignment
curl -X POST "https://yourdomain.com/api/equipment/{equipmentId}/rentals" \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "assignment_type": "rental",
    "start_date": "2025-01-01",
    "status": "active"
  }'
```
**Result**: Equipment status should change to "assigned" immediately (no waiting for cron)

#### 6. Test Real-Time Maintenance
```bash
# Create a new maintenance record
curl -X POST "https://yourdomain.com/api/maintenance" \
  -H "Authorization: Bearer your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": 123,
    "title": "Test Maintenance",
    "status": "open"
  }'
```
**Result**: Equipment status should change to "under_maintenance" immediately

#### 7. Bulk Immediate Update
```bash
# Update all equipment statuses immediately
curl -X POST "https://yourdomain.com/api/admin/update-all-equipment-status" \
  -H "Authorization: Bearer your-admin-token"
```
**Result**: All equipment statuses updated immediately based on current data

## Monitoring and Logs

The system logs all activities to your application logs. Check for:
- `🔍 Starting equipment status monitoring...`
- `✅ Fixed [equipment] status to [new_status]`
- `🎉 Equipment status monitoring completed. Checked: X, Fixed: Y`

## Security Considerations

1. **CRON_SECRET**: Use a strong, unique secret for cron authentication
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **IP Whitelisting**: Optionally restrict cron calls to specific IP addresses
4. **Logging**: Monitor for unauthorized access attempts

## Troubleshooting

### Common Issues

1. **Cron job not running**
   - Check cron service status: `sudo systemctl status cron`
   - Verify cron syntax: `crontab -l`
   - Check logs: `tail -f /var/log/cron`

2. **Authentication errors**
   - Verify CRON_SECRET environment variable
   - Check Authorization header format
   - Ensure endpoint is accessible

3. **Database connection issues**
   - Verify database connection string
   - Check database permissions
   - Monitor connection pool limits

### Debug Mode

To enable debug logging, add to your environment:
```bash
DEBUG_EQUIPMENT_MONITOR=true
```

## Performance Considerations

- **Frequency**: 15-minute intervals are recommended for most use cases
- **Database Impact**: The monitoring queries are optimized with EXISTS clauses
- **Scaling**: For large equipment databases, consider running during off-peak hours
- **Caching**: The system doesn't cache results to ensure real-time accuracy

## Integration with Existing Systems

The cron job integrates with your existing:
- Equipment management system
- Maintenance tracking
- Rental/assignment system
- RBAC permissions

No changes to existing functionality are required.
