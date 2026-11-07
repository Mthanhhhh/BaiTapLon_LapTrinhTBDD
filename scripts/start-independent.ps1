param([string]$EnvironmentFile='.env.independent.local',[string]$PublicApiUrl='https://api-eshop.mtcord.io.vn',[int]$Port=8080)
$ErrorActionPreference='Stop'
$env:COMPOSE_PARALLEL_LIMIT='1'
$root=Split-Path $PSScriptRoot -Parent
Set-Location $root
$EnvironmentFile=$ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($EnvironmentFile)
if (-not (Test-Path -LiteralPath $EnvironmentFile)) {
 $template=Get-Content (Join-Path $root 'infra/independent/environment.example') -Raw
 foreach($name in @('JWT_SECRET','INTERNAL_SERVICE_TOKEN','AUTH_DB_PASSWORD','AUTH_ROOT_PASSWORD','PRODUCT_DB_PASSWORD','PRODUCT_ROOT_PASSWORD','ORDER_DB_PASSWORD','ORDER_ROOT_PASSWORD','PAYMENT_DB_PASSWORD','PAYMENT_ROOT_PASSWORD')) {
  $bytes=New-Object byte[] 48
  $random=[System.Security.Cryptography.RandomNumberGenerator]::Create()
  $random.GetBytes($bytes);$random.Dispose()
  $secret=[Convert]::ToBase64String($bytes)
  $template=$template.Replace("$name=REPLACE_WITH_RANDOM_48_CHARACTER_SECRET","$name=$secret")
 }
 $empty=(Join-Path $root 'infra/independent/empty-bootstrap').Replace('\','/')
 $template=$template -replace '(?m)^MIGRATION_DATA_DIR=.*',"MIGRATION_DATA_DIR=$empty"
 $template=$template -replace '(?m)^PUBLIC_PORT=.*',"PUBLIC_PORT=$Port"
 $template=$template -replace '(?m)^PUBLIC_API_URL=.*',"PUBLIC_API_URL=$PublicApiUrl"
 [System.IO.File]::WriteAllText($EnvironmentFile,$template,(New-Object System.Text.UTF8Encoding($false)))
 Write-Host 'Created private environment file with distinct random credentials.'
}
& py -3 (Join-Path $PSScriptRoot 'setup-monitoring.py') --env $EnvironmentFile
if ($LASTEXITCODE -ne 0) { throw 'Monitoring credentials setup failed.' }
& docker compose --env-file $EnvironmentFile -f infra/independent/compose.yml up -d --build --wait --wait-timeout 420 --scale product-service=2 --scale order-service=2 --scale api-gateway=2
if($LASTEXITCODE -ne 0){throw 'Startup failed; inspect docker compose logs.'}
