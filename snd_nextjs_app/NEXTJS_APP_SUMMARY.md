# SND Next.js App - Comprehensive Summary

## 🏗️ **Project Overview**

**SND Rental Management System** is a comprehensive enterprise-level web application built with Next.js 15, designed for equipment and property rental management. The application serves as a modern frontend interface that integrates with a Laravel backend API.

## 🎯 **Core Purpose**

The application manages rental operations including:
- Equipment and property rentals
- Employee management and timesheets
- Customer relationship management
- Payroll processing
- Project management
- Analytics and reporting
- Document management

## 🛠️ **Technology Stack**

### **Core Framework & Runtime**
- **Next.js 15.2.4** (App Router)
- **React 18.3.1** with TypeScript
- **Node.js** runtime environment
- **TypeScript 5** for type safety

### **Frontend Styling & UI**
- **Tailwind CSS 3.4.17** for utility-first styling
- **Radix UI** components for accessible UI elements:
  - `@radix-ui/react-accordion` - Collapsible content
  - `@radix-ui/react-alert-dialog` - Modal dialogs
  - `@radix-ui/react-avatar` - User avatars
  - `@radix-ui/react-checkbox` - Checkbox inputs
  - `@radix-ui/react-collapsible` - Collapsible sections
  - `@radix-ui/react-dialog` - Modal dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-hover-card` - Hover cards
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-menubar` - Menu bars
  - `@radix-ui/react-navigation-menu` - Navigation
  - `@radix-ui/react-popover` - Popover content
  - `@radix-ui/react-progress` - Progress indicators
  - `@radix-ui/react-radio-group` - Radio buttons
  - `@radix-ui/react-select` - Select dropdowns
  - `@radix-ui/react-separator` - Visual separators
  - `@radix-ui/react-slider` - Range sliders
  - `@radix-ui/react-slot` - Component composition
  - `@radix-ui/react-switch` - Toggle switches
  - `@radix-ui/react-tabs` - Tab interfaces
  - `@radix-ui/react-toggle` - Toggle buttons
  - `@radix-ui/react-toggle-group` - Toggle groups
  - `@radix-ui/react-tooltip` - Tooltips

### **State Management & Data Fetching**
- **TanStack Query 5.80.7** (React Query) for server state
- **Zustand 5.0.5** for client state management
- **React Hook Form 7.58.1** for form handling
- **@hookform/resolvers 5.1.1** for form validation

### **Authentication & Authorization**
- **NextAuth.js 4.24.11** for authentication
- **@auth/prisma-adapter 2.10.0** for Prisma integration
- **CASL 6.7.3** for Role-Based Access Control (RBAC)
- **@casl/react 5.0.0** for React integration
- **@casl/ability 6.7.3** for permission management
- **bcryptjs 3.0.2** for password hashing
- **Session management** with JWT tokens

### **Database & ORM**
- **PostgreSQL** as primary database
- **Prisma 6.12.0** ORM for database operations
- **@prisma/client 6.12.0** for database queries
- **pg 8.16.3** PostgreSQL driver
- **Database migrations** and seeding
- **Prisma Studio** for database management

### **File Storage & Upload**
- **AWS S3-compatible** storage (Coolify/MinIO)
- **@aws-sdk/client-s3 3.540.0** for S3 operations
- **Formidable 3.5.4** for file upload handling
- **Image processing** and optimization
- **React Image Crop 11.0.10** for image editing

### **Internationalization (i18n)**
- **i18next 25.3.2** for translation management
- **react-i18next 15.5.3** for React integration
- **i18next-browser-languagedetector 8.2.0** for language detection
- **i18next-http-backend 3.0.2** for backend loading
- **next-intl 3.9.1** for Next.js integration
- **Arabic (RTL) and English** language support
- **@umalqura/core 0.0.7** for Hijri calendar
- **@vvo/tzdb 6.176.0** for timezone data

### **UI/UX Libraries & Components**
- **Framer Motion 12.23.0** for animations
- **Lucide React 0.475.0** for icons
- **@tabler/icons-react 3.34.1** for additional icons
- **React Day Picker 9.8.1** for date selection
- **@skhazaei/persian-date-picker 0.1.0** for Persian dates
- **Recharts 2.15.4** for data visualization
- **Sonner 2.0.6** for toast notifications
- **Ant Design 5.26.1** for additional UI components
- **@headlessui/react 2.2.0** for unstyled components
- **Vaul 1.1.2** for drawer components
- **React Resizable Panels 3.0.3** for resizable layouts
- **React Grid Layout 1.5.2** for grid layouts

