const http = require('http');

const testEmail = `devtest${Date.now()}@example.com`;
const testUsername = `testdev${Date.now()}`;
const testPassword = 'TestPass123!';

const payload = JSON.stringify({
  email: testEmail,
  username: testUsername,
  password: testPassword
});

console.log('🧪 TESTING REGISTRATION ENDPOINT');
console.log('Email:', testEmail);
console.log('Username:', testUsername);
console.log('');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ REGISTRATION SUCCESS');
    } else {
      console.log('❌ REGISTRATION FAILED');
    }
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      if (parsed.data && parsed.data.id) {
        console.log('\n🎯 USER CREATED:');
        console.log('UserId:', parsed.data.id);
        console.log('Email:', parsed.data.email);
        console.log('Username:', parsed.data.username);
      }
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Request Error: ${error.message}`);
  process.exit(1);
});

req.write(payload);
req.end();
