# BUG FIXES - DO THESE FIRST (This Week)

**Status:** 🔴 CRITICAL - Must fix before anything else

---

## BUG #1: Auth Endpoints Use Wrong Fields (2 HOURS)

### The Problem
Login endpoint uses "identifier" but registration uses "email"  
This breaks frontend integration and confuses developers

### Files to Fix
**File:** `backend/src/modules/auth/auth.controller.ts`

**What to change:**
```
OLD: loginDto.identifier
NEW: loginDto.email

OLD: registerDto.identifier  
NEW: registerDto.email
```

**Also add validation:**
```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  fullName: string;
}
```

**Test It:**
```bash
cd backend
npm run dev
# Then in another terminal:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
# Should get 401 (user not found) NOT error about identifier
```

---

## BUG #2: Salary Field Crashes on Wrong Type (1 HOUR)

### The Problem
API crashes if you send `salary: 150000` (number)  
Should accept `salary: "$150K-$200K"` (string)

### File to Fix
**File:** `backend/src/modules/jobs/job.controller.ts`

**What to add:**
```typescript
// In job scoring route:
if (typeof salary === 'number') {
  // Convert: 150000 → "$150K"
  const k = Math.round(salary / 1000);
  salary = `$${k}K`;
}

if (!salary || salary.trim() === '') {
  return res.status(400).json({
    error: 'salary is required. Format examples: "$100K" or "$100K-$150K"'
  });
}
```

**Test It:**
```bash
# This should work now:
curl -X POST http://localhost:5000/api/jobs/score \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle":"Senior Developer",
    "salary":150000,
    "skills":["JavaScript","React"],
    "years":5
  }'
# Should NOT crash
```

---

## BUG #3: Generic Error Messages (1.5 HOURS)

### The Problem
Errors say "All fields required" but don't say WHICH fields  
Users have to guess

### Files to Fix
**File:** `backend/src/modules/resumes/cover-letter.controller.ts`

**What to change:**
```typescript
// BEFORE:
if (!jobTitle || !company || !skills) {
  return res.status(400).json({ error: 'All fields required' });
}

// AFTER:
const validateFields = () => {
  const errors = [];
  if (!jobTitle) errors.push('jobTitle');
  if (!company) errors.push('company');
  if (!skills || skills.length === 0) errors.push('skills (array)');
  if (!yearsExperience) errors.push('yearsExperience (number)');
  return errors;
};

const missingFields = validateFields();
if (missingFields.length > 0) {
  return res.status(400).json({
    error: 'Missing required fields: ' + missingFields.join(', '),
    expectedFormat: {
      jobTitle: 'string',
      company: 'string',
      skills: 'string[]',
      yearsExperience: 'number'
    }
  });
}
```

**Do this for:**
1. `/api/cover-letters/generate`
2. `/api/resumes/autofill`
3. `/api/applications/track`

---

## BUG #4: Inconsistent Field Names (2 HOURS)

### The Problem
Different endpoints use different names:
- Some use `yearsExperience`, others use `experience`
- Some use `employmentHistory`, others use `workExperience`
- Frontend has to know all variations

### Standardize To:
```
yearsExperience (number)     - NOT "experience" or "years"
employmentHistory (array)    - NOT "workExperience"
skills (array)               - NOT "skillset" or "skillsList"
currentLocation (string)     - NOT "location" or "city"
desiredRole (string)         - NOT "jobTitle" (when describing user preference)
salary (string)              - NOT "expectedSalary" or "salaryRange"
```

### Files to Update:
```
backend/src/modules/resumes/resume.service.ts  (user schema)
backend/src/modules/jobs/job-matcher.ts         (job schema)
backend/src/modules/auth/auth.service.ts        (user profile)
```

**Test command:**
```bash
# After fixing, create integration test:
npm test -- --testNamePattern="field names are consistent"
```

---

## YOUR FIRST WEEK (7 DAYS) - DO THESE

### Monday
- [ ] Fix Bug #1 (identifier → email) - 2 hours
- [ ] Test login endpoint - 30 min
- [ ] Commit to git: `git commit -m "fix: standardize auth email field"`

