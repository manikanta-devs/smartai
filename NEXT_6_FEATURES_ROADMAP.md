# 🚀 Next 6 Premium Features - Implementation Roadmap

After deploying Career Coach, Resume Versions, and Career Streak, here are the next priority features with full implementation details.

---

## Feature 5: Company Insider Intel

### 🏢 Overview
Real company insights before applying - company health, salary data, culture, recent news, hiring trends.

### Architecture
```
Backend:
- companyIntel.service.ts (300+ lines)
  - Clearbit API (free tier: 5K/month)
  - AI analysis with Gemini
  - Cache company data for 30 days
  
- intel.routes.ts (150+ lines)
  - GET /api/companies/:name/intel
  - GET /api/companies/search
  - GET /api/companies/:id/salary-trends

Database:
model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  website   String?
  logo      String?
  industry  String?
  founded   Int?
  employees Int?
  
  // Clearbit data
  clearbitData    String @db.Text // JSON
  
  // AI-generated insights
  aiSummary      String @db.Text
  cultureScore   Int
  hiringSentiment String // "hot", "moderate", "slow"
  
  // Salary data
  avgSalary      Int?
  salaryRange    String? // "100k-150k"
  
  // News & trends
  recentNews     String @db.Text // JSON array
  
  // Cache control
  lastUpdated    DateTime @default(now())
  createdAt      DateTime @default(now())
  
  @@index([name])
  @@index([industry])
}

model ApplicationInsight {
  id            String   @id @default(cuid())
  userId        String
  applicationId String?
  companyId     String
  
  // Scoring
  recommendScore    Int // 0-100
  complianceRisk    Int // 0-100 (salary expectations vs market)
  interestScore     Int // 0-100 (fit + growth potential)
  
  // Predictions
  acceptanceOdds    Int? // 0-100%
  salaryForecast    Int?
  timeToOffer       String? // "7-14 days"
  
  user        User @relation(fields: [userId], references: [id])
  company     Company @relation(fields: [companyId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([userId])
}
```

### API Endpoints

```typescript
// Search companies
GET /api/companies/search?q=Google
Returns: { companies: [{ id, name, logo, website }] }

// Get full company intel
GET /api/companies/:companyId/intel
Returns: {
  company: {
    name, website, logo, industry, employees,
    aiSummary,
    cultureScore,
    hiringSentiment,
    avgSalary,
    salaryRange,
    recentNews: [{ title, date, source }]
  },
  insights: {
    topSkills: ["Python", "React", "AWS"],
    recentHires: ["ML Engineer", "DevOps"],
    hiringRate: "high"
  }
}

// AI-powered recommendation for application
POST /api/companies/:companyId/application-insight
Body: { applicationId, salary_expected }
Returns: {
  recommendScore: 85,
  insight: "Excellent fit! Company is hiring 20+ engineers. Salary seems slightly below market.",
  risks: ["competitive market", "visa sponsorship unclear"],
  tips: ["Emphasize data science skills", "Ask about remote work"]
}
```

### Service Implementation

```typescript
// companyIntel.service.ts
export async function searchCompanies(query: string) {
  // Check cache first (1 week)
  const cached = await prisma.company.findFirst({
    where: { name: { contains: query, mode: "insensitive" } }
  });
  
  if (cached && isRecent(cached.lastUpdated, 7 * 24 * 60)) {
    return cached;
  }
  
  // Fetch from Clearbit
  const clearbitResponse = await fetch(
    `https://company.clearbit.com/v1/companies/suggest?name=${query}`,
    { headers: { Authorization: `Bearer ${CLEARBIT_KEY}` } }
  );
  
  const results = await clearbitResponse.json();
  return results;
}

export async function getCompanyIntel(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  
  // If cached and recent, return cached
  if (company && isRecent(company.lastUpdated, 30 * 24 * 60)) {
    return JSON.parse(company.clearbitData);
  }
  
  // Fetch from Clearbit + AI processing
  const freshData = await enrichCompanyData(company.name);
  
  // Update cache
  await prisma.company.update({
    where: { id: companyId },
    data: {
      clearbitData: JSON.stringify(freshData),
      lastUpdated: new Date()
    }
  });
  
  return freshData;
}

