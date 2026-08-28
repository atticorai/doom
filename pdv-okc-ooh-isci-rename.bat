@echo off
rem  Renames the 12 Oklahoma City OOH files to "ISCI - Title.ext" for upload to Doom.
rem  Statics are .tif, digitals are .png. Every pattern requires OKC + the exact
rem  size, so Tulsa files in the same folder are never touched, and the Jr. Posters
rem  are matched before the full-size posters so the two never collide.
rem  Drop into the folder with the 12 files and double-click.
setlocal
echo.
for %%F in ("*Jr*Poster*OKC*Thunder*.tif") do if not exist "OKCPDV26JP001O - PDV Static Jr. Poster - Oklahoma City - Thunder - 4'11x10'11.tif" (ren "%%F" "OKCPDV26JP001O - PDV Static Jr. Poster - Oklahoma City - Thunder - 4'11x10'11.tif" & echo   renamed  %%F  to  OKCPDV26JP001O)
for %%F in ("*Jr*Poster*OKC*Pepper*.tif") do if not exist "OKCPDV26JP002O - PDV Static Jr. Poster - Oklahoma City - Pepper and Murry - 4'11x10'11.tif" (ren "%%F" "OKCPDV26JP002O - PDV Static Jr. Poster - Oklahoma City - Pepper and Murry - 4'11x10'11.tif" & echo   renamed  %%F  to  OKCPDV26JP002O)
for %%F in ("PDV Static Poster*OKC*Thunder*.tif") do if not exist "OKCPDV26SP001O - PDV Static Poster - Oklahoma City - Thunder - 10'5x22'8.tif" (ren "%%F" "OKCPDV26SP001O - PDV Static Poster - Oklahoma City - Thunder - 10'5x22'8.tif" & echo   renamed  %%F  to  OKCPDV26SP001O)
for %%F in ("PDV Static Poster*OKC*Pepper*.tif") do if not exist "OKCPDV26SP002O - PDV Static Poster - Oklahoma City - Pepper and Murry - 10'5x22'8.tif" (ren "%%F" "OKCPDV26SP002O - PDV Static Poster - Oklahoma City - Pepper and Murry - 10'5x22'8.tif" & echo   renamed  %%F  to  OKCPDV26SP002O)
for %%F in ("*Billboard*OKC*Thunder*14x48*.tif") do if not exist "OKCPDV26SB001O - PDV Static Bulletin - Oklahoma City - Thunder - 14x48.tif" (ren "%%F" "OKCPDV26SB001O - PDV Static Bulletin - Oklahoma City - Thunder - 14x48.tif" & echo   renamed  %%F  to  OKCPDV26SB001O)
for %%F in ("*Billboard*OKC*Pepper*14x48*.tif") do if not exist "OKCPDV26SB002O - PDV Static Bulletin - Oklahoma City - Pepper and Murry - 14x48.tif" (ren "%%F" "OKCPDV26SB002O - PDV Static Bulletin - Oklahoma City - Pepper and Murry - 14x48.tif" & echo   renamed  %%F  to  OKCPDV26SB002O)
for %%F in ("*Billboard*OKC*Thunder*11x44*.tif") do if not exist "OKCPDV26SB003O - PDV Static Bulletin - Oklahoma City - Thunder - 11x44.tif" (ren "%%F" "OKCPDV26SB003O - PDV Static Bulletin - Oklahoma City - Thunder - 11x44.tif" & echo   renamed  %%F  to  OKCPDV26SB003O)
for %%F in ("*Billboard*OKC*Pepper*11x44*.tif") do if not exist "OKCPDV26SB004O - PDV Static Bulletin - Oklahoma City - Pepper and Murry - 11x44.tif" (ren "%%F" "OKCPDV26SB004O - PDV Static Bulletin - Oklahoma City - Pepper and Murry - 11x44.tif" & echo   renamed  %%F  to  OKCPDV26SB004O)
for %%F in ("*Digital*OKC*Thunder*400x1400*.png") do if not exist "OKCPDV26DB001O - PDV Digital Bulletin - Oklahoma City - Thunder - 400x1400.png" (ren "%%F" "OKCPDV26DB001O - PDV Digital Bulletin - Oklahoma City - Thunder - 400x1400.png" & echo   renamed  %%F  to  OKCPDV26DB001O)
for %%F in ("*Digital*OKC*Pepper*400x1400*.png") do if not exist "OKCPDV26DB002O - PDV Digital Bulletin - Oklahoma City - Pepper and Murry - 400x1400.png" (ren "%%F" "OKCPDV26DB002O - PDV Digital Bulletin - Oklahoma City - Pepper and Murry - 400x1400.png" & echo   renamed  %%F  to  OKCPDV26DB002O)
for %%F in ("*Digital*OKC*Thunder*400x840*.png") do if not exist "OKCPDV26DB003O - PDV Digital Bulletin - Oklahoma City - Thunder - 400x840.png" (ren "%%F" "OKCPDV26DB003O - PDV Digital Bulletin - Oklahoma City - Thunder - 400x840.png" & echo   renamed  %%F  to  OKCPDV26DB003O)
for %%F in ("*Digital*OKC*Pepper*400x840*.png") do if not exist "OKCPDV26DB004O - PDV Digital Bulletin - Oklahoma City - Pepper and Murry - 400x840.png" (ren "%%F" "OKCPDV26DB004O - PDV Digital Bulletin - Oklahoma City - Pepper and Murry - 400x840.png" & echo   renamed  %%F  to  OKCPDV26DB004O)
echo.
echo Done. Files now named by ISCI:
dir /b "OKCPDV26*" 2>nul
echo.
pause
