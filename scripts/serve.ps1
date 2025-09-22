param(
    [string]$Project,
    [int]$Port = 5173
)

$repoRoot = Split-Path $PSScriptRoot -Parent
$root = $repoRoot

if ($Project) {
    $candidate = Join-Path (Join-Path $repoRoot 'projects') $Project
    if (-not (Test-Path $candidate)) {
        Write-Error "Project '$Project' not found under projects/." -ErrorAction Stop
    }
    $root = $candidate
}

$rootFullPath = [IO.Path]::GetFullPath($root)

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Error "Unable to start server on $prefix. Is the port already in use?" -ErrorAction Stop
}

Write-Host "Serving $rootFullPath at $prefix" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm' = 'text/html; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png' = 'image/png'
    '.jpg' = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif' = 'image/gif'
    '.svg' = 'image/svg+xml'
    '.ico' = 'image/x-icon'
    '.txt' = 'text/plain; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
            if ($requestPath.EndsWith('/')) {
                $requestPath = $requestPath + 'index.html'
            }
            $relative = $requestPath.TrimStart('/')
            if (-not $relative) {
                $relative = 'index.html'
            }
            $localPath = [IO.Path]::GetFullPath((Join-Path $rootFullPath $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)))
            if (-not $localPath.StartsWith($rootFullPath, [StringComparison]::OrdinalIgnoreCase)) {
                $context.Response.StatusCode = 403
                $context.Response.Close()
                continue
            }
            if (-not (Test-Path $localPath -PathType Leaf)) {
                $context.Response.StatusCode = 404
                $context.Response.Close()
                continue
            }

            $extension = [IO.Path]::GetExtension($localPath).ToLowerInvariant()
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) {
                $contentType = 'application/octet-stream'
            }

            $buffer = [IO.File]::ReadAllBytes($localPath)
            $response = $context.Response
            $response.Headers['Access-Control-Allow-Origin'] = '*'
            $response.ContentType = $contentType
            $response.ContentLength64 = $buffer.LongLength
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            $response.OutputStream.Flush()
            $response.Close()
        } catch {
            try {
                $context.Response.StatusCode = 500
                $context.Response.Close()
            } catch {}
        }
    }
} catch [System.Exception] {
    if ($_ -is [System.Management.Automation.StopUpstreamCommandsException]) {
        throw
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
