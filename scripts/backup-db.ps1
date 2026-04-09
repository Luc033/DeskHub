# ============================================================
# DeskHub - Script de Backup do PostgreSQL
# Executa pg_dump de dentro do container e salva na máquina host
# ============================================================

param(
    [int]$RetainDays = 7  # Dias para manter backups antigos
)

$ErrorActionPreference = "Stop"

# --- Configuração ---
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackupDir   = Join-Path $ProjectRoot "backups"
$Timestamp   = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$FileName    = "deskhub_backup_$Timestamp.sql"
$BackupPath  = Join-Path $BackupDir $FileName

# Carrega variáveis do .env raiz
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

if (-not $DbUser -or -not $DbName) {
    Write-Error "DB_USER ou DB_NAME nao encontrados no .env"
    exit 1
}

# --- Cria pasta de backups ---
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Iniciando backup do banco '$DbName'..." -ForegroundColor Cyan

# --- Executa pg_dump dentro do container ---
try {
    docker compose -f "$ProjectRoot\docker-compose.yml" exec -T postgres `
        pg_dump -U $DbUser -d $DbName --clean --if-exists --no-owner `
        > $BackupPath

    if ($LASTEXITCODE -ne 0) { throw "pg_dump retornou codigo $LASTEXITCODE" }

    $size = (Get-Item $BackupPath).Length
    if ($size -lt 100) {
        $content = Get-Content $BackupPath -Raw
        throw "Backup vazio ou com erro: $content"
    }

    $sizeKB = [math]::Round($size / 1KB, 1)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Backup salvo: $BackupPath ($sizeKB KB)" -ForegroundColor Green
}
catch {
    Write-Error "Falha no backup: $_"
    if (Test-Path $BackupPath) { Remove-Item $BackupPath -Force }
    exit 1
}

# --- Limpa backups antigos ---
$cutoff = (Get-Date).AddDays(-$RetainDays)
$removed = 0
Get-ChildItem -Path $BackupDir -Filter "deskhub_backup_*.sql" | Where-Object {
    $_.CreationTime -lt $cutoff
} | ForEach-Object {
    Remove-Item $_.FullName -Force
    $removed++
}

if ($removed -gt 0) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $removed backup(s) antigo(s) removido(s) (> $RetainDays dias)" -ForegroundColor Yellow
}

Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Concluido!" -ForegroundColor Green