### **Data Tables & Forms**
- **@tanstack/react-table 8.21.3** for data tables
- **React Hook Form 7.58.1** for form management
- **Zod 3.25.76** for schema validation
- **Class Variance Authority 0.7.1** for component variants
- **CLSX 2.1.1** for conditional classes
- **Tailwind Merge 3.3.1** for class merging

### **Drag & Drop**
- **@dnd-kit/core 6.3.1** for drag and drop
- **@dnd-kit/sortable 10.0.0** for sortable lists
- **@dnd-kit/modifiers 9.0.0** for drag modifiers
- **@dnd-kit/utilities 3.2.2** for utility functions

### **Date & Time Handling**
- **date-fns 4.1.0** for date manipulation
- **date-fns-tz 3.2.0** for timezone support
- **@umalqura/core 0.0.7** for Hijri calendar
- **@vvo/tzdb 6.176.0** for timezone database

### **PDF & Document Generation**
- **jsPDF 3.0.1** for PDF generation
- **html2canvas 1.4.1** for HTML to canvas
- **React To Print 3.1.1** for printing
- **Puppeteer 24.15.0** for PDF generation

### **QR Codes & Utilities**
- **qrcode.react 4.2.0** for QR code generation
- **CMDK 1.1.1** for command palette
- **React Spring Web 10.0.1** for spring animations

### **Theme & Styling**
- **next-themes 0.4.6** for theme management
- **tailwindcss-animate 1.0.7** for animations
- **Autoprefixer 10.4.21** for CSS prefixes
- **PostCSS 8.5.6** for CSS processing

### **Development Tools**
- **ESLint 9** for code linting
- **Prettier 3.4.2** for code formatting
- **prettier-plugin-organize-imports 4.1.0** for import organization
- **prettier-plugin-tailwindcss 0.6.11** for Tailwind formatting
- **@tanstack/react-query-devtools 5.83.0** for query debugging
- **TSX 4.20.3** for TypeScript execution

### **Type Definitions**
- **@types/node 22** for Node.js types
- **@types/react 18.3.23** for React types
- **@types/react-dom 18.3.7** for React DOM types
- **@types/bcryptjs 2.4.6** for bcryptjs types
- **@types/formidable 3.4.5** for formidable types
- **@types/next-auth 3.13.0** for NextAuth types
- **@types/react-grid-layout 1.3.5** for grid layout types
- **@types/react-i18next 7.8.3** for i18next types

## 📁 **Project Structure**

```
snd_nextjs_app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── modules/           # Feature modules
│   │   │   ├── employee-management/
│   │   │   ├── customer-management/
│   │   │   ├── equipment-management/
│   │   │   ├── rental-management/
│   │   │   ├── timesheet-management/
│   │   │   ├── payroll-management/
│   │   │   ├── project-management/
│   │   │   ├── analytics/
│   │   │   ├── reporting/
│   │   │   ├── settings/
│   │   │   └── notifications/
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components
│   │   ├── employee/         # Employee-specific components
│   │   ├── timesheet/        # Timesheet components
│   │   └── project/          # Project components
│   ├── lib/                  # Utility libraries
│   │   ├── api-service.ts    # API client
│   │   ├── auth-config.ts    # Auth configuration
│   │   ├── rbac/            # RBAC implementation
│   │   └── i18n/            # Internationalization
│   ├── hooks/               # Custom React hooks
│   ├── contexts/            # React contexts
│   └── locales/             # Translation files
├── prisma/                  # Database schema & migrations
├── public/                  # Static assets
└── scripts/                 # Utility scripts
```

## 🔧 **Key Features & Modules**

### **1. Employee Management**
- Employee CRUD operations
- Document management
- Performance reviews
- Training tracking
- Salary management
- Leave management
- Skills and certifications

### **2. Customer Management**
- Customer profiles
- Contact information
- Rental history
- Payment tracking
- Document storage

### **3. Equipment Management**
- Equipment inventory
- Maintenance tracking
- Availability status
- Image management
- ERPNext integration

### **4. Rental Management**
- Rental agreements
- Equipment allocation
- Duration tracking
- Pricing calculations
- Approval workflows
- Completion tracking

### **5. Timesheet Management**
- Time tracking
- Project assignments
- Approval workflows
- Overtime calculations
- Geofencing support

