param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 4179,
  [switch]$Background,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$scriptPath = $PSCommandPath
if ($Background) {
  $serverArguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"' + $scriptPath + '"'),
    '-Port', $Port
  )
  if ($NoBrowser) { $serverArguments += '-NoBrowser' }
  Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList $serverArguments
  exit 0
}

$siteRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$siteRootPrefix = $siteRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$siteUrl = "http://127.0.0.1:$Port/index.html"

function Open-DiaryPage {
  if (-not $NoBrowser) {
    Start-Process -FilePath $siteUrl
  }
}

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.js'   { return 'application/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
    '.svg'  { return 'image/svg+xml' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.gif'  { return 'image/gif' }
    '.webp' { return 'image/webp' }
    '.ico'  { return 'image/x-icon' }
    '.txt'  { return 'text/plain; charset=utf-8' }
    default { return 'application/octet-stream' }
  }
}

function Write-HttpResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$IncludeBody = $true
  )

  $headerText = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $header = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($header, 0, $header.Length)
  if ($IncludeBody -and $Body.Length) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try {
  $listener.Start()
} catch [System.Net.Sockets.SocketException] {
  # The diary server is probably already running from an earlier double-click.
  Open-DiaryPage
  exit 0
}

Open-DiaryPage

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $client.ReceiveTimeout = 5000
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      while ($reader.ReadLine()) { }

      if (-not $requestLine) { continue }
      $parts = $requestLine.Split(' ')
      if ($parts.Length -lt 2) { continue }
      $method = $parts[0].ToUpperInvariant()
      $requestTarget = $parts[1]
      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed')
        Write-HttpResponse -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body
        continue
      }

      $rawPath = ($requestTarget -split '\?', 2)[0]
      $decodedPath = [System.Uri]::UnescapeDataString($rawPath)
      if ($decodedPath -eq '/') { $decodedPath = '/index.html' }
      $relativePath = $decodedPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($siteRoot, $relativePath))
      $insideSite = $fullPath.StartsWith($siteRootPrefix, [System.StringComparison]::OrdinalIgnoreCase)

      if (-not $insideSite -or -not [System.IO.File]::Exists($fullPath)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -IncludeBody ($method -eq 'GET')
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($fullPath)
      Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType (Get-ContentType $fullPath) -Body $body -IncludeBody ($method -eq 'GET')
    } catch {
      # A browser can cancel an image request while the page is changing; keep serving.
    } finally {
      $client.Dispose()
    }
  }
} finally {
  $listener.Stop()
}
