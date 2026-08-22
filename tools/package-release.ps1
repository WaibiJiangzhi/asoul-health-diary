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
  (Join-Path $projectRoot "icons")
)

foreach ($path in $corePaths) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing release file: $path" }
}
foreach ($path in $coreDirectories) {
  if (-not (Test-Path -LiteralPath $path -PathType Container)) { throw "Missing release directory: $path" }
}

$logo = Get-ChildItem -LiteralPath $projectRoot -File -Filter "Asoul.png" -Recurse |
  Where-Object { $_.FullName -notlike "$releaseRoot*" } |
  Select-Object -First 1
if ($null -eq $logo) { throw "Could not locate the image asset root" }
$imageRoot = $logo.Directory.Parent.FullName
$imageFolders = @(Get-ChildItem -LiteralPath $imageRoot -Directory)
if ($imageFolders.Count -ne 4) {
  throw "Expected exactly four lightweight image folders, found $($imageFolders.Count)"
}

New-Item -ItemType Directory -Path $packageDir | Out-Null
foreach ($path in $corePaths) {
  Copy-Item -LiteralPath $path -Destination $packageDir
}
foreach ($path in $coreDirectories) {
  Copy-Item -LiteralPath $path -Destination $packageDir -Recurse
}

$targetImageRoot = Join-Path $packageDir (Split-Path -Leaf $imageRoot)
New-Item -ItemType Directory -Path $targetImageRoot | Out-Null
foreach ($folder in $imageFolders) {
  Copy-Item -LiteralPath $folder.FullName -Destination $targetImageRoot -Recurse
}

Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -CompressionLevel Optimal
Write-Output "Created $zipPath"
