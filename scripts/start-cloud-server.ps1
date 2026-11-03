param([switch]$Restart,[ValidateSet('auth-service','product-service','order-service','payment-service','api-gateway')][string[]]$Service)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
Set-Location $root
$environmentFile=Join-Path $root '.env.independent.local'
if(-not(Test-Path -LiteralPath $environmentFile)) { & (Join-Path $PSScriptRoot 'start-independent.ps1'); return }
& py -3 (Join-Path $PSScriptRoot 'setup-monitoring.py') --env $environmentFile
if ($LASTEXITCODE -ne 0) { throw 'Monitoring credentials setup failed.' }
$composeArgs=@('compose','--env-file',$environmentFile,'-f',(Join-Path $root 'infra/independent/compose.yml'))
if($Restart) {
 $targets=if($Service){$Service}else{@('auth-service','product-service','order-service','payment-service','api-gateway')}
 & docker @composeArgs restart @targets
 if($LASTEXITCODE -ne 0){throw 'Could not restart application containers.'}
}
if($Service) {
 $selectedArgs=@('up','-d','--no-deps','--wait','--wait-timeout','420')
 foreach($name in $Service){if($name -in @('product-service','order-service','api-gateway')){$selectedArgs+=@('--scale',"$name=2")}}
 $selectedArgs+=$Service
 & docker @composeArgs @selectedArgs
} else {
 & docker @composeArgs up -d --wait --wait-timeout 420 --scale product-service=2 --scale order-service=2 --scale api-gateway=2
}
if($LASTEXITCODE -ne 0){throw 'Server startup failed. Inspect Docker Compose logs; database volumes were retained.'}
$tunnel=Get-Service cloudflared -ErrorAction SilentlyContinue
if($tunnel -and $tunnel.Status -ne 'Running'){Write-Warning 'Start the installed cloudflared service to enable public HTTPS.'}
Write-Output 'Independent Docker services ready. Public API: https://api-eshop.mtcord.io.vn'
