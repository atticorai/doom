@echo off
rem  Seattle TV :15s to "ISCI - Title.mp4" - matches vendor code anywhere in filename.
setlocal
echo.
for %%F in ("*LRWA35184*.mp4") do if not exist "SEALR2615003T - Get LNR_15.mp4" (ren "%%F" "SEALR2615003T - Get LNR_15.mp4" & echo   renamed  %%F  to  SEALR2615003T - Get LNR_15.mp4)
for %%F in ("*LRWA35207*.mp4") do if not exist "SEALR2615004T - If Your Wreck_15.mp4" (ren "%%F" "SEALR2615004T - If Your Wreck_15.mp4" & echo   renamed  %%F  to  SEALR2615004T - If Your Wreck_15.mp4)
for %%F in ("*LRWA35183*.mp4") do if not exist "SEALR2615005T - Ins Stop_15.mp4" (ren "%%F" "SEALR2615005T - Ins Stop_15.mp4" & echo   renamed  %%F  to  SEALR2615005T - Ins Stop_15.mp4)
for %%F in ("*LRWA35181*.mp4") do if not exist "SEALR2615006T - Wreck Check_15.mp4" (ren "%%F" "SEALR2615006T - Wreck Check_15.mp4" & echo   renamed  %%F  to  SEALR2615006T - Wreck Check_15.mp4)
for %%F in ("*LRWA35209*.mp4") do if not exist "SEALR2615010T - Overnight_15.mp4" (ren "%%F" "SEALR2615010T - Overnight_15.mp4" & echo   renamed  %%F  to  SEALR2615010T - Overnight_15.mp4)
for %%F in ("*LRWA35208*.mp4") do if not exist "SEALR2615011T - Weekend_15.mp4" (ren "%%F" "SEALR2615011T - Weekend_15.mp4" & echo   renamed  %%F  to  SEALR2615011T - Weekend_15.mp4)
echo.
echo Done.
dir /b "SEALR*" 2>nul
pause
