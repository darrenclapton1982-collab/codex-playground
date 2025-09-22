param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[a-z0-9-]+$")]
    [string]$ProjectName,
    [int]$Port = 5173
)

$repoRoot = Split-Path $PSScriptRoot -Parent
$projectsRoot = Join-Path $repoRoot "projects"
$projectDir = Join-Path $projectsRoot $ProjectName

if (Test-Path $projectDir) {
    Write-Error "Project '$ProjectName' already exists." -ErrorAction Stop
}

$templateDir = Join-Path (Join-Path $repoRoot "templates") "web-basic"
if (-not (Test-Path $templateDir)) {
    Write-Error "Template directory not found at $templateDir" -ErrorAction Stop
}

New-Item -ItemType Directory -Path $projectDir -Force | Out-Null
Copy-Item -Path (Join-Path $templateDir '*') -Destination $projectDir -Recurse -Force

Get-ChildItem -Path $projectDir -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content.Replace("{{PROJECT_NAME}}", $ProjectName)
    $content = $content.Replace("{{PORT}}", $Port.ToString())
    Set-Content -Path $_.FullName -Value $content
}

$bsConfigPath = Join-Path $projectDir 'bs-config.json'
if (Test-Path $bsConfigPath) {
    $config = Get-Content $bsConfigPath -Raw | ConvertFrom-Json
    $config.port = $Port
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $bsConfigPath
}

Push-Location $projectDir
try {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm.cmd install | Out-Null
    Write-Host "Dependencies installed." -ForegroundColor Green
} catch {
    Write-Warning "npm install failed. Install dependencies manually in $projectDir."
} finally {
    Pop-Location
}

Write-Output "Created project at projects/$ProjectName"
