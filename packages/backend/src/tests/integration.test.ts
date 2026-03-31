/**
 * COMPREHENSIVE INTEGRATION TEST SUITE
 * Tests entire student workflow from registration to job application
 * 
 * Run with: npm test -- integration.test.ts
 */

import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

// Test data
const testUser = {
  email: `student-${Date.now()}@test.com`,
  username: `student${Date.now()}`,
  password: 'TestPassword123!'
};

const testResume = `
JOHN DOE
john@example.com | (555) 123-4567 | New York, NY
linkedin.com/in/johndoe | github.com/johndoe

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 3+ years building scalable web applications using React, Node.js, and PostgreSQL. Passionate about clean code and user-focused design.

EXPERIENCE
Senior Frontend Developer | Tech Company Inc | Jan 2023 - Present
- Led team of 4 developers in rebuilding customer dashboard, resulting in 40% improvement in page load time
- Implemented real-time notifications using WebSocket, reducing support tickets by 25%
- Mentored 2 junior developers on React best practices and code standards

Junior Full Stack Developer | Startup XYZ | Jun 2021 - Dec 2022
- Built 5 customer-facing features using React and Node.js, deployed to 10K+ users
- Reduced API response time by 30% through database query optimization
- Collaborated with product team to iterate on UI/UX based on user feedback

EDUCATION
Bachelor of Science in Computer Science | State University | May 2021
GPA: 3.8/4.0

SKILLS
Frontend: React, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Redux
Backend: Node.js, Express, Python, Django, REST API, GraphQL
Databases: PostgreSQL, MongoDB, Redis
Tools & DevOps: Git, Docker, AWS, CI/CD, JIRA, Agile
Other: Microservices, Testing (Jest, Pytest), Linux

PROJECTS
AI Resume Analyzer | github.com/johndoe/ai-resume
- Built full-stack app using React and FastAPI that analyzes resumes with AI
- Integrated Gemini API for intelligent feedback
- Deployed to Docker + AWS, supporting 500+ users
- Tech: React, FastAPI, PostgreSQL, Docker, AWS

Real-time Chat Application | github.com/johndoe/chat-app
- Developed live chat using WebSocket and Redux
- Implemented user authentication and message encryption
- Tech: React, Node.js, Socket.io, MongoDB

CERTIFICATIONS
- AWS Solutions Architect Associate (2023)
- Google Cloud Professional Data Engineer (2022)
`;

const testJobDescription = `
Full Stack Developer - Mid Level

Company: Growing Tech Company
Location: New York, NY (Remote OK)
Salary: $120k - $160k

ABOUT THE ROLE
We're looking for a Full Stack Developer to join our growing team. You'll work on building scalable web applications that serve millions of users.

REQUIRED SKILLS
- 2+ years of professional web development experience
- Strong JavaScript/TypeScript skills
- React or Vue experience
- Node.js or similar backend framework
- PostgreSQL or MongoDB experience
- Git version control
- REST API design

NICE TO HAVE
- Docker experience
- AWS or cloud platform experience
- GraphQL experience
- Microservices architecture knowledge
- Agile/Scrum experience

RESPONSIBILITIES
- Design and implement new features
- Write clean, testable code
- Collaborate with product and design teams
- Participate in code reviews
- Debug production issues
- Mentor junior developers

BENEFITS
- Competitive salary
- Health insurance
- 401k matching
- Remote flexibility
- Professional development budget
`;

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: [] as Array<{ name: string; status: 'PASS' | 'FAIL'; error?: string; duration: number }>
};

