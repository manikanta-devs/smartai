# DETAILED TESTER - COMPREHENSIVE TEST SUITE

$API_BASE = "http://localhost:5000/api"
$TIMESTAMP = Get-Date -Format "yyyyMMddHHmmss"
$TEST_EMAIL = "tester-$TIMESTAMP@test.com"
$TEST_USERNAME = "tester$TIMESTAMP"
$TEST_PASSWORD = "TestPassword123!"

# Color codes
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$RESET = "`e[0m"

$results = @{
    passed = 0
    failed = 0
    warnings = @()
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [object]$body,
        [hashtable]$headers = @{},
        [scriptblock]$validator = $null
    )
    
    $start = Get-Date
    try {
        $url = "$API_BASE$endpoint"
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($body) {
            $params['Body'] = ($body | ConvertTo-Json -Depth 10)
            $params['ContentType'] = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        $duration = (Get-Date) - $start
        $data = $response.Content | ConvertFrom-Json
        
        # Run validator if provided
        if ($validator) {
            & $validator $response $data
        }
        
        $results.passed++
        $results.tests += @{
            name = $name
            status = "PASS"
            duration = $duration.TotalMilliseconds
            statusCode = $response.StatusCode
        }
        
        Write-Host "${GREEN}✓${RESET} $name (${BLUE}${response.StatusCode}${RESET})" -ForegroundColor Green
        return $data
        
    } catch {
        $duration = (Get-Date) - $start
        $results.failed++
        $statusCode = $_.Exception.Response.StatusCode.value__ 
        
        $results.tests += @{
            name = $name
            status = "FAIL"
            duration = $duration.TotalMilliseconds
            statusCode = $statusCode
            error = $_.Exception.Message
        }
        
        Write-Host "${RED}✗${RESET} $name (${YELLOW}${statusCode}${RESET}): $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n$BLUE========================================$RESET"
Write-Host "$BLUE DETAILED BACKEND TEST SUITE $RESET"
Write-Host "$BLUE========================================$RESET`n"

# ============================================
# PHASE 1: AUTHENTICATION
# ============================================
Write-Host "$BLUE[PHASE 1] Authentication$RESET`n"

# Test 1: Register
$registerResp = Test-Endpoint `
    -name "Register new user" `
    -method "POST" `
    -endpoint "/auth/register" `
    -body @{
        email = $TEST_EMAIL
        username = $TEST_USERNAME
        password = $TEST_PASSWORD
        firstName = "Test"
        lastName = "User"
    }

$accessToken = $registerResp.data.accessToken
$userId = $registerResp.data.user.id

if ($accessToken) {
    Write-Host "   ${GREEN}→ Got access token: $($accessToken.Substring(0, 20))...${RESET}"
    Write-Host "   ${GREEN}→ User ID: $userId${RESET}"
}

# Test 2: Login
$loginResp = Test-Endpoint `
    -name "Login with credentials" `
    -method "POST" `
    -endpoint "/auth/login" `
    -body @{
        identifier = $TEST_EMAIL
        password = $TEST_PASSWORD
    }

# Test 3: Get current user
Test-Endpoint `
    -name "Get current user profile" `
    -method "GET" `
    -endpoint "/auth/me" `
    -headers @{ Authorization = "Bearer $accessToken" }

# ============================================
# PHASE 2: NEW JOB SCORING ENDPOINT
# ============================================
Write-Host "`n$BLUE[PHASE 2] Job Scoring Endpoint (/jobs/score)$RESET`n"

$testResume = @"
JOHN DEVELOPER
john@example.com | (555) 123-4567
linkedin.com/in/johndeveloper

EXPERIENCE
Senior Software Engineer | TechCorp | 2021-Present
- Architected React applications serving 100K+ users
- Led team of 5 engineers
- Reduced API response time by 40%

SKILLS
- React, TypeScript, Node.js, PostgreSQL, Docker, AWS
- Full Stack Development
- Team Leadership
"@

$testJobDesc = @"
Senior Full Stack Developer Position

We're looking for a Senior Full Stack Developer with:
- 3+ years React experience
- Strong Node.js backend skills
- Experience with PostgreSQL databases
- Docker and AWS knowledge
- Team mentoring abilities

Responsibilities:
- Build scalable web applications
- Lead architecture decisions
- Mentor junior developers
- Collaborate cross-functionally
"@

# Test 1: Score with valid data
Write-Host "${YELLOW}Test 1: Scoring with valid resume${RESET}"
$scoreResp = Test-Endpoint `
    -name "Score resume against job" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
    } `
    -validator {
        param($response, $data)
        if (-not $data.data.overallScore) {
            throw "Missing overallScore in response"
        }
        if (-not $data.data.matchedKeywords) {
            throw "Missing matchedKeywords in response"
        }
    }

if ($scoreResp) {
    Write-Host "   ${GREEN}→ Overall Score: $($scoreResp.data.overallScore)${RESET}"
    Write-Host "   ${GREEN}→ ATS Score: $($scoreResp.data.atsScore)${RESET}"
    Write-Host "   ${GREEN}→ Matched Keywords: $($scoreResp.data.matchedKeywords | ConvertTo-Json)${RESET}"
    if ($scoreResp.data.recommendations) {
        Write-Host "   ${GREEN}→ Recommendations: $($scoreResp.data.recommendations[0])...${RESET}"
    }
}

# Test 2: Missing authentication
Write-Host "`n${YELLOW}Test 2: Missing authentication token${RESET}"
Test-Endpoint `
    -name "Score without auth (should fail)" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
    }

# Test 3: Missing resume text
Write-Host "`n${YELLOW}Test 3: Missing required field (resumeText)${RESET}"
Test-Endpoint `
    -name "Score without resumeText (should fail)" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        jobDescription = $testJobDesc
    }

# Test 4: Missing job description
Write-Host "`n${YELLOW}Test 4: Missing required field (jobDescription)${RESET}"
Test-Endpoint `
    -name "Score without jobDescription (should fail)" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $testResume
    }

# Test 5: Invalid data type
Write-Host "`n${YELLOW}Test 5: Invalid data types${RESET}"
Test-Endpoint `
    -name "Score with numeric types (should fail)" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = 12345
        jobDescription = 67890
    }

# ============================================
# PHASE 3: COVER LETTER GENERATION ENDPOINT
# ============================================
Write-Host "`n$BLUE[PHASE 3] Cover Letter Endpoint (/jobs/cover-letter)$RESET`n"

# Test 1: Generate cover letter
Write-Host "${YELLOW}Test 1: Generate with valid data${RESET}"
$letterResp = Test-Endpoint `
    -name "Generate cover letter" `
    -method "POST" `
    -endpoint "/jobs/cover-letter" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
        company = "TechCorp Innovations"
        position = "Senior Full Stack Developer"
    } `
    -validator {
        param($response, $data)
        if (-not $data.data.coverLetter) {
            throw "Missing coverLetter in response"
        }
        if ($data.data.coverLetter.Length -lt 100) {
            throw "Cover letter too short: $($data.data.coverLetter.Length) chars"
        }
    }

if ($letterResp) {
    $letterPreview = $letterResp.data.coverLetter.Substring(0, [Math]::Min(100, $letterResp.data.coverLetter.Length))
    Write-Host "   ${GREEN}→ Letter generated (length: $($letterResp.data.coverLetter.Length) chars)${RESET}"
    Write-Host "   ${GREEN}→ Effectiveness: $($letterResp.data.effectiveness)${RESET}"
    Write-Host "   ${GREEN}→ Preview: $letterPreview...${RESET}"
}

# Test 2: Missing authentication
Write-Host "`n${YELLOW}Test 2: Missing authentication${RESET}"
Test-Endpoint `
    -name "Generate letter without auth (should fail)" `
    -method "POST" `
    -endpoint "/jobs/cover-letter" `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
        company = "TechCorp"
        position = "Developer"
    }

