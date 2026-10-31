param([string]$ConfigFile = '')
$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path $PSScriptRoot -Parent
if (-not $ConfigFile) { $ConfigFile = Join-Path $repositoryRoot 'services/auth-service/.env.local' }
if (-not (Test-Path -LiteralPath $ConfigFile)) { throw 'Copy services/auth-service/.env.example to .env.local and enter your OAuth credentials first.' }
$allowedNames = @('GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','FACEBOOK_APP_ID','FACEBOOK_APP_SECRET','FACEBOOK_GRAPH_VERSION','OAUTH_ALLOWED_REDIRECTS')
foreach ($line in Get-Content -LiteralPath $ConfigFile) {
    if ($line -match '^\s*([A-Z_]+)\s*=(.*)$' -and $allowedNames -contains $Matches[1]) {
        $value = $Matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($Matches[1], $value, 'Process')
    }
}
$listener = Get-NetTCPConnection -State Listen -LocalPort 8083 -ErrorAction SilentlyContinue
if ($listener) {
    $runningAuth = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener[0].OwningProcess)"
    if ($runningAuth.CommandLine -notlike '*auth-service*') { throw 'Port 8083 belongs to another application; auth-service was not stopped.' }
    Stop-Process -Id $runningAuth.ProcessId -Force
    Wait-Process -Id $runningAuth.ProcessId -Timeout 15 -ErrorAction SilentlyContinue
}
$maven = Join-Path $repositoryRoot 'infra/apache-maven-3.9.9/bin/mvn.cmd'
$pom = Join-Path $repositoryRoot 'services/auth-service/pom.xml'
& $maven -f $pom package -q
if ($LASTEXITCODE -ne 0) { throw 'Auth-service build/tests failed.' }
$logFolder = Join-Path $repositoryRoot '.tools'
New-Item -ItemType Directory -Path $logFolder -Force | Out-Null
$jar = Join-Path $repositoryRoot 'services/auth-service/target/auth-service-0.0.1-SNAPSHOT.jar'
Start-Process -FilePath (Get-Command java).Source -ArgumentList '-jar', $jar -WorkingDirectory $repositoryRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logFolder 'auth-oauth.log') -RedirectStandardError (Join-Path $logFolder 'auth-oauth-error.log')
Write-Host 'Auth-service is starting on port 8083. Credentials were not printed. Ensure MySQL and API Gateway are running.'
