# ============================================================
# DeskHub - Registrar tarefa agendada de backup diário
# Executa como o usuário atual, todo dia às 02:00 da manhã
# EXECUTAR COMO ADMINISTRADOR
# ============================================================

$ErrorActionPreference = "Stop"

$TaskName   = "DeskHub_Backup_Diario"
$ScriptPath = Join-Path $PSScriptRoot "backup-db.ps1"

if (-not (Test-Path $ScriptPath)) {
    Write-Error "Script de backup nao encontrado: $ScriptPath"
    exit 1
}

# Remove tarefa anterior se existir (ignora erro se não existir)
$ErrorActionPreference = "SilentlyContinue"
schtasks /delete /tn $TaskName /f 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

# Registra a tarefa usando schtasks.exe (mais confiável com permissões)
$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

try {
    schtasks /create `
        /tn $TaskName `
        /tr $command `
        /sc daily `
        /st 18:15 `
        /rl HIGHEST `
        /f

    if ($LASTEXITCODE -ne 0) {
        throw "schtasks retornou codigo $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "Tarefa '$TaskName' registrada com sucesso!" -ForegroundColor Green
    Write-Host "Horario: Todo dia as 18:15" -ForegroundColor Cyan
    Write-Host "Script:  $ScriptPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Para testar agora: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Yellow
}
catch {
    Write-Host ""
    Write-Host "ERRO ao registrar tarefa: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifique se voce esta executando como Administrador:" -ForegroundColor Yellow
    Write-Host "  1. Clique direito no PowerShell -> Executar como administrador" -ForegroundColor Yellow
    Write-Host "  2. Execute: .\scripts\setup-backup-schedule.ps1" -ForegroundColor Yellow
    exit 1
}
