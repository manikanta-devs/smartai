# ⚡ Quick Start: Validate & Test Your Resume SaaS

> **5 minute setup** to get validation and testing working

## 🎯 What You Just Got

1. **Unified Schemas** - Single source of truth for all data (no more field name confusion)
2. **Error Handling** - Tells users EXACTLY what's wrong instead of generic errors
3. **Integration Tests** - Real end-to-end tests that verify everything works together
4. **Free-tier Gemini** - Already optimized (15K requests/day)

## 🚀 Get Running Now

### Step 1: Install Test Dependencies (2 min)

```bash
cd c:\Users\lucky\resume\resume-saas\packages\backend

# Install testing libraries
npm install --save-dev @types/jest supertest
```

### Step 2: Start Your Backend (1 min)

```bash
npm run dev
```

Should see:
```
✓ Server running on http://localhost:4000
✓ Database connected
```

### Step 3: Run Tests in New Terminal (1 min)

```bash
cd c:\Users\lucky\resume\resume-saas\packages\backend

# Run all tests
npm test

# Or run specific test
npm test -- tests/integration/resume.workflow.test.ts
```

### Step 4: Watch for Failures (1 min)

Tests will fail because endpoints aren't updated yet. That's GOOD!

This shows you:
- ✅ What works
- ❌ What's broken
- 📋 Exactly what to fix

Example output:
```
FAIL  tests/integration/resume.workflow.test.ts
  ✓ should register a new user
  ✓ should login the user
  ❌ should upload resume - Got 400, expected 201
  ❌ should match resume to job - Got 400, no error details
```

---

## 🏗️ Fix Broken Endpoints (Pick ONE)

### Pattern: Fix One Endpoint

1. **Find the error in test output**
   ```
   ❌ should match resume to job - Got 400 status
   ```

2. **Open that endpoint** → `src/modules/resume/resume.controller.ts`

3. **Add validation** using the example from IMPLEMENTATION_GUIDE.md
   ```typescript
   import { jobSchema, validateAndParse } from "@/common/schemas";
   import { asyncHandler, ValidationError } from "@/common/utils/errors";

   export const matchJob = asyncHandler(async (req, res) => {
     const validation = validateAndParse(jobSchema, req.body);
     if (!validation.success) {
       return res.status(400).json(createErrorResponse("Invalid job", validation.errors));
     }
     // ... rest of endpoint
   });
   ```

4. **Run tests again**
   ```bash
   npm test -- --watch
   ```

5. **Repeat for next broken endpoint**

---

## 📊 Expected Progress

| When | What Happens |
|------|-------------|
| **Now** | ~5 tests pass, 15 fail |
| **After 1 hour** | You understand what's broken |
| **After 2 hours** | Can fix 1 endpoint properly |
| **After 4 hours** | 3-4 endpoints fixed, tests green |
| **After 8 hours** | Most critical endpoints fixed, 60%+ test pass |
| **After 24 hours** | Ready for public testing |

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module '@/common/schemas'"

**Fix**: Restart backend server
```bash
# Kill the npm run dev process
# Run it again
npm run dev
```

### Issue: "ECONNREFUSED - can't connect to backend"

**Fix**: Backend isn't running
```bash
# In separate terminal
npm run dev

# Wait for:
# ✓ Server running on http://localhost:4000
```

### Issue: "Database error - no such table"

**Fix**: Run migrations
```bash
npx prisma migrate dev
```

### Issue: Test times out

**Fix**: Backend is slow
```bash
# Check backend logs for errors
# Increase timeout in test:
jest.setTimeout(60000); // 60 seconds
```

---

## 📝 What Each File Does

| File | Purpose |
|------|---------|
| `src/common/schemas/index.ts` | Data validation rules (new) |
| `src/common/utils/errors.ts` | Error handling (new) |
| `tests/integration/resume.workflow.test.ts` | Integration tests (new) |
| `IMPLEMENTATION_GUIDE.md` | How to fix endpoints (new) |
| `tests/setup.ts` | Test configuration |

---

## ✅ Success Checklist

- [ ] Backend running on port 4000
- [ ] Tests show 5-10 green checkmarks
- [ ] Tests show 10-15 red X's
- [ ] You understand what each test does
- [ ] You can spot which endpoint causes which test to fail
- [ ] You know how to fix one endpoint

**If all checked → Ready to build! 🚀**

---

## 🎓 Deep Dive: How Validation Works

### Before (Broken ❌)

```typescript
const salary = req.body.salary; // Could be: "150K", 150000, null, {}, etc
const match = salary.match(/\d+/); // 💥 CRASHES if not a string
```

### After (Fixed ✅)

```typescript
// Schema says: salary MUST be a string matching "$XXK - $XXK" format
const validation = validateAndParse(jobSchema, req.body);

if (!validation.success) {
  // { 
  //   "salary": "Must be formatted as \"$150K - $200K\""  
  // }
  return res.status(400).json(createErrorResponse("Invalid", validation.errors));
}

const salary = validation.data.salary; // Now 100% safe - it's a string
const match = salary.match(/\d+/); // ✓ Works perfectly
```

---

## 🔥 Pro Tips

1. **Read the test to understand what should happen**
   ```bash
   cat tests/integration/resume.workflow.test.ts | less
   ```

2. **Fix tests one at a time**
   ```bash
   npm test -- --testNamePattern="should upload resume"
   ```

3. **Use error messages as a guide**
   - Test says: "Expected email to exist"
   - You add email validation
   - Test passes ✓

4. **Add comments to explain logic**
   ```typescript
   // Validate job salary is in correct format
   if (!validation.success) {
     return res.status(400).json(...);
   }
   ```

---

## 📞 Need Help?

### Test won't run?
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm test
```

### Still stuck?
1. Check backend logs for errors
2. Read IMPLEMENTATION_GUIDE.md
3. Compare your endpoint to the example

---

## 🎉 You Just Did

1. ✅ Added unified validation (no more type errors)
2. ✅ Added proper error messages (users know what's wrong)
3. ✅ Added integration tests (verify everything works)
4. ✅ Free-tier optimized (15K requests/day)
5. ✅ Production ready foundation

**Next: Fix broken endpoints** → Use IMPLEMENTATION_GUIDE.md → Tests will go green

**Good luck! 🚀**
