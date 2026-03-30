const fs = require('fs');
const http = require('http');

const token = fs.readFileSync('token.txt', 'utf-8');
const userId = fs.readFileSync('userid.txt', 'utf-8');

console.log('🧪 COMPREHENSIVE END-TO-END TESTING');
console.log('================================\n');

// Test cover letter generation
async function testCoverLetter() {
  console.log('\n📄 TESTING COVER LETTER GENERATION');
  
  const payload = JSON.stringify({
    job: {
      title: 'Senior Engineer',
      description: 'Looking for Senior role with React, TypeScript, AWS experience',
      company: 'TechCorp'
    },
    candidate: {
      name: 'John Developer',
      skills: ['React', 'TypeScript', 'AWS'],
      years: 10
    }
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs/generate-cover-letter',
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
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('  ✅ Status 200');
            if (parsed.data && parsed.data.letter) {
              console.log('  ✅ Letter generated');
              console.log('  Letter preview:', parsed.data.letter.substring(0, 100) + '...');
            } else {
              console.log('  ❓ No letter in response:', JSON.stringify(parsed).substring(0, 200));
            }
          } catch (e) {
            console.log('  ❓ Parse error');
          }
        } else {
          console.log(`  ❌ Status ${res.statusCode}`);
          console.log('  Error:', data.substring(0, 150));
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log('  ❌ Network error');
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
}

// Test form autofill
async function testFormAutofill() {
  console.log('\n📋 TESTING FORM AUTOFILL');
  
  const payload = JSON.stringify({
    platform: 'linkedin',
    resumeData: {
      name: 'John Developer',
      email: 'john@example.com',
      phone: '555-123-4567',
      skills: ['React', 'TypeScript', 'AWS'],
      experience: 10
    }
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs/autofill-package',
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
        if (res.statusCode === 200) {
          console.log('  ✅ Status 200');
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.coverage) {
              console.log(`  ✅ Coverage: ${parsed.data.coverage}%`);
            } else {
              console.log('  ❓ Response:', JSON.stringify(parsed).substring(0, 150));
            }
          } catch (e) {
            console.log('  ❓ Parse error');
          }
        } else {
          console.log(`  ❌ Status ${res.statusCode}`);
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log('  ❌ Network error');
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
}

// Test application tracking
async function testApplicationTracking() {
  console.log('\n📊 TESTING APPLICATION TRACKING');
  
  const payload = JSON.stringify({
    jobTitle: 'Senior Engineer',
    company: 'TechCorp',
    jobUrl: 'http://example.com/job/123',
    atsScore: 85,
    resumeVersionUsed: 'v1-tech'
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs/applications/record',
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
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('  ✅ Status 200/201');
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.id) {
              console.log('  ✅ Application recorded');
              console.log('  Application ID:', parsed.data.id.substring(0, 16) + '...');
            }
          } catch (e) {
            console.log('  ❓ Parse error');
          }
        } else {
          console.log(`  ❌ Status ${res.statusCode}`);
          console.log('  Error:', data.substring(0, 150));
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log('  ❌ Network error');
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
}

// Test ATS rewriting
async function testATSRewriting() {
  console.log('\n✨ TESTING ATS REWRITING');
  
  const payload = JSON.stringify({
    resumeId: '8afb6d92-0583-42bf-aa1e-32e783ebd150',
    jobDescription: 'Senior role with React, TypeScript, building microservices on AWS',
    jobTitle: 'Senior Full-Stack Engineer',
    targetRole: 'Senior Engineer'
  });
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/jobs/rewrite-resume',
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
        if (res.statusCode === 200) {
          console.log('  ✅ Status 200');
          try {
            const parsed = JSON.parse(data);
            if (parsed.data) {
              console.log(`  ✅ ATS Score: ${parsed.data.atsScore}/100`);
              if (parsed.data.keywordMatches) {
                console.log(`  ✅ Keywords matched: ${parsed.data.keywordMatches.length}`);
              }
            }
          } catch (e) {
            console.log('  ❓ Parse error');
          }
        } else {
          console.log(`  ❌ Status ${res.statusCode}`);
        }
        resolve();
      });
    });
    
    req.on('error', () => {
      console.log('  ❌ Network error');
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  await testCoverLetter();
  await testFormAutofill();
  await testApplicationTracking();
  await testATSRewriting();
  
  console.log('\n✅ All tests completed');
}

runAllTests();
