const http = require('http');

async function post(path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch (e) {
          resolve({ status: res.statusCode, data: resp });
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  console.log('\n🧪 QUICK API TEST\n');
  
  // Test 1: Register
  console.log('1️⃣  Testing Registration with email...');
  const regRes = await post('/api/auth/register', {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User'
  });
  
  console.log(`   Status: ${regRes.status}`);
  console.log(`   Response: ${JSON.stringify(regRes.data).substring(0, 100)}...\n`);
  
  // Test 2: Login with email FIELD (not identifier)
  console.log('2️⃣  Testing Login with email field (FIXED - was "identifier")...');
  const loginRes = await post('/api/auth/login', {
    email: `user_${Date.now()}_login@test.com`,  // ✅ Using EMAIL field
    password: 'Password123!'
  });
  
  console.log(`   Status: ${loginRes.status}`);
  if (loginRes.data.error) {
    console.log(`   Error: ${loginRes.data.error.message}`);
  } else {
    console.log(`   Success: ${loginRes.data.success}`);
  }
  console.log();
  
  // Test 3: Job scoring with NUMBER salary
  console.log('3️⃣  Testing Job Scoring with NUMBER salary (FIXED - used to crash)...');
  const scoreRes = await post('/api/jobs/score-job', {
    job: {
      title: 'Senior Developer',
      description: 'Looking for senior developer with 5+ years experience in JavaScript and React',
      company: 'TechCorp',
      salary: 150000  // ✅ NUMBER format (fixed)
    },
    userProfile: {
      targetRole: 'Senior Developer',
      yearsExperience: 6,
      skills: ['JavaScript', 'React', 'Node.js'],
      targetSalary: 120000
    }
  });
  
  console.log(`   Status: ${scoreRes.status}`);
  if (scoreRes.data.data && scoreRes.data.data.score !== undefined) {
    console.log(`   ✅ Job Score: ${scoreRes.data.data.score}/100`);
  } else {
    console.log(`   Error: ${scoreRes.data.error?.message || 'Unknown'}`);
  }
  console.log();
  
  // Test 4: Error messages
  console.log('4️⃣  Testing Error Messages (FIXED - now specific field names)...');
  const errRes = await post('/api/jobs/score-job', {
    job: { title: 'Developer' },  // Missing required fields
    userProfile: {}  // Missing required fields
  });
  
  console.log(`   Status: ${errRes.status}`);
  console.log(`   Error Message: ${errRes.data.error?.message || 'N/A'}`);
  console.log();
  
  console.log('✨ API Tests Complete!\n');
  process.exit(0);
})().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
