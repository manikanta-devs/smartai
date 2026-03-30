# 🚀 One-Click Deployment Guide

**Deploy SmartAI to mobile in 15 minutes!**

---

## Quick Summary

Your app has been prepared for deployment. We created 5 configuration files:

```
✅ Dockerfile              - Backend containerization
✅ vercel.json             - Vercel frontend config
✅ railway.toml            - Railway backend config
✅ deploy.sh/.bat          - Setup helper scripts
✅ .env.example files      - Configuration templates
```

---

## 📱 Final Result

After deployment, you'll access your app at:

```
🌐 Frontend: https://your-app.vercel.app
📱 Mobile:   Same URL in any browser
🔗 Backend:  https://your-app.railway.app/api
```

---

## ⚡ Step-by-Step Deployment (15 mins)

### STEP 1: Push to GitHub (2 minutes)

```bash
cd c:\Users\lucky\resume\resume-saas

git add Dockerfile deploy.sh deploy.bat packages/frontend/vercel.json packages/frontend/.env.example packages/backend/railway.toml

git commit -m "Add deployment configuration for Railway & Vercel"

git push origin main
```

---

### STEP 2: Deploy Backend to Railway (5 minutes)

**1. Create Railway Account**
- Visit: https://railway.app
- Sign up with GitHub (click "Sign up with GitHub")
- Click "Authorize"

**2. Create New Backend Project**
- Click "New Project"
- Select "Deploy from GitHub"
- Find and click your repo: `smartai`
- Select root directory (default)
- Railway auto-detects Node.js

