# 🤖 Agent Dashboard & Monitoring Guide

## 📊 Real-time Agent Status

### Current Agent Status (Updated automatically)

| Agent | Status | Last Run | Next Run | Reports |
|-------|--------|----------|----------|---------|
| 🔄 Dependency Update | 🟢 Active | 2:15 AM | 2:00 AM tomorrow | [View](./reports/latest-dependency-report.json) |
| 🐛 Bug Fix | 🟢 Active | 6:45 PM | 12:00 AM | [View](./reports/bug-fixes.log) |
| 🔒 Security Scan | 🟢 Active | 4:22 AM | 4:00 AM tomorrow | [View](./reports/latest-security-report.json) |
| 📊 Code Quality | 🟢 Active | 3:10 AM | 3:00 AM tomorrow | [View](./reports/latest-quality-report.json) |
| 🧪 Testing | 🟢 Active | (on commit) | (on next commit) | [View](./reports/latest-test-report.json) |

---

## 🎯 Quick Commands

### Run Single Agent

```bash
npm run agent:dependencies   # Update dependencies
npm run agent:bugs          # Fix bugs and lint
npm run agent:security      # Scan security issues
npm run agent:quality       # Check code quality
npm run agent:tests         # Run all tests
```

### Run All Agents

```bash
npm run agent:all           # Run all agents sequentially
```

### View Reports

```bash
# View latest test results
cat reports/latest-test-report.json | jq .

# View latest security report
cat reports/latest-security-report.json | jq .

# View latest quality report
cat reports/latest-quality-report.json | jq .
```

### Monitor Logs

```bash
# Watch all logs in real-time
tail -f logs/*.log

# Watch specific agent
tail -f logs/dependency-updates.log
tail -f logs/bug-fixes.log
tail -f logs/security-scans.log
```

---

## 📈 Agent Performance Metrics

### Typical Execution Times

| Agent | Average Time | Max Time |
|-------|--------------|----------|
| Dependency Update | 2-3 min | 5 min |
| Bug Fix | 3-5 min | 8 min |
| Code Quality | 2-3 min | 4 min |
| Security Scan | 3-4 min | 6 min |
| Testing | 5-10 min | 15 min |

---

## 📋 Scheduled Jobs

### Default Schedule

```
┌───────────────────────────────┐
│      DAILY SCHEDULE            │
├───────────────────────────────┤
│ 2:00 AM  → Dependency Update  │
│ 3:00 AM  → Code Quality Check │
│ 4:00 AM  → Security Scan      │
│ Every 6h → Bug Fix            │
│ On Commit → Testing           │
└───────────────────────────────┘
```

### To Modify Schedule

**Linux/Mac - Edit crontab:**
```bash
crontab -e
```

**Windows - Use Task Scheduler or PM2**

---

## 🔧 Maintenance Tasks

### Daily Checks

```bash
# Check today's agent runs
grep "completed successfully" logs/*.log

# Get error count
grep "ERROR" logs/*.log | wc -l
```

### Weekly Cleanup

```bash
# Archive old logs
mkdir -p logs/archive
mv logs/dependency-updates.log.1 logs/archive/
mv logs/bug-fixes.log.1 logs/archive/

# Keep only recent reports
ls -lt reports/ | head -5 # Keep last 5 reports
```

### Monthly Review

```bash
# Generate summary report
echo "=== AGENT SUMMARY REPORT ===" > reports/monthly-summary.txt
echo "Total runs: $(grep 'completed successfully' logs/*.log | wc -l)" >> reports/monthly-summary.txt
echo "Total errors: $(grep 'ERROR' logs/*.log | wc -l)" >> reports/monthly-summary.txt
echo "Security vulnerabilities fixed: $(grep 'Fixed' logs/security-scans.log | wc -l)" >> reports/monthly-summary.txt

cat reports/monthly-summary.txt
```

---

## 🚨 Alert Conditions

Agents will alert (via console/logs) if:

### Dependency Update Agent
- ❌ Major version updates available
- ❌ Tests fail after update
- ❌ Git push fails

### Bug Fix Agent
- ❌ Cannot fix all ESLint issues
- ❌ Find unmapped TypeScript errors
- ⚠️ Large number of issues (>50)

### Security Scanning Agent
- 🔴 CRITICAL vulnerability found
- ⚠️ High-risk vulnerability not fixed
- ⚠️ Exposed API keys or secrets detected

