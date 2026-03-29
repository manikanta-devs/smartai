# Database Setup Guide

## Quick Start (SQLite - Development)

The app is pre-configured to use SQLite for development. No setup required!

```bash
cd packages/backend

# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Start the backend
npm run dev
```

SQLite will create a `dev.db` file automatically. Perfect for testing!

---

## PostgreSQL Setup (Production)

When you're ready to deploy, follow these steps:

### 1. Install PostgreSQL

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Run installer, remember the password
- Verify: `psql --version`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql terminal:
CREATE DATABASE resume_saas;
CREATE USER resume_user WITH PASSWORD 'secure_password';
ALTER ROLE resume_user SET client_encoding TO 'utf8';
ALTER ROLE resume_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE resume_user SET default_transaction_deferrable TO on;
ALTER ROLE resume_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE resume_saas TO resume_user;
\q
```

### 3. Update `.env` for PostgreSQL

```env
DATABASE_URL="postgresql://resume_user:secure_password@localhost:5432/resume_saas?schema=public"
```

### 4. Run Migrations

```bash
cd packages/backend
npx prisma migrate dev --name init
```

### 5. Verify Connection

```bash
# Open Prisma Studio to view database
npx prisma studio

# This opens: http://localhost:5555
```

---

## Troubleshooting

### "Cannot connect to database at localhost:5432"

**Solution 1: PostgreSQL not running**
```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

**Solution 2: Wrong credentials**
- Check your `DATABASE_URL` in `.env`
- Verify password is correct
- Ensure database exists: `psql -U postgres -l`

**Solution 3: Port already in use**
```bash
# Windows
netstat -ano | findstr :5432

# macOS/Linux
lsof -i :5432

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # macOS/Linux
```

### "Prisma migrations failed"

```bash
# Reset database (WARNING: deletes all data!)
npx prisma migrate reset

# Or manually:
# 1. Drop the database
# 2. Create it again
# 3. Run migrations

psql -U postgres -c "DROP DATABASE resume_saas;"
psql -U postgres -c "CREATE DATABASE resume_saas;"
npx prisma migrate deploy
```

### "P1001: Can't reach database server"

Check that:
- ✅ PostgreSQL service is running
- ✅ Correct host/port in DATABASE_URL
- ✅ Firewall isn't blocking port 5432
- ✅ Username/password is correct

---

## Prisma Commands

```bash
# View schema visually
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (DEV ONLY!)
npx prisma migrate reset

# Seed database (optional)
npx prisma db seed
```

---

## Database Schema

```prisma
// User
- id (UUID, PK)
- email (String, Unique)
- username (String, Unique)
- passwordHash (String)
- firstName (String?)
- lastName (String?)
- role (String)
- createdAt (DateTime)
- updatedAt (DateTime)

// Resume
- id (UUID, PK)
- userId (UUID, FK)
- fileName (String)
- fileUrl (String)
- parsedData (Json)
- analysisResult (Json?)
- atsScore (Int?)
- createdAt (DateTime)

// RefreshToken
- id (UUID, PK)
- userId (UUID, FK)
- tokenHash (String)
- expiresAt (DateTime)
- createdAt (DateTime)
```

---

## Backup & Restore

### PostgreSQL Backup

```bash
# Backup
pg_dump -U postgres resume_saas > backup.sql

# Restore
psql -U postgres resume_saas < backup.sql
```

### SQLite Backup

```bash
# Just copy the file!
cp dev.db dev.db.backup
```

---

## Performance Tips

1. **Add Indexes** (for large datasets):
```prisma
model Resume {
  id String @id @default(cuid())
  userId String
  
  @@index([userId])
  @@index([createdAt])
}
```

2. **Enable Query Logging**:
```env
# In .env
DATABASE_URL="postgresql://user:pass@localhost/db?schema=public"
DEBUG="prisma:*"
```

3. **Connection Pooling** (production):
```
Use PgBouncer or connection pooling service
```

---

**Need Help?** 
- Check Prisma docs: https://www.prisma.io/docs/
- See error messages in console closely
- Review `.env` configuration
