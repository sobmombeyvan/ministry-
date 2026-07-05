# Ministry IT Ticketing - Next.js + Supabase

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"

function Test-NtfsDrive($path) {
    $drive = Split-Path $path -Qualifier
    if (-not $drive) { return $true }
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$drive'" -ErrorAction SilentlyContinue
    if ($disk) { return $disk.FileSystem -eq 'NTFS' }
    return $true
}

function Sync-ToLocalDev($sourceFrontend, $sourceRoot) {
    $devRoot = Join-Path $env:LOCALAPPDATA "ministry-dev"
    $devFrontend = Join-Path $devRoot "frontend"

    New-Item -ItemType Directory -Force -Path $devFrontend | Out-Null

    Write-Host "Syncing to $devFrontend (non-NTFS drive workaround)..." -ForegroundColor DarkGray
    robocopy $sourceFrontend $devFrontend /MIR /XD node_modules .next build /NFL /NDL /NJH /NJS /NC /NS | Out-Null

    foreach ($f in @('.env', '.env.local')) {
        $src = Join-Path $sourceRoot $f
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $devRoot $f) -Force
            Copy-Item $src (Join-Path $devFrontend $f) -Force
        }
    }

    if (-not (Test-Path "$devFrontend\node_modules\next")) {
        Write-Host "Installing dependencies..."
        Push-Location $devFrontend
        npm install
        Pop-Location
    }

    return @{ Frontend = $devFrontend; Root = $devRoot }
}

$runFrontend = $frontend
if (-not (Test-NtfsDrive $frontend)) {
    $local = Sync-ToLocalDev $frontend $root
    $runFrontend = $local.Frontend
}

Set-Location $runFrontend

if (-not (Test-Path "node_modules\next")) {
    Write-Host "Installing dependencies..."
    npm install
}

Write-Host ""
Write-Host "Starting Next.js at http://localhost:3000" -ForegroundColor Green
Write-Host "Requires Supabase - see SUPABASE_SETUP.md" -ForegroundColor Cyan
if ($runFrontend -ne $frontend) {
    Write-Host "Running from: $runFrontend" -ForegroundColor DarkGray
}
Write-Host ""
npm run dev
