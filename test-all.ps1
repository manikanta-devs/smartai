# Comprehensive Test Suite for SmartAI Resume App
# Tests entire workflow from registration through job matching

$API_BASE = 'https://smartai-production-7661.up.railway.app/api'
$timestamp = (Get-Date).Ticks
$TEST_EMAIL = "test-$timestamp@example.com"
$TEST_PASSWORD = 'TestPassword123!'
$TEST_USERNAME = "student$timestamp"

Write-Host '========================================' -ForegroundColor Cyan
Write-Host 'SMARTAI COMPREHENSIVE TEST SUITE' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Test Configuration:' -ForegroundColor Yellow
Write-Host "API Base URL: $API_BASE"
Write-Host "Test User: $TEST_EMAIL"
Write-Host ''

# Track results
$passed = 0
$failed = 0

function Test-API {
    param(
        [string]$name,
        [scriptblock]$testBlock
    )
    
    try {
        & $testBlock
        $global:passed++
        Write-Host "[PASS] $name" -ForegroundColor Green
        $true
    } catch {
        $global:failed++
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        $false
    }
}

# ============================================
# 1. HEALTH CHECK
# ============================================

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '1. HEALTH CHECK' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ''

Test-API "API is online" {
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    } catch {
        $response = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    }
    if ($null -eq $response) {
        throw "API not responding"
    }
} > $null

Write-Host ''

# ============================================
# 2. AUTHENTICATION TESTS
# ============================================

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '2. AUTHENTICATION TESTS' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ''

$ACCESS_TOKEN = ""
$USER_ID = ""

Test-API "User registration" {
    $registerBody = @{
        email = $TEST_EMAIL
        username = $TEST_USERNAME
        password = $TEST_PASSWORD
        firstName = 'Test'
        lastName = 'Student'
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/register" -Method Post `
        -Body $registerBody -ContentType 'application/json' -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.data.accessToken) {
        throw "No access token returned"
    }
    
    $global:ACCESS_TOKEN = $data.data.accessToken
    $global:USER_ID = $data.data.user.id
    
    Write-Host "   Token: $($global:ACCESS_TOKEN.Substring(0, 20))..."
    Write-Host "   User ID: $($global:USER_ID)"
} > $null

Test-API "User login" {
    $loginBody = @{
        identifier = $TEST_EMAIL
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/login" -Method Post `
        -Body $loginBody -ContentType 'application/json' -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.data.accessToken) {
        throw "Login failed - no token returned"
    }
} > $null

Test-API "Get current user" {
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/me" -Method Get `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.email -ne $TEST_EMAIL) {
        throw "Email doesn't match: $($data.data.email) != $TEST_EMAIL"
    }
} > $null

Write-Host ''

# ============================================
# 3. RESUME ANALYSIS TESTS
# ============================================

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '3. RESUME ANALYSIS TESTS' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ''

$RESUME_CONTENT = @"
JOHN DOE
john@example.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 5 years building web applications using React, Node.js, and PostgreSQL.

EXPERIENCE
Senior Frontend Developer | Tech Company | 2023-Present
- Led team of 4 developers in rebuilding dashboard (40% performance improvement)
- Implemented real-time features using WebSocket

SKILLS
Frontend: React, TypeScript, JavaScript, HTML, CSS, Tailwind
Backend: Node.js, Express, Python, Django
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, AWS, Git, Linux, Agile
"@

$RESUME_ID = ""
$ATS_SCORE = 0

Test-API "Analyze resume" {
    $body = @{
        content = $RESUME_CONTENT
        fileName = "test-resume.txt"
        userId = $global:USER_ID
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/resumes/analyze" -Method Post `
        -Body $body -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.data.atsScore) {
        throw "ATS score not returned"
    }
    
    $global:RESUME_ID = $data.data.resumeId
    $global:ATS_SCORE = $data.data.atsScore
    
    Write-Host "   ATS Score: $global:ATS_SCORE/100"
    Write-Host "   Resume ID: $($global:RESUME_ID.Substring(0, 20))..."
} > $null

Test-API "ATS score is valid (30-100)" {
    if ($global:ATS_SCORE -lt 30 -or $global:ATS_SCORE -gt 100) {
        throw "Invalid ATS score: $global:ATS_SCORE"
    }
    Write-Host "   Score: $global:ATS_SCORE/100"
} > $null

