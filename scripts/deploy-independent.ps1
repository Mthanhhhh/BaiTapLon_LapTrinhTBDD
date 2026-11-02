param([Parameter(Mandatory=$true)][string]$EnvironmentFile,[switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$env:COMPOSE_PARALLEL_LIMIT='1'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$environmentPath = (Resolve-Path -LiteralPath $EnvironmentFile).Path
$composeArgs = @('compose','--env-file',$environmentPath,'-f',(Join-Path $root 'infra/independent/compose.yml'))
function Invoke-Compose([string[]]$Arguments) {
    & docker @composeArgs @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed ($LASTEXITCODE)." }
}
$stateDirectory = 'T:/ProjectTBDD/.tools/deployment'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$stateFile = Join-Path $stateDirectory 'current.json'
$previous = if (Test-Path $stateFile) { Get-Content $stateFile -Raw | ConvertFrom-Json } else { $null }
$env:IMAGE_TAG = (& git rev-parse --short=12 HEAD).Trim()
if (-not $SkipBuild) { Invoke-Compose @('build') }
& py -3 (Join-Path $PSScriptRoot 'independent-ops.py') backup --env $environmentPath --destination T:/ProjectTBDD/.tools/backups
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; deployment stopped.' }
& py -3 (Join-Path $PSScriptRoot 'independent-ops.py') migrate --env $environmentPath
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; deployment stopped.' }
try {
Invoke-Compose @('up','-d','--wait','--wait-timeout','420','--scale','product-service=2','--scale','api-gateway=2','--scale','order-service=2')
$port = ((Get-Content -LiteralPath $environmentPath | Where-Object { $_ -match '^PUBLIC_PORT=' }) -replace '^PUBLIC_PORT=','').Trim()
if (-not $port) { $port = '18080' }
$health = Invoke-RestMethod "http://127.0.0.1:$port/actuator/health"
if ($health.status -ne 'UP') { throw 'Deployment health check failed.' }
@{ tag=$env:IMAGE_TAG; deployedAt=(Get-Date -Format o) } | ConvertTo-Json | Set-Content $stateFile
Write-Host 'Deployment verified. Database volumes and backups retained.'
} catch {
    if ($previous -and $previous.tag) {
        $env:IMAGE_TAG = $previous.tag
        Invoke-Compose @('up','-d','--no-build','--wait','--wait-timeout','420','--scale','product-service=2','--scale','order-service=2','--scale','api-gateway=2')
        Write-Warning 'Previous application images restored; additive database migrations retained.'
    }
    throw
}