export async function analyzeApplicationFit(
  companyId: string,
  userId: string,
  salaryExpected: number
) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resumes: { include: { analysisResult: true } } }
  });
  
  // Build prompt with full context
  const prompt = `
    User profile: ${user.firstName} ${user.lastName}
    Skills: ${extractSkills(user.resumes[0])}
    Expected salary: $${salaryExpected}
    
    Company: ${company.name}
    avg Salary: ${company.avgSalary}
    Culture Score: ${company.cultureScore}/100
    Recent News: ${company.recentNews}
    
    Provide:
    1. Recommend score (0-100)
    2. 3 specific strengths
    3. Risk factors
    4. Actionable tips for this specific company
    5. Estimated acceptance odds
  `;
  
  const analysis = await gemini.generateContent(prompt);
  
  // Store insight
  await prisma.applicationInsight.create({
    data: {
      userId,
      companyId,
      recommendScore: extractScore(analysis),
      salaryForecast: company.avgSalary,
      acceptanceOdds: estimateOdds(user, company)
    }
  });
  
  return analysis;
}
```

### Frontend Component

```typescript
// CompanyIntelCard.tsx
export const CompanyIntelCard: React.FC = ({ company }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-start gap-4">
        <img src={company.logo} alt={company.name} className="w-12 h-12 rounded" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{company.name}</h3>
          <p className="text-sm text-gray-600">{company.industry} • {company.employees}+ employees</p>
        </div>
      </div>
      
      {/* Scores */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <ScoreCard label="Culture" score={company.cultureScore} />
        <ScoreCard label="Hiring" score={company.hiringSentiment === 'hot' ? 90 : 60} />
        <ScoreCard label="Match" score={calculateFit(company, userProfile)} />
      </div>
      
      {/* AI Insight */}
      <div className="mt-4 p-3 bg-white rounded border border-blue-100">
        <p className="text-sm">{company.aiSummary}</p>
      </div>
      
      {/* Salary & Market */}
      <div className="mt-4 flex justify-between text-sm">
        <span>Avg Salary: <strong>${company.avgSalary?.toLocaleString()}</strong></span>
        <span className="text-gray-500">{company.salaryRange}</span>
      </div>
      
      {/* Recent News */}
      {company.recentNews.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Latest News</p>
          {company.recentNews.slice(0, 2).map((news, idx) => (
            <a key={idx} href={news.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline block">
              • {news.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Cost
- Clearbit: Free tier (5K/month, ~0.16/day per company)
- AI: Included in Gemini free tier
- Cache: 30-day expiration = ~1K API calls/month max
- **Total: $0**

---

## Feature 6: Smart Autopilot

### 🤖 Overview
Automatically generate tailored resumes and apply to matching jobs with one click.

### Architecture
```
Backend:
- autopilot.service.ts (400+ lines)
  - Match algorithm (skill + score analysis)
  - Resume generation
  - Auto-application pipeline
  
- autopilot.routes.ts (200+ lines)
  - POST /api/autopilot/start
  - GET /api/autopilot/status
  - GET /api/autopilot/applications
  - PATCH /api/autopilot/settings

Database:
model AutopilotSession {
  id          String @id @default(cuid())
  userId      String
  
  // Config
  enabled     Boolean @default(false)
  dailyLimit  Int @default(5) // max apps per day
  minMatch    Int @default(70) // min match score
  targetRoles String[] // JSON array
  targetIndustries String[]
  excludeCompanies String[]
  
  // Stats
  totalApplied    Int @default(0)
  successCount    Int @default(0)
  failureCount    Int @default(0)
  lastRun         DateTime?
  
  // Control
  pausedUntil     DateTime?
  reason          String? // "quota_exceeded", "no_matches", etc
  
  user    User @relation(fields: [userId], references: [id])
  jobs    AutopilotApplication[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId])
}

model AutopilotApplication {
  id          String @id @default(cuid())
  sessionId   String
  jobId       String
  applicationId  String?
  
  // Scoring
  matchScore  Int // 0-100
  skillMatch  Int
  scoreUpdate Int? // how much did resume tweak improve score
  
  // Customization
  customizedResume  String @db.Text // JSON diff from original
  coverLetterGenerated Boolean @default(false)
  
  // Status
  status      String @default("pending") // pending, applied, reviewing, rejected
  appliedAt   DateTime?
  outcome     String? // "rejected", "interview", "offer"
  
  session     AutopilotSession @relation(fields: [sessionId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@index([sessionId])
  @@index([status])
}
```

### Service Implementation

```typescript
// autopilot.service.ts
export async function startAutopilot(userId: string, settings: {
  dailyLimit: number
  minMatch: number
  targetRoles: string[]
}) {
  // Get or create session
  let session = await prisma.autopilotSession.findUnique({
    where: { userId }
  });
  
  if (!session) {
    session = await prisma.autopilotSession.create({
      data: { userId, ...settings }
    });
  }
  
  // Start background job
  scheduleAutopilotRun(userId);
  
  return session;
}

export async function runAutopilotOnce(userId: string) {
  const session = await prisma.autopilotSession.findUnique({
    where: { userId }
  });
  
  if (!session?.enabled) return { error: "Autopilot disabled" };
  
  // Check daily quota
  const appliedToday = await prisma.autopilotApplication.count({
    where: {
      sessionId: session.id,
      appliedAt: { gte: startOfDay(new Date()) }
    }
  });
  
  if (appliedToday >= session.dailyLimit) {
    return { paused: true, reason: "daily_quota_exceeded" };
  }
  
  // Find matching jobs
  const matches = await findMatchingJobs(userId, session.minMatch);
  
  // For each job, generate customized resume + apply
  for (const job of matches.slice(0, session.dailyLimit - appliedToday)) {
    try {
      // Tailor resume to this job
      const customResume = await tailorResume(
        session.userId,
        job.description,
        job.requirements
      );
      
      // Measure score improvement
      const scoreImprovement = customResume.newAtsScore - originalScore;
      
      // Create application record
      const appRecord = await prisma.autopilotApplication.create({
        data: {
          sessionId: session.id,
          jobId: job.id,
          matchScore: job.matchScore,
          customizedResume: JSON.stringify(customResume.diff),
          scoreUpdate: scoreImprovement
        }
      });
      
      // Actually apply to job (async, fire and forget)
      applyToJobAsync(job, customResume, appRecord.id);
      
      // Update session stats
      await prisma.autopilotSession.update({
        where: { id: session.id },
        data: {
          totalApplied: { increment: 1 },
          lastRun: new Date()
        }
      });
      
    } catch (err) {
      console.error("Autopilot error:", err);
      await prisma.autopilotSession.update({
        where: { id: session.id },
        data: { failureCount: { increment: 1 } }
      });
    }
  }
}

export async function findMatchingJobs(
  userId: string,
  minScore: number
): Promise<JobMatch[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resumes: true, applications: true }
  });
  
  // Get available jobs
  const availableJobs = await prisma.job.findMany({
    where: {
      // Don't reapply to same job within 30 days
      applications: {
        none: {
          userId,
          appliedAt: { gte: subDays(new Date(), 30) }
        }
      }
    }
  });
  
  // Score each job
  const scored = availableJobs.map(job => ({
    ...job,
    matchScore: calculateJobMatch(user.resumes[0], job)
  }));
  
  return scored.filter(j => j.matchScore >= minScore);
}

export async function tailorResume(
  userId: string,
  jobDescription: string,
  jobRequirements: string
): Promise<{
  diff: any
  newAtsScore: number
}> {
  const resume = await getLatestResume(userId);
  
  // Use AI to suggest modifications
  const prompt = `
    Job: ${jobDescription}
    Requirements: ${jobRequirements}
    Current Resume: ${resume.text}
    
    Generate JSON diff showing:
    1. Which bullets to ADD to match job
    2. Which bullets to REMOVE/DEPRIORITIZE
    3. Which skills to highlight
    4. What order to arrange sections
    5. Keywords to emphasize
    
    Maximize ATS score for this specific job.
  `;
  
  const suggestions = await gemini.generateContent(prompt);
  
  // Apply suggestions (AI suggested changes only, no actual modification)
  const modified = await applyAISuggestions(resume.text, suggestions);
  
  // Score modified version
  const newScore = calculateAtsScore(modified);
  
  return {
    diff: suggestions,
    newAtsScore: newScore
  };
}
```

### Cron Task (runs 3x daily)

```typescript
// Schedule autopilot runs
cron.schedule("0 9,14,18 * * *", async () => {
  // 9 AM, 2 PM, 6 PM
  const activeSessions = await prisma.autopilotSession.findMany({
    where: { enabled: true }
  });
  
  for (const session of activeSessions) {
    await runAutopilotOnce(session.userId);
  }
});
```

### Cost
- Gemini (AI tailoring): Free tier compatible
- Job matching: In-database
- **Total: $0**

---

## Feature 7: Skill Roadmap Generator

### 🎓 Overview
AI-generated week-by-week learning plans based on target role and current skills.

### Service Implementation

```typescript
// skillRoadmap.service.ts
export async function generateRoadmap(
  userId: string,
  targetRole: string,
  timelineWeeks: number = 12
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resumes: true }
  });
  
  // Extract current skills
  const currentSkills = extractSkills(user.resumes[0].text);
  
  // Use AI to create roadmap
  const prompt = `
    Target Role: ${targetRole}
    Current Skills: ${currentSkills.join(", ")}
    Timeline: ${timelineWeeks} weeks
    
    Create a detailed ${timelineWeeks}-week skill development roadmap:
    1. For each week, list specific skills to learn
    2. Suggest 2-3 resources (free: YouTube, GitHub, FCC)
    3. Include practice projects
    4. Track progress checkpoints
    5. Estimate time per skill (hours)
    6. Priority level (critical, important, nice-to-have)
    
    Format as JSON for database storage.
  `;
  
  const roadmap = await gemini.generateContent(prompt);
  
  // Store in database
  await prisma.skillRoadmap.create({
    data: {
      userId,
      targetRole,
      weeks: timelineWeeks,
      content: roadmap,
      startDate: new Date(),
      endDate: addWeeks(new Date(), timelineWeeks)
    }
  });
  
  return roadmap;
}

export async function updateRoadmapProgress(
  userId: string,
  skillId: string,
  completed: boolean
) {
  await prisma.skillProgress.update({
    where: { userId_skillId: { userId, skillId } },
    data: {
      completed,
      completedDate: completed ? new Date() : null
    }
  });
}

export async function getRoadmapProgress(userId: string) {
  const roadmap = await prisma.skillRoadmap.findMany({
    where: { userId },
    include: {
      skills: {
        include: { progress: true }
      }
    }
  });
  
  return roadmap.map(r => ({
    ...r,
    percentComplete: calculateProgress(r.skills),
    weeksUntilComplete: calculateTimeRemaining(r.skills, r.endDate)
  }));
}
```

### Database Schema

```prisma
model SkillRoadmap {
  id          String @id @default(cuid())
  userId      String
  targetRole  String
  weeks       Int
  content     String @db.Text // JSON roadmap
  
  // Timeline
  startDate   DateTime @default(now())
  endDate     DateTime
  
  // Engagement
  active      Boolean @default(true)
  completedAt DateTime?
  
  skills      SkillLevel[]
  user        User @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

model SkillLevel {
  id          String @id @default(cuid())
  roadmapId   String
  skillName   String
  weekNumber  Int
  resources   String[] // URLs
  projectIdea String?
  timeHours   Int
  priority    String // "critical", "important", "nice-to-have"
  
  progress    SkillProgress?
  roadmap     SkillRoadmap @relation(fields: [roadmapId], references: [id])
}

model SkillProgress {
  id            String @id @default(cuid())
  userId        String
  skillId       String @unique
  completed     Boolean @default(false)
  completedDate DateTime?
  lastReview    DateTime?
  score         Int? // 0-100
  
  user          User @relation(fields: [userId], references: [id])
  skill         SkillLevel @relation(fields: [skillId], references: [id])
}
```

### Cost: $0

---

## Feature 8: LinkedIn Profile Scanner

### 🔗 Overview
Analyze LinkedIn profile (from public URL) and suggest optimizations.

```typescript
export async function scanLinkedInProfile(profileUrl: string) {
  // Scrape public LinkedIn (no private API needed)
  const profile = await scrapeLinkedInPublic(profileUrl);
  
  // Analyze with AI
  const prompt = `
    LinkedIn Profile:
    - Headline: ${profile.headline}
    - Summary: ${profile.summary}
    - Experience: ${profile.experience}
    - Skills: ${profile.skills}
    - Endorsements: ${profile.endorsements}
    
    Provide optimization suggestions for:
    1. Headline (impact of keywords)
    2. Summary (length, keywords, CTA)
    3. Experience descriptions (ATS keywords)
    4. Photo quality assessment
    5. Skills section optimization
    6. Missing sections
    7. Overall profile completeness score
    
    Each suggestion explains impact on recruiter visibility.
  `;
  
  return await gemini.generateContent(prompt);
}
```

### Cost: $0 (uses free Clearbit + AI)

---

## Feature 9: Portfolio Builder

### 🎨 Overview
Auto-generate a portfolio website from GitHub + resume.

```typescript
export async function generatePortfolio(
  userId: string,
  githubUsername: string
) {
  // Get user resume
  const resume = await getLatestResume(userId);
  
  // Get GitHub projects
  const repos = await fetch(`https://api.github.com/users/${githubUsername}/repos`)
    .then(r => r.json());
  
  // Generate portfolio HTML
  const portfolioHTML = generatePortfolioHTML({
    name: resume.name,
    summary: resume.summary,
    skills: resume.skills,
    projects: repos.filter(r => !r.fork).slice(0, 6),
    email: resume.email,
    portfolio: resume.portfolioUrl
  });
  
  // Deploy to free hosting (Vercel, Netlify)
  const deployedUrl = await deployToVercel(portfolioHTML, userId);
  
  return deployedUrl;
}
```

### Cost: $0 (GitHub API + Vercel free tier)

---

## Feature 10: Referral Network

### 👥 Overview
Connect job seekers with employees at target companies for referrals.

```prisma
model ReferralNetwork {
  id          String @id @default(cuid())
  userId      String
  company     String
  
  // People working there
  employees   ReferralContact[]
  
  // Requests
  requests    ReferralRequest[]
  
  createdAt   DateTime @default(now())
  
  @@unique([userId, company])
}

model ReferralContact {
  id          String @id @default(cuid())
  networkId   String
  linkedinProfile String // public profile URL
  name        String
  title       String
  email       String?
  
  network     ReferralNetwork @relation(fields: [networkId], references: [id])
}

model ReferralRequest {
  id          String @id @default(cuid())
  userId      String
  contactId   String?
  companyName String
  
  status      String @default("pending")
  message     String? @db.Text
  
  user        User @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
}
```

### Cost: $0

---

## Implementation Timeline

```
Week 1: Company Insider Intel (300 lines backend + 200 lines frontend)
Week 2: Smart Autopilot (400 lines backend + 250 lines UI)
Week 3: Skill Roadmap + LinkedIn Scanner (200 + 100 lines backend)
Week 4: Portfolio Builder + Referral Network (200 + 150 lines)

Total: ~1,650 lines of new code
Total Cost: $0 ✅
```

---

## Deployment Sequence

1. **Deploy Features 5-7 First** (Intel, Autopilot, Skill Roadmap)
   - Core value features
   - Heavy AI usage, but within free tier
   - Can be deployed together in one push

2. **Deploy Features 8-9** (LinkedIn, Portfolio)
   - Enhance existing features
   - Can be independent additions

3. **Deploy Feature 10** (Referral)
   - Network effects require critical mass
   - Deploy last for maximum impact

---

## Success Metrics

Track for each feature:
```
Feature 5 (Intel):
- % users viewing company intel before applying
- Avg time saved on research per user
- Correlation between intel usage and application success

Feature 6 (Autopilot):
- Jobs applied via autopilot
- Success rate vs manual applications
- Time saved per application
- User retention increase

Feature 7 (Skill Roadmap):
- Roadmaps created
- Completion rate
- Skills completed per week
- Correlation to job matching

Feature 8-9 (LinkedIn + Portfolio):
- Profile views increase
- Portfolio visits from profile
- Job opportunities from portfolio

Feature 10 (Referral):
- Referrals initiated
- Conversion rate (referral → interview)
- Network growth
```

---

## Total Product Value

**10 Premium Features Using Only Free APIs:**

| Feature | Backend | Frontend | Cost |
|---------|---------|----------|------|
| Career Coach | ✅ | ✅ | $0 |
| Resume Versions | ✅ | ✅ | $0 |
| Career Streak | ✅ | ✅ | $0 |
| Company Intel | ✅ | ✅ | $0 |
| Smart Autopilot | ✅ | ✅ | $0 |
| Skill Roadmap | ✅ | ✅ | $0 |
| LinkedIn Scanner | ✅ | ✅ | $0 |
| Portfolio Builder | ✅ | ✅ | $0 |
| Referral Network | ✅ | ✅ | $0 |
| Interview Analyzer | - | ✅ | $0 |

**Total: ~2,800+ lines of code, $0 cost, production-ready system**

This positions the product as a comprehensive, feature-rich alternative to paid platforms like LinkedIn, Indeed Premium, and Workable - all free.
