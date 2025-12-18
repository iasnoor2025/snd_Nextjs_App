# Role Color System - Automatic & Manual Color Assignment

## Overview
The role color system supports **both automatic and manual color assignment** for roles. When you add a new role, you can either:
1. **Let the system auto-assign a color** (automatic)
2. **Manually select a color** (configurable)

## How It Works

### 1. Automatic Color Assignment (Default)
When you create a new role **without specifying a color**, the system will:
- Automatically assign a color based on the role name hash
- Ensure the same role always gets the same color (consistent)
- Use one of 8 predefined color options:
  - indigo, teal, pink, cyan, amber, emerald, violet, rose

**Example:**
```javascript
// Create role without color - auto-assigned
POST /api/roles
{
  "name": "WORKSHOP_MANAGER"
  // No color field - system auto-assigns
}
```

### 2. Manual Color Selection (Configurable)
You can **manually set a color** when creating or updating a role:

**Available Colors:**
- `red`, `blue`, `purple`, `orange`, `green`, `gray`, `slate`
- `indigo`, `teal`, `pink`, `cyan`, `amber`, `emerald`, `violet`, `rose`

**Example:**
```javascript
// Create role with specific color
POST /api/roles
{
  "name": "FINANCE_SPECIALIST",
  "color": "green"  // Manually selected
}

// Update existing role color
PUT /api/roles
{
  "id": 5,
  "color": "purple"  // Change color
}
```

## Database Schema

The `roles` table now includes a `color` field:
```sql
ALTER TABLE roles ADD COLUMN color text;
```

## Default Colors for Existing Roles

When the migration runs, default colors are set:
- **SUPER_ADMIN**: `red`
- **ADMIN**: `blue`
- **MANAGER**: `purple`
- **SUPERVISOR**: `orange`
- **OPERATOR**: `green`
- **EMPLOYEE**: `gray`
- **USER**: `slate`

## Color Priority

The system uses colors in this order:
1. **Database color** (if set) - Highest priority
2. **Hardcoded colors** (for known roles like SUPER_ADMIN, ADMIN, etc.)
3. **Auto-assigned color** (hash-based for custom roles)

## Usage in Header

The header automatically uses the role color:
- **Header background** changes based on role color
- **Role badge** uses matching color
- **Dark mode** support included

## API Endpoints

### Get Roles (includes color)
```javascript
GET /api/roles
// Returns: [{ id, name, color, ... }]
```

### Create Role (with optional color)
```javascript
POST /api/roles
{
  "name": "NEW_ROLE",
  "color": "blue"  // Optional - auto-assigned if omitted
}
```

### Update Role Color
```javascript
PUT /api/roles
{
  "id": 1,
  "color": "purple"  // Update color
}
```

## Migration

Run the migration to add the color column:
```sql
-- File: drizzle/migrations/0033_add_role_color.sql
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color text;
```

## Benefits

✅ **Automatic**: New roles get colors automatically  
✅ **Configurable**: Admins can customize colors  
✅ **Consistent**: Same role always gets same color  
✅ **Flexible**: Easy to change colors later  
✅ **No Code Changes**: Update colors via API, no deployment needed

## Example Workflow

1. **Create new role** → System auto-assigns color
2. **Review in UI** → See auto-assigned color
3. **Customize if needed** → Update via API with preferred color
4. **Done!** → Color persists in database

