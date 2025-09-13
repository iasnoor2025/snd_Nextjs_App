# Project Brief: SND Rental Management System Flutter App

## Project Overview
**Goal:** Convert the existing Next.js SND Rental Management System into a cross-platform Flutter mobile application that works on iOS, Android, Web, and Desktop.

## Current System Architecture
- **Backend:** Next.js 14 with App Router, PostgreSQL, Drizzle ORM
- **Authentication:** NextAuth.js with Google OAuth and RBAC system
- **UI:** shadcn/ui components with Tailwind CSS
- **Storage:** S3-compatible storage (Supabase/MinIO)
- **Database:** PostgreSQL with comprehensive schema (400+ permissions)
- **Internationalization:** Arabic & English support

## Core Business Modules
1. **Employee Management** - Complete HR system with skills, training, performance reviews
2. **Project Management** - Project lifecycle, resource allocation, task management
3. **Equipment Management** - Inventory, maintenance, rental tracking
4. **Customer Management** - Customer profiles, credit limits, project associations
5. **Rental Management** - Rental agreements, equipment tracking, invoicing
6. **Timesheet Management** - Time tracking, approval workflows, payroll integration
7. **Payroll Management** - Salary calculations, advance payments, payslips
8. **Leave Management** - Leave requests, approval workflows, calendar integration
9. **Quotation Management** - Quote generation, approval, conversion to rentals
10. **Safety Management** - Incident reporting, tracking, resolution
11. **Company Management** - Company profile, document management, compliance
12. **User Management** - User accounts, role assignments, permissions
13. **Document Management** - File uploads, versioning, approval workflows

## Technical Requirements
- Cross-platform compatibility (iOS, Android, Web, Desktop)
- Offline capabilities with local SQLite database
- Push notifications via Firebase
- Camera integration for document scanning
- GPS location services for geofencing
- Secure authentication with Google Sign-In
- Real-time data synchronization
- Responsive design for tablets and desktop

## Success Criteria
- Full feature parity with Next.js web application
- Performance: App loads in <3 seconds
- Offline: Works without internet for 24+ hours
- Security: Secure authentication and data handling
- User Experience: Intuitive navigation and interactions
