@echo off
rem  Double-click me. Downloads all L&R radio :30s into THIS folder,
rem  already named "ISCI - Title.ext" (no rename step needed), and
rem  makes the Tucson copies. Needs lr-radio-30s-bulk-download.ps1
rem  sitting next to it. Safe to re-run - it skips finished files.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0lr-radio-30s-bulk-download.ps1"
pause
