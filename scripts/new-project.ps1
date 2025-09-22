param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[a-z0-9-]+$")]
    [string]$ProjectName
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
Copy-Item -Path (Join-Path $templateDir '*') -Destination $projectDir -Recurse

Get-ChildItem -Path $projectDir -Recurse -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content.Replace("{{PROJECT_NAME}}", $ProjectName)
    Set-Content -Path $_.FullName -Value $content
}

$readmePath = Join-Path $projectDir 'README.md'
if (-not (Test-Path $readmePath)) {
    "# $ProjectName`n`nStarter project created from templates/web-basic." | Set-Content -Path $readmePath
}

Write-Output "Created project at projects/$ProjectName"
