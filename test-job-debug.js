const fs = require('fs');
const http = require('http');

const token = fs.readFileSync('token.txt', 'utf-8');

console.log('🧪 DEBUGGING JOB SCORING API Error');
console.log('');

const testJob = {
  title: 'Senior Engineer',
  description: 'Senior role with React and Node.js',
  salary: 150000,
  location: 'San Francisco'
};

const payload = JSON.stringify({ job: testJob });

console.log('Sending payload:', payload);
console.log('');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/jobs/score-job',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.write(payload);
req.end();
