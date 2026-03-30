const fs = require('fs');
const http = require('http');

const token = fs.readFileSync('token.txt', 'utf-8');

console.log('🧪 TESTING JOB SCORING (Salary as STRING)');
console.log('');

const userProfile = {
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
  yearsExperience: 10,
  targetRole: 'Senior Full-Stack Engineer',
  targetSalary: 150000,
  preferredLocations: ['San Francisco', 'Remote']
};

const testJobs = [
  {
    title: 'Senior Full-Stack Engineer',
    description: 'Looking for Senior Full-Stack Engineer with 8+ years in React, Node.js, TypeScript, AWS.',
    salary: '$150K - $200K',  // CORRECTED: String format with $ and K
    location: 'San Francisco, CA',
    company: 'TechCorp'
  },
  {
    title: 'Junior Frontend Developer',
    description: 'Entry-level React position',
    salary: '$70K - $90K',
    location: 'New York, NY',
    company: 'StartupXYZ'
  }
];

async function testJobScoring() {
  for (const job of testJobs) {
    console.log(`\n📊 "${job.title}" @ ${job.company}`);
    console.log(`   Salary: ${job.salary}, Location: ${job.location}`);
    
    const payload = JSON.stringify({ job, userProfile });
    
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
                const scoreObj = parsed.data;
                console.log(`   ✅ SCORE: ${scoreObj.score}/100`);
                console.log(`   Recommendation: ${scoreObj.recommendation.toUpperCase()}`);
                if (scoreObj.reasons && scoreObj.reasons.length > 0) {
                  console.log(`   Reasons: ${scoreObj.reasons[0]}`);
                }
              }
            } catch (e) {
              console.log('   Parse error:', e.message);
            }
          } else {
            console.log(`   ❌ (${res.statusCode}): ${data.substring(0, 100)}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.log('   ❌ Error:', err.message);
        resolve();
      });
      
      req.write(payload);
      req.end();
    });
  }
}

testJobScoring().then(() => console.log('\n✅ Tests completed'));
