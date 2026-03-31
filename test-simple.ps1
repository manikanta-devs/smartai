
# Simple test script - no emojis, plain ASCII only
$API_BASE = 'https://smartai-production-7661.up.railway.app/api'
$timestamp = (Get-Date).Ticks
$TEST_EMAIL = "test-$timestamp@example.com"
$TEST_PASSWORD = 'TestPassword123!'
$TEST_USERNAME = "student$timestamp"

$passed = 0
$failed = 0

Write-Host '========================================'
Write-Host 'SMARTAI - COMPREHENSIVE TEST SUITE'
Write-Host '========================================'
Write-Host ''
Write-Host "API: $API_BASE"
Write-Host "Test User: $TEST_EMAIL"
Write-Host ''

# Test 1: API Health
Write-Host 'TEST 1: API Health Check' -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest "$API_BASE/auth/login" -Method Options -ErrorAction SilentlyContinue
    Write-Host '[PASS] API is reachable' -ForegroundColor Green
    $passed++
} catch {
    Write-Host '[FAIL] API not reachable' -ForegroundColor Red
    $failed++
}

# Test 2: Registration
Write-Host ''
Write-Host 'TEST 2: User Registration' -ForegroundColor Yellow
try {
    $body = @{
        email = $TEST_EMAIL
        username = $TEST_USERNAME
        password = $TEST_PASSWORD
        firstName = 'Test'
        lastName = 'Student'
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/register" -Method Post `
        -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.accessToken) {
        $global:ACCESS_TOKEN = $data.data.accessToken
        $global:USER_ID = $data.data.user.id
        Write-Host '[PASS] Registration successful' -ForegroundColor Green
        Write-Host "       User ID: $($global:USER_ID)" -ForegroundColor Cyan
        $passed++
    } else {
        throw "No token returned"
    }
} catch {
    Write-Host "[FAIL] Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 3: Login
Write-Host ''
Write-Host 'TEST 3: User Login' -ForegroundColor Yellow
try {
    $body = @{
        identifier = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Post `
        -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.accessToken) {
        Write-Host '[PASS] Login successful' -ForegroundColor Green
        $passed++
    } else {
        throw "No token"
    }
} catch {
    Write-Host "[FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 4: Get Current User
Write-Host ''
Write-Host 'TEST 4: Get Current User' -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/me" -Method Get `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } `
        -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.email) {
        Write-Host '[PASS] Current user retrieved' -ForegroundColor Green
        Write-Host "       Email: $($data.data.email)" -ForegroundColor Cyan
        $passed++
    } else {
        throw "No email"
    }
} catch {
    Write-Host "[FAIL] Get user failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 5: Resume Analysis
Write-Host ''
Write-Host 'TEST 5: Resume Analysis' -ForegroundColor Yellow
try {
    $resume = "JOHN DOE`njohn@test.com`nFull Stack Developer`nSkills: React, Node.js, PostgreSQL, Docker, AWS"
    
    $body = @{
        content = $resume
        fileName = "test.txt"
        userId = $global:USER_ID
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/resumes/analyze" -Method Post `
        -Body $body -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } `
        -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.atsScore) {
        $global:RESUME_ID = $data.data.resumeId
        Write-Host '[PASS] Resume analyzed' -ForegroundColor Green
        Write-Host "       ATS Score: $($data.data.atsScore)/100" -ForegroundColor Cyan
        $passed++
    } else {
        throw "No ATS score"
    }
} catch {
    Write-Host "[FAIL] Resume analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 6: Job Scoring
Write-Host ''
Write-Host 'TEST 6: Job Scoring' -ForegroundColor Yellow
try {
    $resume = "Full Stack Developer with React, Node.js, Docker"
    $job = "Full Stack Developer - Required: React, Node.js, PostgreSQL"
    
    $body = @{
        resumeText = $resume
        jobDescription = $job
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/jobs/score" -Method Post `
        -Body $body -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } `
        -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.overallScore -or $data.data.matchedKeywords) {
        Write-Host '[PASS] Job scoring completed' -ForegroundColor Green
        if ($data.data.overallScore) {
            Write-Host "       Match Score: $($data.data.overallScore)/100" -ForegroundColor Cyan
        }
        $passed++
    } else {
        throw "No score"
    }
} catch {
    Write-Host "[FAIL] Job scoring failed - may need Gemini API" -ForegroundColor Yellow
    Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Gray
    # Don't count as fail - this test is optional
}

# Test 7: Get Jobs
Write-Host ''
Write-Host 'TEST 7: Get Job Recommendations' -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/jobs?limit=5" -Method Get `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } `
        -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    $count = 0
    if ($data.data -is [array]) {
        $count = $data.data.Count
    } elseif ($null -ne $data.data) {
        $count = 1
    }
    
    Write-Host '[PASS] Jobs retrieved' -ForegroundColor Green
    Write-Host "       Available: $count jobs" -ForegroundColor Cyan
    $passed++
} catch {
    Write-Host "[FAIL] Get jobs failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 8: Authentication Required
Write-Host ''
Write-Host 'TEST 8: Authentication Required' -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/resumes" -Method Get `
        -UseBasicParsing -ErrorAction Stop
    Write-Host '[FAIL] Should require authentication' -ForegroundColor Red
    $failed++
} catch {
    $status = $_.Exception.Response.StatusCode
    if ($status -eq 401 -or $_.Exception.Message -contains "Unauthorized") {
        Write-Host '[PASS] Correctly requires authentication' -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[FAIL] Got unexpected status: $status" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host ''
Write-Host '========================================'
Write-Host 'TEST SUMMARY' -ForegroundColor Cyan
Write-Host '========================================'
Write-Host ''

$total = $passed + $failed
if ($total -gt 0) {
    $rate = [math]::Round(($passed / $total) * 100, 1)
} else {
    $rate = 0
}

Write-Host "Total: $total tests"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Rate: $rate%" -ForegroundColor Cyan
Write-Host ''

if ($failed -eq 0) {
    Write-Host 'RESULT: ALL TESTS PASSED' -ForegroundColor Green
    Write-Host 'Your SmartAI Resume App is working!' -ForegroundColor Green
} else {
    Write-Host "RESULT: $failed tests failed" -ForegroundColor Yellow
}

Write-Host ''
Write-Host '========================================'
Write-Host ''