### **6. Payroll Management**
- Salary calculations
- Deductions and bonuses
- Tax handling
- Payment processing
- Report generation

### **7. Project Management**
- Project creation and tracking
- Resource allocation
- Timeline management
- Budget tracking
- Progress monitoring

### **8. Analytics & Reporting**
- Dashboard statistics
- Financial reports
- Equipment utilization
- Rental analytics
- Export capabilities (PDF, Excel, CSV)

## 🔐 **Authentication & Authorization**

### **Authentication Flow**
1. **NextAuth.js** handles user sessions
2. **JWT tokens** for API authentication
3. **Session persistence** across requests
4. **Role-based access** control

### **RBAC Implementation**
- **CASL** for permission management
- **Role-based** component rendering
- **API route protection**
- **Dynamic permission checking**

### **User Roles**
- **Super Admin**: Full system access
- **Admin**: Module-specific access
- **Manager**: Team management
- **Employee**: Limited access
- **Customer**: Rental access only

## 🌐 **Internationalization**

### **Supported Languages**
- **English** (LTR)
- **Arabic** (RTL)

### **Implementation**
- **i18next** for translation management
- **Dynamic language switching**
- **RTL layout support**
- **Date/time localization**

## 📊 **API Integration**

### **API Service Layer**
```typescript
// Centralized API client
class ApiService {
  static async request<T>(endpoint: string, options: ApiOptions)
  static async get<T>(endpoint: string, params?)
  static async post<T>(endpoint: string, body?)
  static async put<T>(endpoint: string, body?)
  static async delete<T>(endpoint: string)
}
```

### **API Endpoints Structure**

#### **Authentication & Users**
- `GET/POST /api/auth/*` - NextAuth.js authentication routes
- `GET/PUT /api/profile` - User profile management
- `GET/PUT /api/users` - User management
- `GET/PUT /api/roles` - Role management
- `GET/PUT /api/admin` - Admin operations

#### **Employee Management**
- `GET/POST/PUT/DELETE /api/employees` - Employee CRUD
- `GET/POST/PUT/DELETE /api/employees/documents` - Document upload
- `POST /api/employees/sync` - ERPNext synchronization
- `GET/PUT /api/departments` - Department management
- `GET/PUT /api/designations` - Designation management

#### **Customer Management**
- `GET/POST/PUT/DELETE /api/customers` - Customer CRUD
- `POST /api/customers/sync` - ERPNext synchronization

#### **Equipment Management**
- `GET/POST/PUT/DELETE /api/equipment` - Equipment CRUD
- `POST /api/equipment/images` - Image upload
- `GET/POST /api/erpnext/equipment` - ERPNext integration

#### **Rental Management**
- `GET/POST/PUT/DELETE /api/rentals` - Rental CRUD
- `POST /api/rentals/{id}/approve` - Rental approval
- `POST /api/rentals/{id}/complete` - Rental completion

#### **Timesheet Management**
- `GET/POST/PUT/DELETE /api/timesheets` - Timesheet CRUD
- `POST /api/timesheets/{id}/approve` - Timesheet approval
- `POST /api/timesheets/{id}/reject` - Timesheet rejection
- `GET/POST /api/test-timesheet` - Testing endpoints

#### **Payroll Management**
- `GET/POST/PUT/DELETE /api/payroll` - Payroll CRUD
- `POST /api/payroll/{id}/approve` - Payroll approval
- `POST /api/payroll/{id}/process` - Payroll processing

#### **Project Management**
- `GET/POST/PUT/DELETE /api/projects` - Project CRUD
- `GET/POST/PUT/DELETE /api/projects/{id}/resources` - Project resources

#### **Analytics & Reporting**
- `GET /api/analytics/*` - Analytics data
- `GET /api/reports/*` - Report generation
- `GET /api/dashboard/stats` - Dashboard statistics

#### **File Upload & Media**
- `POST /api/upload/*` - File upload endpoints
- `GET/POST /api/media` - Media management

#### **System & Utilities**
- `GET /api/health` - Health check
- `GET /api/debug/*` - Debug endpoints
- `GET /api/test-*` - Testing endpoints
- `GET /api/sse` - Server-Sent Events
- `GET /api/cron/*` - Scheduled tasks

#### **ERPNext Integration**
- `GET/POST /api/erpnext/*` - ERPNext API integration
- `POST /api/erpnext/sync` - Data synchronization

