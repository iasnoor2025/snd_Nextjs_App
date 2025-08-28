const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testMaintenanceAPI() {
  console.log('Testing Maintenance API endpoints...\n');

  try {
    // Test GET maintenance list
    console.log('1. Testing GET /api/maintenance...');
    const listResponse = await fetch(`${BASE_URL}/maintenance`);
    const listData = await listResponse.json();
    console.log('Status:', listResponse.status);
    console.log('Response:', JSON.stringify(listData, null, 2));
    console.log('');

    if (listData.data && listData.data.length > 0) {
      const firstMaintenance = listData.data[0];
      const maintenanceId = firstMaintenance.id;
      
      // Test GET specific maintenance
      console.log(`2. Testing GET /api/maintenance/${maintenanceId}...`);
      const getResponse = await fetch(`${BASE_URL}/maintenance/${maintenanceId}`);
      const getData = await getResponse.json();
      console.log('Status:', getResponse.status);
      console.log('Response:', JSON.stringify(getData, null, 2));
      console.log('');

      // Test DELETE maintenance (this will fail without proper authentication)
      console.log(`3. Testing DELETE /api/maintenance/${maintenanceId}...`);
      const deleteResponse = await fetch(`${BASE_URL}/maintenance/${maintenanceId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteResponse.text();
      console.log('Status:', deleteResponse.status);
      console.log('Response:', deleteData);
      console.log('');

    } else {
      console.log('No maintenance records found to test with.');
    }

  } catch (error) {
    console.error('Error testing maintenance API:', error);
  }
}

// Run the test
testMaintenanceAPI();
