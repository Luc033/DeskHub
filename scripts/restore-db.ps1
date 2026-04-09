# ============================================================
# DeskHub - Restaurar backup do PostgreSQL
# Uso: .\scripts\restore-db.ps1 -BackupFile "backups\deskhub_backup_2026-04-09_12-00-00.sql"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not [System.IO.Path]::IsPathRooted($BackupFile)) {
    $BackupFile = Join-Path $ProjectRoot $BackupFile
}

if (-not (Test-Path $BackupFile)) {
    Write-Error "Arquivo nao encontrado: $BackupFile"
    exit 1
}

# Carrega variáveis do .env
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim("'", '"')
            Set-Item -Path "Env:$key" -Value $val -ErrorAction SilentlyContinue
        }
    }
}

$DbUser = $env:DB_USER
$DbName = $env:DB_NAME

Write-Host ""
Write-Host "ATENCAO: Isso vai SUBSTITUIR todos os dados do banco '$DbName'!" -ForegroundColor Red
Write-Host "Arquivo: $BackupFile" -ForegroundColor Yellow
$confirm = Read-Host "Digite 'SIM' para confirmar"

if ($confirm -ne "SIM") {
    Write-Host "Restauracao cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Restaurando backup..." -ForegroundColor Cyan

try {
    Get-Content $BackupFile | docker compose -f "$ProjectRoot\docker-compose.yml" exec -T postgres `
        psql -U $DbUser -d $DbName

    if ($LASTEXITCODE -ne 0) { throw "psql retornou codigo $LASTEXITCODE" }

    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Banco restaurado com sucesso!" -ForegroundColor Green
}
catch {
    Write-Error "Falha na restauracao: $_"
    exit 1
}
