const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    // Test the exact same logic as the auth config
    const user = await prisma.user.findUnique({
      where: { email: 'admin@ias.com' }
    });
    
    console.log('🔍 Database user:', user);
    console.log('🔍 role_id:', user?.role_id);
    console.log('🔍 role_id type:', typeof user?.role_id);
    console.log('🔍 role_id === 1:', user?.role_id === 1);
    
    const role = user.role_id === 1 ? "ADMIN" : "USER";
    console.log('🔍 Calculated role:', role);
    
    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: role,
    };
    
    console.log('🔍 Final user data:', userData);
    
    // Test password verification
    const testPassword = 'password123';
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    console.log('🔍 Password valid:', isPasswordValid);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 