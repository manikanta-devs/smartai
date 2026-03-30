# Quick Integration Guide - Rejection Analyzer

## 1️⃣ Add Route to Frontend Router

In your main routing file (e.g., `src/App.tsx` or similar):

```tsx
import { RejectionAnalysisPage } from "./pages/RejectionAnalysisPage";

// In your route configuration:
<Route path="/analyze-rejection" element={<RejectionAnalysisPage />} />
```

Or if using React Router v6:

```tsx
import { Routes, Route } from "react-router-dom";
import { RejectionAnalysisPage } from "./pages/RejectionAnalysisPage";

<Routes>
  {/* ... other routes ... */}
  <Route path="/analyze-rejection" element={<RejectionAnalysisPage />} />
</Routes>
```

## 2️⃣ Add Navigation Link

Add a link to your navigation or header:

```tsx
<Link to="/analyze-rejection" className="nav-link">
  🔥 Why I Got Rejected
</Link>
```

Or as a button in your dashboard:

```tsx
<button onClick={() => navigate("/analyze-rejection")}>
  🔥 Analyze Why I Got Rejected
</button>
```

## 3️⃣ Embed Component Anywhere

Use the `RejectAnalyzer` component directly:

```tsx
import { RejectAnalyzer } from "@/components/RejectAnalyzer";

export function MyDashboard() {
  const [resumeText, setResumeText] = useState("");

  return (
    <div>
      <h1>Dashboard</h1>
      <RejectAnalyzer resumeText={resumeText} />
    </div>
  );
}
```

## 4️⃣ Pass Resume Automatically

If user has uploaded resume, pass it automatically:

```tsx
import { useQuery } from "@tanstack/react-query";
import { RejectAnalyzer } from "@/components/RejectAnalyzer";

export function AnalysisPage() {
  const { data: resume } = useQuery({
    queryKey: ["latest-resume"],
    queryFn: () => api.get("/api/resumes/latest"),
  });

  return (
    <RejectAnalyzer 
      resumeText={resume?.data?.analysis?.fullText || ""} 
    />
  );
}
```

## 5️⃣ Save Analysis Results (Optional)

To save analyses to database:

```tsx
// In rejectionAnalyzer.service.ts - add save function:
export async function saveAnalysis(
  userId: string,
  analysis: RejectionAnalysisResult,
  jobDescription: string
): Promise<void> {
  await prisma.rejectionAnalysis.create({
    data: {
      userId,
      jobDescription,
      matchScore: analysis.matchScore,
      verdict: analysis.verdict,
      analysisData: analysis, // Store full analysis as JSON
      createdAt: new Date(),
    },
  });
}

// In frontend component:
const saveAnalysis = async () => {
  await api.post("/api/analysis/rejection/save", {
    analysis: result,
    jobDescription: jobDesc,
  });
  alert("Analysis saved!");
};

// Add button in ResultScreen:
<button onClick={saveAnalysis}>💾 Save This Analysis</button>
```

## 6️⃣ Show Analysis History (Optional)

Create a new page to show past analyses:

```tsx
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function AnalysisHistory() {
  const { data: analyses } = useQuery({
    queryKey: ["analysis-history"],
    queryFn: () => api.get("/api/analysis/rejection/history"),
  });

  return (
    <div>
      <h2>Your Analyses</h2>
      {analyses?.data?.map((analysis, i) => (
        <div key={i} style={{ border: "1px solid gray", padding: "16px", marginBottom: "12px" }}>
          <div>Score: {analysis.matchScore}%</div>
          <div>{analysis.verdict}</div>
          <div>{new Date(analysis.createdAt).toLocaleDateString()}</div>
          <button onClick={() => viewAnalysis(analysis.id)}>View</button>
        </div>
      ))}
    </div>
  );
}
```

## 7️⃣ Database Schema (If Saving)

Add to `schema.prisma`:

```prisma
model RejectionAnalysis {
  id                String   @id @default(cuid())
  userId            String
  jobDescription    String   @db.Text
  matchScore        Int
  verdict           String   // "Selected", "Maybe", "Not Selected"
  rejectionReasons  Json     // Store array of reasons
  keywordGaps       Json     // Store keyword gaps
  analysisData      Json     // Store full analysis
  userAction        String?  // "apply", "upskill", "easier_role", "none"
  feedback          Int?     // 1-5 star rating
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

// Add to User model:
model User {
  // ... existing fields ...
  rejectionAnalyses RejectionAnalysis[]
}
```

Then run migration:

```bash
npx prisma migrate dev --name add_rejection_analysis
```

## 8️⃣ Create API Endpoint to Get History

```tsx
// In rejection.routes.ts:
router.get(
  "/rejection/history",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const analyses = await prisma.rejectionAnalysis.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.json(createSuccessResponse({ analyses }));
  })
);

router.post(
  "/rejection/save",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { analysis, jobDescription } = req.body;

    const saved = await prisma.rejectionAnalysis.create({
      data: {
        userId: req.user!.id,
        jobDescription,
        matchScore: analysis.matchScore,
        verdict: analysis.verdict,
        rejectionReasons: analysis.rejectionReasons,
        keywordGaps: analysis.keywordGaps,
        analysisData: analysis,
      },
    });

    return res.json(createSuccessResponse({ id: saved.id }));
  })
);
```

## Testing Checklist

- [ ] Route is accessible at `/analyze-rejection`
- [ ] Navigation link appears in menu/dashboard
- [ ] Component loads with empty resume state
- [ ] Can input resume text in left panel
- [ ] Can input job description in analyzer
- [ ] Analysis button calls API
- [ ] Response displays all 4 tabs correctly
- [ ] Verdict banner shows correct color (green/orange/red)
- [ ] ATS warning appears when appropriate
- [ ] Keyword comparison shows correct badges
- [ ] Fix options are ranked properly
- [ ] Reset button returns to input screen
- [ ] Copy button works for rewritten summary

## Deployment Checklist

- [ ] `rejectionAnalyzer.service.ts` is in backend
- [ ] `rejection.routes.ts` is registered in app.ts
- [ ] `RejectAnalyzer.tsx` component is exported
- [ ] `RejectionAnalysisPage.tsx` is in routes
- [ ] Environment variables are set:
  - `GEMINI_API_KEY`
  - `AUTOMATION_ENABLED=true`
- [ ] Backend compiled successfully
- [ ] Frontend compiled successfully
- [ ] Tests pass (if any)
- [ ] Ready to deploy! 🚀

---

**Need help?** Check `REJECTION_ANALYZER_DOCS.md` for complete documentation.
