# Resume SaaS - Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd packages/backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default SQLite setup will work immediately:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Run Migrations

```bash
npx prisma migrate dev --name init
```

This creates tables automatically in `dev.db`.

### 4. Start Backend

```bash
npm run dev
```

Backend runs on: **http://localhost:5000**

---

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

```bash
# Solution: Reinstall Prisma
npm install @prisma/client
npx prisma generate
```

### Issue: "P1001: Can't reach database server"

```bash
# For SQLite (file:./dev.db) - should work automatically
# For PostgreSQL - ensure it's running:

# Windows
net start postgresql-x64-14

# macOS  
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Verify connection
psql -U postgres -d resume_saas
```

### Issue: "Port 5000 already in use"

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: API responding with "401 Unauthorized"

- ❌ Missing JWT token in header
- ✅ Add to your request:
```
Authorization: Bearer <your_token>
```

### Issue: "Email already registered" for new email

```bash
# SQLite: Delete dev.db and restart
rm dev.db
npm run dev

# PostgreSQL: Reset database
npx prisma migrate reset
```

---

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: {
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "createdAt": "2025-03-28T10:00:00Z"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: {
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

#### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response: {
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## Development Tools

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens: **http://localhost:5555**

View/edit database visually without SQL!

### View Database Logs

```env
# In .env, add:
DATABASE_URL="... schema=public"
DEBUG="prisma:*"
```

### Generate Types

```bash
npx prisma generate
```

Creates TypeScript types for your models automatically.

---

## File Structure

```
packages/backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── common/
│   │   ├── middleware/        # Auth, error handling
│   │   └── utils/             # JWT, helpers
│   ├── config/
│   │   ├── env.ts            # Environment variables
│   │   ├── prisma.ts         # Prisma client setup
│   │   └── swagger.ts        # API docs config
│   └── modules/
│       ├── auth/             # Auth routes/services
│       ├── resume/           # Resume routes/services
│       ├── jobs/             # Job routes/services
│       └── users/            # User routes/services
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration history
├── tests/
│   └── auth.routes.test.ts   # Test examples
├── .env                       # Environment config (gitignored)
├── .env.example              # Example config
└── package.json
```

---

## Common Commands

```bash
# Development
npm run dev              # Start with hot reload
npm run build           # Build for production
npm start               # Run production build

# Database
npx prisma studio      # Open database GUI
npx prisma generate    # Generate Prisma Client
npx prisma migrate dev --name add_field  # Create migration
npx prisma migrate deploy               # Apply migrations
npx prisma db push                      # Sync schema (dev only)

# Testing
npm test                # Run Jest tests
npm run test:watch     # Watch mode

# Linting
npm run lint           # Run ESLint
npm run lint:fix       # Fix issues
```

---

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL or SQLite connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### Optional
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development/production
- `DEBUG` - Enable debug logging
- `FRONTEND_URL` - For CORS
- `OPENAI_API_KEY` - For AI features

---

## Production Deployment

### 1. Use PostgreSQL

Update `.env`:
```
DATABASE_URL="postgresql://user:password@prod-db.com/resume_saas?schema=public"
NODE_ENV=production
```

### 2. Generate Secret Keys

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Build & Start

```bash
npm run build
npm start
```

### 5. Set Up Reverse Proxy (Nginx)

```nginx
upstream backend {
  server localhost:5000;
}

server {
  listen 80;
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
```

### Using Postman

1. Import collection from `api-docs/postman-collection.json`
2. Set environment variables
3. Run requests in sequence

### Using Thunder Client (VS Code)

Install Thunder Client extension and use provided requests.

---

## Monitoring & Logs

### View Logs

```bash
# All logs
pm2 logs

# Specific app
pm2 logs backend

# Clear logs
pm2 flush
```

### Monitor Performance

```bash
# CPU/Memory usage
pm2 monit

# Dashboard
pm2 web
# Opens: http://localhost:9615
```

---

## Support

**Need help?**

1. Check [DATABASE_SETUP.md](./DATABASE_SETUP.md)
2. Review error message in console
3. Check `.env` configuration
4. See [Prisma Error Reference](https://www.prisma.io/docs/reference/error-reference)

