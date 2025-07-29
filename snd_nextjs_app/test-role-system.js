const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testRoleSystem() {
  try {
    console.log('🔍 Testing Complete Role System...\n');
    
    // 1. Check database user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ias.com' }
    });
    
    console.log('1. Database User:');
    console.log('- ID:', user?.id);
    console.log('- Email:', user?.email);
    console.log('- Role ID:', user?.role_id);
    console.log('- Role ID Type:', typeof user?.role_id);
    console.log('- Is Active:', user?.isActive);
    
    // 2. Test role assignment logic (same as auth config)
    let role = "USER";
    if (user.role_id === 1) {
      role = "ADMIN";
    } else if (user.role_id === 2) {
      role = "MANAGER";
    } else if (user.role_id === 3) {
      role = "SUPERVISOR";
    } else if (user.role_id === 4) {
      role = "OPERATOR";
    }
    
    console.log('\n2. Role Assignment Logic:');
    console.log('- Calculated Role:', role);
    console.log('- role_id === 1:', user?.role_id === 1);
    console.log('- role_id === 2:', user?.role_id === 2);
    console.log('- role_id === 3:', user?.role_id === 3);
    console.log('- role_id === 4:', user?.role_id === 4);
    
    // 3. Test user data structure (same as auth config)
    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      isActive: user.isActive || true,
    };
    
    console.log('\n3. User Data Structure:');
    console.log('- User Data:', JSON.stringify(userData, null, 2));
    
    // 4. Test password verification
    const testPassword = 'password123';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('\n4. Password Verification:');
    console.log('- Password Valid:', isPasswordValid);
    
    // 5. Test role permissions
    const rolePermissions = {
      ADMIN: {
        can: [
          { action: 'manage', subject: 'Employee' },
          { action: 'sync', subject: 'Employee' },
          { action: 'export', subject: 'Employee' },
        ],
      },
      USER: {
        can: [
          { action: 'read', subject: 'Employee' },
        ],
      },
    };
    
    const userPermissions = rolePermissions[role] || rolePermissions.USER;
    
    console.log('\n5. Role Permissions:');
    console.log('- Role:', role);
    console.log('- Permissions:', JSON.stringify(userPermissions, null, 2));
    
    // 6. Test specific permissions
    const hasManageEmployee = userPermissions.can.some(p => p.action === 'manage' && p.subject === 'Employee');
    const hasSyncEmployee = userPermissions.can.some(p => p.action === 'sync' && p.subject === 'Employee');
    const hasExportEmployee = userPermissions.can.some(p => p.action === 'export' && p.subject === 'Employee');
    
    console.log('\n6. Specific Permission Tests:');
    console.log('- Can Manage Employee:', hasManageEmployee);
    console.log('- Can Sync Employee:', hasSyncEmployee);
    console.log('- Can Export Employee:', hasExportEmployee);
    
    console.log('\n✅ Role System Test Complete!');
    console.log('Expected Result: ADMIN role with full permissions');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleSystem(); 