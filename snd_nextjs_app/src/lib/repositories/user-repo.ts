import { db } from '@/lib/drizzle';
import { users, modelHasRoles, roles } from '@/lib/drizzle/schema';
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
    .filter((r) => r.roleName != null)
    .map((r) => ({ role: { name: r.roleName! } }));

  return {
    id: base.id,
    email: base.email,
    name: base.name,
    password: base.password,
    isActive: base.isActive,
    role_id: base.role_id,
    national_id: base.national_id,
    user_roles: roleNames,
  };
}

export async function upsertGoogleUser(email: string, name: string | null): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) return;
  await db.insert(users).values({
    email,
    name: name ?? email.split('@')[0],
    password: '',
    isActive: true,
    emailVerifiedAt: new Date().toISOString(),
    roleId: 7,
    updatedAt: new Date().toISOString(),
  });
}