**3. Add Environment Variables**
- In Railway dashboard, click "Variables"
- Add these (copy from `packages/backend/.env.example`):

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://[your-vercel-domain].vercel.app
DATABASE_URL=postgresql://[railway-generates-this]
JWT_SECRET=[generate: https://uuidgenerator.net/]
JWT_ACCESS_SECRET=[generate: https://uuidgenerator.net/]
JWT_REFRESH_SECRET=[generate: https://uuidgenerator.net/]
GEMINI_API_KEY=AIzaSy...  [your key from aistudio.google.com]
```

**4. Deploy**
- Click "Deploy"
- Wait 2-3 minutes
- Get your URL: `https://smartai-backend.railway.app`
- **SAVE THIS URL** ← You'll need it for frontend

---

### STEP 3: Deploy Frontend to Vercel (5 minutes)

**1. Create Vercel Account**
- Visit: https://vercel.com
- Click "Sign up with GitHub"
- Authorize GitHub

**2. Import Project**
- Click "Import Project"
- Select your GitHub repo: `smartai`

**3. Configure Build**
- **Project Name:** `smartai-resume`
- **Root Directory:** `packages/frontend`
- **Build Command:** `npm run build` (should auto-fill)
- **Output Directory:** `dist` (should auto-fill)

**4. Add Environment Variables**
- Click "Environment Variables"
- Add these (use your Railway backend URL):

```
VITE_API_URL=https://[your-railway-backend-url]/api
VITE_GEMINI_API_KEY=AIzaSy...  [same key as backend]
```

**5. Deploy**
- Click "Deploy"
- Wait 1-2 minutes
- Get your URL: `https://smartai-resume.vercel.app`

---

### STEP 4: Link Frontend & Backend (1 minute)

**Update Railway Variables:**
- Go back to Railway backend
- Click "Variables"
- Update `FRONTEND_URL`:
  ```
  FRONTEND_URL=https://smartai-resume.vercel.app
  ```
- Click "Save"
- Railway auto-redeploys

---

## ✅ Verify Everything Works

### Test Backend

Open in browser:
```
https://[your-railway-url]/api/auth/register
```

Should show error (that's OK - it means backend is running):
```json
{
  "success": false,
  "error": { "message": "..."}
}
```

### Test Frontend

Open in browser:
```
https://[your-vercel-url]
```

You should see login page! 🎉

### Test on Mobile

Open same Vercel URL in phone browser - works perfectly!

---

## 🎯 Configuration Files Explained

**Dockerfile** - Makes backend portable
```dockerfile
# Builds Node app, installs deps, runs TypeScript compilation
```

**vercel.json** - Tells Vercel how to build frontend
```json
{
  "builds": [...],
  "routes": [...]
}
```

**railway.toml** - Tells Railway how to build backend
```toml
[build]
cmd = "npm run build --workspace=@resume-saas/backend"
```

**.env.example files** - Templates for environment variables
```env
# Copy these values into platform dashboards
```

---

## 🆘 Troubleshooting

### "Build failed" on Railway

**Check:**
- All required env vars are set
- `GEMINI_API_KEY` is valid (starts with `AIzaSy`)
- No spaces in values

**Fix:**
- Delete and redeploy project

### "Can't connect to API" on frontend

**Check:**
- `VITE_API_URL` in Vercel ends with `/api`
- Backend URL is correct
- CORS is configured (handled automatically)

**Fix:**
- Update Vercel env var
- Redeploy frontend

### "Blank page" on Vercel

**Check:**
- Frontend built successfully (check Vercel logs)
- `npm run build` passed locally

**Fix:**
- Redeploy
- Or rebuild locally: `cd packages/frontend && npm run build`

---

## 📊 Post-Deployment

### Enable Monitoring (Optional)

**Sentry (Error Tracking)**
```
1. Sign up: https://sentry.io
2. Create new project (Node.js + React)
3. Add SENTRY_DSN to env vars
```

**Uptime Monitoring**
```
1. Use: https://betterstack.com (5 free checks)
2. Monitor both backend and frontend URLs
```

---

## 🔐 Security Notes

- ✅ `.env.example` shows what vars you need
- ✅ `.env` stays local (never pushed)
- ✅ Platform dashboards keep secrets encrypted
- ✅ No API keys in GitHub
- ✅ HTTPS used automatically

---

## 📈 Next Steps

1. **Share your app URL:** `https://smartai-resume.vercel.app`
2. **Test on mobile:** Open URL on phone
3. **Get feedback:** Share with friends
4. **Monitor:** Check Railway & Vercel dashboards
5. **Scale:** Add custom domain later

---

## 🎓 What You've Built

```
┌─────────────────┐         ┌──────────────────┐
│   Your Phone    │         │   Your Desktop   │
│                 │         │                  │
│ Browser ──────────────────── Vercel Frontend │
│                 │         │ (React App)      │
└─────────────────┘         └──────────────────┘
         │                            │
         └────────────────┬───────────┘
                          │
                    Railway Backend
                    (Express API)
                          │
                 PostgreSQL Database
                          │
                   Google Gemini AI
```

---

## ✨ Features Available

- ✅ Upload resumes (PDF/DOCX)
- ✅ AI analysis with Gemini
- ✅ Job search (mock data)
- ✅ Resume scoring
- ✅ Cover letter generation
- ✅ Interview prep
- ✅ Authentication
- ✅ Mobile responsive

---

## 💰 Cost

- **Vercel:** FREE (up to 100GB bandwidth/month)
- **Railway:** FREE tier ($5/month with credits)
- **Gemini API:** FREE (60 requests/minute)
- **PostgreSQL:** FREE on Railway
- **Total:** **$0/month** (or $5 if you exceed Railway free tier)

---

## 📞 Support

If deployment doesn't work:

1. Check backend logs: Railway dashboard
2. Check frontend logs: Vercel dashboard
3. Test locally: `npm run dev` in both packages
4. Verify env vars are set exactly as shown

---

## 🎉 Done!

Your app is now live and accessible from **any device, anywhere**!

**Mobile URL:** `https://smartai-resume.vercel.app`

Share it with friends! 🚀

---

**Deployment Date:** March 30, 2026  
**Setup Time:** ~15 minutes  
**Status:** Ready to Deploy ✅
