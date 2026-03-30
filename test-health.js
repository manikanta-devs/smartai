const http = require('http');

const request = http.get('http://localhost:5000/health', (res) => {
  console.log(`Health Check: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    
    // Try auth endpoint
    const authReq = http.get('http://localhost:5000/api/auth/login', {
      method: 'POST'
    }, (res2) => {
      console.log(`Auth endpoint: ${res2.statusCode}`);
    });
    authReq.on('error', (e) => console.log('Auth error:', e.message));
  });
});

request.on('error', (e) => {
  console.log('Health check failed:', e.message);
  
  // Try without /health
  const fallback = http.get('http://localhost:5000', (res) => {
    console.log(`Root endpoint: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', data.substring(0, 200)));
  });
  
  fallback.on('error', (e) => console.log('Fallback failed:', e.message));
});

setTimeout(() => process.exit(0), 3000);