# Test 3: Missing required fields
Write-Host "`n${YELLOW}Test 3: Missing required fields$(RESET)"
foreach ($field in @("resumeText", "jobDescription", "company", "position")) {
    $body = @{
        resumeText = $testResume
        jobDescription = $testJobDesc
        company = "TechCorp"
        position = "Developer"
    }
    $body.Remove($field)
    
    Test-Endpoint `
        -name "Generate without $field (should fail)" `
        -method "POST" `
        -endpoint "/jobs/cover-letter" `
        -headers @{ Authorization = "Bearer $accessToken" } `
        -body $body
}

# ============================================
# PHASE 4: EDGE CASES & STRESS TESTS
# ============================================
Write-Host "`n$BLUE[PHASE 4] Edge Cases & Stress Tests$RESET`n"

# Test 1: Very long resume
Write-Host "${YELLOW}Test 1: Very long resume text${RESET}"
$longResume = $testResume + ("`n" * 500 + "Additional Experience: " + ("TEST " * 1000))
Test-Endpoint `
    -name "Score with 15KB resume" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $longResume
        jobDescription = $testJobDesc
    }

# Test 2: Empty strings
Write-Host "`n${YELLOW}Test 2: Empty string values${RESET}"
Test-Endpoint `
    -name "Score with empty resume" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = ""
        jobDescription = $testJobDesc
    }

# Test 3: Special characters
Write-Host "`n${YELLOW}Test 3: Special characters in input${RESET}"
$specialResume = @"
Name: José García-López
Email: josé@email.com
Skills: C++, C#, Java, Node.js, Python, Rust, Go
Experience: Built APIs using €-based payment systems, worked with 中文 documentation
"@

Test-Endpoint `
    -name "Score with special characters/unicode" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $specialResume
        jobDescription = "International company needs multilingual developer with €uro payments"
    }

# Test 4: Invalid token
Write-Host "`n${YELLOW}Test 4: Invalid authentication token${RESET}"
Test-Endpoint `
    -name "Score with invalid token" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer invalid_token_12345" } `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
    }

