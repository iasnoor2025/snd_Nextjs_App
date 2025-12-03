import { db } from '@/lib/drizzle';
import {
  modelHasRoles,
  permissions,
  roleHasPermissions,
  roles,
  users,
} from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class RBACInitializer {
  private static instance: RBACInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): RBACInitializer {
    if (!RBACInitializer.instance) {
      RBACInitializer.instance = new RBACInitializer();
    }
    return RBACInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if system is already initialized
      const existingRoles = await db.select().from(roles).limit(1);
      if (existingRoles.length > 0) {
        this.isInitialized = true;
        return;
      }

      // Start initialization
      await this.createRoles();
      await this.createPermissions();
      await this.assignRolePermissions();
      await this.createSuperAdminUsers();

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ RBAC system initialization failed:', error);
      throw error;
    }
  }

  private async createRoles(): Promise<void> {
    const systemRoles = [
      { name: 'SUPER_ADMIN', guardName: 'web' },
      { name: 'ADMIN', guardName: 'web' },
      { name: 'MANAGER', guardName: 'web' },
      { name: 'SUPERVISOR', guardName: 'web' },
      { name: 'OPERATOR', guardName: 'web' },
      { name: 'EMPLOYEE', guardName: 'web' },
      { name: 'USER', guardName: 'web' },
    ];

    for (const role of systemRoles) {
      await db.insert(roles).values({
        name: role.name,
        guardName: role.guardName,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }
  }

  private async createPermissions(): Promise<void> {
    const actions = ['create', 'read', 'update', 'delete', 'manage'];
    const subjects = [
      'User', 'Employee', 'Customer', 'Equipment', 'Maintenance',
      'Rental', 'Quotation', 'Payroll', 'Timesheet', 'Project',
      'Leave', 'Department', 'Designation', 'Report', 'Settings',
      'Company', 'company', 'Location', 'Advance', 'Assignment', 'Safety'
    ];

    const allPermissions: string[] = [];

    // Generate all permission combinations
    for (const subject of subjects) {
      for (const action of actions) {
        allPermissions.push(`${action}.${subject.toLowerCase()}`);
      }
    }

    // Add special permissions
    allPermissions.push('*', 'manage.all', 'system.admin');

    // Create permissions
    for (const permission of allPermissions) {
      await db.insert(permissions).values({
        name: permission,
        guardName: 'web',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      });
    }
  }

  private async assignRolePermissions(): Promise<void> {
    const allRoles = await db.select().from(roles);
    const allPermissions = await db.select().from(permissions);

    // SUPER_ADMIN gets all permissions
    const superAdminRole = allRoles.find(r => r.name === 'SUPER_ADMIN');
    if (superAdminRole) {
      for (const permission of allPermissions) {
        await db.insert(roleHasPermissions).values({
          roleId: superAdminRole.id,
          permissionId: permission.id,
        });
      }
    }

    // Other roles get basic permissions
    const basicRoles = allRoles.filter(r => r.name !== 'SUPER_ADMIN');
    for (const role of basicRoles) {
      const basicPermissions = allPermissions.filter(p => 
        p.name.includes('read') || p.name.includes('own-')
      );
      
      for (const permission of basicPermissions) {
        await db.insert(roleHasPermissions).values({
          roleId: role.id,
          permissionId: permission.id,
        });
      }
    }
  }

  private async createSuperAdminUsers(): Promise<void> {
    const superAdminRole = await db.select().from(roles).where(eq(roles.name, 'SUPER_ADMIN')).limit(1);
    if (superAdminRole.length === 0) {
      throw new Error('SUPER_ADMIN role not found');
    }

    const superAdminUsers = [
      { name: 'IAS Admin', email: 'admin@ias.com', password: 'admin123' },
    ];

    for (const userData of superAdminUsers) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUser.length === 0) {
        // Create new user with hashed password
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const userResult = await db.insert(users).values({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          roleId: superAdminRole[0]!.id,
          status: 1,
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }).returning();

        if (userResult[0]) {
          await db.insert(modelHasRoles).values({
            roleId: superAdminRole[0]!.id,
            userId: userResult[0].id,
          });
        }
      } else {
        // Update existing user to ensure password is properly hashed
        const existingUserData = existingUser[0]!;
        let needsUpdate = false;
        let hashedPassword = existingUserData.password;
        
        // Check if password needs hashing (not starting with $2b$)
        if (!existingUserData.password || !existingUserData.password.startsWith('$2b$')) {
          hashedPassword = await bcrypt.hash(userData.password, 12);
          needsUpdate = true;
        }
        
        // Update user if needed
        if (needsUpdate) {
          await db.update(users)
            .set({
              password: hashedPassword,
              updatedAt: new Date().toISOString().split('T')[0],
            })
            .where(eq(users.id, existingUserData.id));
        } else {
        }
        
        // Ensure user has the correct role
        const existingRole = await db.select()
          .from(modelHasRoles)
          .where(eq(modelHasRoles.userId, existingUserData.id))
          .limit(1);
        
        if (existingRole.length === 0) {
          await db.insert(modelHasRoles).values({
            roleId: superAdminRole[0]!.id,
            userId: existingUserData.id,
          });
        }
      }
    }
  }

  isSystemInitialized(): boolean {
    return this.isInitialized;
  }
}

export const rbacInitializer = RBACInitializer.getInstance();

export async function initializeRBACSystem(): Promise<void> {
  try {
    await rbacInitializer.initialize();
  } catch (error) {
    console.error('Failed to initialize RBAC system:', error);
  }
}
