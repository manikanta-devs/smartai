# Security & Best Practices

Comprehensive security guidelines for SmartAI Resume Platform.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [API Security](#api-security)
3. [Database Security](#database-security)
4. [File Handling](#file-handling)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Privacy](#data-privacy)
7. [Deployment Security](#deployment-security)
8. [Security Checklist](#security-checklist)

---

## Environment Variables

### ❌ DON'T

```bash
# ❌ Never commit .env files
git add .env
git commit -m "Add credentials"

# ❌ Never hardcode secrets in code
const API_KEY = "AIzaSyD...";

# ❌ Never expose secrets in logs
console.log("API Key:", apiKey);

# ❌ Never send secrets in URL
fetch(`/api/analyze?key=${API_KEY}`);
```

### ✅ DO

```bash
# ✅ Create .env.local (local only)
echo "VITE_GEMINI_API_KEY=your-key" > .env.local

# ✅ Add .env to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# ✅ Use environment variables
const apiKey = process.env.GEMINI_API_KEY;

# ✅ Set in hosting dashboard (Vercel, Railway, etc.)
# Vercel → Project Settings → Environment Variables
# Railway → Variables
# Heroku → Config Vars

# ✅ Validation
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not set");
}
```

### Environment Variable Checklist

**Backend (.env)**
```env
# ✅ Required - Never commit
NODE_ENV=production                    # development/production
GEMINI_API_KEY=your-actual-key        # From asistudio.google.com
JWT_SECRET=generate-secure-string     # 32+ chars, random

# ✅ Required but can be generic
DATABASE_URL=postgresql://...         # Connection string
JWT_ACCESS_SECRET=change-in-prod      # 32+ chars
JWT_REFRESH_SECRET=change-in-prod     # 32+ chars

# ⚠️ Optional - Never commit real values
EMAIL_SERVICE=smtp                    # gmail/sendgrid
EMAIL_USER=your-email@gmail.com      # Your email
EMAIL_PASSWORD=your-app-password     # Not real password
```

**Frontend (.env.local)**
```env
# ✅ Can be public - API URL is visible anyway
VITE_API_URL=https://api.yourdomain.com

# ✅ Required - Never hardcode
VITE_GEMINI_API_KEY=your-actual-key   # From asistudio.google.com
```

---

## API Security

### 1. Authentication

#### JWT Implementation

```typescript
// ✅ Correct JWT setup
const JWT_SECRET = process.env.JWT_SECRET;  // 32+ chars
const token = jwt.sign(
  { userId: user.id, email: user.email },
  JWT_SECRET,
  { expiresIn: "15m" }  // Short expiry
);

// ❌ Wrong
const token = jwt.sign(payload, "secret");  // Weak secret
jwt.sign(payload, secret, {});  // No expiry
```

#### Token Storage

```javascript
// ✅ Correct - localStorage (for SPAs)
localStorage.setItem("token", token);

// ✅ Use in requests
headers: {
  "Authorization": `Bearer ${token}`
}

// ❌ Wrong - Cookies with httpOnly:false
document.cookie = `token=${token}`;  // XSS vulnerability

// ✅ Better for SSR - httpOnly cookies
res.cookie("token", token, {
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: "strict",
  maxAge: 15 * 60 * 1000  // 15 minutes
});
```

### 2. Input Validation

```typescript
// ✅ Use Zod for validation
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password too short"),
  fullName: z.string().min(1, "Name required")
});

// Validate
const result = registerSchema.safeParse(data);
if (!result.success) {
  return { error: result.error.errors };
}

// ❌ Wrong - No validation
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  // Trust user input - UNSAFE!
});
```

### 3. SQL Injection Prevention

```typescript
// ✅ Correct - Use Prisma ORM (prevents SQL injection)
const user = await prisma.user.findUnique({
  where: { email: userInput.email }
});

// ❌ Wrong - String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Vulnerable to: ' OR '1'='1
```

### 4. Rate Limiting

```typescript
// ✅ Implement rate limiting
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: "Too many requests",
  skip: (req) => req.user?.isPremium,  // Skip for premium
});

app.use("/api/", limiter);

// ✅ More strict for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts per 15 min
  skipSuccessfulRequests: true
});

app.post("/api/auth/login", authLimiter, loginHandler);
```

### 5. CORS

```typescript
// ✅ Correct CORS setup
import cors from "cors";

const corsOptions = {
  origin: process.env.FRONTEND_URL,  // Only your frontend
  credentials: true,  // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
};

app.use(cors(corsOptions));

// ❌ Wrong - Allow all
app.use(cors());  // Anyone can call your API

// ❌ Wrong
app.use(cors({ origin: "*" }));  // Same as above
```

### 6. Content Security

```typescript
// ✅ Use Helmet for security headers
import helmet from "helmet";

app.use(helmet());  // Adds multiple security headers:
// - X-Frame-Options: DENY (prevent clickjacking)
// - X-Content-Type-Options: nosniff
// - Content-Security-Policy
// - X-XSS-Protection

// ✅ Disable for file uploads specifically
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// ❌ No security headers
app.post("/upload", (req, res) => {
  // No protection!
});
```

---

## Database Security

### 1. Connection Security

```typescript
// ✅ Correct
const DATABASE_URL = process.env.DATABASE_URL;  // From env
// postgresql+asyncpg://user:pass@host/db?ssl=require

// ❌ Wrong - Hardcoded
const DATABASE_URL = "postgresql://root:password@localhost/db";

// ✅ SSL required in production
DATABASE_URL=postgresql://...?sslmode=require
```

### 2. Query Security

```typescript
// ✅ Use Prisma (prevents injection)
await prisma.user.findUnique({
  where: { id: req.params.id }
});

// ❌ Wrong - String interpolation
const query = `SELECT * FROM users WHERE id = ${id}`;
// Vulnerable!
```

### 3. Password Security

```typescript
// ✅ Hash passwords with bcryptjs
import bcryptjs from "bcryptjs";

const hashedPassword = await bcryptjs.hash(password, 10);  // 10 rounds
await db.user.create({
  email,
  password: hashedPassword
});

// Verify
const isValid = await bcryptjs.compare(inputPassword, hashedPassword);
if (!isValid) {
  throw new Error("Invalid credentials");
}

// ❌ Wrong - Plaintext password
db.user.create({ email, password });

// ❌ Wrong - Too few rounds
bcryptjs.hash(password, 2);  // Too fast to brute force
```

### 4. Data Minimization

```typescript
// ✅ Only store necessary data
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    fullName
    // Don't store: IP address, browser info, etc.
  }
});

// ✅ Exclude sensitive fields when responding
await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    fullName: true
    // Exclude: password, updatedAt, etc.
  }
});

// ❌ Wrong - Return full object with password
res.json(user);  // Exposes password!
```

---

## File Handling

### 1. File Upload Security

```typescript
// ✅ Secure file upload
import multer from "multer";

const upload = multer({
  dest: "./uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF and DOCX
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

app.post("/upload", upload.single("file"), (req, res) => {
  // Validate file
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  // Validate size
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: "File too large" });
  }
  
  // Process file...
});

// ❌ Wrong - No validation
app.post("/upload", (req, res) => {
  // Could receive executable files!
});
```

### 2. File Storage

```typescript
// ✅ Secure storage
import path from "path";
import crypto from "crypto";

// Generate safe filename
const safeFilename = crypto.randomBytes(16).toString("hex") + ".pdf";
const filepath = path.join("./uploads/", safeFilename);

// ✅ Store outside webroot
// /var/app/uploads/ (not /var/www/html/uploads/)

// ❌ Wrong - Use user filename
const filepath = req.file.originalname;  // Could be ../../../etc/passwd
```

### 3. File Download Security

```typescript
// ✅ Correct file download
app.get("/resume/:id/download", async (req, res) => {
  // Check authorization
  const resume = await prisma.resume.findUnique({
    where: { id: req.params.id },
    include: { user: true }
  });
  
  if (resume.userId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized" });
  }
  
  // Download file
  res.download(resume.filePath, resume.fileName);
});

// ❌ Wrong
app.get("/download/:filename", (req, res) => {
  res.download(`./uploads/${req.params.filename}`);
  // Could download: ../../../etc/passwd
});
```

---

## Authentication & Authorization

### 1. Password Requirements

```typescript
// ✅ Strong password validation
const passwordSchema = z.string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Must include uppercase")
  .regex(/[a-z]/, "Must include lowercase")
  .regex(/[0-9]/, "Must include number")
  .regex(/[!@#$%^&*]/, "Must include special char");

// Or use password strength library
import zxcvbn from "zxcvbn";

const result = zxcvbn(password);
if (result.score < 3) {
  throw new Error("Password too weak");
}
```

### 2. Session Management

```typescript
// ✅ Proper session handling
const token = jwt.sign(
  { userId: user.id },
  JWT_SECRET,
  { expiresIn: "15m" }  // Short-lived
);

const refreshToken = jwt.sign(
  { userId: user.id },
  JWT_REFRESH_SECRET,
  { expiresIn: "7d" }  // Long-lived
);

// Store refresh token in database
await prisma.token.create({
  userId: user.id,
  token: refreshToken,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// ❌ Wrong - No refresh tokens
jwt.sign(payload, secret, { expiresIn: "365d" });
```

### 3. Authorization Middleware

```typescript
// ✅ Proper authorization check
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token" });
  }
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Use in routes
app.get("/api/resume/list", requireAuth, (req, res) => {
  // Only authenticated users
});
```

---

## Data Privacy

### 1. GDPR Compliance

```typescript
// ✅ Right to deletion
app.delete("/api/user/delete", requireAuth, async (req, res) => {
  // Delete all user data
  await prisma.resume.deleteMany({
    where: { userId: req.user.id }
  });
  
  await prisma.user.delete({
    where: { id: req.user.id }
  });
  
  res.json({ message: "Account deleted" });
});

// ✅ Data export
app.get("/api/user/export", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { resumes: true, results: true }
  });
  
  res.json(user);  // User can download their data
});
```

### 2. Data Encryption

```typescript
// ✅ Encrypt sensitive data at rest (optional)
import crypto from "crypto";

const encryptField = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return iv.toString("hex") + ":" + 
         cipher.update(text, "utf8", "hex") + 
         cipher.final("hex");
};

const decryptField = (encrypted, key) => {
  const [iv, text] = encrypted.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc", 
    key, 
    Buffer.from(iv, "hex")
  );
  return decipher.update(text, "hex", "utf8") + decipher.final("utf8");
};

// Store encrypted
await prisma.resume.create({
  data: {
    textContent: encryptField(resumeText, encryptionKey)
  }
});
```

### 3. Audit Logging

```typescript
// ✅ Log security events
const auditLog = async (userId, action, details) => {
  await prisma.auditLog.create({
    data: {
      userId,
      action,  // "LOGIN", "FILE_UPLOAD", "DATA_EXPORT"
      details,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    }
  });
};

// Log sensitive actions
auditLog(req.user.id, "TOKEN_REFRESH", { oldTokenId: token.id });
auditLog(req.user.id, "PASSWORD_CHANGE", { changedAt: new Date() });
auditLog(req.user.id, "ACCOUNT_DELETED", { permanentDelete: true });
```

---

## Deployment Security

### 1. HTTPS/TLS

```bash
# ✅ Always use HTTPS in production
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# ✅ Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === "production") {
    return res.redirect(`https://${req.get("host")}${req.url}`);
  }
  next();
});

# ❌ Never use HTTP in production
http://yourdomain.com  # Insecure!
```

### 2. Environment Isolation

```bash
# Development
NODE_ENV=development
DEBUG=true
ENABLE_LOGGING=true

# Staging
NODE_ENV=staging
DEBUG=false
ENABLE_LOGGING=true

# Production
NODE_ENV=production
DEBUG=false
ENABLE_LOGGING=false
```

### 3. Production Checklist

```bash
✅ Environment variables set (don't hardcode)
✅ HTTPS enabled with valid certificate
✅ Database backups configured
✅ Logging enabled (sent to external service)
✅ Monitoring alerts configured
✅ API rate limiting enabled
✅ CORS restricted to known domains
✅ Security headers configured (Helmet)
✅ SQL injection protection (Prisma)
✅ XSS protection enabled
✅ CSRF token on forms
✅ Dependencies updated
✅ No console.log() of sensitive data
✅ .env files in .gitignore
✅ Secrets manager for storing keys
```

---

## Security Checklist

### Before Deployment

- [ ] Review all environment variables
- [ ] Verify no secrets in code/logs
- [ ] Run security audit: `npm audit`
- [ ] Check for hardcoded credentials
- [ ] Test authentication flows
- [ ] Verify authorization on all endpoints
- [ ] Test file upload security
- [ ] CORS configured properly
- [ ] HTTPS certificate valid
- [ ] Database backups working
- [ ] Monitoring/alerting configured
- [ ] Error messages don't leak info
- [ ] Rate limiting working
- [ ] Security headers present

### Regular Maintenance

- [ ] Weekly: Review logs for suspicious activity
- [ ] Monthly: Run `npm audit` and update packages
- [ ] Monthly: Review access logs
- [ ] Quarterly: Security penetration testing
- [ ] Quarterly: Update SSL certificates
- [ ] Quarterly: Review user permissions
- [ ] Annually: Full security audit

---

## Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email: `security@smartai.dev`

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will:
- Acknowledge receipt within 24 hours
- Provide timeline for fix
- Credit you in release notes (if requested)

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0  
**Status:** Active
