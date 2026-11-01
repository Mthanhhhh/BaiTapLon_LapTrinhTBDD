param([switch]$Restart,[ValidateSet('auth-service','product-service','order-service','payment-service','api-gateway')][string[]]$Service)
$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$logRoot=Join-Path $repoRoot '.tools/cloud-server'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
# One host and the existing Docker volumes remain the source of all shared data.
$privateConfig=Join-Path $repoRoot '.env.server.local'
if(-not(Test-Path -LiteralPath $privateConfig)){
 $bytes=New-Object byte[] 48
 $rng=[Security.Cryptography.RandomNumberGenerator]::Create();$rng.GetBytes($bytes);$rng.Dispose()
 [IO.File]::WriteAllText($privateConfig,'JWT_SECRET='+[Convert]::ToBase64String($bytes)+[Environment]::NewLine)
}
$allowed=@('JWT_SECRET','DB_HOST','DB_PORT','DB_USERNAME','DB_PASSWORD','REDIS_HOST','REDIS_PORT','KAFKA_SERVERS','GEMINI_API_KEY','GEMINI_MODEL','GEMINI_CONNECT_TIMEOUT_SECONDS','GEMINI_REQUEST_TIMEOUT_SECONDS')
foreach($line in Get-Content -LiteralPath $privateConfig){if($line -match '^([A-Z_]+)=(.*)$' -and $allowed -contains $Matches[1]){[Environment]::SetEnvironmentVariable($Matches[1],$Matches[2].Trim(),'Process')}}
$oauthFile=Join-Path $repoRoot 'services/auth-service/.env.local'
$oauthKeys=@('GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','FACEBOOK_GRAPH_VERSION','OAUTH_ALLOWED_REDIRECTS')
if(Test-Path -LiteralPath $oauthFile){foreach($line in Get-Content -LiteralPath $oauthFile){if($line -match '^([A-Z_]+)=(.*)$' -and $oauthKeys -contains $Matches[1]){[Environment]::SetEnvironmentVariable($Matches[1],$Matches[2].Trim().Trim('"').Trim("'"),'Process')}}}
$env:OAUTH_ALLOWED_REDIRECTS=(@($env:OAUTH_ALLOWED_REDIRECTS -split ',')+@('http://localhost:8082/oauth/callback','https://api-eshop.mtcord.io.vn/api/v1/auth/oauth/mobile/callback','https://eshop.mtcord.io.vn/oauth/callback') | Where-Object {$_} | Select-Object -Unique) -join ','
$env:PROMOTIONS_ALLOWED_ORIGINS='http://localhost:8082,http://localhost:8087,https://api-eshop.mtcord.io.vn,https://eshop.mtcord.io.vn'
$ready=$false
for($i=0;$i -lt 30;$i++){docker info --format '{{.ServerVersion}}' 2>$null | Out-Null;if($LASTEXITCODE -eq 0){$ready=$true;break};Start-Sleep -Seconds 2}
if(-not $ready){throw 'Docker Desktop is not ready. Open Docker Desktop, then run this script again.'}
foreach($container in @('ecommerce-mysql','ecommerce-redis','ecommerce-kafka','ecommerce-elasticsearch')){docker start $container | Out-Null;if($LASTEXITCODE -ne 0){throw "Could not start $container. Existing volumes were not changed."}}
$javaExe=(Get-Command java).Source
$services=@(@{Name='auth-service';Port=8083;Heap='320m'},@{Name='product-service';Port=8084;Heap='512m'},@{Name='order-service';Port=8085;Heap='512m'},@{Name='payment-service';Port=8086;Heap='320m'},@{Name='api-gateway';Port=8080;Heap='256m'})
if($Service){$services=@($services | Where-Object {$Service -contains $_.Name})}
foreach($svc in $services){
 $jar=Join-Path $repoRoot "services/$($svc.Name)/target/$($svc.Name)-0.0.1-SNAPSHOT.jar"
 if(-not(Test-Path -LiteralPath $jar)){throw "Build missing: $($svc.Name). Build its Maven package first."}
 $running=@(Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'java.exe' -and $_.CommandLine -like "*$repoRoot*" -and $_.CommandLine -like "*$($svc.Name)-0.0.1-SNAPSHOT.jar*"})
 if($running){
  if(-not $Restart){Write-Output "$($svc.Name): already running";continue}
  foreach($proc in $running){Stop-Process -Id $proc.ProcessId -Force;Wait-Process -Id $proc.ProcessId -Timeout 15 -ErrorAction SilentlyContinue}
 }
 $serviceLog=Join-Path $logRoot "$($svc.Name).log"
 $started=Start-Process -FilePath $javaExe -ArgumentList "-Xmx$($svc.Heap)",'-jar',('"'+$jar+'"'),'--server.address=127.0.0.1' -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput $serviceLog -RedirectStandardError (Join-Path $logRoot "$($svc.Name)-error.log") -PassThru
 Write-Output "$($svc.Name): starting on $($svc.Port)"
 for($i=0;$i -lt 45;$i++){
  $started.Refresh();if($started.HasExited){throw "$($svc.Name) exited during startup. See $serviceLog"}
  $booted=Select-String -LiteralPath $serviceLog -Pattern 'Started \S+ in ' -Quiet -ErrorAction SilentlyContinue
  if($booted){try{$health=Invoke-RestMethod "http://127.0.0.1:$($svc.Port)/actuator/health" -TimeoutSec 3;if($health.status -eq 'UP'){break}}catch{}}
  Start-Sleep -Seconds 2
 }
 if($i -eq 45){throw "$($svc.Name) did not become healthy. See logs in .tools/cloud-server."}
}
$tunnel=Get-Service cloudflared -ErrorAction SilentlyContinue
if($tunnel -and $tunnel.Status -ne 'Running'){Start-Service cloudflared}
Write-Output 'Server ready. Public API: https://api-eshop.mtcord.io.vn'
Write-Output 'If JWT_SECRET changed, sign in again on existing clients.'
