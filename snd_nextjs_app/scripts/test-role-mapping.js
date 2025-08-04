const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleMapping() {
  try {
    console.log('🔍 Testing role mapping for ias.snd2024@gmail.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'ias.snd2024@gmail.com' },
      include: {
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📊 User data:');
    console.log('- ID:', user.id);
    console.log('- Role ID:', user.role_id);
    console.log('- User Roles:', user.user_roles.map(ur => ur.role.name));

    // Test the role mapping logic from auth-config.ts
    let role = "USER";
    
    if (user.user_roles && user.user_roles.length > 0) {
      console.log('🔍 Using user_roles mapping...');
      
      const roleHierarchy = {
        'SUPER_ADMIN': 1,
        'ADMIN': 2,
        'MANAGER': 3,
        'SUPERVISOR': 4,
        'OPERATOR': 5,
        'EMPLOYEE': 6,
        'USER': 7
      };
      
      let highestRole = 'USER';
      let highestPriority = 7;
      
      user.user_roles.forEach(userRole => {
        const roleName = userRole.role.name.toUpperCase();
        const priority = roleHierarchy[roleName] || 7;
        console.log(`  - Role: ${roleName}, Priority: ${priority}`);
        if (priority < highestPriority) {
          highestPriority = priority;
          highestRole = roleName;
        }
      });
      
      role = highestRole;
      console.log('✅ Assigned role from user_roles:', role);
    } else {
      console.log('🔍 Using role_id fallback...');
      
      if (user.role_id === 1) {
        role = "SUPER_ADMIN";
      } else if (user.role_id === 2) {
        role = "ADMIN";
      } else if (user.role_id === 3) {
        role = "MANAGER";
      } else if (user.role_id === 4) {
        role = "SUPERVISOR";
      } else if (user.role_id === 5) {
        role = "OPERATOR";
      } else if (user.role_id === 6) {
        role = "EMPLOYEE";
      } else if (user.role_id === 7) {
        role = "USER";
      }
      
      console.log('✅ Assigned role from role_id:', role);
    }

    console.log('🎯 Final assigned role:', role);
    console.log('🔍 Expected role: SUPER_ADMIN');
    console.log('✅ Role assignment is correct:', role === 'SUPER_ADMIN');

  } catch (error) {
    console.error('❌ Error during role mapping test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRoleMapping()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 