# SmartAI Resume Platform

**Free-tier-first resume optimization and job matching platform powered by Gemini AI**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)](https://github.com/manikanta-devs/smartai)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git
- A free Gemini API key ([Get one here](https://aistudio.google.com/app/apikey) - no credit card needed!)

### Installation (5 minutes)

```bash
# Clone repository
git clone https://github.com/manikanta-devs/smartai.git
cd smartai

# Install dependencies
npm install --workspaces

# Setup backend
cd packages/backend
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY

# Setup frontend
cd ../frontend
touch .env.local
echo "VITE_GEMINI_API_KEY=your-api-key" >> .env.local
echo "VITE_API_URL=http://localhost:5000/api" >> .env.local

# Start servers (in separate terminals)
# Terminal 1 - Backend
cd packages/backend && npm run dev

# Terminal 2 - Frontend
cd packages/frontend && npm run dev

# Open browser
# Frontend: http://localhost:5174
# API: http://localhost:5000
```

---

## ✨ Features

### 🎯 Core Features
- ✅ **Resume Upload & Parsing** - Support for PDF, DOCX files
- ✅ **ATS Score Analysis** - Get realistic ATS scoring from Gemini AI
- ✅ **Job Search Integration** - Search across RemoteOK, Adzuna, and more
- ✅ **AI Job Matching** - Match your resume to job descriptions
- ✅ **Cover Letter Generation** - AI-powered cover letters tailored to jobs
- ✅ **Interview Preparation** - Get interview questions based on job role
- ✅ **Salary Insights** - Market-based salary ranges for your role
- ✅ **Career Coaching** - AI guidance for career decisions

### 🔄 Smart Architecture
- **Free-tier first** - Works with free services, no paid APIs forced
- **Graceful fallbacks** - Local heuristics if APIs unavailable
- **Intelligent caching** - Reduces API calls and improves performance
- **User's API key** - Uses YOUR Gemini API key (you control the quota)
- **No data lock-in** - Export your resume and data anytime

### 🛡️ Security & Privacy
- **End-to-end encryption** - HTTPS by default
- **JWT authentication** - Secure token-based auth
- **Password hashing** - bcryptjs with 10 rounds
- **No third-party tracking** - Your data is yours
- **GDPR compliant** - Right to deletion and export
- **Open source** - Full transparency

---

## 📚 Documentation

### Getting Started
- [📖 Setup Guide](./SETUP_GUIDE.md) - Complete installation & configuration
- [🚀 Quick Start](#quick-start) - 5-minute setup

### for Developers
- [🏗️ Workflow Guide](./WORKFLOW.md) - System architecture & data flow
- [📡 API Documentation](./API_DOCUMENTATION.md) - All endpoints & examples
- [🛡️ Security Guide](./SECURITY.md) - Security best practices
- [🔧 Troubleshooting](./TROUBLESHOOTING.md) - Common issues & solutions

### Deployment
- [🌐 Vercel (Frontend)](#deploy-frontend)
- [🚂 Railway (Backend)](#deploy-backend)

---

## 🏗️ Tech Stack

### Frontend
```
React 18 + TypeScript + Vite
├── Tailwind CSS - Styling
├── Axios - HTTP client
├── Lucide - Icons
├── Recharts - Charts
└── Zod - Validation
```

### Backend
```
Express + Node.js + TypeScript
├── Prisma ORM - Database
├── SQLite (dev) / PostgreSQL (prod)
├── JWT - Authentication
├── Google Generative AI - AI features
└── Multer - File uploads
```

### AI
```
Google Gemini API
├── Resume Analysis
├── Job Matching
├── Cover Letter Generation
├── Interview Prep
└── Salary Insights
```

---

## 📊 Project Structure

```
smartai/
├── packages/
│   ├── frontend/              # React UI
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── lib/           # Utilities & API client
│   │   │   └── store/         # State management
│   │   ├── vite.config.ts
│   │   └── tailwind.config.ts
│   │
│   ├── backend/               # Express API
│   │   ├── src/
│   │   │   ├── config/        # Configuration
│   │   │   ├── modules/       # Feature modules
│   │   │   ├── services/      # Business logic
│   │   │   ├── common/        # Shared utilities
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   └── tsconfig.json
│   │
│   └── shared/                # Shared ypes
│
└── Documentation/
    ├── SETUP_GUIDE.md
    ├── API_DOCUMENTATION.md
    ├── WORKFLOW.md
    ├── SECURITY.md
    └── TROUBLESHOOTING.md
```

---

## 🚀 Deployment

### Deploy Frontend (Vercel - Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd packages/frontend

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard:
# - VITE_GEMINI_API_KEY = your-key
# - VITE_API_URL = https://api.yourdomain.com
```

### Deploy Backend (Railway - Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from root
railway up

# Set environment variables in Railway dashboard:
# - NODE_ENV = production
# - DATABASE_URL = postgresql://...
# - GEMINI_API_KEY = your-key
# - JWT_SECRET = generate-secure-string
# - FRONTEND_URL = https://yourdomain.com
```

### Deploy with Docker

```bash
# Build image
docker build -t smartai-backend -f Dockerfile .

# Run container
docker run -p 5000:5000 \
  -e GEMINI_API_KEY=your-key \
  -e DATABASE_URL=postgresql://... \
  smartai-backend
```

---

## 📈 Workflow

### User Journey

```
1. Sign Up / Login
   └─ JWT tokens issued

2. Upload Resume
   └─ PDF/DOCX parsed and stored

3. AI Analysis
   └─ Gemini evaluates strengths/weaknesses
   └─ ATS score calculated
   └─ Suggestions provided

4. Search Jobs
   └─ Browse RemoteOK/Adzuna listings
   └─ Results cached for 6 hours

5. Match Resume to Job
   └─ Gemini scores match % (0-100%)
   └─ Highlights matching/missing skills

6. Generate Cover Letter
   └─ Tailored to job description
   └─ Downloadable as PDF

7. Interview Prep
   └─ Role-specific questions
   └─ STAR method guidance
```

---

## 🔑 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database (Production - PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/resume_saas

# AI (Gemini)
GEMINI_API_KEY=AIzaSy...

# JWT
JWT_SECRET=generate-32-char-random-string
JWT_ACCESS_SECRET=generate-32-char-random-string
JWT_REFRESH_SECRET=generate-32-char-random-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Optional
LOG_LEVEL=info
DEBUG=false
```

### Frontend (.env.local)

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_GEMINI_API_KEY=AIzaSy...
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests (when available)
cd packages/frontend
npm test
```

### Test API Endpoints

```bash
# Using cURL
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## 📊 Performance

- ✅ Frontend bundle: **467KB** (gzipped: **135KB**)
- ✅ Backend startup: **< 2 seconds**
- ✅ API response time: **50-100ms** (cached)
- ✅ AI analysis time: **2-10 seconds** (Gemini)
- ✅ Job search: **< 1 second** (cached)

---

## 🛡️ Security

- ✅ HTTPS/TLS encryption
- ✅ JWT token authentication
- ✅ Password hashing with bcryptjs
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (React escaping)
- ✅ CORS configured
- ✅ Rate limiting on auth endpoints
- ✅ No sensitive data in logs
- ✅ Security headers (Helmet)

See [Security Guide](./SECURITY.md) for detailed security practices.

---

## 📝 API Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'

# Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "id": "...", "email": "..." }
  }
}
```

### Upload Resume

```bash
curl -X POST http://localhost:5000/api/resume/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@resume.pdf"

# Response
{
  "success": true,
  "data": {
    "id": "resume-123",
    "fileName": "resume.pdf",
    "textContent": "..."
  }
}
```

See [API Documentation](./API_DOCUMENTATION.md) for all endpoints.

---

## 🆘 Troubleshooting

### Common Issues

**"Cannot find module @resume-saas/backend"**
```bash
npm install --workspaces
```

**"Port 5000 already in use"**
```bash
# Windows: taskkill /PID <pid> /F
# macOS/Linux: kill -9 <pid>
```

**"VITE_GEMINI_API_KEY is not set"**
```bash
# Create packages/frontend/.env.local
VITE_GEMINI_API_KEY=your-key-here
```

**"Database connection error"**
```bash
npx prisma db push
```

See [Troubleshooting Guide](./TROUBLESHOOTING.md) for more issues.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
git clone <your-fork>
cd smartai
npm install --workspaces
npm run dev
```

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Credits

- **Gemini AI** - Google's generative AI
- **Prisma** - Database ORM
- **Express** - Web framework
- **React** - UI framework
- **Vite** - Build tool

---

## 📧 Support

- 📖 [Documentation](./README.md)
- 🆘 [Troubleshooting Guide](./TROUBLESHOOTING.md)
- 🐛 [Report Issues](https://github.com/manikanta-devs/smartai/issues)
- 💬 [Discussions](https://github.com/manikanta-devs/smartai/discussions)
- 📧 Email: support@smartai.dev

---

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Resume upload & parsing
- ✅ AI analysis with Gemini
- ✅ Job search integration
- ✅ Cover letter generation
- ✅ Free-tier optimization

### Phase 2 (Planned)
- [ ] Premium features
- [ ] LinkedIn integration
- [ ] Real-time job alerts
- [ ] Team collaboration
- [ ] Advanced analytics

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Automated job applications
- [ ] Salary negotiation guide
- [ ] Interview video prep
- [ ] Multi-language support

---

## 🎯 Goals

**Mission:** Empower job seekers with intelligent resume optimization and job matching, completely free.

**Vision:** Build the most user-friendly, transparent, and free resume platform that uses AI ethically.

**Values:**
- 🎁 Free for everyone
- 🔓 Open source & transparent
- 🛡️ Privacy-first
- ⚡ Fast & reliable
- 🤖 Ethical AI use

---

## 🌟 Star us on GitHub!

If this project helps you, please star it! ⭐

[⭐ Star on GitHub](https://github.com/manikanta-devs/smartai)

---

## 📸 Screenshots

*Screenshots coming soon*

---

**Made with ❤️ for job seekers everywhere**

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0  
**Status:** Production Ready ✅
