@echo off
rem ================================================================
rem  Lerner & Rowe - Radio :30s to ISCI names (ABQ / PHX / TUC / RNO)
rem
rem  Takes each file to "ISCI - Title.ext" no matter which state it
rem  is in right now:
rem    LRAL35082.mp3   -> ABQLR2630001R - Service_30.mp3
rem    ABQLR2630001R.mp3 -> ABQLR2630001R - Service_30.mp3
rem    already renamed -> left alone, reported OK
rem  Tucson entries are COPIES of the renamed Phoenix files (same spot).
rem
rem  Put this .bat in the folder with the downloaded files and
rem  double-click it. Anything it cannot find is reported MISSING -
rem  send those file names back and the .bat gets regenerated.
rem ================================================================
setlocal
echo.
echo --- Albuquerque (7 spots) ---
call :r "ABQLR2630001R" "LRAL35082" "Service_30" "ABQLR2630001R - Service_30"
call :r "ABQLR2630002R" "LRAL35049" "505_30" "ABQLR2630002R - 505_30"
call :r "ABQLR2630003R" "LRAL35037" "Help_30" "ABQLR2630003R - Help_30"
call :r "ABQLR2630004R" "LRAL35039" "Wreck Life_30" "ABQLR2630004R - Wreck Life_30"
call :r "ABQLR2630005R" "LRAL35038" "One Call_30" "ABQLR2630005R - One Call_30"
call :r "ABQLR2630006R" "LRAL35138" "Rear End_30" "ABQLR2630006R - Rear End_30"
call :r "ABQLR2630007R" "LRAL35151" "Make Them Pay_30" "ABQLR2630007R - Make Them Pay_30"
echo.
echo --- Phoenix (4 spots) ---
call :r "PHXLR2630001R" "LRPH35018" "PHX Tuc Law_30" "PHXLR2630001R - PHX Tuc Law_30"
call :r "PHXLR2630002R" "LRPH35047" "Best_30" "PHXLR2630002R - Best_30"
call :r "PHXLR2630003R" "LRPH35136" "Rear End_30" "PHXLR2630003R - Rear End_30"
call :r "PHXLR2630004R" "LRPH35149" "Make Them Pay_30" "PHXLR2630004R - Make Them Pay_30"
echo.
echo --- Tucson (4 spots) ---
call :c "PHXLR2630001R - PHX Tuc Law_30" "TUCLR2630001R - PHX Tuc Law_30"
call :c "PHXLR2630002R - Best_30" "TUCLR2630002R - Best_30"
call :c "PHXLR2630003R - Rear End_30" "TUCLR2630003R - Rear End_30"
call :c "PHXLR2630004R - Make Them Pay_30" "TUCLR2630004R - Make Them Pay_30"
echo.
echo --- Reno (6 spots) ---
call :r "RNOLR2630001R" "LRRO31031" "No Results_30" "RNOLR2630001R - No Results_30"
call :r "RNOLR2630002R" "LRRO31029" "Results 523_30" "RNOLR2630002R - Results 523_30"
call :r "RNOLR2630003R" "LRRO31027" "The Process 523_30" "RNOLR2630003R - The Process 523_30"
call :r "RNOLR2630004R" "LRRO31028" "They Know Who We Are_30" "RNOLR2630004R - They Know Who We Are_30"
call :r "RNOLR2630005R" "LRRO31026" "What It Means_30" "RNOLR2630005R - What It Means_30"
call :r "RNOLR2630006R" "LRRO31208" "Electric Vehicle_30" "RNOLR2630006R - Electric Vehicle_30"
echo.
echo Done.
pause
exit /b

rem %1 = ISCI, %2 = vendor code, %3 = title, %4 = final "ISCI - Title"
:r
set "done="
for %%E in (mp3 wav m4a aif mp4) do (
  if exist "%~4.%%E" (
    echo   OK       %~4.%%E already named
    set "done=1"
  ) else if exist "%~1.%%E" (
    ren "%~1.%%E" "%~4.%%E"
    echo   renamed  %~1.%%E  to  %~4.%%E
    set "done=1"
  ) else if exist "%~2.%%E" (
    ren "%~2.%%E" "%~4.%%E"
    echo   renamed  %~2.%%E  to  %~4.%%E
    set "done=1"
  ) else if exist "%~3.%%E" (
    ren "%~3.%%E" "%~4.%%E"
    echo   renamed  %~3.%%E  to  %~4.%%E
    set "done=1"
  )
)
if not defined done echo   MISSING  %~1 / %~2  -  no audio file found
exit /b

rem %1 = renamed PHX file, %2 = TUC final name (copy, same spot)
:c
set "done="
for %%E in (mp3 wav m4a aif mp4) do (
  if exist "%~2.%%E" (
    echo   OK       %~2.%%E already there
    set "done=1"
  ) else if exist "%~1.%%E" (
    copy /y "%~1.%%E" "%~2.%%E" >nul
    echo   copied   %~1.%%E  to  %~2.%%E
    set "done=1"
  )
)
if not defined done echo   MISSING  %~2  -  Phoenix source not found yet
exit /b
