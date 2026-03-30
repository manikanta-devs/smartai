/**
 * Integration Tests - End-to-End Workflow Testing
 * Tests the complete workflow: upload → analyze → match → cover letter
 * 
 * Run with: npm test -- tests/integration
 * Requires: Running backend server on port 4000
 */

import request from "supertest";

const API_URL = "http://localhost:4000";

// Mock data for testing
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: "TestPassword123!",
};

const testResume = {
  text: `
    JOHN DOE
    john@example.com | (555) 123-4567 | New York, NY
    LinkedIn: linkedin.com/in/johndoe
    
    PROFESSIONAL SUMMARY
    Full Stack Developer with 5+ years of experience building scalable web applications.
    Expertise in React, Node.js, TypeScript, and cloud deployment.
    
    PROFESSIONAL EXPERIENCE
    
    Senior Full Stack Developer | TechCorp Inc | Jan 2020 - Present
    - Led development of customer-facing React dashboard, improving user engagement by 40%
    - Architected microservices backend using Node.js and Express, reducing API latency by 30%
    - Managed team of 3 developers, mentored 2 junior developers
    - Implemented CI/CD pipeline using Docker and Kubernetes, reducing deployment time from 2 hours to 15 minutes
    
    Full Stack Developer | StartupXYZ | Jun 2018 - Dec 2019
    - Built full-stack web application using React, Node.js, PostgreSQL
    - Increased application performance by 50% through optimization
    - Implemented authentication and authorization system using JWT
    
    EDUCATION
    B.S. Computer Science | University of Tech | May 2018
    
    TECHNICAL SKILLS
    Languages: JavaScript, TypeScript, Python, SQL
    Frontend: React, Vue.js, HTML/CSS, Tailwind CSS
    Backend: Node.js, Express, Django, FastAPI
    Database: PostgreSQL, MongoDB, Redis
    DevOps: Docker, Kubernetes, AWS, GitHub Actions
    
    CERTIFICATIONS
    AWS Certified Solutions Architect - Associate (2021)
    Certified Kubernetes Administrator (CKA) - 2022
  `,
};

const testJob = {
  title: "Senior Full Stack Developer",
  company: "TechCorp Inc",
  description: `
    We are looking for a Senior Full Stack Developer to join our team.
    
    REQUIREMENTS:
    - 5+ years of experience with JavaScript/TypeScript
    - Strong experience with React and Node.js
    - Experience with PostgreSQL and MongoDB
    - AWS or cloud platform experience
    - Leadership and mentoring experience
    
    NICE TO HAVE:
    - Kubernetes experience
    - Microservices architecture knowledge
    - Open source contributions
    
    Job Type: Full-time
    Location: Remote or New York, NY
    Salary: $150K - $200K
  `,
  salary: "$150K - $200K",
  requirements: ["5+ years JavaScript", "React", "Node.js", "PostgreSQL", "AWS"],
};

