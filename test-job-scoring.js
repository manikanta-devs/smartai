const fs = require('fs');
const http = require('http');

const token = fs.readFileSync('token.txt', 'utf-8');
const resumeId = '8afb6d92-0583-42bf-aa1e-32e783ebd150'; // From upload

console.log('🧪 TESTING JOB SCORING API');
console.log('');

// Test job scoring with a sample job
const testJobs = [
  {
    title: 'Senior Full-Stack Engineer',
    description: 'Looking for Senior Full-Stack Engineer with 8+ years in React, Node.js, TypeScript, AWS. Must have microservices experience.',
    salary: 180000,
    location: 'San Francisco, CA',
    company: 'TechCorp'
  },
  {
    title: 'Junior Frontend Developer',
    description: 'Entry-level position for someone learning React and JavaScript. No strong requirements.',
    salary: 80000,
    location: 'New York, NY',
    company: 'StartupXYZ'
  },
  {
    title: 'DevOps Engineer',
    description: 'Looking for DevOps specialist with Kubernetes, Docker, CI/CD pipeline experience.',
    salary: 150000,
    location: 'Remote',
    company: 'CloudCo'
  }
];

async function testJobScoring() {
  for (const job of testJobs) {
    console.log(`\n📊 Testing job: "${job.title}" @ ${job.company}`);
    console.log('   Description:', job.description.substring(0, 60) + '...');
    
    const payload = JSON.stringify({ job });
    
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
    
    await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.data) {
                const score = parsed.data.score || parsed.data.totalScore;
                console.log(`   ✅ Score: ${score}/100`);
                if (parsed.data.assessment) {
                  console.log(`   Assessment: ${parsed.data.assessment.substring(0, 100)}...`);
                }
              }
            } catch (e) {
              console.log(`   ❓ Response: ${data.substring(0, 100)}`);
            }
          } else {
            console.log(`   ❌ Failed (${res.statusCode})`);
          }
          resolve();
        });
      });
      
      req.on('error', () => {
        console.log('   ❌ Network error');
        resolve();
      });
      
      req.write(payload);
      req.end();
    });
  }
}

testJobScoring().then(() => {
  console.log('\n✅ Job scoring tests completed');
});
