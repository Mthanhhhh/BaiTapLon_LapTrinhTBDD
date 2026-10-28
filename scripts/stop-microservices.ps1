# Script dung toan bo Microservices
Write-Host "Dang dung cac tien trinh Microservices tren cong 8080, 8083, 8084, 8085, 8086..." -ForegroundColor Yellow

$ports = @(8080, 8083, 8084, 8085, 8086)
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host "Dung tien trinh PID $pidToKill tren cong $port..." -ForegroundColor Red
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "Da dung toan bo Microservices!" -ForegroundColor Green

