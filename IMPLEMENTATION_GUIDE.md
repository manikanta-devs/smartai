# 🏗️ Implementation Guide: Using New Validation & Error Handling

> **Status**: Free-tier optimized, production-ready patterns

This guide shows developers how to properly validate inputs and handle errors using the unified system.

## Table of Contents

1. [Input Validation](#1-input-validation)
2. [Error Handling](#2-error-handling)
3. [Endpoint Examples](#3-endpoint-examples)
4. [Testing](#4-running-tests)

---

## 1. Input Validation

### Single Field Validation

**Before:**
```typescript
// ❌ No validation - crashes on wrong type
export const matchJob = async (req: Request, res: Response) => {
  const salary = req.body.salary; // Could be number, string, null...
  const regex = salary.match(/\$\d+/); // 💥 CRASH if salary is number
};
```

**After:**
```typescript
// ✅ Proper validation with Zod
import { jobSchema, validateAndParse, createSuccessResponse, createErrorResponse } from "@/common/schemas";
import { asyncHandler, ValidationError } from "@/common/utils/errors";

export const matchJob = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validation = validateAndParse(jobSchema, req.body);
  
  if (!validation.success) {
    return res.status(400).json(createErrorResponse("Validation failed", validation.errors));
  }

  const job = validation.data;
  // Now you know: job.salary is always a string in "$150K - $200K" format
  // job.title is always a non-empty string
  // job.requirements is always an array of strings
  
  const result = await processJob(job);
  return res.json(createSuccessResponse(result));
});
```

### Multiple Field Validation

**Before:**
```typescript
// ❌ Error message doesn't tell which fields failed
res.status(400).json({ error: "All fields are required" });
```

**After:**
```typescript
// ✅ Specific error messages for each field
import { MultiValidationError } from "@/common/utils/errors";

export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  const validation = validateAndParse(resumeUploadSchema, {
    file: req.file?.buffer,
    fileName: req.file?.originalname,
    mimeType: req.file?.mimetype,
    fileSize: req.file?.size,
  });

  if (!validation.success) {
    // Response will include:
    // {
    //   success: false,
    //   error: "Validation failed",
    //   errors: [
    //     { field: "file", message: "File size must be under 10MB" },
    //     { field: "fileName", message: "File name is required" }
    //   ]
    // }
    return res.status(400).json(createErrorResponse("Validation failed", validation.errors));
  }

  // File is validated and safe to process
  const resume = validation.data;
  const result = await extractResume(resume.file);
  return res.json(createSuccessResponse(result));
});
```

---

## 2. Error Handling

### Creating Custom Errors

```typescript
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
  asyncHandler
} from "@/common/utils/errors";

// Validation error - single field
throw new ValidationError("salary", 'Must be formatted as "$150K - $200K"');
// Response: { success: false, error: "salary: Must be formatted as...", errors: [...] }

// Validation error - multiple fields
throw new MultiValidationError([
  { field: "email", message: "Email is required" },
  { field: "password", message: "Password must be 8+ characters" }
]);

// Not found
throw new NotFoundError("Resume", resumeId);
// Response: { success: false, error: "Resume with ID abc123 not found" }

// Unauthorized
if (!req.user) {
  throw new UnauthorizedError("You must be logged in");
}

// Forbidden
if (resume.userId !== req.user.id) {
  throw new ForbiddenError("You can only access your own resumes");
}

// Internal server error
try {
  await riskyOperation();
} catch (error) {
  throw new InternalServerError("Failed to process resume", error);
}
```

### Error Handler Middleware (Already Configured)

The global error handler automatically catches all errors and formats them:

```typescript
// In src/server.ts - this is already set up
app.use(errorHandler); // Catches all errors and returns consistent format
```

---

## 3. Endpoint Examples

### Example 1: Job Matching (Fixed ✅)

**File**: `src/modules/resume/resume.controller.ts`

```typescript
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError } from "@/common/utils/errors";
import { jobSchema, validateAndParse, createSuccessResponse, createErrorResponse } from "@/common/schemas";
import { matchResumeToJob } from "@/services/resumeAutomation";

export const matchJobController = asyncHandler(async (req: Request, res: Response) => {
  const { resumeId } = req.params;
  const jobData = req.body;

  // 1. Validate job input
  const jobValidation = validateAndParse(jobSchema, jobData);
  if (!jobValidation.success) {
    return res.status(400).json(createErrorResponse("Invalid job data", jobValidation.errors));
  }

  // 2. Find resume (with proper error)
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId }
  });
  
  if (!resume) {
    throw new NotFoundError("Resume", resumeId);
  }

  // 3. Check ownership
  if (resume.userId !== req.user!.id) {
    throw new ForbiddenError("You can only match your own resumes");
  }

  // 4. Match resume to job
  const match = await matchResumeToJob({
    resumeText: resume.text,
    jobDescription: jobValidation.data.description
  });

  // 5. Return consistent response
  return res.json(createSuccessResponse({
    matchScore: match.matchScore,
    matchedSkills: match.matchingSkills,
    missingSkills: match.missingSkills,
    feedback: match.feedback
  }));
});
```

**Route**:
```typescript
// src/modules/resume/resume.routes.ts
router.post("/:resumeId/match-job", requireAuth, matchJobController);
```

**Testing**:
```bash
# This will work
curl -X POST http://localhost:4000/api/resumes/abc123/match-job \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Developer",
    "company": "TechCorp",
    "description": "We need a developer...",
    "salary": "$150K - $200K",
    "requirements": ["JavaScript", "React"]
  }'

# This will return clear error
curl -X POST http://localhost:4000/api/resumes/abc123/match-job \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "salary": 150000,
    "requirements": []
  }'

# Response:
# {
#   "success": false,
#   "error": "Validation failed",
#   "errors": [
#     { "field": "title", "message": "String must contain at least 3 character(s)" },
#     { "field": "salary", "message": "Salary must be formatted as \"$150K - $200K\"" },
#     { "field": "requirements", "message": "Array must contain at least 1 element(s)" }
#   ]
# }
```

### Example 2: Resume Upload (Fixed ✅)

```typescript
import { resumeUploadSchema, validateAndParse, createSuccessResponse } from "@/common/schemas";
import { asyncHandler, ValidationError } from "@/common/utils/errors";

export const uploadResumeController = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;

  // 1. Validate file
  const validation = validateAndParse(resumeUploadSchema, {
    file: file?.buffer,
    fileName: file?.originalname,
    mimeType: file?.mimetype,
    fileSize: file?.size,
  });

  if (!validation.success) {
    return res.status(400).json(createErrorResponse("Upload failed", validation.errors));
  }

  // 2. Extract resume
  const extracted = await extractResumeText(validation.data.file);

  // 3. Store in database
  const resume = await prisma.resume.create({
    data: {
      userId: req.user!.id,
      fileName: validation.data.fileName,
      text: extracted,
      extracted: extracted // Store parsed data
    }
  });

  // 4. Analyze resume
  const analysis = await analyzeResumeWithAI(extracted);

  // 5. Return response
  return res.status(201).json(createSuccessResponse({
    id: resume.id,
    fileName: resume.fileName,
    analysis,
    extracted
  }));
});
```

---

## 4. Running Tests

### Setup (One-time)

```bash
cd packages/backend

# Install dependencies (already done)
npm install

# Create test database
createdb resume_test  # or use your database tool
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- tests/integration/resume.workflow.test.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Watch Mode (Recommended for Development)

```bash
npm test -- --watch
```

### Example Test Output

```
PASS  tests/integration/resume.workflow.test.ts (8.5s)
  Integration Tests - Resume SaaS E2E
    1. Authentication Workflow
      ✓ should register a new user (125ms)
      ✓ should login the user (95ms)
      ✓ should reject invalid credentials (78ms)
    2. Resume Upload & Extraction
      ✓ should upload resume as text (234ms)
      ✓ should extract contact information (89ms)
      ✓ should extract experience section (76ms)
      ✓ should extract skills (54ms)
    3. ATS Analysis
      ✓ should analyze resume for ATS compatibility (156ms)
      ✓ should provide actionable feedback (148ms)
    4. Job Matching
      ✓ should match resume to job (203ms)
      ✓ should identify matched skills (189ms)
      ✓ should identify missing skills (187ms)
    5. Cover Letter Generation
      ✓ should generate cover letter (1023ms)
      ✓ should include personalization (998ms)
    6. Error Handling & Validation
      ✓ should reject upload without authorization (52ms)
      ✓ should validate job title format (78ms)
      ✓ should validate salary format (64ms)
      ✓ should return helpful error messages (81ms)
    7. Database Persistence
      ✓ should persist resume data (134ms)
      ✓ should update resume (156ms)
      ✓ should retrieve user's resumes (89ms)
      ✓ should delete resume (124ms)

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Time:        18.23s
```

---

## 5. Fixing Existing Endpoints

### Deploy Pattern (Do This for Each Endpoint)

1. **Find the broken endpoint** (e.g., from BRUTAL_HONEST_ASSESSMENT.md)
2. **Create input schema** in `src/common/schemas/index.ts`
3. **Update controller** to use `validateAndParse()`
4. **Add proper errors** using `throw new ValidationError()` etc
5. **Test with curl** to verify error messages
6. **Add integration test** to verify it works end-to-end
7. **Deploy with confidence** ✅

### Quick Checklist for Each Endpoint

- [ ] Input validation with Zod schema
- [ ] Proper error messages (not generic "invalid")
- [ ] Field-level error details
- [ ] Authorization checks for user data
- [ ] Integration test for happy path
- [ ] Integration test for error cases
- [ ] Consistent response format

---

## 6. Debugging Tips

### Check Test Output
```bash
npm test -- --verbose
```

### Test Specific Workflow
```bash
npm test -- --testNamePattern="Resume Upload & Extraction"
```

### Debug a Single Test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/integration/resume.workflow.test.ts
```

### See What's Happening
```typescript
// Add logging to understand flow
console.log("📤 Uploading resume:", { fileName, size: file.size });
console.log("✓ Resume stored with ID:", resume.id);
console.log("🤖 AI Analysis:", analysis.atsScore);
```

---

## 7. Next Steps

1. **Run the tests** to see what works/breaks
2. **Fix broken endpoints** using this guide
3. **Add tests for new endpoints** before implementing
4. **Deploy with 80%+ test coverage**

✅ **Ready to build!**
