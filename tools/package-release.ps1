param(
  [string]$Version = "v1.1.0"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot "发布"
$packageName = "Asoul一个魂健康日记-$Version"
$packageDir = Join-Path $releaseRoot $packageName
$zipPath = "$packageDir.zip"

if ((Test-Path -LiteralPath $packageDir) -or (Test-Path -LiteralPath $zipPath)) {
  throw "Release already exists: $packageName"
}

$coreFiles = @(
  "Asoul一个魂健康日记.html",
  "Asoul一个魂健康日记.cmd",
  "app.js",
  "data-model.js",
  "styles.css",
  "weekly-planner.css",
  "weekly-polish.css",
  "stickers.js",
  "冷笑话.js",
  "使用说明.md"
)

New-Item -ItemType Directory -Path $packageDir | Out-Null
foreach ($file in $coreFiles) {
  $source = Join-Path $projectRoot $file
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing release file: $source" }
  Copy-Item -LiteralPath $source -Destination $packageDir
}

$targetImageRoot = Join-Path $packageDir "图片"
New-Item -ItemType Directory -Path $targetImageRoot | Out-Null
foreach ($folder in @("贝拉", "嘉然", "乃琳", "其他图片")) {
  Copy-Item -LiteralPath (Join-Path $projectRoot "图片\$folder") -Destination $targetImageRoot -Recurse
}

Compress-Archive -LiteralPath $packageDir -DestinationPath $zipPath -CompressionLevel Optimal
Write-Output "Created $zipPath"

