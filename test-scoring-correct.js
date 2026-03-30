const fs = require('fs');
const http = require('http');

const token = fs.readFileSync('token.txt', 'utf-8');

console.log('🧪 TESTING JOB SCORING (Corrected)');
console.log('');

// User profile based on the resume we uploaded
const userProfile = {
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Python', 'PostgreSQL'],
  experience: 10,
  targetRole: 'Senior Full-Stack Engineer',
  targetSalary: 150000,
  targetLocation: 'San Francisco'
};

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
  },
  {
    title: 'Python Data Scientist',
    description: 'Data scientist role requiring Python, TensorFlow, SQL. Great for AI/ML enthusiasts.',
    salary: 140000,
    location: 'Boston, MA',
    company: 'DataInc'
  }
];

async function testJobScoring() {
  for (const job of testJobs) {
    console.log(`\n📊 Scoring: "${job.title}" @ ${job.company}`);
    
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
                const totalScore = scoreObj.totalScore || scoreObj.score || 0;
                console.log(`   ✅ SCORE: ${totalScore}/100`);
                
                if (scoreObj.breakdown) {
                  console.log(`      Role Match: ${scoreObj.breakdown.roleMatch || 'N/A'}/30`);
                  console.log(`      Skills Match: ${scoreObj.breakdown.skillsMatch || 'N/A'}/15`);
                  console.log(`      Experience: ${scoreObj.breakdown.experienceMatch || 'N/A'}/15`);
                  console.log(`      Salary: ${scoreObj.breakdown.salaryMatch || 'N/A'}/20`);
                  console.log(`      Location: ${scoreObj.breakdown.locationMatch || 'N/A'}/20`);
                }
              }
            } catch (e) {
              console.log(`   ❓ Raw response: ${data.substring(0, 200)}`);
            }
          } else {
            console.log(`   ❌ Failed (${res.statusCode}): ${data}`);
          }
          resolve();
        });
      });
      
      req.on('error', (err) => {
        console.log('   ❌ Network error:', err.message);
        resolve();
      });
      
      req.write(payload);
      req.end();
    });
  }
}

testJobScoring().then(() => {
  console.log('\n✅ All scoring tests completed');
});
