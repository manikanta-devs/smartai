
# Debug test to see actual responses
$API_BASE = 'https://smartai-production-7661.up.railway.app/api'
$timestamp = (Get-Date).Ticks
$TEST_EMAIL = "debug-$timestamp@example.com"
$TEST_PASSWORD = 'TestPassword123!'
$TEST_USERNAME = "student$timestamp"

Write-Host '================================'
Write-Host 'DEBUGGING API RESPONSES'
Write-Host '================================'
Write-Host ''

# Test 1: Registration Response
Write-Host 'TEST 1: Registration' -ForegroundColor Yellow
Write-Host 'URL: ' $API_BASE/auth/register
Write-Host 'Body:' -ForegroundColor Cyan

$body = @{
    email = $TEST_EMAIL
    username = $TEST_USERNAME
    password = $TEST_PASSWORD
    firstName = 'Test'
    lastName = 'Student'
} | ConvertTo-Json

Write-Host $body
Write-Host ''

try {
    $response = Invoke-WebRequest -Uri "$API_BASE/auth/register" -Method Post `
        -Body $body -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
    
    Write-Host 'Status: ' $response.StatusCode -ForegroundColor Green
    Write-Host 'Response:' -ForegroundColor Cyan
    Write-Host $response.Content
    Write-Host ''
} catch {
    Write-Host 'Status: ' $_.Exception.Response.StatusCode -ForegroundColor Red
    Write-Host 'Error: ' $_.Exception.Message -ForegroundColor Red
    
    try {
        $ErrorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($ErrorResponse)
        $responseBody = $reader.ReadToEnd()
        Write-Host 'Response Body:' -ForegroundColor Yellow
        Write-Host $responseBody
        Write-Host ''
    } catch {
        Write-Host 'Could not read error response body'
    }
}

# Test 2: Check if API health check works
Write-Host ''
Write-Host 'TEST 2: Health Check' -ForegroundColor Yellow

$healthUrl = "$API_BASE/health"
Write-Host "URL: $healthUrl"

try {
    $response = Invoke-WebRequest -Method Get -Uri $healthUrl -UseBasicParsing -ErrorAction Stop
    Write-Host 'Status: ' $response.StatusCode -ForegroundColor Green
    Write-Host 'Response: ' $response.Content -ForegroundColor Cyan
} catch {
    Write-Host 'Could not reach health endpoint'
}

Write-Host ''

# Test 3: Try a simple GET request to verify API is responding
Write-Host ''
Write-Host 'TEST 3: API Availability' -ForegroundColor Yellow

try {
    # Try accessing a public endpoint or checking CORS
    $response = Invoke-WebRequest -Method Options -Uri "$API_BASE/auth/login" `
        -UseBasicParsing -ErrorAction Stop
    Write-Host 'API is responding to OPTIONS' -ForegroundColor Green
} catch {
    Write-Host 'Could not reach API with OPTIONS'
}

$testUrl = "https://smartai-production-7661.up.railway.app"
Write-Host ""
Write-Host "Trying base URL: $testUrl"
try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -ErrorAction Stop
    Write-Host 'Base URL status: ' $response.StatusCode -ForegroundColor Green
} catch {
    Write-Host 'Base URL status: ' $_.Exception.Response.StatusCode -ForegroundColor Yellow
}
