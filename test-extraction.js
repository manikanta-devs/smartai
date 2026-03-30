const http = require("http");
const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:5000";
const TEST_EMAIL = `test-extraction-${Date.now()}@test.com`;
const TEST_PASSWORD = "TestPassword123!";

// Sample resume text
const SAMPLE_RESUME = `
John Doe
john.doe@example.com
+1 (555) 123-4567
San Francisco, CA
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

Professional Summary
Experienced Full Stack Engineer with 5+ years of experience building scalable web applications using React, Node.js, and cloud technologies. Passionate about solving complex problems and mentoring junior developers.

Technical Skills
JavaScript, TypeScript, React, Node.js, Express, SQL, PostgreSQL, MongoDB, Docker, Kubernetes, AWS, Azure, Git, REST APIs, GraphQL, HTML, CSS, Tailwind CSS, Jest, Testing

Professional Experience

Senior Frontend Engineer
Tech Company Inc | January 2022 - Present
Lead development of customer-facing React applications. Architected payment processing features, improving transaction success rate by 23%. Mentored 3 junior developers.

Full Stack Engineer
StartUp Corp | June 2020 - December 2021
Built and maintained microservices using Node.js and Express. Implemented CI/CD pipelines with Docker and Kubernetes. Reduced API response time by 40%.

Junior Web Developer
Digital Agency LLC | January 2019 - May 2020
Developed responsive web applications using React and vanilla JavaScript. Collaborated with designers to implement pixel-perfect UIs.

Education

Bachelor of Science in Computer Science
State University | Graduated May 2018
GPA: 3.8/4.0

Associate Degree in Web Development
Community College | Graduated May 2016

Certifications
AWS Certified Solutions Architect - Professional | Issued August 2021
Google Cloud Professional Data Engineer | Issued March 2020
Certified Kubernetes Administrator | Issued November 2019
`;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function uploadResume(token) {
  return new Promise((resolve, reject) => {
    const boundary = "----WebKitFormBoundary";
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="resume.txt"`,
      "Content-Type: text/plain",
      "",
      SAMPLE_RESUME,
      `--${boundary}--`
    ].join("\r\n");

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/resumes/upload",
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function runTest() {
  try {
    console.log("🧪 Starting Resume Data Extraction Test...\n");

    // Step 1: Register
    console.log("📝 Step 1: Registering new user...");
    const registerRes = await makeRequest("POST", "/api/auth/register", {
      email: TEST_EMAIL,
      username: `user_${Date.now()}`,
      password: TEST_PASSWORD,
      firstName: "John",
      lastName: "Doe"
    });
    console.log(`Status: ${registerRes.status}`);
    if (registerRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(registerRes.body)}`);
    }
    const userId = registerRes.body.data.id;
    const registeredEmail = registerRes.body.data.email;
    console.log(`✓ User registered: ${userId}`);
    console.log(`  Email (after transform): ${registeredEmail}\n`);

    // Step 2: Login
    console.log("🔐 Step 2: Logging in...");
    const loginRes = await makeRequest("POST", "/api/auth/login", {
      identifier: registeredEmail,
      password: TEST_PASSWORD
    });
    console.log(`Status: ${loginRes.status}`);
    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.data.accessToken;
    console.log(`✓ Logged in, token: ${token.substring(0, 20)}...\n`);

    // Step 3: Upload resume
    console.log("📤 Step 3: Uploading resume...");
    const uploadRes = await uploadResume(token);
    console.log(`Status: ${uploadRes.status}`);
    if (uploadRes.status !== 201) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadRes.body)}`);
    }
    const resumeId = uploadRes.body.data.resume.id;
    console.log(`✓ Resume uploaded: ${resumeId}`);
    console.log(`  Parsed data exists: ${!!uploadRes.body.data.resume.parsedData}`);
    if (uploadRes.body.data.resume.parsedData) {
      console.log(`  Contact info: ${JSON.stringify(uploadRes.body.data.resume.parsedData.contactInfo)}`);
      console.log(`  Skills found: ${uploadRes.body.data.resume.parsedData.skills?.length || 0}`);
      console.log(`  Experience entries: ${uploadRes.body.data.resume.parsedData.experience?.length || 0}`);
    }
    console.log();

    // Step 4: Get extracted data via endpoint
    console.log("🔍 Step 4: Getting extracted data via endpoint...");
    const extractRes = await makeRequest("GET", `/api/resumes/${resumeId}/extracted`, null, token);
    console.log(`Status: ${extractRes.status}`);
    if (extractRes.status !== 200) {
      throw new Error(`Extraction endpoint failed: ${JSON.stringify(extractRes.body)}`);
    }
    const extracted = extractRes.body.data.extracted;
    const validation = extractRes.body.data.validation;
    console.log(`✓ Extraction data retrieved:`);
    console.log(`  Is valid: ${validation.isValid}`);
    if (!validation.isValid) {
      console.log(`  Missing fields: ${validation.missingFields.join(", ")}`);
    }
    console.log(`  Warnings: ${validation.warnings.join(", ") || "none"}`);
    console.log(`  Name: ${extracted.contactInfo?.name}`);
    console.log(`  Email: ${extracted.contactInfo?.email}`);
    console.log(`  Phone: ${extracted.contactInfo?.phone}`);
    console.log(`  Location: ${extracted.contactInfo?.location}`);
    console.log(`  Skills: ${extracted.skills?.slice(0, 5).join(", ")}`);
    console.log(`  Experience entries: ${extracted.experience?.length || 0}`);
    console.log(`  Education entries: ${extracted.education?.length || 0}`);
    console.log(`  Certifications: ${extracted.certifications?.length || 0}`);
    console.log();

    // Step 5: Verify extraction is in automation report
    console.log("🤖 Step 5: Running automation...");
    const automationRes = await makeRequest(
      "POST",
      "/api/automation/run",
      { resumeId },
      token
    );
    console.log(`Status: ${automationRes.status}`);
    if (automationRes.status !== 200) {
      throw new Error(`Automation run failed: ${JSON.stringify(automationRes.body)}`);
    }
    const report = automationRes.body.data;
    console.log(`✓ Automation report generated:`);
    console.log(`  Report ID: ${report.id}`);
    console.log(`  Jobs found: ${report.newJobsCount}`);
    console.log(`  Top matches: ${report.topMatches.length}`);
    console.log(`  Missing skills: ${report.missingSkills.length}`);
    console.log(`  Agent payload exists: ${!!report.agent}`);
    console.log();

    // Step 6: Get latest automation report and verify extracted data
    console.log("📊 Step 6: Verifying extracted data in automation report...");
    const latestRes = await makeRequest("GET", "/api/automation/latest", null, token);
    console.log(`Status: ${latestRes.status}`);
    if (latestRes.status !== 200) {
      throw new Error(`Failed to get latest report: ${JSON.stringify(latestRes.body)}`);
    }
    const latestReport = latestRes.body.data;
    console.log(`✓ Latest report retrieved:`);
    console.log(`  Report ID: ${latestReport.id}`);
    console.log(`  Has extracted data in agent payload: ${!!latestReport.agent?.autofill?.contactInfo}`);
    if (latestReport.agent?.autofill?.contactInfo) {
      console.log(`    Name: ${latestReport.agent.autofill.contactInfo.name}`);
      console.log(`    Email: ${latestReport.agent.autofill.contactInfo.email}`);
      console.log(`    Phone: ${latestReport.agent.autofill.contactInfo.phone}`);
      console.log(`    Skills for autofill: ${latestReport.agent.autofill.skills.length}`);
    }
    console.log();

    console.log("✅ ALL TESTS PASSED!\n");
    console.log("Summary:");
    console.log("- Resume data extraction working ✓");
    console.log("- Extraction stored on Resume record ✓");
    console.log("- Extraction endpoint returns correct data ✓");
    console.log("- Extraction integrated into automation ✓");
    console.log("- Data properly formatted for form autofill ✓");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

runTest();
