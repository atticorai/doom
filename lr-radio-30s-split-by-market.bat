@echo off
rem  Sorts the ISCI-named L&R radio files into one folder per market.
rem  Put this .bat in the folder with the 20 files and double-click it.
cd /d "%~dp0"
for %%M in (Albuquerque Phoenix Tucson Reno) do if not exist "%%M" mkdir "%%M"
move "ABQLR*" "Albuquerque" >nul 2>&1
move "PHXLR*" "Phoenix" >nul 2>&1
move "TUCLR*" "Tucson" >nul 2>&1
move "RNOLR*" "Reno" >nul 2>&1
echo.
echo Albuquerque: & dir /b "Albuquerque"
echo. & echo Phoenix: & dir /b "Phoenix"
echo. & echo Tucson: & dir /b "Tucson"
echo. & echo Reno: & dir /b "Reno"
echo.
pause