#### **Settings & Configuration**
- `GET/PUT /api/settings` - Application settings
- `GET/PUT /api/notifications` - Notification management

## 🗄️ **Database Schema**

### **Database Technology**
- **PostgreSQL** as primary database
- **Prisma ORM 6.12.0** for database operations
- **pg 8.16.3** PostgreSQL driver
- **Database migrations** with version control
- **Prisma Studio** for database management

### **Core Database Models**

#### **Authentication & Users**
- **User**: Authentication profiles, roles, permissions
- **Session**: User session management
- **PasswordResetToken**: Password reset functionality
- **PersonalAccessToken**: API access tokens

#### **Employee Management**
- **Employee**: Staff information and profiles
- **Department**: Organizational departments
- **Designation**: Job titles and roles
- **OrganizationalUnit**: Company structure units
- **EmployeeDocument**: Document storage
- **EmployeeSalary**: Salary information
- **EmployeeLeave**: Leave management
- **EmployeePerformanceReview**: Performance tracking
- **EmployeeResignation**: Resignation records
- **EmployeeAssignment**: Project assignments
- **EmployeeSkill**: Skills and certifications
- **EmployeeTraining**: Training records

#### **Financial Management**
- **Payroll**: Salary processing
- **PayrollItem**: Individual payroll items
- **PayrollRun**: Payroll batch processing
- **AdvancePayment**: Employee advances
- **AdvancePaymentHistory**: Advance payment tracking
- **Loan**: Employee loans
- **SalaryIncrement**: Salary increases
- **TaxDocument**: Tax documentation
- **TaxDocumentPayroll**: Tax-payroll relationships

#### **Time Tracking**
- **Timesheet**: Time tracking records
- **TimeEntry**: Individual time entries
- **WeeklyTimesheet**: Weekly summaries
- **TimesheetApproval**: Approval workflows
- **TimeOffRequest**: Leave requests
- **GeofenceZone**: Location-based tracking

#### **Customer & Equipment Management**
- **Customer**: Client information
- **Equipment**: Inventory items
- **Rental**: Rental agreements
- **RentalItem**: Individual rental items
- **RentalOperatorAssignment**: Equipment operators

#### **Project Management**
- **Project**: Project information
- **Media**: File and media storage

#### **System & Analytics**
- **Company**: Company information
- **AnalyticsReport**: Analytics data
- **Cache**: System caching
- **Job**: Background job queue
- **FailedJob**: Failed job tracking
- **TelescopeEntry**: System monitoring
- **TelescopeEntryTag**: Monitoring tags
- **TelescopeMonitoring**: Monitoring configuration

#### **Role-Based Access Control (RBAC)**
- **Role**: User roles
- **Permission**: System permissions
- **RolePermission**: Role-permission relationships
- **UserRole**: User-role assignments
- **UserPermission**: User-specific permissions

### **Key Database Relationships**
- **Employees** belong to **Departments** and **Designations**
- **Rentals** link **Customers** and **Equipment**
- **Timesheets** track **Employee** work on **Projects**
- **Payrolls** process **Employee** salaries with **PayrollItems**
- **Projects** assign **Resources** (Employees/Equipment)
- **Users** have **Roles** and **Permissions**
- **Equipment** can be assigned to **RentalOperatorAssignments**
- **AdvancePayments** track **Employee** financial advances
- **TaxDocuments** relate to **Payroll** processing

### **Database Features**
- **Soft deletes** with `deleted_at` timestamps
- **Audit trails** with `created_at` and `updated_at`
- **Foreign key relationships** for data integrity
- **Indexes** for performance optimization
- **Migrations** for schema version control
- **Seeding** for initial data setup

## 🎨 **UI/UX Design**

### **Design System**
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Dark/Light theme** support
- **Responsive design** for all devices

### **Component Architecture**
- **Atomic design** principles
- **Reusable components**
- **Consistent styling**
- **Accessibility compliance**

## 🔄 **State Management**

### **Server State**
- **TanStack Query** for API data
- **Automatic caching** and invalidation
- **Optimistic updates**
- **Error handling**

### **Client State**
- **Zustand** for global state
- **React Context** for theme/auth
- **Local storage** for persistence

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### **Features**
- **Mobile-first** approach
- **Touch-friendly** interfaces
- **Responsive tables** and forms
- **Adaptive navigation**

## 🚀 **Development Workflow**

