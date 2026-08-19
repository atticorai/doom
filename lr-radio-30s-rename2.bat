@echo off
rem  Renames the downloaded L&R radio spots to "ISCI - Title.ext".
rem  Matches the vendor code ANYWHERE in the filename, so it works
rem  no matter what Drive named the downloads.
rem  Put this .bat in the folder with the files and double-click it.
setlocal
echo.
for %%F in ("*LRAL35082*.*") do if not exist "ABQLR2630001R - Service_30%%~xF" (ren "%%F" "ABQLR2630001R - Service_30%%~xF" & echo   renamed  %%F  to  ABQLR2630001R - Service_30%%~xF)
for %%F in ("*LRAL35049*.*") do if not exist "ABQLR2630002R - 505_30%%~xF" (ren "%%F" "ABQLR2630002R - 505_30%%~xF" & echo   renamed  %%F  to  ABQLR2630002R - 505_30%%~xF)
for %%F in ("*LRAL35037*.*") do if not exist "ABQLR2630003R - Help_30%%~xF" (ren "%%F" "ABQLR2630003R - Help_30%%~xF" & echo   renamed  %%F  to  ABQLR2630003R - Help_30%%~xF)
for %%F in ("*LRAL35039*.*") do if not exist "ABQLR2630004R - Wreck Life_30%%~xF" (ren "%%F" "ABQLR2630004R - Wreck Life_30%%~xF" & echo   renamed  %%F  to  ABQLR2630004R - Wreck Life_30%%~xF)
for %%F in ("*LRAL35038*.*") do if not exist "ABQLR2630005R - One Call_30%%~xF" (ren "%%F" "ABQLR2630005R - One Call_30%%~xF" & echo   renamed  %%F  to  ABQLR2630005R - One Call_30%%~xF)
for %%F in ("*LRAL35138*.*") do if not exist "ABQLR2630006R - Rear End_30%%~xF" (ren "%%F" "ABQLR2630006R - Rear End_30%%~xF" & echo   renamed  %%F  to  ABQLR2630006R - Rear End_30%%~xF)
for %%F in ("*LRAL35151*.*") do if not exist "ABQLR2630007R - Make Them Pay_30%%~xF" (ren "%%F" "ABQLR2630007R - Make Them Pay_30%%~xF" & echo   renamed  %%F  to  ABQLR2630007R - Make Them Pay_30%%~xF)
for %%F in ("*LRPH35018*.*") do if not exist "PHXLR2630001R - PHX Tuc Law_30%%~xF" (ren "%%F" "PHXLR2630001R - PHX Tuc Law_30%%~xF" & echo   renamed  %%F  to  PHXLR2630001R - PHX Tuc Law_30%%~xF)
for %%F in ("*LRPH35047*.*") do if not exist "PHXLR2630002R - Best_30%%~xF" (ren "%%F" "PHXLR2630002R - Best_30%%~xF" & echo   renamed  %%F  to  PHXLR2630002R - Best_30%%~xF)
for %%F in ("*LRPH35136*.*") do if not exist "PHXLR2630003R - Rear End_30%%~xF" (ren "%%F" "PHXLR2630003R - Rear End_30%%~xF" & echo   renamed  %%F  to  PHXLR2630003R - Rear End_30%%~xF)
for %%F in ("*LRPH35149*.*") do if not exist "PHXLR2630004R - Make Them Pay_30%%~xF" (ren "%%F" "PHXLR2630004R - Make Them Pay_30%%~xF" & echo   renamed  %%F  to  PHXLR2630004R - Make Them Pay_30%%~xF)
for %%F in ("*LRRO31031*.*") do if not exist "RNOLR2630001R - No Results_30%%~xF" (ren "%%F" "RNOLR2630001R - No Results_30%%~xF" & echo   renamed  %%F  to  RNOLR2630001R - No Results_30%%~xF)
for %%F in ("*LRRO31029*.*") do if not exist "RNOLR2630002R - Results 523_30%%~xF" (ren "%%F" "RNOLR2630002R - Results 523_30%%~xF" & echo   renamed  %%F  to  RNOLR2630002R - Results 523_30%%~xF)
for %%F in ("*LRRO31027*.*") do if not exist "RNOLR2630003R - The Process 523_30%%~xF" (ren "%%F" "RNOLR2630003R - The Process 523_30%%~xF" & echo   renamed  %%F  to  RNOLR2630003R - The Process 523_30%%~xF)
for %%F in ("*LRRO31028*.*") do if not exist "RNOLR2630004R - They Know Who We Are_30%%~xF" (ren "%%F" "RNOLR2630004R - They Know Who We Are_30%%~xF" & echo   renamed  %%F  to  RNOLR2630004R - They Know Who We Are_30%%~xF)
for %%F in ("*LRRO31026*.*") do if not exist "RNOLR2630005R - What It Means_30%%~xF" (ren "%%F" "RNOLR2630005R - What It Means_30%%~xF" & echo   renamed  %%F  to  RNOLR2630005R - What It Means_30%%~xF)
echo.
echo --- Tucson copies (same spots as Phoenix) ---
for %%F in ("PHXLR2630001R - PHX Tuc Law_30.*") do if not exist "TUCLR2630001R - PHX Tuc Law_30%%~xF" (copy "%%F" "TUCLR2630001R - PHX Tuc Law_30%%~xF" >nul & echo   copied   TUCLR2630001R - PHX Tuc Law_30%%~xF)
for %%F in ("PHXLR2630002R - Best_30.*") do if not exist "TUCLR2630002R - Best_30%%~xF" (copy "%%F" "TUCLR2630002R - Best_30%%~xF" >nul & echo   copied   TUCLR2630002R - Best_30%%~xF)
for %%F in ("PHXLR2630003R - Rear End_30.*") do if not exist "TUCLR2630003R - Rear End_30%%~xF" (copy "%%F" "TUCLR2630003R - Rear End_30%%~xF" >nul & echo   copied   TUCLR2630003R - Rear End_30%%~xF)
for %%F in ("PHXLR2630004R - Make Them Pay_30.*") do if not exist "TUCLR2630004R - Make Them Pay_30%%~xF" (copy "%%F" "TUCLR2630004R - Make Them Pay_30%%~xF" >nul & echo   copied   TUCLR2630004R - Make Them Pay_30%%~xF)
echo.
echo Done. Files now named by ISCI:
dir /b "ABQLR*" "PHXLR*" "TUCLR*" "RNOLR*" 2>nul
echo.
pause
