# 👥 User & Role Management System

## 📋 **Overview**

The User & Role Management System provides comprehensive user administration capabilities with role-based access control (RBAC). It allows administrators to manage users, create custom roles, and assign granular permissions.

## 🏗️ **Architecture**

### **Core Components**
- **User Management**: Create, read, update, delete users
- **Role Management**: Define custom roles with specific permissions
- **Permission System**: Granular permission-based access control
- **Authentication Integration**: Seamless integration with NextAuth.js

### **Database Schema**
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String?
  password    String?
  role        UserRole @default(USER)
  isActive    Boolean  @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  roles Role[]
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  permissions String[] @default([])
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users User[]
}
```

## 🎯 **Features**

### **User Management**
- ✅ **User CRUD Operations**: Create, read, update, delete users
- ✅ **Password Management**: Secure password hashing with bcrypt
- ✅ **User Status**: Active/inactive user management
- ✅ **Role Assignment**: Assign users to specific roles
- ✅ **Last Login Tracking**: Monitor user activity
- ✅ **Email Validation**: Unique email enforcement

### **Role Management**
- ✅ **Role CRUD Operations**: Create, read, update, delete roles
- ✅ **Permission Assignment**: Granular permission system
- ✅ **Role Status**: Active/inactive role management
- ✅ **User Count Tracking**: Monitor role usage
- ✅ **Role Validation**: Prevent deletion of roles with assigned users

### **Permission System**
- ✅ **Granular Permissions**: Module-specific permissions
- ✅ **Permission Categories**: Read, create, update, delete operations
- ✅ **Module Coverage**: All major modules covered
- ✅ **Permission Validation**: Server-side permission checking

## 🔐 **Security Features**

### **Authentication**
- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: JWT-based sessions
- **Login Tracking**: Last login timestamp
- **Account Status**: Active/inactive account management

### **Authorization**
- **Role-based Access**: User role assignment
- **Permission-based Access**: Granular permission control
- **API Protection**: Server-side permission validation
- **UI Protection**: Component-level access control

## 📊 **Available Permissions**

### **User Management**
- `users.read` - View user list and details
- `users.create` - Create new users
- `users.update` - Update user information
- `users.delete` - Delete users

### **Role Management**
- `roles.read` - View role list and details
- `roles.create` - Create new roles
- `roles.update` - Update role information
- `roles.delete` - Delete roles

### **Equipment Management**
- `equipment.read` - View equipment list and details
- `equipment.create` - Create new equipment
- `equipment.update` - Update equipment information
- `equipment.delete` - Delete equipment

### **Rental Management**
- `rentals.read` - View rental list and details
- `rentals.create` - Create new rentals
- `rentals.update` - Update rental information
- `rentals.delete` - Delete rentals

### **Employee Management**
- `employees.read` - View employee list and details
- `employees.create` - Create new employees
- `employees.update` - Update employee information
- `employees.delete` - Delete employees

### **Project Management**
- `projects.read` - View project list and details
- `projects.create` - Create new projects
- `projects.update` - Update project information
- `projects.delete` - Delete projects

### **Reporting**
- `reports.read` - View reports
- `reports.create` - Create new reports
- `reports.update` - Update reports
- `reports.delete` - Delete reports

### **Settings**
- `settings.read` - View system settings
- `settings.update` - Update system settings

### **Analytics**
- `analytics.read` - View analytics and dashboards

## 🎨 **User Interface**

### **Tabbed Interface**
- **Users Tab**: Complete user management
- **Roles Tab**: Role and permission management

### **User Management Features**
- **User List**: Display all users with key information
- **Create User**: Modal form for new user creation
- **Edit User**: Update user information
- **Delete User**: Remove users with confirmation
- **Status Indicators**: Visual status badges
- **Role Badges**: Color-coded role display

### **Role Management Features**
- **Role List**: Display all roles with user counts
- **Create Role**: Modal form with permission selection
- **Edit Role**: Update role and permissions
- **Delete Role**: Remove roles (with validation)
- **Permission Matrix**: Checkbox-based permission assignment
- **User Count**: Track role usage

## 🔧 **API Endpoints**

### **Users API** (`/api/users`)
```typescript
// GET /api/users - Get all users
GET /api/users

// POST /api/users - Create new user
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "MANAGER",
  "isActive": true
}

