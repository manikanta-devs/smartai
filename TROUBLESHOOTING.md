# Troubleshooting Guide

Common issues and solutions for SmartAI Resume Platform.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Running the App](#running-the-app)
3. [API Issues](#api-issues)
4. [Frontend Issues](#frontend-issues)
5. [Database Issues](#database-issues)
6. [AI/Gemini Issues](#aigemini-issues)
7. [Deployment Issues](#deployment-issues)
8. [Performance Issues](#performance-issues)

---

## Installation Issues

### Issue: "Cannot find module '@resume-saas/backend'"

**Symptoms:**
```
Error: Cannot find module '@resume-saas/backend'
```

**Cause:** Dependencies not installed or workspace not recognized

**Solution:**
```bash
# Go to repository root
cd smartai

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Install workspace dependencies
npm install --workspaces

# Verify
npm ls @resume-saas/backend
```

---

### Issue: "Command not found: npm"

**Symptoms:**
```
npm: command not found
```

**Cause:** Node.js not installed or not in PATH

**Solution:**
```bash
# Check if Node.js is installed
node -v  # Should show v18.x.x or higher
npm -v   # Should show 9.x.x or higher

# If not installed, download from:
# https://nodejs.org/ (LTS version recommended)

# Close and reopen terminal after installing
```

---

### Issue: "Port 3000 is already in use" (or any port)

**Symptoms:**
```
Error: listen EADDRINUSE :::3000
```

**Cause:** Another process is using the same port

**Solution:**

**Windows (PowerShell):**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID 12345 /F

# Or change port in .env
PORT=5001
```

**macOS/Linux:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

---

### Issue: "ENOENT: no such file or directory"

**Symptoms:**
```
Error: ENOENT: no such file or directory, open '.env'
```

**Cause:** Required .env file doesn't exist

**Solution:**
```bash
# Navigate to backend directory
cd packages/backend

# Create .env file
touch .env  # macOS/Linux
type nul > .env  # Windows

# Add configuration
echo "NODE_ENV=development" >> .env
echo "PORT=5000" >> .env
echo "GEMINI_API_KEY=your-key-here" >> .env

# Verify
cat .env  # macOS/Linux
type .env  # Windows
```

---

### Issue: "Cannot find module 'axios'"

**Symptoms:**
```
Error: Cannot find module 'axios'
```

**Cause:** Dependency not installed

**Solution:**
```bash
# Navigate to backend
cd packages/backend

# Install axios
npm install axios

# Verify in package.json
cat package.json | grep axios

# Rebuild TypeScript
npm run build
```

---

## Running the App

### Issue: Backend won't start - "GOOGLE_GEMINI_API_KEY not set"

**Symptoms:**
```
[WARN] ⚠️ GOOGLE_GEMINI_API_KEY not set - AI features will be limited
```

**This is NORMAL** - Backend starts with warning

**Solution:**
```bash
# Option 1: Add API key to .env
echo "GEMINI_API_KEY=AIzaSy..." >> packages/backend/.env

# Option 2: Export as environment variable
export GEMINI_API_KEY=AIzaSy...  # Unix
set GEMINI_API_KEY=AIzaSy...     # Windows CMD
$env:GEMINI_API_KEY="AIzaSy..."  # PowerShell

# Verify
echo $GEMINI_API_KEY  # Unix
echo %GEMINI_API_KEY%  # Windows CMD
```

**Get Free Gemini API Key:**
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Choose "Create new project" 
4. Copy the key and add to .env

---

### Issue: "API running on http://localhost:5000" but frontend can't connect

**Symptoms:**
```
Backend starts but frontend shows "Connection refused"
```

**Cause:** CORS configuration or frontend pointing to wrong URL

**Solution:**

**Check 1: Both servers running?**
```bash
# Terminal 1
cd packages/backend && npm run dev

# Terminal 2
cd packages/frontend && npm run dev

# Verify ports
# Backend: http://localhost:5000
# Frontend: http://localhost:5174
```

**Check 2: Frontend .env.local**
```env
VITE_API_URL=http://localhost:5000/api
```

**Check 3: Backend CORS**
```typescript
// In backend src/server.ts
app.use(cors({
  origin: "http://localhost:5174",
  credentials: true
}));
```

**Check 4: Network**
```bash
# Test from frontend machine
curl http://localhost:5000/api/auth/register

# Should get response (not Connection refused)
```

---

### Issue: "Cannot find module 'tsx'"

**Symptoms:**
```
Error: Cannot find module 'tsx'
```

**Cause:** Development dependency not installed

**Solution:**
```bash
# Install tsx globally
npm install -g tsx

# Or install locally
npm install --save-dev tsx

# Verify
tsx --version
```

---

## API Issues

### Issue: "401 Unauthorized" on protected endpoints

**Symptoms:**
```json
{
  "error": "Unauthorized"
}
```

**Cause:** Missing or invalid authentication token

**Solution:**

**Step 1: Verify token exists**
```javascript
// In browser console
console.log(localStorage.getItem("token"));
// Should show: eyJhbGciOiJIUzI1NiIs...
```

**Step 2: Check token format**
```javascript
// Should be: Bearer <token>
const token = localStorage.getItem("token");
const header = `Bearer ${token}`;
console.log(header);
```

**Step 3: Login again**
```bash
# If no token exists, login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

### Issue: "422 Unprocessable Entity" / Validation error

**Symptoms:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

**Cause:** Request data invalid

**Solution:**

**Check email format:**
```javascript
// Valid: user@example.com
// Invalid: user@, user@example, user example@example.com
```

**Check password requirements:**
```javascript
// Valid: SecurePass123!
// Invalid: pass (too short), "pass word" (spaces), password (no number)
```

**Check required fields:**
```javascript
// Required fields must be present
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}

// Missing: firstName (error!)
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

---

### Issue: "500 Internal Server Error"

**Symptoms:**
```json
{
  "error": "Internal server error"
}
```

**Cause:** Backend error (check server logs)

**Solution:**

**Check backend logs:**
```bash
# Terminal where backend is running - look for red errors
# Example: [ERROR] Database connection failed

# Check environment variables
echo $DATABASE_URL
echo $GEMINI_API_KEY

# Check database connection
npx prisma db push
```

**Common causes:**
- Database connection failed
- Missing environment variable
- File permission error
- Out of memory
- Syntax error in code

---

## Frontend Issues

### Issue: "Blank white screen" on load

**Symptoms:**
- Browser shows white screen
- No error in console
- Page doesn't load

**Cause:** Build error or missing dependencies

**Solution:**

**Step 1: Clear cache**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install --workspaces
```

**Step 2: Rebuild**
```bash
cd packages/frontend
npm run build
npm run dev
```

**Step 3: Check console errors**
```javascript
// Open DevTools: F12
// Check Console tab for errors
// Check Network tab for failed requests
```

---

### Issue: "VITE_GEMINI_API_KEY is not set"

**Symptoms:**
```
[warn] [vite] Invalid request url: undefined
```

**Cause:** Frontend .env.local not configured

**Solution:**
```bash
# In packages/frontend directory
touch .env.local

# Add
echo "VITE_GEMINI_API_KEY=your-gemini-key" >> .env.local
echo "VITE_API_URL=http://localhost:5000/api" >> .env.local

# Restart frontend
npm run dev
```

---

### Issue: Styles not loading (CSS broken)

**Symptoms:**
- Page loads but CSS styles missing
- Page looks unstyled

**Cause:** CSS build error or wrong import paths

**Solution:**

**Step 1: Check CSS imports**
```typescript
// ✅ Correct
import "./index.css"

// ❌ Wrong
import "./index.CSS"  // Wrong case on some systems
import "index.css"    // Missing ./
```

**Step 2: Rebuild CSS**
```bash
cd packages/frontend
npm run build
npm run dev
```

**Step 3: Clear browser cache**
```
Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
Then: Hard Refresh (Ctrl+F5 or Cmd+Shift+R)
```

---

## Database Issues

### Issue: "Error: ENOENT: no such file or directory './dev.db'"

**Symptoms:**
```
Error: ENOENT: no such file or directory, open './dev.db'
```

**Cause:** Database file not created

**Solution:**
```bash
cd packages/backend

# Initialize database
npx prisma migrate deploy

# Or create from schema
npx prisma db push

# Verify file created
ls -la prisma/dev.db  # Unix
dir prisma\dev.db     # Windows
```

---

### Issue: "Database connection timeout"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** 
- PostgreSQL not running (production mode)
- Wrong connection string

**Solution:**

**For Development (SQLite):**
```bash
# Should work automatically
# No external database needed
```

**For Production (PostgreSQL):**
```bash
# Make sure PostgreSQL is running
# Linux
sudo systemctl start postgresql

# macOS
brew services start postgresql

# Windows
# Start PostgreSQL from Services

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/resume_saas"
```

---

### Issue: "TABLE 'users' doesn't exist"

**Symptoms:**
```
Error: relation "users" does not exist
```

**Cause:** Migrations not run

**Solution:**
```bash
cd packages/backend

# Run migrations
npx prisma migrate deploy

# Or create from schema
npx prisma db push

# Verify
npx prisma studio  # Opens GUI to view database
```

---

## AI/Gemini Issues

### Issue: "Gemini API returns empty response"

**Symptoms:**
```json
{
  "analysis": "",
  "suggestions": null
}
```

**Cause:** API key invalid or API changed

**Solution:**

**Step 1: Verify API key**
```bash
# Check .env
echo $GEMINI_API_KEY

# Should start with: AIzaSy...
```

**Step 2: Test Gemini API directly**
```bash
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```

**Step 3: Check API quota**
```
Visit: https://aistudio.google.com/app/apikey
- Check: Free tier limit (60 req/min)
- Check: Current usage
- Check: Error messages
```

---

### Issue: Job search returns no results

**Symptoms:**
```json
{
  "jobs": []
}
```

**Cause:** API quota exceeded or no mock data

**Solution:**

**Check mock data exists:**
```typescript
// Backend should return mock jobs if:
// 1. External APIs fail
// 2. API quota exceeded
// 3. Developer mode

// Test fallback
curl -X POST http://localhost:5000/api/jobs/search \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "Developer"}'

# Should return mock dev jobs
```

---

## Deployment Issues

### Issue: "Application crashed on startup"

**Symptoms:**
```
Error: Application exited with code 1
```

**Cause:** Environment variables not set in production

**Solution:**

**On Vercel (Frontend):**
```
Settings → Environment Variables
Add:
- VITE_GEMINI_API_KEY = your-key
- VITE_API_URL = https://api.yourdomain.com
```

**On Railway (Backend):**
```
Variables
Add:
- NODE_ENV = production
- DATABASE_URL = postgresql://...
- GEMINI_API_KEY = your-key
- JWT_SECRET = random-secure-string
- FRONTEND_URL = https://yourdomain.com
```

**On Heroku:**
```bash
heroku config:set NODE_ENV=production
heroku config:set GEMINI_API_KEY=your-key
heroku config:set DATABASE_URL=postgresql://...

# Verify
heroku config
```

---

### Issue: CORS error in production

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Cause:** Frontend URL not in CORS whitelist

**Solution:**

**Update backend .env:**
```env
FRONTEND_URL=https://yourdomain.com
CLIENT_ORIGIN=https://yourdomain.com
```

**Update CORS config:**
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Redeploy backend**

---

### Issue: Database migration fails on deployment

**Symptoms:**
```
Error: Migration failed
```

**Cause:** Schema out of sync with database

**Solution:**

**On Railway:**
```bash
# Run migration before main app
# Add this to Dockerfile:
RUN npx prisma migrate deploy
CMD ["npm", "start"]
```

**On Heroku:**
```bash
# Connect to Heroku Postgres
heroku pg:psql

# Run migrations
heroku run "npx prisma migrate deploy"
```

---

## Performance Issues

### Issue: App is slow / slow load times

**Symptoms:**
- Page takes > 5 seconds to load
- API responses slow
- High CPU usage

**Cause:** 
- Large bundle size
- Unoptimized queries
- Gemini API slow

**Solution:**

**Check frontend bundle:**
```bash
cd packages/frontend
npm run build

# Check output size
ls -lh dist/
```

**Optimize bundle:**
```javascript
// Code splitting
const Component = lazy(() => import('./Component'));

// Image optimization
<img src="image.webp" alt="..." />

// Remove unused dependencies
npm prune --production
```

**Check database queries:**
```typescript
// Enable logging
DEBUG="prisma:*" npm run dev

// Look for N+1 queries
```

---

### Issue: Memory leak / Out of memory

**Symptoms:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```

**Cause:**
- Event listeners not cleaned up
- Large data objects in memory
- Database connections not closed

**Solution:**

**Check for memory leaks:**
```bash
# Run with memory profiling
node --max-old-space-size=4096 dist/server.js

# Monitor memory
pm2 monit  # if using pm2
```

**Fix leaks:**
```typescript
// Always clean up
component.addEventListener('load', handler);
return () => {
  component.removeEventListener('load', handler);
};

// Close connections
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## Getting More Help

**Stack Overflow:**
- Tag: `resume-platform` or specific tech (react, express, etc.)
- Include error message and code snippet

**GitHub Issues:**
https://github.com/manikanta-devs/smartai/issues
- Search existing issues first
- Include reproduction steps

**Discord Community:**
Join our community for real-time help

**Email Support:**
support@smartai.dev

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0
