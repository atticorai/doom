@echo off
rem  Sorts the LNR radio MP3s into one folder per market.
rem  Put this .bat in the folder with the files and double-click it.
setlocal
md "Albuquerque" 2>nul
move "LNR_ALB*.*" "Albuquerque\" >nul 2>&1
echo   Albuquerque: & dir /b "Albuquerque"
md "Chicago" 2>nul
move "LNR_Chicago*.*" "Chicago\" >nul 2>&1
echo   Chicago: & dir /b "Chicago"
md "Las Vegas" 2>nul
move "LNR_Vegas*.*" "Las Vegas\" >nul 2>&1
echo   Las Vegas: & dir /b "Las Vegas"
md "Phoenix" 2>nul
move "LNR_Phoenix*.*" "Phoenix\" >nul 2>&1
echo   Phoenix: & dir /b "Phoenix"
md "Reno" 2>nul
move "LNR_Reno*.*" "Reno\" >nul 2>&1
echo   Reno: & dir /b "Reno"
md "Seattle" 2>nul
move "LNR_Seattle*.*" "Seattle\" >nul 2>&1
echo   Seattle: & dir /b "Seattle"
md "Tucson" 2>nul
move "LNR_Tucson*.*" "Tucson\" >nul 2>&1
echo   Tucson: & dir /b "Tucson"
md "Yuma" 2>nul
move "LNR_Yuma*.*" "Yuma\" >nul 2>&1
echo   Yuma: & dir /b "Yuma"
echo.
echo Done - each market is in its own folder.
pause
