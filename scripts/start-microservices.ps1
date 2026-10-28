# Script khoi dong toan bo he thong Microservices
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  KHOI DONG HE THONG E-COMMERCE MICROSERVICES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$baseDir = "T:\ProjectTBDD"
$mvn = "$baseDir\infra\apache-maven-3.9.9\bin\mvn.cmd"

# 1. Kiem tra va bat Docker containers
Write-Host "[1/3] Kiem tra Docker containers..." -ForegroundColor Yellow
docker start ecommerce-mysql ecommerce-redis ecommerce-kafka ecommerce-elasticsearch 2>$null

# 2. Danh sach cac services
$services = @(
    @{ Name = "1. AUTH-SERVICE (Port 8083)"; Path = "$baseDir\services\auth-service" },
    @{ Name = "2. PRODUCT-SERVICE (Port 8084)"; Path = "$baseDir\services\product-service" },
    @{ Name = "3. ORDER-SERVICE (Port 8085)"; Path = "$baseDir\services\order-service" },
    @{ Name = "4. PAYMENT-SERVICE (Port 8086)"; Path = "$baseDir\services\payment-service" },
    @{ Name = "5. API-GATEWAY (Port 8080)"; Path = "$baseDir\services\api-gateway" }
)

Write-Host "[2/3] Mo cua so khoi dong tung Microservice..." -ForegroundColor Yellow
foreach ($svc in $services) {
    Write-Host " -> Dang mo $($svc.Name)..." -ForegroundColor Green
    $cmd = "cd '$($svc.Path)'; Write-Host '--- $($svc.Name) ---' -ForegroundColor Cyan; & '$mvn' spring-boot:run"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "$cmd"
    Start-Sleep -Seconds 2
}

Write-Host "[3/3] Hoan tat! 5 cua so Microservices dang duoc khoi dong." -ForegroundColor Cyan
Write-Host "Ban co the mo trinh duyet http://localhost:8082 de su dung frontend." -ForegroundColor Green