// Helper functions
async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS', duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.failed++;
    results.tests.push({ 
      name, 
      status: 'FAIL', 
      error: error.message, 
      duration: Date.now() - start 
    });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE INTEGRATION TESTS\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test User: ${testUser.email}\n`);

  let accessToken = '';
  let userId = '';
  let resumeId = '';
  let atsScore = 0;

  // ============================================
  // 1. AUTHENTICATION TESTS
  // ============================================

  console.log('\n📝 AUTHENTICATION TESTS\n');

  await test('Should register new user', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: testUser.email,
      username: testUser.username,
      password: testUser.password,
      firstName: 'Test',
      lastName: 'Student'
    });
    
    assert(response.status === 201, 'Status should be 201');
    assert(response.data.data.user, 'Should return user data');
    assert(response.data.data.accessToken, 'Should return access token');
    
    accessToken = response.data.data.accessToken;
    userId = response.data.data.user.id;
  });

  await test('Should login with valid credentials', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      identifier: testUser.email,
      password: testUser.password
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.accessToken, 'Should return access token');
  });

  await test('Should get current user info', async () => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.email === testUser.email, 'Email should match');
  });

  // ============================================
  // 2. RESUME UPLOAD & ANALYSIS TESTS
  // ============================================

  console.log('\n📄 RESUME ANALYSIS TESTS\n');

  await test('Should upload and analyze resume', async () => {
    const response = await axios.post(`${API_BASE}/resumes/analyze`, {
      content: testResume,
      fileName: 'test-resume.txt',
      userId: userId
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.atsScore !== undefined, 'Should return ATS score');
    assert(response.data.data.skills, 'Should return skills');
    
    resumeId = response.data.data.resumeId;
    atsScore = response.data.data.atsScore;
  });

  await test('ATS Score should be meaningful (30-100)', async () => {
    assert(atsScore >= 30 && atsScore <= 100, 
      `ATS score ${atsScore} should be between 30-100`);
  });

  await test('Should extract technical skills from resume', async () => {
    const response = await axios.get(`${API_BASE}/resumes/${resumeId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.data.data.skills, 'Should have skills');
    assert(response.data.data.skills.length > 0, 'Should extract multiple skills');
    
    const hasReact = response.data.data.skills.some((s: string) => s.toLowerCase().includes('react'));
    assert(hasReact, 'Should extract React from resume');
  });

  await test('Should get resume feedback', async () => {
    const response = await axios.get(`${API_BASE}/resumes/${resumeId}/feedback`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.feedback, 'Should return feedback');
  });

  // ============================================
  // 3. JOB MATCHING TESTS
  // ============================================

  console.log('\n💼 JOB MATCHING TESTS\n');

  await test('Should score resume against job description', async () => {
    const response = await axios.post(`${API_BASE}/jobs/score`, {
      resumeText: testResume,
      jobDescription: testJobDescription
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.overallScore !== undefined, 'Should return overall score');
    assert(response.data.data.matchedKeywords, 'Should return matched keywords');
  });

  await test('Matched keywords should be identified', async () => {
    const response = await axios.post(`${API_BASE}/jobs/score`, {
      resumeText: testResume,
      jobDescription: testJobDescription
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const matched = response.data.data.matchedKeywords;
    assert(matched.length > 0, `Should match at least 1 keyword, got ${matched.length}`);
    console.log(`   Matched keywords: ${matched.slice(0, 5).join(', ')}`);
  });

  await test('Should provide job recommendations', async () => {
    const response = await axios.get(`${API_BASE}/jobs?limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(Array.isArray(response.data.data), 'Should return jobs array');
    assert(response.data.data.length > 0, 'Should return at least 1 job');
  });

  // ============================================
  // 4. RESUME REWRITING TESTS
  // ============================================

  console.log('\n✏️  RESUME REWRITING TESTS\n');

  await test('Should rewrite resume for job description', async () => {
    const response = await axios.post(`${API_BASE}/resumes/rewrite`, {
      resumeText: testResume,
      jobDescription: testJobDescription,
      targetRole: 'Full Stack Developer'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.rewrittenResume, 'Should return rewritten resume');
  });

  await test('Rewritten resume should include job keywords', async () => {
    const response = await axios.post(`${API_BASE}/resumes/rewrite`, {
      resumeText: testResume,
      jobDescription: testJobDescription,
      targetRole: 'Full Stack Developer'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const rewritten = response.data.data.rewrittenResume.toLowerCase();
    const hasKeywords = rewritten.includes('full stack') || rewritten.includes('react') || rewritten.includes('node');
    assert(hasKeywords, 'Rewritten resume should include job-specific keywords');
  });

  // ============================================
  // 5. COVER LETTER GENERATION TESTS
  // ============================================

  console.log('\n📧 COVER LETTER GENERATION TESTS\n');

  await test('Should generate cover letter', async () => {
    const response = await axios.post(`${API_BASE}/jobs/cover-letter`, {
      resumeText: testResume,
      jobDescription: testJobDescription,
      company: 'Growing Tech Company',
      position: 'Full Stack Developer'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.coverLetter, 'Should return cover letter');
    assert(response.data.data.coverLetter.length > 100, 'Cover letter should be substantial');
  });

  // ============================================
  // 6. APPLICATION TRACKING TESTS
  // ============================================

  console.log('\n📊 APPLICATION TRACKING TESTS\n');

  let applicationId = '';

  await test('Should create application record', async () => {
    const response = await axios.post(`${API_BASE}/applications`, {
      jobId: 'test-job-123',
      jobTitle: 'Full Stack Developer',
      company: 'Growing Tech Company',
      applicationDate: new Date(),
      status: 'applied'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 201, 'Status should be 201');
    assert(response.data.data.id, 'Should return application ID');
    
    applicationId = response.data.data.id;
  });

  await test('Should retrieve applications', async () => {
    const response = await axios.get(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(Array.isArray(response.data.data), 'Should return applications array');
  });

  await test('Should update application status', async () => {
    const response = await axios.patch(`${API_BASE}/applications/${applicationId}`, {
      status: 'interview_scheduled'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    assert(response.status === 200, 'Status should be 200');
    assert(response.data.data.status === 'interview_scheduled', 'Status should be updated');
  });

  // ============================================
  // 7. DATABASE PERSISTENCE TESTS
  // ============================================

  console.log('\n💾 DATA PERSISTENCE TESTS\n');

  await test('Resume data should persist across sessions', async () => {
    // Logout and login again
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: testUser.email,
      password: testUser.password
    });

    const newAccessToken = loginResponse.data.data.accessToken;

    const response = await axios.get(`${API_BASE}/resumes/${resumeId}`, {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });

    assert(response.status === 200, 'Should retrieve resume after login');
    assert(response.data.data.id === resumeId, 'Resume ID should match');
  });

  // ============================================
  // 8. ERROR HANDLING TESTS
  // ============================================

  console.log('\n🛡️  ERROR HANDLING TESTS\n');

  await test('Should handle missing authentication', async () => {
    try {
      await axios.get(`${API_BASE}/resumes`);
      throw new Error('Should have thrown unauthorized error');
    } catch (error: any) {
      assert(error.response?.status === 401, 'Should return 401 unauthorized');
    }
  });

  await test('Should handle invalid JWT token', async () => {
    try {
      await axios.get(`${API_BASE}/resumes`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      throw new Error('Should have thrown error for invalid token');
    } catch (error: any) {
      assert(error.response?.status === 401, 'Should return 401 for invalid token');
    }
  });

  await test('Should handle missing required fields', async () => {
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: 'test@example.com'
        // missing username and password
      });
      throw new Error('Should have thrown validation error');
    } catch (error: any) {
      assert(error.response?.status === 400, 'Should return 400 for validation error');
    }
  });

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n\n📋 TEST SUMMARY\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  // Failed test details
  if (results.failed > 0) {
    console.log('Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  ❌ ${t.name}`);
        console.log(`     Error: ${t.error}`);
      });
  }

  // Performance summary
  console.log('\n⏱️  Performance:\n');
  const avgDuration = results.tests.reduce((a, b) => a + b.duration, 0) / results.tests.length;
  const slowestTest = results.tests.sort((a, b) => b.duration - a.duration)[0];
  
  console.log(`Average test time: ${avgDuration.toFixed(0)}ms`);
  console.log(`Slowest test: ${slowestTest.name} (${slowestTest.duration}ms)\n`);

  // Final status
  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${results.failed} tests failed. Review above for details.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