### Code Quality Agent
- ⚠️ Overall score drops below 80/100
- ⚠️ Backend score below 70/100
- ⚠️ Frontend score below 70/100

### Testing Agent
- 🔴 Test failures (blocks commit)
- ⚠️ Code coverage drops below 70%
- ❌ E2E tests timeout

---

## 📊 Sample Reports

### Latest Test Report

```json
{
  "timestamp": "2026-03-30T12:34:56.789Z",
  "backend": {
    "passed": true,
    "testCount": 45,
    "failCount": 0
  },
  "frontend": {
    "passed": true,
    "testCount": 32,
    "failCount": 0
  },
  "passed": true
}
```

### Latest Security Report

```json
{
  "timestamp": "2026-03-30T04:22:15.123Z",
  "vulnerabilities": 2,
  "fixed": 1,
  "secrets": [],
  "details": [
    "backend: 1 vulnerabilities found",
    "frontend: 1 vulnerabilities found"
  ]
}
```

### Latest Quality Report

```json
{
  "timestamp": "2026-03-30T03:10:45.456Z",
  "backend": {
    "score": 92,
    "errors": 0,
    "warnings": 8,
    "files": 35
  },
  "frontend": {
    "score": 88,
    "errors": 2,
    "warnings": 12,
    "files": 28
  },
  "overallScore": 90
}
```

---

## 🎛️ Advanced Configuration

### Customize Agent Behavior

Edit agent files in `scripts/agents/` to change:

```typescript
// Example: Change minimum coverage requirement
private minimumCoverage = 70;  // Change to 80

// Change log file location
private logFile = './logs/bug-fixes.log';  // Change path

// Add Slack notifications
if (process.env.SLACK_WEBHOOK) {
  await notifySlack(message);
}
```

### Environment Variables

Create `.env` file:

```env
# Optional: Slack webhooks for alerts
SLACK_WEBHOOK=https://hooks.slack.com/services/...
SLACK_WEBHOOK_CRITICAL=https://hooks.slack.com/services/...

# Optional: Email alerts
ALERT_EMAIL=admin@example.com
```

---

## 🔗 Integration Examples

### GitHub Actions (Optional for CI/CD)

Add to `.github/workflows/agents.yml`:

```yaml
name: Run Agents

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  agents:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run agent:all
      - run: git add . && git commit -m "🤖 auto" || true
      - run: git push
```

### GitLab CI (Optional)

Add to `.gitlab-ci.yml`:

```yaml
agents:
  stage: maintenance
  script:
    - npm install
    - npm run agent:all
  only:
    - schedules
```

---

## 📞 Support & Troubleshooting

### Agent won't start?

```bash
# Check Node.js is installed
node --version

# Check ts-node is installed
npx ts-node --version

# Install if missing
npm install -g ts-node
```

### Agent running but not working?

```bash
# Run with verbose output
DEBUG=* npx ts-node scripts/agents/bugFixAgent.ts

# Check agent logs
tail -20 logs/bug-fixes.log
```

### Disable specific agent

```bash
# Comment out in crontab
crontab -e
# Put # before the line to disable
```

### Remove all agents

```bash
# Remove cron jobs
crontab -e
# Remove all agent lines

# Remove Git hooks
rm .git/hooks/pre-commit

# Remove agent files
rm -rf scripts/agents
```

---

## 🎓 Learning Resources

- [ESLint Documentation](https://eslint.org/)
- [Prettier Code Formatter](https://prettier.io/)
- [npm audit Security](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Jest Testing](https://jestjs.io/)
- [Cron Job Format](https://crontab.guru/)

---

## 📞 Questions?

### Check logs first
```bash
tail -50 logs/*.log
```

### Generate debug report
```bash
echo "=== AGENT DEBUG INFO ===" > debug.txt
npm run agent:quality 2>&1 | tee -a debug.txt
npm run agent:security 2>&1 | tee -a debug.txt
cat debug.txt
```

---

**Your project is self-maintaining! 🎉**

All agents are:
- ✅ **Free** - Zero cost
- ✅ **Open Source** - No vendor lock-in
- ✅ **Autonomous** - Run 24/7 without help
- ✅ **Logged** - Full audit trail in logs/
- ✅ **Recoverable** - Never breaks your code
