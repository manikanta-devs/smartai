# Setup & Installation Guide

Welcome to SmartAI Resume Platform! This guide walks you through setting up and running the application locally.

## Table of Contents
- [System Requirements](#system-requirements)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Production Deployment](#production-deployment)

---

## System Requirements

### Minimum Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version
- **RAM**: 4GB minimum
- **Disk Space**: 2GB free

### Recommended
- **Node.js**: 20.x LTS
- **RAM**: 8GB+
- **OS**: macOS 12+, Ubuntu 20+, Windows 10/11

### Optional (For development)
- **PostgreSQL**: For production deployments
- **Docker**: For containerized deployment

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/manikanta-devs/smartai.git
cd smartai
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies (monorepo)
npm install --workspaces
```

### 3. Install Development Tools

```bash
# TypeScript compiler
npm install -g typescript

# Prisma CLI (optional, for database management)
npm install -g prisma
```

---

## Environment Configuration

### 1. Backend Configuration

Create `.env` file in `packages/backend/`:

```bash
cd packages/backend
touch .env
```

Add the following configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5174

# Database (Development - SQLite)
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET="dev-secret-change-in-production"
JWT_ACCESS_SECRET="dev-access-secret-min-32-chars"
JWT_REFRESH_SECRET="dev-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# AI Services (Gemini)
GEMINI_API_KEY="your-gemini-api-key-here"
# Get free key from: https://aistudio.google.com/app/apikey

# Job APIs (Optional - uses fallback if not set)
ADZUNA_APP_ID="demo"
ADZUNA_API_KEY="demo"
JSEARCH_API_KEY="demo"

# Email (Optional)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Logging
LOG_LEVEL="debug"
DEBUG="true"
```

### 2. Frontend Configuration

Create `.env.local` file in `packages/frontend/`:

```bash
cd packages/frontend
touch .env.local
```

Add the following configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Gemini API (for frontend AI calls)
VITE_GEMINI_API_KEY="your-gemini-api-key-here"

# Debug Mode
VITE_DEBUG=true
```

### 3. Get Gemini API Key

**FREE** - No credit card required!

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Choose or create a Google Cloud project
4. Copy the generated key
5. Paste into both `.env` files

---

## Database Setup

### 1. Initialize Prisma

```bash
cd packages/backend

# Generate Prisma client
npm run prisma:generate

# Create SQLite database and run migrations
npm run prisma:migrate
```

### 2. View Database (Optional)

```bash
# Open Prisma Studio to view/edit data
npm run prisma:studio
# Opens at http://localhost:5555
```

### 3. Reset Database (Development)

```bash
# ⚠️ WARNING: This deletes all data!
npx prisma migrate reset
```

---

## Running the Application

### Development Mode

#### Terminal 1 - Backend Server

```bash
cd packages/backend
npm run dev
# Runs on http://localhost:5000
```

Expected output:
```
[WARN] ⚠️ GOOGLE_GEMINI_API_KEY not set - AI features will be limited
API running on http://localhost:5000
```

#### Terminal 2 - Frontend Server

```bash
cd packages/frontend
npm run dev
# Runs on http://localhost:5174
```

Expected output:
```
VITE v5.4.21  dev server running at:

➜  Local:   http://localhost:5174/
```

#### Terminal 3 - Automated Monitoring (Optional)

```bash
cd packages/backend
npm run watch
```

### Testing the Setup

**Backend Health Check:**
```bash
curl http://localhost:5000/api/auth/register
# Should respond (endpoint may require POST)
```

**Frontend Access:**
- Open browser: http://localhost:5174
- You should see the login page

---

## Production Deployment

### Build for Production

```bash
# Build both frontend and backend
npm run build --workspaces

# Or individually:
npm run build --workspace=@resume-saas/frontend
npm run build --workspace=@resume-saas/backend
```

### Environment Setup for Production

Set these environment variables in your hosting platform:

**Vercel / Netlify (Frontend):**
```
VITE_API_URL=https://api.yourdomain.com
VITE_GEMINI_API_KEY=your-production-key
```

**Server (Backend - Railway, Heroku, etc.):**
```
NODE_ENV=production
DATABASE_URL=postgresql://...  # PostgreSQL connection string
GEMINI_API_KEY=your-production-key
JWT_SECRET=generate-secure-random-string-32-chars
JWT_ACCESS_SECRET=generate-secure-random-string-32-chars
JWT_REFRESH_SECRET=generate-secure-random-string-32-chars
FRONTEND_URL=https://yourdomain.com
```

### Database for Production

**Switch from SQLite to PostgreSQL:**

1. Set `DATABASE_URL` to PostgreSQL connection string
2. Run migrations on production server:
```bash
npm run prisma:migrate -- --name production-init
```

### Deploy Backend

**Option A: Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Option B: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set GEMINI_API_KEY=your-key

# Deploy
git push heroku main
```

**Option C: Docker**
```bash
# Build image
docker build -t smartai-backend -f Dockerfile .

# Run container
docker run -p 5000:5000 \
  -e GEMINI_API_KEY=your-key \
  -e DATABASE_URL=postgresql://... \
  smartai-backend
```

### Deploy Frontend

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## Troubleshooting

### Common Setup Issues

**Issue: "Cannot find module '@resume-saas/backend'"**
```bash
# Solution: Run from monorepo root
cd smartai  # Go to root
npm install --workspaces
```

**Issue: "ENOENT: no such file or directory, open '.env'"**
```bash
# Solution: Create .env files
cd packages/backend && touch .env
cd ../frontend && touch .env.local
```

**Issue: "Port 5000 is already in use"**
```bash
# Solution: Change PORT in .env or kill process
# Linux/macOS:
lsof -ti:5000 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

**Issue: "Cannot find name 'axios'"**
```bash
# Solution: This has been fixed. If persists:
npm install --save axios
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues.

---

## Next Steps

1. ✅ [Read the API Documentation](./API_DOCUMENTATION.md)
2. ✅ [Understand the System Workflow](./WORKFLOW.md)
3. ✅ [Review Security Best Practices](./SECURITY.md)
4. ✅ [Check Environment Variables](./ENVIRONMENT.md)

---

## Getting Help

- 📖 [Full Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/manikanta-devs/smartai/issues)
- 💬 [Join Discussions](https://github.com/manikanta-devs/smartai/discussions)
- 📧 Email: support@smartai.dev

---

## Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs in `packages/backend/logs/`
3. Check environment variables are correctly set
4. Ensure Node.js version is 18+
5. Try clearing `node_modules` and reinstalling

```bash
# Complete reset (development only)
rm -rf node_modules packages/*/node_modules
npm install --workspaces
npm run build --workspaces
```

---

**Happy coding! 🚀**
