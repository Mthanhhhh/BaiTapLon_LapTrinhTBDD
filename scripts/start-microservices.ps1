param([switch]$Restart)
& (Join-Path $PSScriptRoot 'start-cloud-server.ps1') -Restart:$Restart
