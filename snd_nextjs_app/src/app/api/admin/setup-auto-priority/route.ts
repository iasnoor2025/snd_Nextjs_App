import { db } from '@/lib/db';
import { roles } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create the trigger function that reuses lowest available priority
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION set_role_priority()
      RETURNS TRIGGER AS $$
      DECLARE
        next_priority INTEGER;
        max_priority INTEGER;
      BEGIN
        -- USER always gets 999
        IF NEW.name = 'USER' THEN
          NEW.priority = 999;
          RETURN NEW;
        END IF;
        
        -- Get the maximum priority from existing roles (excluding USER)
        SELECT COALESCE(MAX(priority), 0)
        INTO max_priority
        FROM roles 
        WHERE name != 'USER' AND priority < 999;
        
        -- Find the first available priority starting from 1
        next_priority := 1;
        WHILE next_priority <= max_priority + 1 LOOP
          IF NOT EXISTS (
            SELECT 1 FROM roles 
            WHERE priority = next_priority AND name != 'USER'
          ) THEN
            EXIT;
          END IF;
          next_priority := next_priority + 1;
        END LOOP;
        
        NEW.priority = next_priority;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Create the trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS trigger_set_role_priority ON roles;
      CREATE TRIGGER trigger_set_role_priority
        BEFORE INSERT ON roles
        FOR EACH ROW
        EXECUTE FUNCTION set_role_priority();
    `;
    
    // Update existing roles to use sequential priorities
    const updateRolesSQL = `
      UPDATE roles 
      SET priority = CASE 
        WHEN name = 'USER' THEN 999 
        ELSE id
      END;
    `;
    
    // Execute the SQL statements
    await db.execute(createFunctionSQL);
    await db.execute(createTriggerSQL);
    await db.execute(updateRolesSQL);
    // Show all roles with their priorities
    const allRoles = await db.select().from(roles).orderBy(roles.priority);
    allRoles.forEach(role => {
          });
    
    return NextResponse.json({
      success: true,
      message: 'Smart auto role priority system set up successfully',
      roles: allRoles,
      explanation: 'New roles will reuse the lowest available priority (excluding USER=999)'
    });
    
  } catch (error) {
    console.error('❌ Error setting up auto role priority:', error);
    return NextResponse.json(
      { error: 'Failed to set up auto role priority system' },
      { status: 500 }
    );
  }
}
