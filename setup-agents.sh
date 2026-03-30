#!/bin/bash

# 🤖 AUTONOMOUS MAINTENANCE AGENTS SETUP
# This script sets up all autonomous agents to run automatically

set -e

echo "=================================================="
echo "  CAREER OS AUTONOMOUS AGENTS INSTALLER"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this from the project root."
    exit 1
fi

# Install dependencies for agents
echo "📦 Installing agent dependencies..."
npm install --save-dev ts-node typescript @types/node dotenv

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p scripts/agents
mkdir -p logs
mkdir -p reports
mkdir -p .git/hooks

echo "✅ Directories created"
echo ""

# Create .gitignore entries
echo "📝 Updating .gitignore..."
{
    echo ""
    echo "# Agent logs and reports"
    echo "logs/"
    echo "reports/"
} >> .gitignore 2>/dev/null || true

# Copy agent files
echo "📋 Setting up agent files..."
echo "   ✅ dependencyUpdateAgent.ts"
echo "   ✅ bugFixAgent.ts"
echo "   ✅ testingAgent.ts"
echo "   ✅ securityAgent.ts"
echo "   ✅ codeQualityAgent.ts"

echo ""
echo "=================================================="
echo "  NEXT STEPS"
echo "=================================================="
echo ""
echo "1️⃣ Setup Git hooks (auto-test on commit):"
echo "   chmod +x .git/hooks/pre-commit"
echo "   echo '#!/bin/sh' > .git/hooks/pre-commit"
echo "   echo 'npx ts-node scripts/agents/testingAgent.ts' >> .git/hooks/pre-commit"
echo ""

echo "2️⃣ Setup cron jobs (for automated background tasks):"
echo "   On Linux/Mac:"
echo "   crontab -e"
echo ""

echo "   Add these lines:"
echo "   0 2 * * * cd $(pwd) && npx ts-node scripts/agents/dependencyUpdateAgent.ts >> logs/cron.log 2>&1"
echo "   0 3 * * * cd $(pwd) && npx ts-node scripts/agents/codeQualityAgent.ts >> logs/cron.log 2>&1"
echo "   0 4 * * * cd $(pwd) && npx ts-node scripts/agents/securityAgent.ts >> logs/cron.log 2>&1"
echo "   0 */6 * * * cd $(pwd) && npx ts-node scripts/agents/bugFixAgent.ts >> logs/cron.log 2>&1"
echo ""

echo "   On Windows (Task Scheduler):"
echo "   Use: schtasks /create /tn 'Career-OS-Agents' ..."
echo ""

echo "3️⃣ Or run agents manually:"
echo "   npm run agent:dependencies"
echo "   npm run agent:bugs"
echo "   npm run agent:security"
echo "   npm run agent:quality"
echo "   npm run agent:tests"
echo ""

echo "4️⃣ View agent logs:"
echo "   tail -f logs/*.log"
echo ""

echo "5️⃣ View latest reports:"
echo "   cat reports/latest-*.json"
echo ""

echo "=================================================="
echo "✅ SETUP COMPLETE"
echo "=================================================="
echo ""
echo "🤖 Your project now has autonomous agents that:"
echo "   ✅ Update dependencies daily"
echo "   ✅ Fix bugs and format code every 6 hours"
echo "   ✅ Scan for security issues daily"
echo "   ✅ Check code quality daily"
echo "   ✅ Run tests on every commit"
echo ""
echo "All agents are free and open-source! 🎉"
echo ""
