# Test script to login and create a customer
$baseUrl = "http://localhost:3001/api"

# Login to get token
$loginData = @{
    email = "admin@sanvi-machinery.com"
    password = "Admin123!"
} | ConvertTo-Json

Write-Host "Logging in..."
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.access_token

Write-Host "Login successful, token received: $($token.Substring(0, 20))..."

# Create a customer
$customerData = @{
    companyName = "Test Company Ltd"
    contactPerson = "John Doe"
    email = "john.doe@testcompany.com"
    phone = "+91-9876543210"
    address = "123 Test Street"
    city = "Mumbai"
    state = "Maharashtra"
    country = "India"
    postalCode = "400001"
    customerType = "SMALL_BUSINESS"
    creditLimit = 100000
    paymentTerms = "NET_30"
} | ConvertTo-Json

Write-Host "Creating customer..."
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$customerResponse = Invoke-RestMethod -Uri "$baseUrl/customers" -Method POST -Body $customerData -Headers $headers

Write-Host "Customer created successfully!"
Write-Host "Customer ID: $($customerResponse.id)"
Write-Host "Customer ID matches CUID pattern: $($customerResponse.id -match '^c[a-z0-9]{24}$')"
Write-Host "Full response:"
$customerResponse | ConvertTo-Json -Depth 3