# System Workflow & Architecture

Complete guide to understanding how SmartAI Resume Platform works end-to-end.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [User Journey](#user-journey)
4. [Technical Workflow](#technical-workflow)
5. [Component Interactions](#component-interactions)
6. [Data Flow](#data-flow)
7. [AI Processing Pipeline](#ai-processing-pipeline)

---

## System Overview

SmartAI is a **free-tier-first** resume optimization and job matching platform that uses Gemini AI for intelligent analysis.

### Key Features

- ✅ Resume Upload & Parsing
- ✅ ATS Score Analysis
- ✅ Job Matching & Suggestions
- ✅ AI-Powered Recommendations
- ✅ Cover Letter Generation
- ✅ Interview Preparation
- ✅ Salary Insights
- ✅ Career Path Suggestions

### Tech Stack

```
┌─────────────────────────────────────┐
│         FRONTEND (React + Vite)      │
│  - TypeScript                        │
│  - Tailwind CSS                      │
│  - Axios HTTP Client                 │
└─────────────────────────────────────┘
              ↓↑ (HTTP/REST)
┌─────────────────────────────────────┐
│      BACKEND (Express + Node.js)     │
│  - TypeScript                        │
│  - Prisma ORM                        │
│  - SQLite (dev) / PostgreSQL (prod)  │
└─────────────────────────────────────┘
              ↓↑ (API)
┌─────────────────────────────────────┐
│    EXTERNAL SERVICES                 │
│  - Google Gemini AI (Free)          │
│  - Job APIs (Adzuna, RemoteOK)      │
│  - Email Service (Nodemailer)       │
└─────────────────────────────────────┘
```

---

## Architecture Diagram

### High-Level Architecture

```
User Browser (Frontend)
    │
    ├─ Login/Register
    ├─ Upload Resume
    ├─ Search Jobs
    ├─ AI Analysis
    ├─ View Results
    └─ Download Reports
    │
    ↓ (HTTPS/REST)
    │
Express Backend Server
    │
    ├─ Authentication (JWT)
    ├─ File Processing
    │   ├─ Parse PDF/DOCX
    │   ├─ Extract Text
    │   └─ Validate Resume
    │
    ├─ Job Service
    │   ├─ Search APIs
    │   ├─ Cache Results
    │   └─ Filter Jobs
    │
    ├─ AI Service (Gemini)
    │   ├─ Mock/Fallback Logic
    │   ├─ Cache Results
    │   └─ Error Handling
    │
    └─ Database (SQLite/PostgreSQL)
        ├─ Users
        ├─ Resumes
        ├─ Jobs
        ├─ Analysis Results
        └─ Cache
```

### Monorepo Structure

```
smartai/
├── packages/
│   ├── frontend/          # React UI
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── QuickWins.tsx
│   │   │   │   ├── JobFitDetector.tsx
│   │   │   │   ├── GapExplainer.tsx
│   │   │   │   └── JobMatchMeter.tsx
│   │   │   ├── pages/
│   │   │   └── lib/
│   │   │       └── api.ts
│   │   └── dist/
│   │
│   ├── backend/           # Express Server
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── jobs/
│   │   │   │   └── resume/
│   │   │   ├── services/
│   │   │   │   ├── aiAnalyzer.ts
│   │   │   │   ├── jobService.ts
│   │   │   │   ├── resumeAutomation.ts
│   │   │   │   └── resumeAdjuster.service.ts
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── dist/
│   │
│   └── shared/            # Shared types
│       └── src/index.ts
│
└── Documentation/
    ├── SETUP_GUIDE.md
    ├── API_DOCUMENTATION.md
    ├── WORKFLOW.md
    ├── SECURITY.md
    └── TROUBLESHOOTING.md
```

---

## User Journey

### 1. Authentication Flow

```
NEW USER
  ↓
[Enter Email & Password]
  ↓
[Backend validates & hashes password]
  ↓
[Create User in Database]
  ↓
[Generate JWT tokens]
  ↓
[Return tokens to frontend]
  ↓
LOGGED IN → Stored in localStorage

RETURNING USER
  ↓
[Enter Email & Password]
  ↓
[Validate credentials]
  ↓
[Check password hash]
  ↓
[Generate JWT tokens]
  ↓
LOGGED IN
```

### 2. Resume Upload Flow

```
USER UPLOADS RESUME
  ↓
[Select PDF/DOCX file]
  ↓
[Frontend validates file size < 10MB]
  ↓
[Send to backend via multipart/form-data]
  ↓
[Backend receives file]
  ↓
[Extract text (PDF/DOCX)]
  ↓
[Save to database]
  ↓
[Return extracted text to frontend]
  ↓
USER SEES RESUME TEXT
```

### 3. Resume Analysis Flow

```
USER CLICKS "ANALYZE RESUME"
  ↓
[Frontend sends resume text]
  ↓
[Backend checks Gemini API key]
  ↓
┌─────────────────────────────┐
│ IF API KEY AVAILABLE        │
└─────────────────────────────┘
  ↓
[Call Gemini API with prompt]
  ↓
[Gemini analyzes resume]
  ↓
[Parse JSON response]
  ↓
[Cache result for 24 hours]
  ↓
┌─────────────────────────────┐
│ IF API KEY NOT AVAILABLE    │
└─────────────────────────────┘
  ↓
[Use fallback heuristics]
  ↓
[Analyze locally:             │
 - Keyword matching          │
 - Format checking           │
 - Length validation         │
  ↓
[Return analysis results]
  ↓
[Frontend displays insights]
  ↓
USER SEES ANALYSIS REPORT
```

### 4. Job Matching Flow

```
USER SEARCHES FOR JOBS
  ↓
[Enter job title & preferences]
  ↓
[Frontend sends to backend]
  ↓
[Backend checks cache first]
  ↓
IF CACHED (< 6 hours)
  ├─ Return cached results
IF NOT CACHED
  ├─ Try Adzuna API
  ├─ Try RemoteOK API
  ├─ Fall back to mock data
  └─ Cache results for 6 hours
  ↓
[Return job listings to frontend]
  ↓
[User selects a job]
  ↓
[Frontend sends resume + job description]
  ↓
[Backend calls Gemini to score match]
  ↓
[Calculate match percentage]
  ↓
USER SEES MATCH SCORE & RECOMMENDATIONS
```

---

## Technical Workflow

### Backend Request Lifecycle

```
REQUEST
  │
  ├─ [Middleware Stack]
  │   ├─ Logger
  │   ├─ CORS
  │   ├─ Body Parser
  │   ├─ Authentication
  │   └─ Rate Limiter
  │
  ├─ [Route Handler]
  │   ├─ Validate Input (Zod)
  │   ├─ Check Authorization
  │   ├─ Process Request
  │   │   ├─ Query Database
  │   │   ├─ Call External APIs
  │   │   ├─ Run Business Logic
  │   │   └─ Cache Results
  │   └─ Format Response
  │
  ├─ [Error Handling]
  │   ├─ Try-Catch Blocks
  │   ├─ Log Errors
  │   ├─ Return Error Response
  │   └─ Graceful Fallbacks
  │
  └─ RESPONSE (JSON)
```

### Frontend Request Lifecycle

```
USER ACTION
  │
  ├─ [UI Component]
  │   ├─ Validate Input
  │   ├─ Show Loading State
  │   └─ Send Request
  │
  ├─ [API Client (Axios)]
  │   ├─ Add Auth Headers
  │   ├─ Set Timeout (30s)
  │   ├─ Send HTTP Request
  │   └─ Wait for Response
  │
  ├─ [Handle Response]
  │   ├─ Check Status Code
  │   ├─ Parse JSON
  │   ├─ Validate Data
  │   └─ Update State
  │
  ├─ [Error Handling]
  │   ├─ Network Errors
  │   ├─ Server Errors
  │   ├─ Validation Errors
  │   └─ Show User Message
  │
  └─ [UI Update]
      ├─ Update Component State
      ├─ Re-render UI
      └─ Show Results/Errors
```

---

## Component Interactions

### Frontend Components

**QuickWins Component**
```
QuickWins.tsx
  ├─ Input: Resume Text
  ├─ Step 1: Validate text length
  ├─ Step 2: Call `/api/automation/quick-wins`
  ├─ Step 3: Try Gemini API
  ├─ Step 4: Fallback to heuristics if needed
  └─ Output: 3-5 improvement suggestions
```

**JobFitDetector Component**
```
JobFitDetector.tsx
  ├─ Input: Resume + Current Job Description
  ├─ Step 1: Format prompt for Gemini
  ├─ Step 2: Call Gemini API directly
  ├─ Step 3: Parse response
  ├─ Step 4: Fallback to skill matching
  └─ Output: Job fit score 0-100%
```

**JobMatchMeter Component**
```
JobMatchMeter.tsx
  ├─ Input: Resume Text + Job Description
  ├─ Step 1: Extract keywords
  ├─ Step 2: Call Gemini with match prompt
  ├─ Step 3: Calculate percentage
  ├─ Step 4: Fallback to keyword overlap
  └─ Output: Visual match meter with insights
```

**GapExplainer Component**
```
GapExplainer.tsx
  ├─ Input: Career history (employment gaps)
  ├─ Step 1: Detect gaps > 3 months
  ├─ Step 2: Call Gemini to explain
  ├─ Step 3: Format response
  ├─ Step 4: Provide smart explanations
  └─ Output: Explanation + cover letter tips
```

### Backend Services

**AI Analyzer Service**
```
aiAnalyzer.ts
├─ analyzeResumeWithAI(resumeText)
│  ├─ Check Gemini API availability
│  ├─ Call Gemini with full prompt
│  ├─ Extract: strengths, weaknesses, ATS score
│  ├─ Cache for 24 hours
│  └─ Return structured analysis
├─ Fallback: fallbackAnalysis()
│  ├─ Keyword density analysis
│  ├─ Format checking
│  ├─ Length evaluation
│  └─ Return local analysis
```

**Resume Automation Service**
```
resumeAutomation.ts
├─ matchResumeToJob()
├─ predictResumeRole()
├─ getImprovementSuggestions()
├─ generateCoverLetter()
├─ generateInterviewPrep()
└─ getSalaryInsights()

All functions:
  ├─ Check API key
  ├─ Call Gemini with specific prompt
  ├─ Cache results
  └─ Fallback to local logic
```

**Job Service**
```
jobService.ts
├─ searchJobsJSearch()    // Free-tier fallback
├─ searchJobsAdzuna()     // Free API
├─ searchJobsRemoteOK()   // Free API
├─ searchJobsGithub()     // Deprecated
└─ buildFallbackJobs()    // Always available

Function flow:
  ├─ Check API credentials
  ├─ Try external API
  ├─ Cache results (6 hours)
  └─ Fallback to mock data
```

---

## Data Flow

### Resume Analysis Data Flow

```
┌──────────────────────────┐
│ Frontend: Upload Resume  │
└──────────────────────────┘
         ↓ (multipart)
┌──────────────────────────┐
│ Backend: /resume/upload  │
├──────────────────────────┤
│ - Parse file             │
│ - Extract text           │
│ - Validate length        │
└──────────────────────────┘
         ↓ (JSON)
┌──────────────────────────┐
│ Database: Store Resume   │
├──────────────────────────┤
│ - resumeId               │
│ - userId                 │
│ - textContent            │
│ - uploadedAt             │
└──────────────────────────┘
         ↓ (resume text)
┌──────────────────────────┐
│ Frontend: Show Text      │
├──────────────────────────┤
│ - Display extracted text │
│ - Allow editing          │
└──────────────────────────┘
         ↓ (on "Analyze")
┌──────────────────────────┐
│ Frontend: Send Text      │
└──────────────────────────┘
         ↓ (POST /analyze)
┌──────────────────────────┐
│ Backend: Analyze         │
├──────────────────────────┤
│ Check Gemini API key?    │
├─ Yes: Call Gemini API   │
└─ No: Use heuristics     │
         ↓
┌──────────────────────────┐
│ Parse AI Response        │
├──────────────────────────┤
│ - Extract insights       │
│ - Calculate ATS score    │
│ - Format suggestions     │
└──────────────────────────┘
         ↓ (JSON)
┌──────────────────────────┐
│ Database: Cache Result   │
├──────────────────────────┤
│ - analysisId             │
│ - resumeId               │
│ - results (JSON)         │
│ - expiresAt (24h)        │
└──────────────────────────┘
         ↓ (JSON response)
┌──────────────────────────┐
│ Frontend: Display        │
├──────────────────────────┤
│ - Show ATS score         │
│ - List suggestions       │
│ - Highlight keywords     │
└──────────────────────────┘
```

---

## AI Processing Pipeline

### Gemini API Integration

```
STEP 1: Input Preparation
  ├─ Check GEMINI_API_KEY environment variable
  ├─ Check VITE_GEMINI_API_KEY (frontend)
  ├─ If missing → Use fallback logic
  └─ If present → Proceed to API call

STEP 2: Prompt Construction
  ├─ Build specific prompt for task
  ├─ Add resume content
  ├─ Add context (job description if needed)
  ├─ Format as request to Gemini
  └─ Set model: "gemini-1.5-flash-latest"

STEP 3: API Call
  ├─ Call: generativelanguage.googleapis.com
  ├─ Method: POST (REST API)
  ├─ Headers: x-goog-api-key: GEMINI_API_KEY
  ├─ Timeout: 30 seconds
  └─ Retry: 3 attempts on failure

STEP 4: Response Processing
  ├─ Receive JSON response
  ├─ Extract text content
  ├─ Parse JSON structure
  ├─ Validate required fields
  └─ Transform to app format

STEP 5: Caching
  ├─ Store result in database
  ├─ Set expiration time
  │  ├─ Analysis: 24 hours
  │  ├─ Job matches: 6 hours
  │  └─ Other: 1 hour
  └─ Use cache on repeat requests

STEP 6: Fallback Logic
  IF API fails or key missing:
  ├─ Resume Analysis
  │  ├─ Keyword extraction
  │  ├─ Format checking
  │  └─ Quick ATS estimate
  ├─ Job Matching
  │  ├─ Skill overlap calculation
  │  └─ Simple percentage
  └─ Return mock-appropriate response
```

### Caching Strategy

```
┌─────────────────────────────┐
│ Request for Analysis        │
└─────────────────────────────┘
         ↓
    Check Cache?
    ├─ CACHE HIT (< expiry)
    │  └─ Return cached result
    └─ CACHE MISS
       └─ Call API/Fallback
         ↓
   [Process Request]
         ↓
   Store in cache with TTL
         ↓
   Return to user
```

### Error Handling Pipeline

```
REQUEST
  ├─ Input Validation
  │  ├─ Valid → Continue
  │  └─ Invalid → Return 400 Error
  │
  ├─ Authentication Check
  │  ├─ Valid token → Continue
  │  └─ Invalid → Return 401 Error
  │
  ├─ Authorization Check
  │  ├─ Authorized → Continue
  │  └─ Not authorized → Return 403 Error
  │
  ├─ Business Logic
  │  ├─ Success → Return 200 with data
  │  ├─ API Error → Try fallback
  │  ├─ Fallback works → Return 200 with fallback data
  │  └─ Both fail → Return 500 with error
  │
  └─ Error Response
     (Always send JSON with error details)
```

---

## Deployment Workflow

### Development

```
npm run dev
├─ Backend: npm run dev (port 5000)
├─ Frontend: npm run dev (port 5174)
└─ Both in watch mode
```

### Production Build

```
npm run build
├─ Frontend: tsc -b && vite build
│  └─ Output: dist/ (optimized)
├─ Backend: tsc -p tsconfig.json
│  └─ Output: dist/ (compiled JS)
└─ Both: minified & ready to deploy
```

### Deployment Targets

**Frontend Options:**
- Vercel (Recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Docker container

**Backend Options:**
- Railway (Recommended)
- Heroku
- AWS Lambda
- DigitalOcean
- Docker container
- VPS (self-hosted)

---

## Performance Considerations

### Frontend Optimization
- ✅ Code splitting by route
- ✅ Lazy loading components
- ✅ Image optimization
- ✅ CSS minification
- ✅ Bundle size: ~467KB (gzipped: ~135KB)

### Backend Optimization
- ✅ Request caching (Redis ready)
- ✅ Database query optimization
- ✅ Compression middleware
- ✅ Rate limiting
- ✅ Connection pooling

### API Response Times
- ✅ Health check: < 10ms
- ✅ Job search (cached): < 50ms
- ✅ Resume upload: < 5s
- ✅ AI analysis (Gemini): 2-10s
- ✅ AI analysis (fallback): < 1s

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0  
**Architecture:** Monorepo (Frontend + Backend + Shared)
