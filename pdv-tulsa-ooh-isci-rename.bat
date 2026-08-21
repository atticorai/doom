@echo off
rem  Renames the 6 Tulsa OOH TIFs to "ISCI - Title.tif" for upload to Doom.
rem  Matches Bulletin/Poster + creative name anywhere in the current filename,
rem  so the size suffixes and spacing quirks don't matter.
rem  Drop into the folder with the 6 TIFs and double-click.
setlocal
echo.
for %%F in ("*Bulletin*Thunder*.tif") do if not exist "TULPDV26SB001O - PDV Static Bulletin - Tulsa - Thunder - 14x48.tif" (ren "%%F" "TULPDV26SB001O - PDV Static Bulletin - Tulsa - Thunder - 14x48.tif" & echo   renamed  %%F  to  TULPDV26SB001O)
for %%F in ("*Bulletin*Here*.tif") do if not exist "TULPDV26SB002O - PDV Static Bulletin - Tulsa - Here All Along - 14x48.tif" (ren "%%F" "TULPDV26SB002O - PDV Static Bulletin - Tulsa - Here All Along - 14x48.tif" & echo   renamed  %%F  to  TULPDV26SB002O)
for %%F in ("*Bulletin*Pepper*.tif") do if not exist "TULPDV26SB003O - PDV Static Bulletin - Tulsa - Pepper and Murry - 14x48.tif" (ren "%%F" "TULPDV26SB003O - PDV Static Bulletin - Tulsa - Pepper and Murry - 14x48.tif" & echo   renamed  %%F  to  TULPDV26SB003O)
for %%F in ("*Poster*Thunder*.tif") do if not exist "TULPDV26SP001O - PDV Static Poster - Tulsa - Thunder - 10'5x22'8.tif" (ren "%%F" "TULPDV26SP001O - PDV Static Poster - Tulsa - Thunder - 10'5x22'8.tif" & echo   renamed  %%F  to  TULPDV26SP001O)
for %%F in ("*Poster*Here*.tif") do if not exist "TULPDV26SP002O - PDV Static Poster - Tulsa - Here All Along - 10'5x22'8.tif" (ren "%%F" "TULPDV26SP002O - PDV Static Poster - Tulsa - Here All Along - 10'5x22'8.tif" & echo   renamed  %%F  to  TULPDV26SP002O)
for %%F in ("*Poster*Pepper*.tif") do if not exist "TULPDV26SP003O - PDV Static Poster - Tulsa - Pepper and Murry - 10'5x22'8.tif" (ren "%%F" "TULPDV26SP003O - PDV Static Poster - Tulsa - Pepper and Murry - 10'5x22'8.tif" & echo   renamed  %%F  to  TULPDV26SP003O)
echo.
echo Done. Files now named by ISCI:
dir /b "TULPDV26*" 2>nul
echo.
pause
