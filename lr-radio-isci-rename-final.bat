@echo off
rem  Renames the L&R radio MP3s to "ISCI - Title.mp3".
rem  Matches the vendor code anywhere in the current filename,
rem  so it works on the files exactly as they are named now.
rem  Drop into the folder with the 29 files and double-click.
setlocal
echo.
for %%F in ("*LRAL36242*.mp3") do if not exist "ABQLR2615001R - One Call, Thats All_15.mp3" (ren "%%F" "ABQLR2615001R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  ABQLR2615001R - One Call, Thats All_15.mp3)
for %%F in ("*LRAL36243*.mp3") do if not exist "ABQLR2615002R - They'll Answer For It_15.mp3" (ren "%%F" "ABQLR2615002R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  ABQLR2615002R - They'll Answer For It_15.mp3)
for %%F in ("*LRAL36244*.mp3") do if not exist "ABQLR2630008R - One Call, Thats All_30.mp3" (ren "%%F" "ABQLR2630008R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  ABQLR2630008R - One Call, Thats All_30.mp3)
for %%F in ("*LRCH36245*.mp3") do if not exist "CHILR2615035R - One Call, Thats All_15.mp3" (ren "%%F" "CHILR2615035R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  CHILR2615035R - One Call, Thats All_15.mp3)
for %%F in ("*LRCH36246*.mp3") do if not exist "CHILR2615036R - They'll Answer For It_15.mp3" (ren "%%F" "CHILR2615036R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  CHILR2615036R - They'll Answer For It_15.mp3)
for %%F in ("*LRCH36247*.mp3") do if not exist "CHILR2630008R - One Call, Thats All_30.mp3" (ren "%%F" "CHILR2630008R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  CHILR2630008R - One Call, Thats All_30.mp3)
for %%F in ("*LRLV36248*.mp3") do if not exist "LVSLR2615001R - One Call, Thats All_15.mp3" (ren "%%F" "LVSLR2615001R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  LVSLR2615001R - One Call, Thats All_15.mp3)
for %%F in ("*LRLV36249*.mp3") do if not exist "LVSLR2615002R - They'll Answer For It_15.mp3" (ren "%%F" "LVSLR2615002R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  LVSLR2615002R - They'll Answer For It_15.mp3)
for %%F in ("*LRLV36250*.mp3") do if not exist "LVSLR2630010R - One Call, Thats All_30.mp3" (ren "%%F" "LVSLR2630010R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  LVSLR2630010R - One Call, Thats All_30.mp3)
for %%F in ("*LRLV36251*.mp3") do if not exist "LVSLR2630011R - They'll Answer For It_30.mp3" (ren "%%F" "LVSLR2630011R - They'll Answer For It_30.mp3" & echo   renamed  %%F  to  LVSLR2630011R - They'll Answer For It_30.mp3)
for %%F in ("*LRPH36230*.mp3") do if not exist "PHXLR2615005R - One Call, Thats All_15.mp3" (ren "%%F" "PHXLR2615005R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  PHXLR2615005R - One Call, Thats All_15.mp3)
for %%F in ("*LRPH36231*.mp3") do if not exist "PHXLR2615006R - They'll Answer For It_15.mp3" (ren "%%F" "PHXLR2615006R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  PHXLR2615006R - They'll Answer For It_15.mp3)
for %%F in ("*LRPH36232*.mp3") do if not exist "PHXLR2630005R - One Call, Thats All_30.mp3" (ren "%%F" "PHXLR2630005R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  PHXLR2630005R - One Call, Thats All_30.mp3)
for %%F in ("*LRPH36233*.mp3") do if not exist "PHXLR2630006R - They'll Answer For It_30.mp3" (ren "%%F" "PHXLR2630006R - They'll Answer For It_30.mp3" & echo   renamed  %%F  to  PHXLR2630006R - They'll Answer For It_30.mp3)
for %%F in ("*LRRO36252*.mp3") do if not exist "RNOLR2615001R - One Call, Thats All_15.mp3" (ren "%%F" "RNOLR2615001R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  RNOLR2615001R - One Call, Thats All_15.mp3)
for %%F in ("*LRRO36253*.mp3") do if not exist "RNOLR2615002R - They'll Answer For It_15.mp3" (ren "%%F" "RNOLR2615002R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  RNOLR2615002R - They'll Answer For It_15.mp3)
for %%F in ("*LRRO36254*.mp3") do if not exist "RNOLR2630006R - One Call, Thats All_30.mp3" (ren "%%F" "RNOLR2630006R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  RNOLR2630006R - One Call, Thats All_30.mp3)
for %%F in ("*LRRO36255*.mp3") do if not exist "RNOLR2630007R - They'll Answer For It_30.mp3" (ren "%%F" "RNOLR2630007R - They'll Answer For It_30.mp3" & echo   renamed  %%F  to  RNOLR2630007R - They'll Answer For It_30.mp3)
for %%F in ("*LRWA36257*.mp3") do if not exist "SEALR2615001R - One Call, Thats All_15.mp3" (ren "%%F" "SEALR2615001R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  SEALR2615001R - One Call, Thats All_15.mp3)
for %%F in ("*LRWA36258*.mp3") do if not exist "SEALR2615002R - They'll Answer For It_15.mp3" (ren "%%F" "SEALR2615002R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  SEALR2615002R - They'll Answer For It_15.mp3)
for %%F in ("*LRWA36256*.mp3") do if not exist "SEALR2630001R - One Call, Thats All_30.mp3" (ren "%%F" "SEALR2630001R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  SEALR2630001R - One Call, Thats All_30.mp3)
for %%F in ("*LRTU36234*.mp3") do if not exist "TUCLR2615005R - One Call, Thats All_15.mp3" (ren "%%F" "TUCLR2615005R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  TUCLR2615005R - One Call, Thats All_15.mp3)
for %%F in ("*LRTU36235*.mp3") do if not exist "TUCLR2615006R - They'll Answer For It_15.mp3" (ren "%%F" "TUCLR2615006R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  TUCLR2615006R - They'll Answer For It_15.mp3)
for %%F in ("*LRTU36236*.mp3") do if not exist "TUCLR2630005R - One Call, Thats All_30.mp3" (ren "%%F" "TUCLR2630005R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  TUCLR2630005R - One Call, Thats All_30.mp3)
for %%F in ("*LRTU36237*.mp3") do if not exist "TUCLR2630006R - They'll Answer For It_30.mp3" (ren "%%F" "TUCLR2630006R - They'll Answer For It_30.mp3" & echo   renamed  %%F  to  TUCLR2630006R - They'll Answer For It_30.mp3)
for %%F in ("*LRYM36238*.mp3") do if not exist "YMALR2615001R - One Call, Thats All_15.mp3" (ren "%%F" "YMALR2615001R - One Call, Thats All_15.mp3" & echo   renamed  %%F  to  YMALR2615001R - One Call, Thats All_15.mp3)
for %%F in ("*LRYM3639*.mp3") do if not exist "YMALR2615002R - They'll Answer For It_15.mp3" (ren "%%F" "YMALR2615002R - They'll Answer For It_15.mp3" & echo   renamed  %%F  to  YMALR2615002R - They'll Answer For It_15.mp3)
for %%F in ("*LRYM36240*.mp3") do if not exist "YMALR2630001R - One Call, Thats All_30.mp3" (ren "%%F" "YMALR2630001R - One Call, Thats All_30.mp3" & echo   renamed  %%F  to  YMALR2630001R - One Call, Thats All_30.mp3)
for %%F in ("*LRYM36241*.mp3") do if not exist "YMALR2630002R - They'll Answer For It_30.mp3" (ren "%%F" "YMALR2630002R - They'll Answer For It_30.mp3" & echo   renamed  %%F  to  YMALR2630002R - They'll Answer For It_30.mp3)
echo.
echo Done. Files now named by ISCI:
dir /b "*LR26*" 2>nul
echo.
pause
