param(
  [string]$Version = "v2.0.0"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseFolderName = -join ([char[]]@(0x53D1, 0x5E03))
$lifeDiaryName = "Asoul" + (-join ([char[]]@(0x4E00, 0x4E2A, 0x9B42, 0x751F, 0x6D3B, 0x65E5, 0x8BB0)))
$releaseRoot = Join-Path $projectRoot $releaseFolderName
$packageName = "$lifeDiaryName-$Version"
$packageDir = Join-Path $releaseRoot $packageName
$zipPath = "$packageDir.zip"

if ((Test-Path -LiteralPath $packageDir) -or (Test-Path -LiteralPath $zipPath)) {
  throw "Release already exists: $packageName"
}

$corePaths = @(
  (Join-Path $projectRoot "index.html"),
  (Join-Path $projectRoot "sw.js"),
  (Join-Path $projectRoot "manifest.webmanifest"),
  (Join-Path $projectRoot "local-server.ps1"),
  (Join-Path $projectRoot "Asoul一个魂健康日记.cmd"),
  (Join-Path $projectRoot "README.md")
)
$coreDirectories = @(
  (Join-Path $projectRoot "js"),
  (Join-Path $projectRoot "css"),
  (Join-Path $projectRoot "icons"),
  (Join-Path $projectRoot "images")
)

foreach ($path in $corePaths) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing release file: $path" }
}
foreach ($path in $coreDirectories) {
  if (-not (Test-Path -LiteralPath $path -PathType Container)) { throw "Missing release directory: $path" }
}

New-Item -ItemType Directory -Path $packageDir | Out-Null
foreach ($path in $corePaths) {
  Copy-Item -LiteralPath $path -Destination $packageDir
}
foreach ($path in $coreDirectories) {
  Copy-Item -LiteralPath $path -Destination $packageDir -Recurse
}

Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -CompressionLevel Optimal
Write-Output "Created $zipPath"
