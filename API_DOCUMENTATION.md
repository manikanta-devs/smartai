# API Documentation

Complete reference for SmartAI Resume Platform API endpoints.

## Base URL

```
Development:  http://localhost:5000/api
Production:   https://api.yourdomain.com/api
```

## Table of Contents

1. [Authentication](#authentication)
2. [Resume Endpoints](#resume-endpoints)
3. [Job Search](#job-search)
4. [AI Analysis](#ai-analysis)
5. [Error Handling](#error-handling)

---

## Authentication

### Register User

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Email already exists"
  }
}
```

---

### Login User

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "fullName": "John Doe"
    }
  }
}
```

---

### Logout

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Resume Endpoints

### Upload Resume

**Endpoint:** `POST /resume/upload`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request:**
```
File: resume.pdf (PDF/DOCX)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "resume-123",
    "fileName": "resume.pdf",
    "uploadedAt": "2024-03-30T12:00:00Z",
    "textContent": "Jane Doe...",
    "pageCount": 1
  }
}
```

---

### Get Resume

**Endpoint:** `GET /resume/:resumeId`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "resume-123",
    "userId": "user-123",
    "fileName": "resume.pdf",
    "textContent": "...",
    "createdAt": "2024-03-30T12:00:00Z"
  }
}
```

---

### List Resumes

**Endpoint:** `GET /resume/list`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1&limit=10&sort=createdAt&order=DESC
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "id": "resume-123",
        "fileName": "resume.pdf",
        "createdAt": "2024-03-30T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

---

## Job Search

### Search Jobs

**Endpoint:** `POST /jobs/search`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "role": "Frontend Developer",
  "platforms": ["linkedin", "indeed", "remoteok"],
  "location": "Remote",
  "salary_range": {
    "min": 100000,
    "max": 200000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job-123",
        "title": "Senior Frontend Developer",
        "company": "Tech Corp",
        "location": "Remote",
        "description": "...",
        "salary": "$150K - $200K",
        "url": "https://...",
        "platform": "LinkedIn",
        "jobType": "Full-time",
        "postedDate": "2024-03-30"
      }
    ],
    "total": 25
  }
}
```

---

## AI Analysis

### Analyze Resume

**Endpoint:** `POST /automation/analyze`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "resumeText": "Jane Doe, Senior Developer with 5 years experience...",
  "analysisType": "full"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strengths": ["Strong technical background", "Clear career progression"],
    "weaknesses": ["Limited project descriptions", "Few metrics"],
    "ats_score": 78,
    "suggestions": [
      "Add more quantifiable achievements",
      "Include specific technologies used"
    ],
    "keyword_analysis": {
      "total_keywords": 45,
      "industry_keywords": 23
    }
  }
}
```

---

### Match Resume to Job

**Endpoint:** `POST /automation/match`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "resumeText": "...",
  "jobDescription": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "match_score": 85,
    "matching_skills": ["React", "TypeScript", "Node.js"],
    "missing_skills": ["GraphQL", "Docker"],
    "fit_analysis": "Strong technical fit with good experience level",
    "recommendations": [
      "Highlight your React expertise",
      "Consider learning GraphQL"
    ]
  }
}
```

---

### Generate Cover Letter

**Endpoint:** `POST /automation/cover-letter`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "resumeText": "...",
  "jobDescription": "...",
  "companyName": "Tech Corp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coverLetter": "Dear Hiring Manager...",
    "tone": "professional"
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID` | 401 | Invalid credentials |
| `TOKEN_EXPIRED` | 401 | Token has expired |
| `NOT_AUTHORIZED` | 403 | No permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `SERVER_ERROR` | 500 | Internal server error |

### Common Errors

**Missing Authorization Header:**
```json
{
  "success": false,
  "error": {
    "message": "Authorization header missing",
    "code": "AUTH_REQUIRED"
  }
}
```

**Invalid Token:**
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired token",
    "code": "TOKEN_INVALID"
  }
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Invalid email format",
      "password": "Password too short"
    }
  }
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free Tier**: 100 requests/minute
- **Premium**: Unlimited (when available)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648732800
```

When limit exceeded:
```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "retryAfter": 60
  }
}
```

---

## Best Practices

### 1. Always Include Authorization

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/resume/list
```

### 2. Handle Errors Gracefully

```javascript
try {
  const response = await fetch('/api/resume/analyze', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await response.json();
  if (!json.success) {
    console.error(json.error.message);
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### 3. Use Appropriate HTTP Methods

- `GET`: Retrieve data
- `POST`: Create data
- `PUT`: Update data
- `DELETE`: Remove data

### 4. Validate Input

- All emails must be valid format
- Passwords must be 8+ characters
- File uploads max 10MB
- Resume text required for analysis

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "fullName": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Using Postman

1. Import the API collection (coming soon)
2. Set the base URL: `http://localhost:5000/api`
3. Use Auth tab to set Bearer token
4. Test endpoints

---

## API Examples

### Complete Flow Example

```bash
#!/bin/bash

API="http://localhost:5000/api"

# 1. Register
REGISTER=$(curl -s -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }')

# 2. Login
LOGIN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $LOGIN | jq -r '.data.accessToken')

# 3. Upload Resume
curl -s -X POST $API/resume/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@resume.pdf"

# 4. Search Jobs
curl -s -X POST $API/jobs/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Frontend Developer"
  }'
```

---

**Last Updated:** March 30, 2024  
**Version:** 1.0.0  
**Status:** Stable
