const https = require('https');
const http = require('http');

async function testManpowerResource() {
  try {
    // Test GET resources
    console.log('Testing GET /api/projects/1/resources...');
    
    const getData = await makeRequest('GET', '/api/projects/1/resources');
    console.log('GET Response:', getData);

    // Test POST manpower resource
    console.log('\nTesting POST /api/projects/1/resources...');
    const manpowerData = {
      type: 'manpower',
      name: 'Test Worker',
      description: 'Test manpower resource',
      employee_id: '1',
      job_title: 'Site Engineer',
      daily_rate: 250,
      start_date: '2024-01-15',
      end_date: '2024-02-15',
      total_days: 30,
      total_cost: 7500,
      status: 'pending',
      notes: 'Test manpower resource created via API'
    };

    const postData = await makeRequest('POST', '/api/projects/1/resources', manpowerData);
    console.log('POST Response:', postData);

    if (postData.success) {
      console.log('✅ Manpower resource created successfully!');
      console.log('Resource ID:', postData.data.id);
    } else {
      console.log('❌ Failed to create manpower resource');
      console.log('Error:', postData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (error) {
          resolve({ error: 'Invalid JSON response', body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

testManpowerResource(); 