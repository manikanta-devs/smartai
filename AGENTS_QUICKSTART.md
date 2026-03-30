# 🤖 Quick Start: Autonomous Maintenance Agents

> **TL;DR:** Set up robots to automatically fix bugs, update dependencies, scan security, run tests, and maintain code quality 24/7 — all for FREE.

---

## ✨ What Will Happen Automatically

| Task | When | What It Does |
|------|------|-------------|
| **Update Dependencies** | Daily 2 AM | Auto-updates npm packages to latest safe versions |
| **Fix Bugs** | Every 6 hours | Auto-fixes ESLint issues, formats code |
| **Check Security** | Daily 4 AM | Scans for vulnerabilities and fixes them |
| **Test Code** | Every commit | Runs all tests, prevents broken code uploads |
| **Code Quality** | Daily 3 AM | Analyzes code, generates quality score |

---

## 🚀 Installation (5 min)

### Step 1: Copy agent files

```bash
# Agent files are already in:
# ✅ scripts/agents/dependencyUpdateAgent.ts
# ✅ scripts/agents/bugFixAgent.ts
# ✅ scripts/agents/testingAgent.ts
# ✅ scripts/agents/securityAgent.ts
# ✅ scripts/agents/codeQualityAgent.ts
```

### Step 2: Install dependencies

```bash
npm install --save-dev ts-node typescript @types/node
```

### Step 3: Setup Git hooks (auto-test on commit)

**On Linux/Mac:**
```bash
chmod +x .git/hooks/pre-commit
echo '#!/bin/sh' > .git/hooks/pre-commit
echo 'npx ts-node scripts/agents/testingAgent.ts' >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**On Windows PowerShell:**
```powershell
$hookContent = @"
#!/bin/sh
npx ts-node scripts/agents/testingAgent.ts
"@

$hookContent | Out-String | Set-Content -Path ".git\hooks\pre-commit"
```

### Step 4: Add npm scripts

Add to your `package.json` in the root:

```json
{
  "scripts": {
    "agent:dependencies": "npx ts-node scripts/agents/dependencyUpdateAgent.ts",
    "agent:bugs": "npx ts-node scripts/agents/bugFixAgent.ts",
    "agent:security": "npx ts-node scripts/agents/securityAgent.ts",
    "agent:quality": "npx ts-node scripts/agents/codeQualityAgent.ts",
    "agent:tests": "npx ts-node scripts/agents/testingAgent.ts",
    "agent:all": "npm run agent:dependencies && npm run agent:bugs && npm run agent:quality && npm run agent:security"
  }
}
```

---

## 🎯 Run Agents Manually

### Run one at a time:

```bash
# Update all dependencies
npm run agent:dependencies

# Auto-fix bugs and lint issues
npm run agent:bugs

# Check security vulnerabilities
npm run agent:security

# Check code quality
npm run agent:quality

# Run tests
npm run agent:tests

# Run all agents
npm run agent:all
```

### Or use ts-node directly:

```bash
npx ts-node scripts/agents/dependencyUpdateAgent.ts
npx ts-node scripts/agents/bugFixAgent.ts
npx ts-node scripts/agents/testingAgent.ts
npx ts-node scripts/agents/securityAgent.ts
npx ts-node scripts/agents/codeQualityAgent.ts
```

---

## ⏰ Setup Automatic Scheduling

### Option 1: Linux/Mac Cron Jobs

```bash
crontab -e
```

Add these lines:

```cron
# Dependency Update Agent - Daily at 2 AM
0 2 * * * cd /path/to/project && npx ts-node scripts/agents/dependencyUpdateAgent.ts >> logs/cron.log 2>&1 &

# Code Quality Agent - Daily at 3 AM
0 3 * * * cd /path/to/project && npx ts-node scripts/agents/codeQualityAgent.ts >> logs/cron.log 2>&1 &

# Security Agent - Daily at 4 AM
0 4 * * * cd /path/to/project && npx ts-node scripts/agents/securityAgent.ts >> logs/cron.log 2>&1 &

# Bug Fix Agent - Every 6 hours
0 */6 * * * cd /path/to/project && npx ts-node scripts/agents/bugFixAgent.ts >> logs/cron.log 2>&1 &
```

**To verify cron is running:**
```bash
crontab -l
```

### Option 2: Windows Task Scheduler

**Via PowerShell (Admin):**

```powershell
$taskAction = New-ScheduledTaskAction -Execute "node" -Argument "scripts/agents/dependencyUpdateAgent.ts"
$taskTrigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "CareerOS-Dependency-Update" -Action $taskAction -Trigger $taskTrigger -RunLevel Highest
```

### Option 3: Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'dependency-update',
      script: 'npx ts-node scripts/agents/dependencyUpdateAgent.ts',
      cron_restart: '0 2 * * *',  // Daily at 2 AM
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
    },
    {
      name: 'bug-fix',
      script: 'npx ts-node scripts/agents/bugFixAgent.ts',
      cron_restart: '0 */6 * * *',  // Every 6 hours
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
    },
    {
      name: 'security-scan',
      script: 'npx ts-node scripts/agents/securityAgent.ts',
      cron_restart: '0 4 * * *',  // Daily at 4 AM
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
    },
    {
      name: 'code-quality',
      script: 'npx ts-node scripts/agents/codeQualityAgent.ts',
      cron_restart: '0 3 * * *',  // Daily at 3 AM
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
    },
  ],
};
```

Start PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 📊 View Agent Reports

### Check latest reports:

```bash
# Latest test report
cat reports/latest-test-report.json

# Latest security report
cat reports/latest-security-report.json

# Latest quality report
cat reports/latest-quality-report.json
```

### Watch agent logs in real-time:

```bash
# Watch all logs
tail -f logs/*.log

# Watch specific log
tail -f logs/dependency-updates.log
tail -f logs/bug-fixes.log
tail -f logs/security-scans.log
```

---

## 🎨 What Each Agent Does

### 1️⃣ Dependency Update Agent

**Runs:** Daily at 2 AM  
**Does:**
- ✅ Checks for outdated npm packages
- ✅ Auto-updates patch & minor versions (safe)
- ✅ Alerts for major versions (requires manual review)
- ✅ Runs tests after update
- ✅ Commits changes to git

**Example:**
```
Found 5 outdated packages
Updated: lodash, axios, typescript
Major updates available: react 18→19 (needs manual review)
All tests passed ✅
Committed to git ✅
```

---

### 2️⃣ Bug Fix Agent

**Runs:** Every 6 hours  
**Does:**
- ✅ Fixes ESLint linting issues automatically
- ✅ Fixes unused variables and imports
- ✅ Formats code with Prettier
- ✅ Checks for TypeScript errors
- ✅ Reports unfixable issues for manual review

**Example:**
```
Backend: Fixed 12 ESLint issues
Frontend: Fixed 8 ESLint issues
Code formatted with Prettier
TypeScript: 0 errors found ✅
```

---

### 3️⃣ Security Scanning Agent

**Runs:** Daily at 4 AM  
**Does:**
- ✅ Runs npm audit for vulnerabilities
- ✅ Auto-fixes low-risk vulnerabilities
- ✅ Scans for exposed secrets (API keys)
- ✅ Alerts for critical issues
- ✅ Generates detailed security report

**Example:**
```
npm audit: Found 3 vulnerabilities
Fixed: 2 low-risk issues
Remaining: 1 medium-risk (manual review)
Secrets scan: No exposed API keys found ✅
```

---

### 4️⃣ Code Quality Agent

**Runs:** Daily at 3 AM  
**Does:**
- ✅ Analyzes code with ESLint
- ✅ Formats code with Prettier
- ✅ Calculates quality score (0-100)
- ✅ Generates quality report
- ✅ Tracks quality trends

**Example:**
```
Backend Score: 92/100 (A)
Frontend Score: 88/100 (A)
Overall Score: 90/100 (A+)
Status: EXCELLENT ✅
```

---

### 5️⃣ Automated Testing Agent

**Runs:** On every git commit  
**Does:**
- ✅ Runs backend tests
- ✅ Runs frontend tests
- ✅ Generates coverage reports
- ✅ Prevents commit if tests fail
- ✅ Tracks test results

**Example:**
```
Backend: 45 tests passed ✅
Frontend: 32 tests passed ✅
Coverage: 82%
Status: All tests passed - commit allowed ✅
```

---

## 🚨 What If Tests Fail?

The testing agent prevents commits if tests fail:

```bash
$ git commit -m "Add feature"

# 🧪 AUTOMATED TESTING AGENT
# Running backend tests...
# Running frontend tests...

# ❌ TESTS FAILED - Commit prevented
# Fix the failing tests and try again
```

**To fix:**

1. Check what failed:
   ```bash
   npm test
   ```

2. Fix the issue

3. Try commit again:
   ```bash
   git commit -m "Add feature"
   ```

---

## 📈 Performance Impact

| Agent | CPU | Memory | Network | Cost |
|-------|-----|--------|---------|------|
| Dependency Update | Low | 50MB | 2MB | $0 |
| Bug Fix | Low | 100MB | 1MB | $0 |
| Security Scan | Low | 150MB | 3MB | $0 |
| Code Quality | Low | 100MB | 1MB | $0 |
| Testing | Medium | 200MB | <1MB | $0 |

**Total:** All agents use local open-source tools = **$0 cost** 🎉

---

## 🆘 Troubleshooting

### Agents not running automatically?

**Check if cron is running (Linux/Mac):**
```bash
crontab -l
```

**Check PM2 status:**
```bash
pm2 status
pm2 logs
```

**Check if Git hook installed:**
```bash
cat .git/hooks/pre-commit
```

---

### "npx: command not found"?

Install Node.js from https://nodejs.org/

---

### Agents slowing down my commits?

Tests are required but should only take 10-30 seconds. If slower:

```bash
# Skip tests temporarily (NOT RECOMMENDED)
git commit -m "..." --no-verify
```

Or configure tests to run in parallel (advanced).

---

### How to stop/disable agents?

**Stop PM2:**
```bash
pm2 delete all
pm2 save
```

**Remove cron jobs:**
```bash
crontab -e
# Remove the lines you added
```

**Remove Git hooks:**
```bash
rm .git/hooks/pre-commit
```

---

## 💡 Tips & Tricks

### Run all agents at once:

```bash
npm run agent:all
```

### Schedule custom agent at specific time:

Edit crontab:
```bash
crontab -e

# Run at 11 PM every Friday
0 23 * * 5 cd /path && npx ts-node scripts/agents/bugFixAgent.ts
```

### Get notifications when agents run:

Edit the agent files to add email/Slack webhooks (advanced).

### Monitor agent health:

```bash
# View all logs
cat logs/*.log | tail -50

# Get summary
echo "Summary:"
grep "completed successfully" logs/*.log | wc -l
```

---

## 🎯 Next Steps

1. ✅ Install agents (done!)
2. ✅ Setup Git hooks (test on next commit)
3. ⏭️ Setup cron jobs (for automatic background tasks)
4. ⏭️ Monitor logs for first week
5. ⏭️ Celebrate that your project maintains itself! 🎉

---

**Questions?** Check agent logs:
```bash
tail -f logs/*.log
```

**Your project is now self-healing!** 🤖✨
