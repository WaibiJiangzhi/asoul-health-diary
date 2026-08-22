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
  (Join-Path $projectRoot "app.js"),
  (Join-Path $projectRoot "data-model.js"),
  (Join-Path $projectRoot "styles.css"),
  (Join-Path $projectRoot "weekly-planner.css"),
  (Join-Path $projectRoot "weekly-polish.css"),
  (Join-Path $projectRoot "stickers.js")
)

$entryHtml = Get-ChildItem -LiteralPath $projectRoot -File -Filter "*.html" | Select-Object -First 1
$launcher = Get-ChildItem -LiteralPath $projectRoot -File -Filter "*.cmd" | Select-Object -First 1
$guide = Get-ChildItem -LiteralPath $projectRoot -File -Filter "*.md" | Select-Object -First 1
$jokes = Get-ChildItem -LiteralPath $projectRoot -File -Filter "*.js" |
  Where-Object { $_.Name -notin @("app.js", "data-model.js", "stickers.js") } |
  Select-Object -First 1

foreach ($required in @($entryHtml, $launcher, $guide, $jokes)) {
  if ($null -eq $required) { throw "Missing release entry file" }
  $corePaths += $required.FullName
}

foreach ($path in $corePaths) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing release file: $path" }
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

$targetImageRoot = Join-Path $packageDir (Split-Path -Leaf $imageRoot)
New-Item -ItemType Directory -Path $targetImageRoot | Out-Null
foreach ($folder in $imageFolders) {
  Copy-Item -LiteralPath $folder.FullName -Destination $targetImageRoot -Recurse
}

Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -CompressionLevel Optimal
Write-Output "Created $zipPath"