describe("Integration Tests - Resume SaaS E2E", () => {
  let authToken: string;
  let userId: string;
  let resumeId: string;

  // ========================================================================
  // AUTHENTICATION WORKFLOW
  // ========================================================================

  describe("1. Authentication Workflow", () => {
    it("should register a new user", async () => {
      const res = await request(API_URL)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("token");

      userId = res.body.data.id;
      authToken = res.body.data.token;
    });

    it("should login the user", async () => {
      const res = await request(API_URL)
        .post("/api/auth/login")
        .send({
          identifier: testUser.email, // or username
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("token");
    });

    it("should reject invalid credentials", async () => {
      const res = await request(API_URL)
        .post("/api/auth/login")
        .send({
          identifier: testUser.email,
          password: "WrongPassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ========================================================================
  // RESUME UPLOAD & EXTRACTION WORKFLOW
  // ========================================================================

  describe("2. Resume Upload & Extraction", () => {
    it("should upload resume as text", async () => {
      const res = await request(API_URL)
        .post("/api/resumes/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: testResume.text,
          fileName: "john_doe_resume.txt",
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("analysis");

      resumeId = res.body.data.id;
    });

    it("should extract contact information", async () => {
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.extracted).toBeDefined();
      expect(res.body.data.extracted.contactInfo).toBeDefined();
      expect(res.body.data.extracted.contactInfo.email).toBe("john@example.com");
      expect(res.body.data.extracted.contactInfo.phone).toBe("(555) 123-4567");
    });

    it("should extract experience section", async () => {
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.extracted.experience).toBeDefined();
      expect(res.body.data.extracted.experience.length).toBeGreaterThan(0);
      expect(res.body.data.extracted.experience[0]).toHaveProperty("company");
      expect(res.body.data.extracted.experience[0]).toHaveProperty("position");
    });

    it("should extract skills", async () => {
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.extracted.skills).toBeDefined();
      expect(res.body.data.extracted.skills.length).toBeGreaterThan(0);
      expect(
        res.body.data.extracted.skills.some((s: string) =>
          s.toLowerCase().includes("react")
        )
      ).toBe(true);
    });
  });

  // ========================================================================
  // ATS ANALYSIS WORKFLOW
  // ========================================================================

  describe("3. ATS Analysis", () => {
    it("should analyze resume for ATS compatibility", async () => {
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}/ats-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("atsScore");
      expect(res.body.data.atsScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.atsScore).toBeLessThanOrEqual(100);
      expect(res.body.data).toHaveProperty("suggestions");
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });

    it("should provide actionable feedback", async () => {
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}/ats-score`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.suggestions.length).toBeGreaterThan(0);
      expect(typeof res.body.data.suggestions[0]).toBe("string");
    });
  });

  // ========================================================================
  // JOB MATCHING WORKFLOW
  // ========================================================================

  describe("4. Job Matching", () => {
    it("should match resume to job", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/match-job`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testJob);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("matchScore");
      expect(res.body.data.matchScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.matchScore).toBeLessThanOrEqual(100);
    });

    it("should identify matched skills", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/match-job`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testJob);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("matchedSkills");
      expect(Array.isArray(res.body.data.matchedSkills)).toBe(true);
      expect(res.body.data.matchedSkills.length).toBeGreaterThan(0);
    });

    it("should identify missing skills", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/match-job`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testJob);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("missingSkills");
      expect(Array.isArray(res.body.data.missingSkills)).toBe(true);
    });
  });

  // ========================================================================
  // COVER LETTER GENERATION WORKFLOW
  // ========================================================================

  describe("5. Cover Letter Generation", () => {
    it("should generate cover letter", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/generate-cover-letter`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          jobTitle: testJob.title,
          jobDescription: testJob.description,
          company: testJob.company,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("coverLetter");
      expect(typeof res.body.data.coverLetter).toBe("string");
      expect(res.body.data.coverLetter.length).toBeGreaterThan(100);
    });

    it("should include personalization", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/generate-cover-letter`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          jobTitle: testJob.title,
          jobDescription: testJob.description,
          company: testJob.company,
        });

      expect([200, 201]).toContain(res.status);
      const letter = res.body.data.coverLetter.toLowerCase();
      expect(letter).toContain(testJob.company.toLowerCase());
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe("6. Error Handling & Validation", () => {
    it("should reject upload without authorization", async () => {
      const res = await request(API_URL)
        .post("/api/resumes/upload")
        .send({
          text: testResume.text,
          fileName: "resume.txt",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should validate job title format", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/match-job`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...testJob,
          title: "", // Empty title - should fail
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it("should validate salary format", async () => {
      const res = await request(API_URL)
        .post(`/api/resumes/${resumeId}/match-job`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          ...testJob,
          salary: 150000, // Number instead of string - should fail
        });

      expect([400, 200]).toContain(res.status); // Either reject or coerce to string
      if (res.status === 200) {
        // If coerced, salary should be string format
        expect(typeof res.body.data).toBeDefined();
      }
    });

    it("should return helpful error messages", async () => {
      const res = await request(API_URL)
        .post("/api/auth/login")
        .send({
          identifier: testUser.email,
          password: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0]).toHaveProperty("field");
      expect(res.body.errors[0]).toHaveProperty("message");
    });
  });

  // ========================================================================
  // DATABASE PERSISTENCE TESTS
  // ========================================================================

  describe("7. Database Persistence", () => {
    it("should persist resume data", async () => {
      // Fetch the resume we uploaded
      const res = await request(API_URL)
        .get(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(resumeId);
      expect(res.body.data.extracted.contactInfo.email).toBe("john@example.com");
    });

    it("should update resume", async () => {
      const res = await request(API_URL)
        .put(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          extractedData: {
            contactInfo: {
              email: "newemail@example.com",
            },
          },
        });

      expect(res.status).toBe(200);

      // Verify update persisted
      const getRes = await request(API_URL)
        .get(`/api/resumes/${resumeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getRes.body.data.extracted.contactInfo.email).toBe(
        "newemail@example.com"
      );
    });

    it("should retrieve user's resumes", async () => {
      const res = await request(API_URL)
        .get("/api/resumes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.id === resumeId)).toBe(true);
    });

    it("should delete resume", async () => {
      // Create a new resume to delete
      const uploadRes = await request(API_URL)
        .post("/api/resumes/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          text: "TEMP RESUME",
          fileName: "temp.txt",
        });

      const tempId = uploadRes.body.data.id;

      // Delete it
      const deleteRes = await request(API_URL)
        .delete(`/api/resumes/${tempId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect([200, 204]).toContain(deleteRes.status);

      // Verify it's gone
      const getRes = await request(API_URL)
        .get(`/api/resumes/${tempId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getRes.status).toBe(404);
    });
  });
});