### Tuesday  
- [ ] Fix Bug #2 (salary type handling) - 1 hour
- [ ] Test with both string and number salary - 30 min
- [ ] Commit: `git commit -m "fix: handle salary as string or number"`

### Wednesday
- [ ] Fix Bug #3 (better error messages) - 1.5 hours
- [ ] Test all 3 error responses - 1 hour
- [ ] Commit: `git commit -m "fix: add specific field names to error messages"`

### Thursday
- [ ] Fix Bug #4 (standardize field names) - 2 hours
- [ ] Update API docs with standard fields - 1 hour
- [ ] Commit: `git commit -m "fix: standardize field names across endpoints"`

### Friday
- [ ] Full integration test - 2 hours
- [ ] Document all working endpoints - 1 hour
- [ ] Commit: `git commit -m "test: verify all endpoints working"`

### Saturday-Sunday
- [ ] Test from frontend perspective - 4 hours
- [ ] Create `API_REFERENCE.md` with correct field names
- [ ] Create `WORKING_ENDPOINTS.md` 

---

## How To Test Each Fix

### Fix #1 Test Script
```bash
# Save as: test-auth-fix.js
const { testAuth } = require('./test-helpers');

async function test() {
  console.log('Testing Auth Fix...');
  
  // Test login with correct field name
  const res = await testAuth({
    endpoint: '/api/auth/login',
    data: {
      email: 'test@test.com',      // NOT "identifier"
      password: 'password123'
    }
  });
  
  if (res.status === 401) console.log('✅ PASS - Uses email field');
  if (res.error?.includes('identifier')) console.log('❌ FAIL - Still uses identifier');
}

test();
```

### Fix #2 Test Script
```bash
# Save as: test-salary-fix.js
async function test() {
  // Test with number (should convert)
  const res1 = await POST('/api/jobs/score', {
    jobTitle: 'Developer',
    salary: 150000,  // NUMBER - should work now
    skills: ['JS'],
    years: 5
  });
  console.log(res1.status === 200 ? '✅ Accepts number salary' : '❌');
  
  // Test with string (should still work)
  const res2 = await POST('/api/jobs/score', {
    jobTitle: 'Developer',
    salary: '$150K',  // STRING - should work
    skills: ['JS'],
    years: 5
  });
  console.log(res2.status === 200 ? '✅ Accepts string salary' : '❌');
}
```

### Fix #3 Test Script
```bash
# Save as: test-error-messages-fix.js
async function test() {
  const res = await POST('/api/cover-letters/generate', {
    jobTitle: 'Developer'
    // Missing: company, skills, yearsExperience
  });
  
  console.log(res.status === 400 ? '✅ Returns 400' : '❌');
  console.log(
    res.error.includes('company') && res.error.includes('skills') 
    ? '✅ Error lists missing fields' 
    : '❌ Error too generic'
  );
}
```

---

## Commit Messages (Make Progress Visible)

```bash
git add .
git commit -m "fix(auth): replace identifier field with email for consistency"
git commit -m "fix(jobs): handle salary as both string and number formats"
git commit -m "fix(api): add specific field names to error messages"
git commit -m "fix(schema): standardize field names across all endpoints"
git commit -m "test(integration): verify all endpoints working correctly"
```

---

## Success Criteria (Done When...)

- ✅ Login works with `email` field (NOT identifier)
- ✅ Job scoring works with salary as number OR string
- ✅ All error responses include specific missing field names
- ✅ All endpoints use same field names for same data
- ✅ Integration tests pass
- ✅ Frontend can call all endpoints without confusion

---

## THEN What? (After Bugs Fixed)

Once these 4 bugs are fixed:

**Week 2:** Test recruiter outreach logic
**Week 3:** Add email scheduling  
**Week 4:** Frontend for campaign manager
**Week 5:** Payment integration
**Week 6:** Launch

---

**START WITH BUG #1 TODAY. Right now. This hour.**

You have 20 years exp. You can code this in 2 hours. Do it.
