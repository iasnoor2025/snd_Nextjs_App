import { db } from '@/lib/drizzle';
import { modelHasRoles, roles, users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export type UserWithRoles = {
  id: number;
  email: string;
  name: string | null;
  password: string;
  isActive: boolean;
  role_id: number | null;
  national_id: string | null;
  user_roles: { role: { name: string } }[];
};

export async function findUserByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      password: users.password,
      isActive: users.isActive,
      role_id: users.roleId,
      national_id: users.nationalId,
      roleName: roles.name,
      roleId: roles.id,
    })
    .from(users)
    .leftJoin(modelHasRoles, eq(modelHasRoles.userId, users.id))
    .leftJoin(roles, eq(roles.id, modelHasRoles.roleId))
    .where(eq(users.email, email));

  if (rows.length === 0) return null;

  const base = rows[0];
  const roleNames = rows
    .filter(r => r.roleName != null)
    .map(r => ({ role: { name: r.roleName! } }));

  return {
    id: base?.id || 0,
    email: base?.email || '',
    name: base?.name || '',
    password: base?.password || '',
    isActive: base?.isActive || false,
    role_id: base?.role_id || null,
    national_id: base?.national_id || null,
    user_roles: roleNames,
  };
}

export async function upsertGoogleUser(email: string, name: string | null): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) return;
  
  // Get EMPLOYEE role from database
  const employeeRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'EMPLOYEE'))
    .limit(1);
  
  if (employeeRole.length === 0) {
    throw new Error('EMPLOYEE role not found in database');
  }
  
  const employeeRoleId = employeeRole[0].id;
  const userName = name ?? email.split('@')[0];
  
  // Insert user with EMPLOYEE role
  const inserted = await db.insert(users).values({
    email: email,
    name: userName,
    password: '',
    isActive: true,
    emailVerifiedAt: new Date().toISOString(),
    roleId: employeeRoleId, // Dynamically fetched from database
    updatedAt: new Date().toISOString(),
  }).returning({ id: users.id });
  
  // Create role relationship in modelHasRoles table
  if (inserted[0] && inserted[0].id) {
    await db.insert(modelHasRoles).values({
      userId: inserted[0].id,
      roleId: employeeRoleId, // Use the same dynamically fetched role ID
    });
  }
}
