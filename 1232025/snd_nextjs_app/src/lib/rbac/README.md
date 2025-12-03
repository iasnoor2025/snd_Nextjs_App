# 🔐 Automatic RBAC System

This is a comprehensive, self-initializing Role-Based Access Control (RBAC) system that automatically sets up all necessary permissions, roles, and users when the application starts.

## ✨ Features

- **🔄 Auto-Initialization**: Automatically creates the complete RBAC system on startup
- **📊 Comprehensive Permissions**: 500+ granular permissions covering all system modules
- **👑 Multiple Roles**: 11 predefined roles with appropriate permission sets
- **👤 Auto-User Creation**: Automatically creates super admin users
- **🛡️ Smart Detection**: Only initializes if the system doesn't already exist
- **🔧 Manual Override**: Can be manually triggered via API or CLI

## 🚀 How It Works

### 1. Automatic Initialization
The RBAC system automatically initializes when the application starts:

```typescript
// In src/app/layout.tsx
<RBACInitializer /> // Automatically checks and initializes RBAC system
```

### 2. Smart Detection
The system checks if RBAC already exists before initializing:
- ✅ If roles exist → Skip initialization
- ❌ If no roles exist → Run full initialization

### 3. Complete Setup
When initializing, it creates:
- **11 System Roles** (SUPER_ADMIN, ADMIN, MANAGER, etc.)
- **500+ Permissions** (create.read.update.delete.manage.approve.reject.export.import.sync.reset for each subject)
- **3 Super Admin Users** (admin@snd.com, admin@ias.com, ias.snd2024@gmail.com)

## 🏗️ System Architecture

### Core Components

1. **`RBACInitializer`** - Main initialization class
2. **`rbac-initializer.ts`** - Core initialization logic
3. **`startup.ts`** - Startup utilities
4. **`/api/rbac/initialize`** - API endpoint for initialization
5. **`RBACInitializer` Component** - React component for UI initialization

### Permission Structure

```
Action.Subject
├── create.user
├── read.employee
├── update.equipment
├── delete.project
├── manage.all
├── approve.leave
├── reject.advance
├── export.report
├── import.data
├── sync.external
└── reset.system
```

### Role Hierarchy

```
SUPER_ADMIN (All permissions)
├── ADMIN (All except system-level)
├── MANAGER (Employee + Department + Approval)
├── SUPERVISOR (Team supervision + Approval)
├── OPERATOR (Equipment + Maintenance + Operations)
├── EMPLOYEE (Self-service + Own data)
├── USER (Basic read access)
├── PROJECT_LEADER (Project management)
├── FINANCE_SPECIALIST (Financial operations)
├── HR_SPECIALIST (Human resources)
└── SALES_REPRESENTATIVE (Sales operations)
```

## 🎯 Usage

### Automatic (Recommended)
The system automatically initializes on application startup. No manual intervention needed.

### Manual via API
```bash
# Check status
GET /api/rbac/initialize

# Initialize system
POST /api/rbac/initialize
```

### Manual via CLI
```bash
# Run the initialization script
node scripts/initialize-rbac.js
```

### Manual via Code
```typescript
import { manualRBACInitialization } from '@/lib/rbac/startup';

// Trigger manual initialization
const success = await manualRBACInitialization();
```

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
# or individual DB settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database
DB_USER=user
DB_PASSWORD=password
```

### Customization
To modify the RBAC system:

1. **Add New Roles**: Edit `createRoles()` in `RBACInitializer`
2. **Add New Permissions**: Edit `createPermissions()` in `RBACInitializer`
3. **Modify Role Permissions**: Edit `assignRolePermissions()` in `RBACInitializer`
4. **Add New Users**: Edit `createSuperAdminUsers()` in `RBACInitializer`

## 📊 Permission Coverage

The system covers all major modules:

- **User Management**: Users, roles, permissions
- **Employee Management**: Employees, documents, skills, training
- **Equipment Management**: Equipment, maintenance, history
- **Project Management**: Projects, tasks, milestones, resources
- **Financial Management**: Payroll, advances, loans, expenses
- **Time Management**: Timesheets, leave, approvals
- **Customer Management**: Customers, documents, projects
- **Safety & Compliance**: Incidents, reports, audits
- **System Operations**: Settings, backups, integrations

## 🚨 Important Notes

### Production Deployment
1. **Change Default Passwords**: All super admin users use `admin123` - change immediately
2. **Secure Database**: Ensure database connection is secure
3. **Monitor Logs**: Watch for initialization errors

### Development
1. **Reset Function**: Use `rbacInitializer.reset()` to clear and reinitialize
2. **Hot Reload**: System detects existing setup and skips re-initialization
3. **Error Handling**: Initialization failures don't crash the application

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL or individual DB settings
   - Ensure database is running and accessible

2. **Initialization Failed**
   - Check database permissions
   - Verify schema exists
   - Check console logs for specific errors

3. **Permissions Not Working**
   - Verify RBAC system is initialized
   - Check user role assignments
   - Verify permission checks in code

### Debug Commands

```bash
# Check RBAC status
curl http://localhost:3000/api/rbac/initialize

# Check database structure
node scripts/check-rbac-structure.js

# Manual initialization
node scripts/initialize-rbac.js
```

## 📈 Performance

- **Initialization Time**: ~2-5 seconds for complete setup
- **Memory Usage**: Minimal - only runs once on startup
- **Database Impact**: Creates ~500+ records (roles, permissions, assignments)
- **Caching**: Uses Redis for permission caching after initialization

## 🔄 Migration from Old System

If migrating from the old manual RBAC system:

1. **Backup**: Export existing RBAC data
2. **Reset**: Use `rbacInitializer.reset()` to clear old data
3. **Initialize**: Let the new system auto-initialize
4. **Verify**: Check that all permissions and roles are created
5. **Test**: Verify user access and permissions work correctly

## 🎉 Benefits

- **🚀 Zero Manual Setup**: Works out of the box
- **🔄 Always Up-to-Date**: Automatically creates latest permissions
- **🛡️ Consistent Security**: Standardized permission structure
- **📊 Complete Coverage**: All system modules covered
- **🔧 Easy Maintenance**: Centralized permission management
- **⚡ Fast Startup**: Smart detection prevents unnecessary initialization

---

**The RBAC system is now completely automatic and will work seamlessly after any database reset! 🎯**