### **Package Scripts**
```json
{
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts",
  "db:reset": "node scripts/reset-db.js"
}
```

### **Configuration Files**
- **`next.config.ts`**: Next.js configuration with webpack optimizations
- **`tailwind.config.ts`**: Tailwind CSS configuration with custom theme
- **`tsconfig.json`**: TypeScript configuration
- **`postcss.config.mjs`**: PostCSS configuration
- **`eslint.config.mjs`**: ESLint configuration
- **`components.json`**: Shadcn/ui components configuration
- **`package.json`**: Dependencies and scripts
- **`prisma/schema.prisma`**: Database schema definition

### **Environment Variables**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="your-bucket-name"

# ERPNext Integration
ERPNEXT_URL="https://your-erpnext-instance.com"
ERPNEXT_API_KEY="your-api-key"
ERPNEXT_API_SECRET="your-api-secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

## 🔧 **Deployment & Infrastructure**

### **Target Platform**
- **Coolify** self-hosted deployment platform
- **Docker** containerization for consistency
- **PostgreSQL** database server
- **S3-compatible** object storage (MinIO/Coolify)

### **Infrastructure Components**

#### **Application Server**
- **Next.js 15.2.4** production build
- **Node.js** runtime environment
- **PM2** or **Docker** process management
- **Nginx** reverse proxy (optional)

#### **Database Layer**
- **PostgreSQL 14+** primary database
- **Prisma ORM** for database operations
- **Database migrations** for schema management
- **Connection pooling** for performance
- **Backup strategy** for data protection

#### **File Storage**
- **AWS S3-compatible** storage (MinIO)
- **CDN** for static asset delivery
- **Image optimization** and resizing
- **File upload** with progress tracking

#### **Caching Layer**
- **Redis** for session storage (optional)
- **Next.js** built-in caching
- **TanStack Query** client-side caching
- **CDN** for static assets

### **Environment Setup Process**

#### **1. Database Setup**
```bash
# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed initial data
npm run db:seed
```

#### **2. Environment Configuration**
```env
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name
```

