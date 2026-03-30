# Deployment Guide - Step by Step

Complete guide to deploy SmartAI to production (accessible on mobile and web).

## 📋 Prerequisites

- GitHub account (you have this ✅)
- Vercel account (free - https://vercel.com)
- Railway account (free - https://railway.app)
- Gemini API Key (you have this ✅)

---

## 🚀 Deployment Steps

### Step 1: Create Free Vercel Account (2 minutes)

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel access to your GitHub
5. Done! ✅

### Step 2: Deploy Frontend to Vercel (5 minutes)

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Search for and click your **smartai** repository
4. Click **"Import"**
5. Configure project:
   - **Framework**: Vite
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. Scroll down to **"Environment Variables"**
7. Add these variables:
   ```
   VITE_API_URL = https://smartai-backend.railway.app/api
   VITE_GEMINI_API_KEY = AIzaSy... (your actual key)
   ```
8. Click **"Deploy"** button
9. Wait 2-3 minutes for build
10. Get your URL: **`https://smartai-***.vercel.app`** ✅

---

### Step 3: Create Free Railway Account (2 minutes)

1. Go to **https://railway.app**
2. Click **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Railway access
5. Done! ✅

### Step 4: Deploy Backend to Railway (5 minutes)

1. Go to **https://railway.app/dashboard**
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your **smartai** repository
4. Choose **"Deploy Now"** for backend
5. Railway will ask for environment variables:

   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://...  (Railway creates this automatically)
   GEMINI_API_KEY=AIzaSy... (your actual key)
   JWT_SECRET=generate-secure-32-char-random-string-here
   JWT_ACCESS_SECRET=generate-another-32-char-random-string
   JWT_REFRESH_SECRET=generate-another-32-char-random-string
   FRONTEND_URL=https://smartai-***.vercel.app
   ```

6. Click **"Deploy"** button
7. Wait 3-5 minutes for build and deployment
8. Get your URL from Railway dashboard: **`https://smartai-backend.railway.app`** ✅

---

### Step 5: Connect Frontend to Backend

**Update Vercel environment variables:**

1. Go to **Vercel Dashboard** → **smartai** project
2. Click **"Settings"** → **"Environment Variables"**
3. Update **`VITE_API_URL`** to your Railway backend URL:
   ```
   VITE_API_URL = https://smartai-backend.railway.app
   ```
4. Click **"Save"**
5. Go to **"Deployments"** tab
6. Click the most recent deployment
7. Click **"Redeploy"** button
8. Wait for rebuild (2-3 minutes)
9. Done! ✅

---

## ✅ Your Application is Live!

### Access URLs

```
📱 Mobile & Web: https://smartai-***.vercel.app
🔌 API Backend: https://smartai-backend.railway.app
```

### Test It

1. **On Mobile:**
   - Open browser
   - Go to: `https://smartai-***.vercel.app`
   - Sign up and test features

2. **Check Backend:**
   - In terminal: `curl https://smartai-backend.railway.app/api/auth/register`
   - Should get response (not error)

---

## 🔄 Updates & Redeployment

### Automatic Deployment (Recommended)

Every time you push to GitHub, Vercel and Railway automatically redeploy:

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✅ Both Vercel and Railway automatically redeploy!
```

### Manual Redeployment

**Vercel:**
- Dashboard → Deployments → Click latest → "Redeploy"

**Railway:**
- Dashboard → Deployments → Click latest → "Redeploy"

---

## 📊 Monitoring

### View Logs

**Vercel Logs:**
1. Vercel Dashboard → Project → "Logs"
2. Check for errors

**Railway Logs:**
1. Railway Dashboard → Project → "Logs"
2. Check for errors

### Check Status

**Vercel Status:** https://vercel.com/status
**Railway Status:** https://status.railway.app

---

## 🆘 Troubleshooting Deployment

### Frontend build fails

```bash
# Check build locally first
cd packages/frontend
npm run build

# Check for errors in output
# Fix any errors then push to git
git push origin main
```

### Backend won't start

```bash
# Check logs in Railway
# Common issues:
# 1. DATABASE_URL not set
# 2. GEMINI_API_KEY not set
# 3. Port already in use

# Update environment variables in Railway dashboard
```

### Frontend can't connect to backend

```bash
# Issue: VITE_API_URL incorrect
# Fix:
# 1. Get correct Railway URL from dashboard
# 2. Update in Vercel environment variables
# 3. Redeploy Vercel
```

### CORS errors

```bash
# Issue: Frontend URL not in backend CORS
# Fix:
# 1. In Railway, add FRONTEND_URL environment variable
# 2. Set it to: https://smartai-***.vercel.app
# 3. Redeploy Railway backend
```

---

## 💡 Pro Tips

### 1. Generate Secure Strings

```bash
# For JWT secrets, use random string generator
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output and use in Railway environment variables
```

### 2. Monitor Costs

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Railway**: Free tier includes $5/month free credits
- **Both**: More than enough for hobby projects

### 3. Custom Domain (Optional)

**Add custom domain to Vercel:**
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records (Vercel provides instructions)

---

## 🎯 Summary

| Step | Time | Status |
|------|------|--------|
| 1. Create Vercel Account | 2 min | ⏳ Pending |
| 2. Deploy Frontend | 5 min | ⏳ Pending |
| 3. Create Railway Account | 2 min | ⏳ Pending |
| 4. Deploy Backend | 5 min | ⏳ Pending |
| 5. Connect Services | 2 min | ⏳ Pending |
| **Total** | **16 min** | ⏳ Pending |

**After these steps: ✅ Live on web and mobile!**

---

## 🚀 Next Steps

1. Follow steps above
2. Test on mobile: Open deployed URL in phone browser
3. Share with friends: Send them the URL
4. Monitor: Check Vercel/Railway dashboards for issues

---

**Need help on any step? Let me know the step number!**

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0  
**Estimated Time to Live:** 20 minutes
