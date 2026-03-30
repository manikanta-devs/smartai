const http = require('http');

// Use credentials from the registration we just did
const testUsername = 'testdev1774853239434';
const testPassword = 'TestPass123!';

const payload = JSON.stringify({
  identifier: testUsername,  // CORRECTED: Use 'identifier', not 'email'
  password: testPassword
});

console.log('🧪 TESTING LOGIN ENDPOINT (CORRECTED)');
console.log('Identifier (username):', testUsername);
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
        console.log('\n🎯 TOKEN GENERATED:');
        console.log('Token (first 50 chars):', parsed.data.accessToken.substring(0, 50) + '...');
        console.log('User ID:', parsed.data.user?.id);
        console.log('User Email:', parsed.data.user?.email);
        console.log('User Role:', parsed.data.user?.role);
        
        // Save token for next test
        require('fs').writeFileSync('token.txt', parsed.data.accessToken);
        require('fs').writeFileSync('userid.txt', parsed.data.user?.id);
        console.log('\n💾 Tokens saved for next tests');
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
