const http = require('http');

async function debugManpower() {
  // Simulate the exact data structure that the frontend sends
  const manpowerData = {
    type: 'manpower',
    name: 'Test Worker',
    description: 'Test manpower resource',
    employee_id: '1',
    worker_name: '',
    job_title: 'Site Engineer',
    daily_rate: 250,
    days_worked: 0,
    start_date: '2024-01-15',
    end_date: '2024-02-15',
    total_days: 30,
    total_cost: 7500,
    notes: 'Test manpower resource created via API',
    status: 'pending',
    project_id: '2'
  };

  console.log('Sending data:', JSON.stringify(manpowerData, null, 2));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/projects/2/resources',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('Response body:', body);
        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (error) {
          resolve({ error: 'Invalid JSON response', body });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(JSON.stringify(manpowerData));
    req.end();
  });
}

debugManpower().then(result => {
  console.log('Final result:', result);
}).catch(error => {
  console.error('Error:', error);
}); 