Test-API "Get resume details" {
    $response = Invoke-WebRequest -Uri "$API_BASE/resumes/$global:RESUME_ID" -Method Get `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.data.id) {
        throw "Resume data not returned"
    }
} > $null

Write-Host ''

# ============================================
# 4. JOB MATCHING TESTS
# ============================================

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '4. JOB MATCHING TESTS' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ''

$JOB_DESC = @"
Full Stack Developer - Mid Level
REQUIRED: 2+ years web development, JavaScript/TypeScript, React, Node.js, PostgreSQL
NICE TO HAVE: Docker, AWS, GraphQL, Microservices, Agile
SALARY: 120k-160k
"@

Test-API "Score resume against job" {
    $body = @{
        resumeText = $RESUME_CONTENT
        jobDescription = $JOB_DESC
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/jobs/score" -Method Post `
        -Body $body -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($null -eq $data.data.overallScore) {
        throw "Overall score not returned"
    }
    
    Write-Host "   Overall Match: $($data.data.overallScore)/100"
    
    if ($data.data.matchedKeywords -and $data.data.matchedKeywords.Count -gt 0) {
        $keywords = $data.data.matchedKeywords -join ', '
        if ($keywords.Length -gt 60) {
            $keywords = $keywords.Substring(0, 60) + "..."
        }
        Write-Host "   Keywords: $keywords"
    }
} > $null

Test-API "Get job recommendations" {
    $response = Invoke-WebRequest -Uri "$API_BASE/jobs?limit=5" -Method Get `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    $count = 0
    if ($data.data -is [array]) {
        $count = $data.data.Count
    } elseif ($null -ne $data.data) {
        $count = 1
    }
    
    Write-Host "   Jobs: $count available"
} > $null

Write-Host ''

# ============================================
# 5. RESUME REWRITING TESTS
# ============================================

Write-Host '========================================' -ForegroundColor Yellow
Write-Host '5. RESUME REWRITING TESTS' -ForegroundColor Yellow
Write-Host '========================================' -ForegroundColor Yellow
Write-Host ''

Test-API "Rewrite resume for job" {
    $body = @{
        resumeText = $RESUME_CONTENT
        jobDescription = $JOB_DESC
        targetRole = "Full Stack Developer"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$API_BASE/resumes/rewrite" -Method Post `
        -Body $body -ContentType 'application/json' `
        -Headers @{ Authorization = "Bearer $global:ACCESS_TOKEN" } -UseBasicParsing
    
    $data = $response.Content | ConvertFrom-Json
    
    if (-not $data.data.rewrittenResume) {
        throw "Rewritten resume not returned"
    }
    
    $length = $data.data.rewrittenResume.Length
    Write-Host "   Generated: $length characters"
} > $null

Write-Host ''

# ============================================
# 6. ERROR HANDLING TESTS
# ============================================

Write-Host "6️⃣  ERROR HANDLING TESTS" -ForegroundColor Yellow
Write-Host ""

Test-API "Rejects missing authentication" {
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/resumes" -Method Get -UseBasicParsing -ErrorAction Stop
        throw "Should have been rejected (got status $($response.StatusCode))"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 'Unauthorized') {
            # Expected
        } else {
            throw "Got unexpected status: $($_.Exception.Response.StatusCode)"
        }
    }
}

Test-API "Rejects invalid token" {
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/resumes" -Method Get `
            -Headers @{ Authorization = "Bearer invalid-token-xyz" } `
            -UseBasicParsing -ErrorAction Stop
        throw "Should have been rejected"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 'Unauthorized') {
            # Expected
        } else {
            throw "Got unexpected status: $($_.Exception.Response.StatusCode)"
        }
    }
}

Write-Host ""

# ============================================
# TEST SUMMARY
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 TEST SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$total = $results.passed + $results.failed
$rate = if ($total -gt 0) { [math]::Round(($results.passed / $total) * 100, 1) } else { 0 }

Write-Host "Total Tests: $total"
Write-Host "✅ Passed: $($results.passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($results.failed)" -ForegroundColor Red
Write-Host "Success Rate: $rate%" -ForegroundColor Cyan
Write-Host ""

# Failed test details
if ($results.failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $results.tests | Where-Object { $_.status -eq "FAIL" } | ForEach-Object {
        Write-Host "  ❌ $($_.name)" -ForegroundColor Red
        Write-Host "     Error: $($_.error)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Performance
if ($results.tests.Count -gt 0) {
    $avgDuration = ($results.tests | Measure-Object -Property duration -Average).Average
    $slowest = $results.tests | Sort-Object -Property duration -Descending | Select-Object -First 1
    
    Write-Host "⏱️  Performance:" -ForegroundColor Cyan
    Write-Host "Average test time: $($avgDuration.ToString('F0'))ms"
    Write-Host "Slowest test: $($slowest.name) ($($slowest.duration.ToString('F0'))ms)"
    Write-Host ""
}

# Final status
if ($results.failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your SmartAI Resume App is working correctly!" -ForegroundColor Green
} else {
    Write-Host "⚠️  $($results.failed) tests failed. Review above for details." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
