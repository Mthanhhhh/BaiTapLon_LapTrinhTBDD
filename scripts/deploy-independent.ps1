param([Parameter(Mandatory=$true)][string]$EnvironmentFile,[switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$env:COMPOSE_PARALLEL_LIMIT = '1'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$environmentPath = (Resolve-Path -LiteralPath $EnvironmentFile).Path
$sha = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot identify release commit.' }
if ($env:DEPLOY_EXPECTED_SHA -and $sha -ne $env:DEPLOY_EXPECTED_SHA) { throw 'Checkout SHA does not match the CI-approved release.' }
if ((& git status --porcelain --untracked-files=no)) { throw 'Tracked files are modified; deploy a clean checkout.' }
$stateDirectory = 'T:/ProjectTBDD/.tools/deployment'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$lock = [System.IO.File]::Open((Join-Path $stateDirectory 'deploy.lock'),[System.IO.FileMode]::OpenOrCreate,[System.IO.FileAccess]::ReadWrite,[System.IO.FileShare]::None)
$stateFile = Join-Path $stateDirectory 'current.json'
$previous = if (Test-Path -LiteralPath $stateFile) { Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json } else { $null }
$composeArgs = @('compose','--env-file',$environmentPath,'-f',(Join-Path $root 'infra/independent/compose.yml'))
function Invoke-Compose([string[]]$Arguments) {
    & docker @composeArgs @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed ($LASTEXITCODE)." }
}
function Read-Setting([string]$Name) {
    $line = Get-Content -LiteralPath $environmentPath | Where-Object { $_ -match ('^' + [regex]::Escape($Name) + '=') } | Select-Object -Last 1
    if ($line) { return ($line -replace ('^' + [regex]::Escape($Name) + '='),'').Trim() }
    return ''
}
function Verify-Application {
    $port = Read-Setting 'PUBLIC_PORT'
    if (-not $port) { $port = '18080' }
    $health = Invoke-RestMethod "http://127.0.0.1:$port/actuator/health" -TimeoutSec 20
    if ($health.status -ne 'UP') { throw 'Local health check failed.' }
    $public = (Read-Setting 'PUBLIC_API_URL').TrimEnd('/')
    if ($public -match '^https://') {
        $health = Invoke-RestMethod "$public/actuator/health" -TimeoutSec 30
        if ($health.status -ne 'UP') { throw 'Public HTTPS health check failed.' }
        $catalog = Invoke-WebRequest "$public/api/v1/products?size=1" -UseBasicParsing -TimeoutSec 30
        if ($catalog.StatusCode -ne 200) { throw 'Public catalog smoke check failed.' }
    }
}
$tag = $sha.Substring(0,12)
$env:IMAGE_TAG = $tag
$started = Get-Date -Format o
try {
    & docker info --format '{{.ServerVersion}}'
    if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop is not ready; start it before deployment.' }
    & py -3 (Join-Path $PSScriptRoot 'setup-monitoring.py') --env $environmentPath
    if ($LASTEXITCODE -ne 0) { throw 'Monitoring credentials setup failed.' }
    if (-not $SkipBuild) {
        foreach ($service in @('auth-service','product-service','order-service','payment-service','api-gateway','frontend')) {
            Invoke-Compose @('build',$service)
        }
    }
    & py -3 (Join-Path $PSScriptRoot 'independent-ops.py') backup --env $environmentPath --destination T:/ProjectTBDD/.tools/backups
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed; deployment stopped.' }
    & py -3 (Join-Path $PSScriptRoot 'independent-ops.py') migrate --env $environmentPath
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed; deployment stopped.' }
    try {
        Invoke-Compose @('up','-d','--wait','--wait-timeout','420','--scale','product-service=2','--scale','api-gateway=2','--scale','order-service=2')
        # Recreate bind mounts after checkout replaces files; reload alone can retain an old inode.
        Invoke-Compose @('up','-d','--no-deps','--force-recreate','--wait','--wait-timeout','180','nginx','prometheus','grafana')
        Invoke-Compose @('exec','-T','nginx','nginx','-t')
        Verify-Application
        & py -3 (Join-Path $PSScriptRoot 'verify-monitoring.py') --env $environmentPath --wait 150
        if ($LASTEXITCODE -ne 0) { throw 'Monitoring verification failed.' }
        @{ tag=$tag; sha=$sha; deployedAt=(Get-Date -Format o); startedAt=$started; source=$env:GITHUB_RUN_ID } | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
        @{ tag=$tag; status='SUCCESS'; finishedAt=(Get-Date -Format o) } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateDirectory 'last-attempt.json') -Encoding UTF8
        Write-Host 'Deployment verified: application, public HTTPS and monitoring. Data volumes retained.'
    } catch {
        $failure = $_
        if ($previous -and $previous.tag) {
            $env:IMAGE_TAG = $previous.tag
            Invoke-Compose @('up','-d','--no-build','--wait','--wait-timeout','420','--scale','product-service=2','--scale','order-service=2','--scale','api-gateway=2')
            Invoke-Compose @('up','-d','--no-deps','--force-recreate','--wait','--wait-timeout','180','nginx')
            Verify-Application
            @{ tag=$tag; restoredTag=$previous.tag; status='ROLLED_BACK'; finishedAt=(Get-Date -Format o) } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stateDirectory 'last-attempt.json') -Encoding UTF8
            Write-Warning 'Previous application images restored and health verified; additive database migrations retained.'
        }
        throw $failure
    }
} finally {
    $lock.Dispose()
}
