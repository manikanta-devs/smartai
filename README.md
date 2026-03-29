# Resume SaaS Monorepo (Phase 1)

This scaffold contains:
- Backend API (Express + TypeScript + Prisma)
- Frontend placeholder app (React + TypeScript + Vite)
- Shared package for common types

## Quick Start

1. Install dependencies:
   npm install

2. Copy env file:
   copy packages\\backend\\.env.example packages\\backend\\.env

3. Update DATABASE_URL and JWT secrets in packages\\backend\\.env

4. Generate Prisma client:
   npm run prisma:generate -w @resume-saas/backend

5. Run migrations:
   npm run prisma:migrate -w @resume-saas/backend

6. Start backend:
   npm run dev:backend

7. Optional frontend:
   npm run dev:frontend

## Auth Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me

Swagger docs: /api/docs
