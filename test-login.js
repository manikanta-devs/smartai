const http = require('http');

// Use credentials from the registration we just did
const testEmail = 'devtest1774853239434@resume.local';
const testPassword = 'TestPass123!';
let accessToken = null;

const payload = JSON.stringify({
  email: testEmail,
  password: testPassword
});

console.log('🧪 TESTING LOGIN ENDPOINT');
console.log('Email:', testEmail);
console.log('');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
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
    
    if (res.statusCode === 200) {
      console.log('✅ LOGIN SUCCESS');
    } else {
      console.log('❌ LOGIN FAILED');
    }
    
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      
      if (parsed.data && parsed.data.accessToken) {
        accessToken = parsed.data.accessToken;
        console.log('\n🎯 TOKEN GENERATED:');
        console.log('Token (first 50 chars):', parsed.data.accessToken.substring(0, 50) + '...');
        console.log('User ID:', parsed.data.user?.id);
        console.log('User Email:', parsed.data.user?.email);
        console.log('User Role:', parsed.data.user?.role);
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
