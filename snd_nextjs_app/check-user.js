const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ias.com' }
    });
    
    console.log('User data:', user);
    console.log('Role ID:', user?.role_id);
    console.log('Role ID type:', typeof user?.role_id);
    console.log('Role ID === 1:', user?.role_id === 1);
    console.log('Role ID === "1":', user?.role_id === "1");
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 