// Simple test script to check users API
async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users API...');
    
    const response = await fetch('/api/users');
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.users) {
        console.log('\n👥 Users with roles:');
        data.users.forEach(user => {
          console.log(`- ${user.name} (${user.email}): ${user.role} (role_id: ${user.role_id})`);
        });
      }
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUsersAPI();
