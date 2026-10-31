$ErrorActionPreference='Stop'
$repoRoot=Split-Path $PSScriptRoot -Parent
$scriptPath=Join-Path $PSScriptRoot 'start-cloud-server.ps1'
$shellExe=(Get-Command powershell.exe).Source
$action=New-ScheduledTaskAction -Execute $shellExe -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$scriptPath+'"') -WorkingDirectory $repoRoot
$user=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $user
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2) -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Eshop-Cloud-Server' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Start existing E-Shop backend and data containers after Windows login.' -Force | Out-Null
Write-Output 'Startup task Eshop-Cloud-Server installed. Docker Desktop must also start at login.'
