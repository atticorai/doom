@echo off
rem  Renames the 3 Tulsa Jr. Bulletin TIFs (10'x40') to "ISCI - Title.tif"
rem  for upload to Doom. Matches Jr + creative name anywhere in the current
rem  filename, so the 14x48 bulletin files in the same folder are never touched.
rem  Drop into the folder with the 3 TIFs and double-click.
setlocal
echo.
for %%F in ("*Jr*Bulletin*Thunder*.tif") do if not exist "TULPDV26JB001O - PDV Static Jr. Bulletin - Tulsa - Thunder - 10x40.tif" (ren "%%F" "TULPDV26JB001O - PDV Static Jr. Bulletin - Tulsa - Thunder - 10x40.tif" & echo   renamed  %%F  to  TULPDV26JB001O)
for %%F in ("*Jr*Bulletin*Cityscape*.tif") do if not exist "TULPDV26JB002O - PDV Static Jr. Bulletin - Tulsa - Tulsa Cityscape - 10x40.tif" (ren "%%F" "TULPDV26JB002O - PDV Static Jr. Bulletin - Tulsa - Tulsa Cityscape - 10x40.tif" & echo   renamed  %%F  to  TULPDV26JB002O)
for %%F in ("*Jr*Bulletin*Pepper*.tif") do if not exist "TULPDV26JB003O - PDV Static Jr. Bulletin - Tulsa - Pepper and Murry - 10x40.tif" (ren "%%F" "TULPDV26JB003O - PDV Static Jr. Bulletin - Tulsa - Pepper and Murry - 10x40.tif" & echo   renamed  %%F  to  TULPDV26JB003O)
echo.
echo Done. Files now named by ISCI:
dir /b "TULPDV26JB*" 2>nul
echo.
pause
