const fs = require('fs');
const http = require('http');

// Read the token we saved from login
const token = fs.readFileSync('token.txt', 'utf-8');
const userId = fs.readFileSync('userid.txt', 'utf-8');

console.log('🧪 TESTING RESUME UPLOAD');
console.log('User ID:', userId);
console.log('');

// Create a simulated PDF content (minimal PDF structure)
const simpleResumeTxt = `
JOHN DEVELOPER
john@example.com | (555) 123-4567 | https://linkedin.com/in/johndeveloper

PROFESSIONAL SUMMARY
Senior Software Engineer with 10+ years of experience building scalable full-stack applications.
Expert in React, Node.js, TypeScript, AWS, and distributed systems architecture.

EXPERIENCE
Senior Software Engineer | TechCorp Inc | 2020 - Present
• Led team of 8 engineers on microservices migration (30% performance improvement)
• Architected real-time data processing system handling 1B+ events daily
• Mentored junior developers, improved code quality scores by 40%

Software Engineer | StartupXYZ | 2018 - 2020
• Built React-based SPA with 500K+ monthly active users
• Implemented automated testing suite (80% coverage)
• Reduced API latency from 500ms to 50ms through optimization

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React 18, Vue.js, Tailwind CSS
Backend: Node.js, Express, FastAPI, Django
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS (EC2, S3, Lambda), Google Cloud Platform
Tools: Docker, Kubernetes, GitHub Actions, Datadog

EDUCATION
B.S. Computer Science | University of California | 2014

CERTIFICATIONS
• AWS Solutions Architect Associate
• Certified Kubernetes Application Developer
`;

// Create a simple text file as resume (since we can't generate real PDF easily)
fs.writeFileSync('sample_resume.txt', simpleResumeTxt);

// Now we need to create multipart/form-data request
const boundary = '----FormBoundary' + Math.random().toString(36).substring(2, 15);
const fileContent = fs.readFileSync('sample_resume.txt');

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="file"; filename="resume.txt"\r\n';
body += 'Content-Type: text/plain\r\n\r\n';
body += fileContent.toString() + '\r\n';
body += '--' + boundary + '--\r\n';

const bodyBuffer =Buffer.from(body);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/resumes/upload',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ RESUME UPLOAD SUCCESS');
    } else {
      console.log('❌ RESUME UPLOAD FAILED');
    }
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nResponse:', JSON.stringify(parsed, null, 2));
      
      if (parsed.data && parsed.data.id) {
        console.log('\n🎯 RESUME CREATED:');
        console.log('Resume ID:', parsed.data.id);
        console.log('File Name:', parsed.data.fileName);
        console.log('ATS Score:', parsed.data.atsScore);
        console.log('Overall Score:', parsed.data.overallScore);
        console.log('Status:', parsed.data.status);
        
        // Save resume ID for next tests
        fs.writeFileSync('resumeid.txt', parsed.data.id);
        console.log('\n💾 Resume ID saved for next tests');
      }
    } catch (e) {
      console.log('Raw Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ Request Error: ${error.message}`);
  process.exit(1);
});

req.write(bodyBuffer);
req.end();

setTimeout(() => {
  console.log('\n⏱️  Request timeout or completed');
}, 10000);
