import { db } from '@/lib/db';
import { roles } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting role priorities based on ID (except USER = 999)...');
    
    // Get all roles first
    const allRoles = await db.select().from(roles).orderBy(roles.id);
    
    // Update priorities based on ID, except USER gets 999
    const updatePromises = allRoles.map(async (role) => {
      const priority = role.name === 'USER' ? 999 : role.id;
      
      return db
        .update(roles)
        .set({ priority })
        .where(eq(roles.id, role.id))
        .returning();
    });
    
    const results = await Promise.all(updatePromises);
    
    console.log('✅ All role priorities updated successfully!');
    
    // Show all roles with their new priorities
    const updatedRoles = await db.select().from(roles).orderBy(roles.priority);
    console.log('\n📋 All roles with priorities:');
    updatedRoles.forEach(role => {
      console.log(`  ${role.name}: priority ${role.priority} (ID: ${role.id})`);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Role priorities updated based on ID (USER = 999)',
      updatedRoles: updatedRoles
    });
    
  } catch (error) {
    console.error('❌ Error updating role priorities:', error);
    return NextResponse.json(
      { error: 'Failed to update role priorities' },
      { status: 500 }
    );
  }
}