#### **3. Build & Deployment**
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
```

#### **4. SSL & Security**
- **SSL certificates** (Let's Encrypt or custom)
- **HTTPS** enforcement
- **Security headers** configuration
- **CORS** policy setup

### **Monitoring & Logging**
- **Application logs** with structured logging
- **Database performance** monitoring
- **Error tracking** and alerting
- **Health checks** for uptime monitoring
- **Performance metrics** collection

### **Backup Strategy**
- **Database backups** (daily automated)
- **File storage backups** (scheduled)
- **Configuration backups** (version controlled)
- **Disaster recovery** procedures

### **Scaling Considerations**
- **Horizontal scaling** with load balancers
- **Database read replicas** for performance
- **CDN** for global content delivery
- **Microservices** architecture (future)

## 📈 **Performance Optimizations**

### **Frontend**
- **Next.js Image** optimization
- **Code splitting** and lazy loading
- **Bundle analysis** and optimization
- **Caching strategies**

### **Backend Integration**
- **API response** caching
- **Database query** optimization
- **File upload** streaming
- **Real-time updates** via SSE

## 🔍 **Testing Strategy**

### **Testing Tools**
- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Manual testing** for UI/UX

## 📚 **Documentation**

### **Code Documentation**
- **TypeScript** interfaces
- **JSDoc** comments
- **README** files
- **API documentation**

## 🎯 **Key Strengths**

1. **Modern Architecture**: Next.js 15 with App Router
2. **Type Safety**: Full TypeScript implementation
3. **Scalable Design**: Modular component architecture
4. **Accessibility**: WCAG compliant components
5. **Internationalization**: Multi-language support
6. **Security**: RBAC and authentication
7. **Performance**: Optimized for production
8. **Developer Experience**: Excellent tooling

## 🔮 **Future Enhancements**

- **Real-time notifications** via WebSockets
- **Mobile app** development
- **Advanced analytics** dashboard
- **AI-powered** insights
- **Third-party integrations**
- **Advanced reporting** features

## 📦 **Complete Package Summary**

### **Total Dependencies: 85+ packages**

#### **Core Dependencies (Production)**
- **Framework**: Next.js 15.2.4, React 18.3.1, TypeScript 5
- **Database**: Prisma 6.12.0, @prisma/client 6.12.0, pg 8.16.3
- **Authentication**: NextAuth.js 4.24.11, @auth/prisma-adapter 2.10.0
- **Authorization**: CASL 6.7.3, @casl/react 5.0.0, @casl/ability 6.7.3
- **State Management**: TanStack Query 5.80.7, Zustand 5.0.5
- **Forms**: React Hook Form 7.58.1, @hookform/resolvers 5.1.1, Zod 3.25.76
- **Styling**: Tailwind CSS 3.4.17, Radix UI components (20+ packages)
- **UI Components**: Ant Design 5.26.1, @headlessui/react 2.2.0, Vaul 1.1.2
- **Data Tables**: @tanstack/react-table 8.21.3
- **Charts**: Recharts 2.15.4
- **Icons**: Lucide React 0.475.0, @tabler/icons-react 3.34.1, React Icons 5.5.0
- **Animations**: Framer Motion 12.23.0, @react-spring/web 10.0.1
- **Date/Time**: date-fns 4.1.0, date-fns-tz 3.2.0, @umalqura/core 0.0.7
- **Internationalization**: i18next 25.3.2, react-i18next 15.5.3, next-intl 3.9.1
- **File Handling**: @aws-sdk/client-s3 3.540.0, formidable 3.5.4
- **PDF/Documents**: jsPDF 3.0.1, html2canvas 1.4.1, react-to-print 3.1.1
- **Drag & Drop**: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- **Utilities**: clsx 2.1.1, class-variance-authority 0.7.1, tailwind-merge 3.3.1
- **Security**: bcryptjs 3.0.2
- **QR Codes**: qrcode.react 4.2.0
- **Command Palette**: cmdk 1.1.1
- **Notifications**: Sonner 2.0.6
- **Theme**: next-themes 0.4.6

#### **Development Dependencies**
- **TypeScript**: typescript 5, @types/* packages
- **Linting**: ESLint 9, eslint-config-next 15.2.4
- **Formatting**: Prettier 3.4.2, prettier plugins
- **Build Tools**: PostCSS 8.5.6, Autoprefixer 10.4.21
- **Development Tools**: @tanstack/react-query-devtools 5.83.0, TSX 4.20.3

### **Technology Stack Summary**

#### **Frontend Technologies**
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.17
- **Components**: Radix UI (20+ components), Ant Design 5.26.1
- **State Management**: TanStack Query 5.80.7, Zustand 5.0.5
- **Forms**: React Hook Form 7.58.1, Zod 3.25.76
- **Charts**: Recharts 2.15.4
- **Animations**: Framer Motion 12.23.0
- **Icons**: Lucide React 0.475.0, Tabler Icons 3.34.1

#### **Backend Technologies**
- **Database**: PostgreSQL with Prisma ORM 6.12.0
- **Authentication**: NextAuth.js 4.24.11
- **Authorization**: CASL 6.7.3
- **File Storage**: AWS S3-compatible (MinIO)
- **API**: Next.js API Routes
- **Real-time**: Server-Sent Events (SSE)

#### **Development Tools**
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint 9, Prettier 3.4.2
- **Type Checking**: TypeScript 5
- **Database Tools**: Prisma Studio
- **Development Server**: Next.js dev server

#### **Deployment & Infrastructure**
- **Platform**: Coolify (self-hosted)
- **Containerization**: Docker
- **Database**: PostgreSQL 14+
- **Storage**: S3-compatible (MinIO)
- **Process Management**: PM2 or Docker
- **Reverse Proxy**: Nginx (optional)
- **SSL**: Let's Encrypt or custom certificates

### **Key Features Implemented**
- ✅ **Complete RBAC** with CASL
- ✅ **Multi-language** support (English/Arabic)
- ✅ **RTL layout** support
- ✅ **File upload** with S3
- ✅ **PDF generation** and printing
- ✅ **Data tables** with sorting/filtering
- ✅ **Drag & drop** functionality
- ✅ **Real-time updates** via SSE
- ✅ **ERPNext integration**
- ✅ **Responsive design** for all devices
- ✅ **Dark/light theme** support
- ✅ **Form validation** with Zod
- ✅ **Toast notifications** with Sonner
- ✅ **Date/time** handling with timezone support
- ✅ **QR code** generation
- ✅ **Image cropping** and editing

---

This Next.js application represents a modern, enterprise-grade solution for rental management with robust architecture, comprehensive features, and excellent developer experience. The project uses 85+ carefully selected packages to create a scalable, maintainable, and feature-rich application. 