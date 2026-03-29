# 🏃 Quick Reference - Resume SaaS

## ⚡ Essential Commands

### Start Everything

```bash
# Terminal 1 - Backend
cd packages/backend && npm run dev     # http://localhost:5000

# Terminal 2 - Frontend  
cd packages/frontend && npm run dev    # http://localhost:5173

# Terminal 3 - Database GUI
cd packages/backend && npx prisma studio  # http://localhost:5555
```

### Setup New Project

```bash
# Backend
cd packages/backend
npm install
npx prisma migrate dev --name init
npm run dev

# Frontend
cd packages/frontend
npm install
npm run dev
```

---

## 🗄️ Database

### SQLite (Development)
```env
DATABASE_URL="file:./dev.db"
```
✅ Works instantly, no setup needed

### PostgreSQL (Production)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/resume_saas?schema=public"
```

### Prisma Commands
```bash
npx prisma studio              # GUI database view
npx prisma migrate dev         # Create migration
npx prisma migrate reset       # ☠️ DELETE ALL DATA
npx prisma generate           # Generate types
npx prisma format             # Format schema
```

---

## 🖥️ Backend

### Port
- Default: **http://localhost:5000**
- Change: Update `PORT` in `.env`

### API Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### JWT Token Header
```
Authorization: Bearer eyJhbGc...
```

---

## 🎨 Frontend

### Port
- Default: **http://localhost:5173**  
- Change: `npm run dev -- --port 3000`

### Add New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `App.tsx`:
```tsx
import NewPage from './pages/NewPage';

// In Routes:
<Route path="/new" element={<NewPage />} />
```

### Form Example
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

type Form = z.infer<typeof schema>;

export default function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}
    </form>
  );
}
```

---

## 🔐 Authentication

### Register Endpoint
```
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login Endpoint
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Protected Routes
```tsx
import { ProtectedRoute } from '@/components';

<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| "Port in use" | Change port: `npm run dev -- --port 3000` |
| "Cannot connect to API" | Check backend running on 5000 |
| "CORS error" | Add FRONTEND_URL to backend .env |
| "Database connection failed" | SQLite needs no setup; PostgreSQL needs installation |
| "401 Unauthorized" | Token missing or expired; refresh token |
| "Form contrast bad" | ✅ Already fixed in RegisterPage |

---

## 📦 Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="min-32-chars"
JWT_REFRESH_SECRET="min-32-chars"
FRONTEND_URL="http://localhost:5173"
```

### Frontend `.env.local`
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Resume Analyzer
```

---

## 🧪 Testing

```bash
# Backend
cd packages/backend
npm test                    # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Frontend
cd packages/frontend
npm test                   # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # End-to-end tests
```

---

## 🛠️ Debugging

### Backend Logs
```bash
# Enable debug logs
DEBUG="prisma:*" npm run dev

# Check error in console
```

### Frontend Console
```bash
# In browser DevTools
console.log('Debug:', data);

# API calls
Network tab → XHR requests
```

### Database Issues
```bash
# Prisma Studio GUI
npx prisma studio

# Or SQL query
psql -U postgres -d resume_saas
SELECT * FROM "User";
```

---

## 📊 Performance

### Build Frontend
```bash
npm run build      # Creates optimized dist/
npm run preview    # Test production build
```

### Monitor Bundle Size
```bash
npm install -D webpack-bundle-analyzer
# Analyze after build
```

### Database Optimization
```prisma
// Add indexes to schema.prisma
@@index([userId])
@@index([createdAt])
```

---

## 🚀 Deployment

### Quick Deploy Commands

**Railway**
```bash
npm install -g @railway/cli
railway link
railway up
```

**Vercel (Frontend)**
```bash
npm install -g vercel
vercel  # Follow prompts
```

**Docker**
```bash
docker-compose up --build
```

---

## 📝 Git Workflow

```bash
# Create branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"

# Push
git push origin feature/new-feature

# Create PR on GitHub
```

---

## 🔑 Keys to Remember

- 🔐 Never commit `.env` (use `.env.example`)
- 📦 Run `npm install` after git pull
- 🔄 Restart servers if you change `.env`
- 💾 Commit migrations in `prisma/migrations/`
- 🧪 Write tests for critical features
- 📚 Update `package.json` when adding dependencies
- 🔒 Use strong JWT secrets in production

---

## 📚 Full Guides

- **Full Database Guide**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Full Backend Guide**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **Full Frontend Guide**: [FRONTEND_SETUP.md](./FRONTEND_SETUP.md)
- **Complete Setup**: [SETUP.md](./SETUP.md)

---

**For quick help** - refer to this sheet  
**For detailed info** - check the full guides above

