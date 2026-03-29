# Resume SaaS - Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd packages/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

### 3. Done!

The app will automatically proxy API calls to `http://localhost:5000`.

---

## What's Included

### Pages
- 🏠 **Landing Page** - Hero, features, pricing, FAQ
- 📝 **Register** - Create new account (fixed UI with proper contrast)
- 🔐 **Login** - Sign in with email/password
- 📊 **Dashboard** - Main app experience
- 📄 **Resume Upload** - Drag-and-drop file upload
- 📈 **Analysis Results** - ATS score, recommendations
- 💼 **Job Matcher** - Find matching jobs
- 🎓 **Skill Gap** - Learning resources
- 👤 **Profile Page** - User settings

### Components
- **Button** - Primary & secondary buttons
- **Input** - Form inputs with validation
- **Textarea** - Multi-line text input
- **Header** - Navigation bar
- **ProtectedRoute** - Guards auth-required pages

### Features
- ✅ User authentication (JWT)
- ✅ Protected routes
- ✅ Form validation (Zod)
- ✅ Error handling with toast notifications
- ✅ Loading states
- ✅ Responsive design
- ✅ Dark/light mode ready

---

## Development

### Scripts

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # Check TypeScript errors
npm run lint       # Run ESLint
npm run lint:fix   # Fix linting issues
```

### File Structure

```
packages/frontend/src/
├── components/
│   ├── Button.tsx          # Reusable button
│   ├── Input.tsx           # Form input
│   ├── Textarea.tsx        # Text area
│   ├── Header.tsx          # Navigation
│   ├── ProtectedRoute.tsx  # Auth guard
│   └── index.ts            # Exports
├── pages/
│   ├── LandingPage.tsx     # Home page
│   ├── LoginPage.tsx       # Sign in
│   ├── RegisterPage.tsx    # Sign up (fixed UI)
│   ├── DashboardPage.tsx   # Main app
│   ├── ResumeDetailPage.tsx
│   ├── JobsPage.tsx
│   └── ProfilePage.tsx
├── lib/
│   ├── api.ts             # Axios instance
│   └── utils.ts           # Helper functions
├── store/
│   └── auth.ts            # Zustand auth store
├── main.tsx               # App entry
├── App.tsx                # Router setup
└── index.css              # Global styles
```

---

## API Configuration

### API Base URL

In `src/lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### Adding Authorization

All requests automatically include the JWT token:

```typescript
// In auth.ts store
const token = useAuthStore((state) => state.accessToken);

if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
```

---

## Authentication Flow

### 1. User Registers

```
RegisterPage → POST /api/auth/register
  ↓
Auto-login with credentials
  ↓
Store token in Zustand
  ↓
Redirect to Dashboard
```

### 2. User Logs In

```
LoginPage → POST /api/auth/login
  ↓
Receive accessToken & refreshToken
  ↓
Store in Zustand (volatile) + localStorage (persistent)
  ↓
Redirect to Dashboard
```

### 3. Protected Routes

```
ProtectedRoute → Check token
  ↓
Token exists? → Show page
Token expired? → Refresh token
No token? → Redirect to login
```

---

## Troubleshooting

### Issue: "Cannot GET /api/auth/register"

Backend not running!

```bash
# Start backend
cd packages/backend
npm run dev
```

Backend should run on `http://localhost:5000`.

### Issue: "CORS error when calling API"

Backend CORS not configured for `http://localhost:5173`.

Check `packages/backend/.env`:
```env
FRONTEND_URL="http://localhost:5173"
CLIENT_ORIGIN="http://localhost:5173"
```

### Issue: "Form has poor contrast - text unreadable"

✅ **FIXED!** RegisterPage now has:
- ✅ White background card
- ✅ Dark text on light background
- ✅ Proper label styling
- ✅ Error message visibility
- ✅ Focus states for accessibility

### Issue: "Token expired - 401 error"

Automatic refresh should work. If not:

```typescript
// In api.ts - add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: useAuthStore.getState().refreshToken
        });
        
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Issue: Tailwind CSS not applying

```bash
# Rebuild Tailwind
npm run build
npx tailwindcss -i src/index.css -o dist/output.css
```

### Issue: TypeScript errors in editor

```bash
# Generate types
npm run type-check
```

---

## Styling

### Theme Colors

```css
/* Tailwind config */
Primary: blue-600
Secondary: purple-600
Success: green-600
Error: red-600
Background: white/gray-50
Text: gray-900/gray-600
```

### Adding New Styles

1. Use Tailwind classes in JSX
2. Or add CSS in `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.custom-button {
  @apply px-4 py-2 rounded-lg font-semibold;
}
```

---

## Performance Tips

### 1. Lazy Load Routes

```typescript
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<div>Loading...</div>}>
  <DashboardPage />
</Suspense>
```

### 2. Memoize Components

```typescript
import { memo } from 'react';

export const Button = memo(({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
));
```

### 3. Optimize Images

```typescript
// Use next-gen formats
<img src="image.webp" alt="description" />

// Or use optimization library
import { Image } from 'react-image-compression';
```

### 4. Monitor Bundle Size

```bash
# Analyze bundle
npm install -D webpack-bundle-analyzer

# Build & analyze
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

---

## Testing

### Unit Tests (Jest)

```bash
npm test
npm run test:watch
```

Example test:

```typescript
// src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button label="Click me" />);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Example:

```typescript
import { test, expect } from '@playwright/test';

test('can register new user', async ({ page }) => {
  await page.goto('http://localhost:5173/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Create Account")');
  await page.waitForURL('/dashboard');
});
```

---

## Building for Production

### 1. Build App

```bash
npm run build
```

Creates optimized `dist/` folder.

### 2. Preview Build

```bash
npm run preview
```

Test production build locally.

### 3. Deploy

Option A - Vercel (recommended):
```bash
npm install -g vercel
vercel
```

Option B - Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

Option C - Docker:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

---

## Environment Variables

### Development (`.env.local`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Resume Analyzer
```

### Production (`.env.production`)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Resume Analyzer
```

Access in code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5173 in use | `npx vite --port 3000` |
| CORS error | Check backend FRONTEND_URL |
| 404 on page refresh | Configure vite.config.ts for SPA |
| Large bundle | Import only needed libraries |
| Slow dev server | `npm run build` and preview |

---

## Next Steps

1. ✅ Register an account
2. ✅ Upload a resume
3. ✅ View analysis results
4. ✅ Try AI features
5. ✅ Deploy to production

---

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Axios Client](https://axios-http.com/)

---

**Questions?** Check BACKEND_SETUP.md or DATABASE_SETUP.md for related issues.

