@echo off
rem Use PowerShell to locate the single HTML entry. This keeps the launcher ASCII-only,
rem so it still works after the folder is moved to a path containing Chinese characters.
powershell.exe -NoProfile -Command "Start-Process -FilePath (Get-ChildItem -LiteralPath '%~dp0' -Filter '*.html' | Select-Object -First 1 -ExpandProperty FullName)"