# ============================================
# PHASE 5: PERFORMANCE TESTS
# ============================================
Write-Host "`n$BLUE[PHASE 5] Performance Analysis$RESET`n"

# Warm up
Test-Endpoint `
    -name "[Warmup] First request" `
    -method "POST" `
    -endpoint "/jobs/score" `
    -headers @{ Authorization = "Bearer $accessToken" } `
    -body @{
        resumeText = $testResume
        jobDescription = $testJobDesc
    } | Out-Null

# Run performance tests
$perfTimes = @()
for ($i = 1; $i -le 5; $i++) {
    $start = Get-Date
    Test-Endpoint `
        -name "[Perf] Request $i" `
        -method "POST" `
        -endpoint "/jobs/score" `
        -headers @{ Authorization = "Bearer $accessToken" } `
        -body @{
            resumeText = $testResume
            jobDescription = "Need React + Node developer for startup"
        } | Out-Null
    
    $perfTimes += ((Get-Date) - $start).TotalMilliseconds
}

Write-Host "`n${BLUE}Performance Summary:${RESET}"
Write-Host "   Average response time: $([math]::Round(($perfTimes | Measure-Object -Average).Average, 0))ms"
Write-Host "   Min response time: $([math]::Round(($perfTimes | Measure-Object -Minimum).Minimum, 0))ms"
Write-Host "   Max response time: $([math]::Round(($perfTimes | Measure-Object -Maximum).Maximum, 0))ms"

# ============================================
# SUMMARY
# ============================================
Write-Host "`n$BLUE========================================$RESET"
Write-Host "$BLUE TEST SUMMARY $RESET"
Write-Host "$BLUE========================================$RESET`n"

$total = $results.passed + $results.failed
$successRate = [math]::Round(($results.passed / $total) * 100, 1)

Write-Host "Total Tests: $total"
Write-Host "${GREEN}Passed: $($results.passed)${RESET}"
Write-Host "${RED}Failed: $($results.failed)${RESET}"
Write-Host "Success Rate: $successRate%`n"

if ($results.failed -gt 0) {
    Write-Host "${YELLOW}Failed Tests:${RESET}"
    foreach ($test in $results.tests | Where-Object { $_.status -eq "FAIL" }) {
        Write-Host "   ${RED}✗${RESET} $($test.name) (Status: $($test.statusCode))"
        if ($test.error) {
            Write-Host "      Error: $($test.error)"
        }
    }
}

Write-Host "`n${BLUE}Feedback Summary:${RESET}"
if ($successRate -eq 100) {
    Write-Host "${GREEN}✓ All tests passed! API is functioning correctly.${RESET}"
} elseif ($successRate -ge 80) {
    Write-Host "${YELLOW}⚠ Most tests passed, but there are some issues to address.${RESET}"
} else {
    Write-Host "${RED}✗ Significant issues detected. Review errors above.${RESET}"
}

Write-Host "`nTest suite completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