// PUT /api/users - Update user
PUT /api/users
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "isActive": true
}

// DELETE /api/users - Delete user
DELETE /api/users
{
  "id": "user-id"
}
```

### **Roles API** (`/api/roles`)
```typescript
// GET /api/roles - Get all roles with user counts
GET /api/roles

// POST /api/roles - Create new role
POST /api/roles
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role description",
  "permissions": ["users.read", "equipment.read"],
  "isActive": true
}

// PUT /api/roles - Update role
PUT /api/roles
{
  "id": "role-id",
  "name": "UPDATED_ROLE",
  "description": "Updated description",
  "permissions": ["users.read", "users.create"],
  "isActive": true
}

// DELETE /api/roles - Delete role
DELETE /api/roles
{
  "id": "role-id"
}
```

## 🚀 **Usage Guide**

### **Accessing User Management**
1. Navigate to `/modules/user-management`
2. Use the tabbed interface to switch between Users and Roles
3. Ensure you have appropriate permissions (`users.read`, `roles.read`)

### **Creating a New User**
1. Click "New User" button in the Users tab
2. Fill in the required fields:
   - **Name**: User's full name
   - **Email**: Unique email address
   - **Password**: Secure password
   - **Role**: Select from available roles
   - **Status**: Active or Inactive
3. Click "Create User"

### **Creating a New Role**
1. Click "New Role" button in the Roles tab
2. Fill in the required fields:
   - **Role Name**: Unique role identifier
   - **Description**: Role description
   - **Permissions**: Select from available permissions
   - **Status**: Active or Inactive
3. Click "Create Role"

### **Managing Permissions**
1. In the role creation/edit modal
2. Use the permission matrix to select permissions
3. Permissions are organized by module
4. Check/uncheck permissions as needed

## 🔒 **Security Best Practices**

### **Password Security**
- Passwords are hashed using bcrypt with 12 salt rounds
- Password validation on server side
- Secure password requirements

### **Role Security**
- Roles cannot be deleted if users are assigned
- Permission validation on server side
- Role-based access control enforcement

### **API Security**
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection
- CSRF protection via NextAuth

## 📈 **Default Roles**

### **Admin Role**
- **Description**: Full system administrator
- **Permissions**: All permissions across all modules
- **Use Case**: System administrators

### **Manager Role**
- **Description**: Department manager
- **Permissions**: Limited administrative permissions
- **Use Case**: Department heads, supervisors

### **User Role**
- **Description**: Standard user
- **Permissions**: Basic read permissions
- **Use Case**: Regular employees

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] Create new user with valid data
- [ ] Create new role with permissions
- [ ] Update user information
- [ ] Update role permissions
- [ ] Delete user (with confirmation)
- [ ] Delete role (with validation)
- [ ] Test permission-based access
- [ ] Test role-based restrictions

### **API Testing**
- [ ] Test all CRUD operations
- [ ] Test validation errors
- [ ] Test permission enforcement
- [ ] Test role validation

## 🐛 **Troubleshooting**

### **Common Issues**

#### **User Creation Fails**
- Check if email already exists
- Verify password meets requirements
- Ensure all required fields are provided

#### **Role Deletion Fails**
- Check if role has assigned users
- Remove user assignments first
- Verify role exists

#### **Permission Issues**
- Check user's role permissions
- Verify role is active
- Check server-side permission validation

### **Error Messages**
- **"User with this email already exists"**: Email must be unique
- **"Cannot delete role with assigned users"**: Remove user assignments first
- **"Role not found"**: Verify role ID is correct
- **"User not found"**: Verify user ID is correct

## 📚 **Integration**

### **With Authentication System**
- Seamless integration with NextAuth.js
- Role information included in JWT tokens
- Session-based role persistence

### **With Other Modules**
- Permission-based access to all modules
- Role-based UI restrictions
- Module-specific permission enforcement

## 🚀 **Deployment Considerations**

### **Database Migration**
- Ensure Role model is properly migrated
- Verify User model has password field
- Check all relationships are established

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### **Security Configuration**
- Enable HTTPS in production
- Configure proper CORS settings
- Set up rate limiting
- Enable audit logging

---

**The User & Role Management System provides a robust foundation for user administration with comprehensive security features and intuitive user interface.** 
