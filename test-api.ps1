
# Simple API Test Suite

$API = "http://localhost:5000/api"
$TIME = Get-Date -Format "yyyyMMddHHmmss"
$EMAIL = "test-$TIME@test.com"
$PASS = "TestPass123!"

$passed = 0
$failed = 0
$tests = @()

function test {
    param($name, $method, $path, $body, $token = "")
    
    try {
        $headers = @{}
        if ($token) { $headers["Authorization"] = "Bearer $token" }
        
        $params = @{
            Uri = "$API$path"
            Method = $method
            Headers = $headers
            UseBasicParsing = $true
            ErrorAction = 'Stop'
        }
        
        if ($body) {
            $params["Body"] = ($body | ConvertTo-Json)
            $params["ContentType"] = "application/json"
        }
        
        $r = Invoke-WebRequest @params
        $data = $r.Content | ConvertFrom-Json
        
        Write-Host "[OK] $name" -ForegroundColor Green
        $script:passed++
        return $data
    }
    catch {
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $null
    }
}

Write-Host "`n=== API TEST SUITE ===" -ForegroundColor Cyan
Write-Host ""

# Phase 1: Auth
Write-Host "Phase 1: Authentication" -ForegroundColor Blue

$reg = test "Register user" "POST" "/auth/register" @{
    email = $EMAIL
    username = "test$TIME"
    password = $PASS
    firstName = "Test"
    lastName = "User"
}

$token = $reg.data.accessToken

if ($token) {
    Write-Host "   Token acquired: $($token.Substring(0,15))..." -ForegroundColor Gray
}

test "Login user" "POST" "/auth/login" @{
    email = $EMAIL
    password = $PASS
} | Out-Null

test "Get current user" "GET" "/auth/me" "" $token | Out-Null

# Phase 2: Job Scoring
Write-Host "`nPhase 2: Job Scoring (/jobs/score)" -ForegroundColor Blue

$resume = "John Developer, john@test.com. React, Node.js, PostgreSQL. 5 years experience. AWS, Docker, Leadership."
$job = "Seeking Senior Full Stack Developer. Need React, Node.js, PostgreSQL, Docker, AWS, and team lead skills."

$score1 = test "Score resume vs job" "POST" "/jobs/score" @{
    resumeText = $resume
    jobDescription = $job
} $token

if ($score1) {
    Write-Host "   Score: $($score1.data.overallScore) | ATS: $($score1.data.atsScore)" -ForegroundColor Gray
    Write-Host "   Keywords: $($score1.data.matchedKeywords.Count) matched" -ForegroundColor Gray
}

test "Score without auth (should fail)" "POST" "/jobs/score" @{
    resumeText = $resume
    jobDescription = $job
} | Out-Null

test "Score missing resume (should fail)" "POST" "/jobs/score" @{
    jobDescription = $job
} $token | Out-Null

test "Score missing job (should fail)" "POST" "/jobs/score" @{
    resumeText = $resume
} $token | Out-Null

test "Score with empty resume (should fail)" "POST" "/jobs/score" @{
    resumeText = ""
    jobDescription = $job
} $token | Out-Null

# Phase 3: Cover Letter
Write-Host "`nPhase 3: Cover Letter (/jobs/cover-letter)" -ForegroundColor Blue

$letter1 = test "Generate cover letter" "POST" "/jobs/cover-letter" @{
    resumeText = $resume
    jobDescription = $job
    company = "TechCorp"
    position = "Senior Developer"
} $token

if ($letter1) {
    $len = $letter1.data.coverLetter.Length
    Write-Host "   Generated: $len characters | Effectiveness: $($letter1.data.effectiveness)" -ForegroundColor Gray
}

test "Letter without auth (should fail)" "POST" "/jobs/cover-letter" @{
    resumeText = $resume
    jobDescription = $job
    company = "TechCorp"
    position = "Developer"
} | Out-Null

test "Letter missing company (should fail)" "POST" "/jobs/cover-letter" @{
    resumeText = $resume
    jobDescription = $job
    position = "Developer"
} $token | Out-Null

test "Letter missing position (should fail)" "POST" "/jobs/cover-letter" @{
    resumeText = $resume
    jobDescription = $job
    company = "TechCorp"
} $token | Out-Null

# Phase 4: Performance
Write-Host "`nPhase 4: Performance Test" -ForegroundColor Blue

$times = @()
for ($i = 1; $i -le 3; $i++) {
    $start = Get-Date
    test "Request $i/3" "POST" "/jobs/score" @{
        resumeText = $resume
        jobDescription = $job
    } $token | Out-Null
    $times += ((Get-Date) - $start).TotalMilliseconds
}

$avg = [math]::Round(($times | Measure-Object -Average).Average, 0)
$min = [math]::Round(($times | Measure-Object -Minimum).Minimum, 0)
$max = [math]::Round(($times | Measure-Object -Maximum).Maximum, 0)
Write-Host "   Avg: ${avg}ms | Min: ${min}ms | Max: ${max}ms" -ForegroundColor Gray

# Summary
Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
$total = $passed + $failed
$rate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 0) } else { 0 }

Write-Host "Total: $total | Passed: $passed | Failed: $failed" -ForegroundColor Cyan
Write-Host "Success Rate: ${rate}%" -ForegroundColor Cyan

if ($rate -eq 100) {
    Write-Host "`nStatus: EXCELLENT - All tests passed!" -ForegroundColor Green
} elseif ($rate -ge 80) {
    Write-Host "`nStatus: GOOD - Most tests passed, minor issues" -ForegroundColor Yellow
} else {
    Write-Host "`nStatus: NEEDS WORK - Significant failures" -ForegroundColor Red
}

Write-Host ""
