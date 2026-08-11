@echo off
rem ================================================================
rem  Wettermark Keith - add titles to ISCI-named files (August 2026)
rem
rem  Takes each file to "ISCI - Title.mov" no matter which state it
rem  is in right now:
rem    BRMWK2605003T.mov            -> BRMWK2605003T - Free Consultation_05.mov
rem    Free Consultation_BHAM_5.mov -> BRMWK2605003T - Free Consultation_05.mov
rem    already renamed              -> left alone, reported OK
rem
rem  Put this .bat in the folder with the files and double-click it.
rem ================================================================
setlocal
echo.
echo --- Free Consultation_05 ---
call :r "BRMWK2605003T" "Free Consultation_BHAM_5" "BRMWK2605003T - Free Consultation_05"
call :r "CHAWK2605003T" "Free Consultation_CHAT_5" "CHAWK2605003T - Free Consultation_05"
call :r "DHNWK2605003T" "Free Consultation_DOTH_5" "DHNWK2605003T - Free Consultation_05"
call :r "HSVWK2605003T" "Free Consultation_HUNT_5" "HSVWK2605003T - Free Consultation_05"
call :r "KNXWK2605003T" "Free Consultation_KNOX_5" "KNXWK2605003T - Free Consultation_05"
call :r "MTGWK2605003T" "Free Consultation_MONT_5" "MTGWK2605003T - Free Consultation_05"
call :r "NSHWK2605003T" "Free Consultation_NASH_5" "NSHWK2605003T - Free Consultation_05"
echo.
echo --- General PI_05 ---
call :r "BRMWK2605004T" "General PI_BHAM_5" "BRMWK2605004T - General PI_05"
call :r "CHAWK2605004T" "General PI_CHAT_5" "CHAWK2605004T - General PI_05"
call :r "DHNWK2605004T" "General PI_DOTH_5" "DHNWK2605004T - General PI_05"
call :r "HSVWK2605004T" "General PI_HUNT_5" "HSVWK2605004T - General PI_05"
call :r "KNXWK2605004T" "General PI_KNOX_5" "KNXWK2605004T - General PI_05"
call :r "MTGWK2605004T" "General PI_MONT_5" "MTGWK2605004T - General PI_05"
call :r "NSHWK2605004T" "General PI_NASH_5" "NSHWK2605004T - General PI_05"
echo.
echo --- General PI_10 ---
call :r "BRMWK2610003T" "General PI_BHAM_10" "BRMWK2610003T - General PI_10"
call :r "CHAWK2610003T" "General PI_CHAT_10" "CHAWK2610003T - General PI_10"
call :r "DHNWK2610003T" "General PI_DOTH_10" "DHNWK2610003T - General PI_10"
call :r "HSVWK2610003T" "General PI_HUNT_10" "HSVWK2610003T - General PI_10"
call :r "KNXWK2610003T" "General PI_KNOX_10" "KNXWK2610003T - General PI_10"
call :r "MTGWK2610003T" "General PI_MONT_10" "MTGWK2610003T - General PI_10"
call :r "NSHWK2610003T" "General PI_NASH_10" "NSHWK2610003T - General PI_10"
echo.
echo --- It's About You_10 ---
call :r "BRMWK2610004T" "It_s About You_BHAM_10" "BRMWK2610004T - It's About You_10"
call :r "CHAWK2610004T" "It_s About You_CHAT_10" "CHAWK2610004T - It's About You_10"
call :r "DHNWK2610004T" "It_s About You_DOTH_10" "DHNWK2610004T - It's About You_10"
call :r "HSVWK2610004T" "It_s About You_HUNT_10" "HSVWK2610004T - It's About You_10"
call :r "KNXWK2610004T" "It_s About You_KNOX_10" "KNXWK2610004T - It's About You_10"
call :r "MTGWK2610004T" "It_s About You_MONT_10" "MTGWK2610004T - It's About You_10"
call :r "NSHWK2610004T" "It_s About You_NASH_10" "NSHWK2610004T - It's About You_10"
echo.
echo Done.
pause
exit /b

rem %1 = bare ISCI name, %2 = original vendor name, %3 = final "ISCI - Title"
:r
set "done="
for %%E in (mov mp4) do (
  if exist "%~3.%%E" (
    echo   OK       %~3.%%E already named
    set "done=1"
  ) else if exist "%~1.%%E" (
    ren "%~1.%%E" "%~3.%%E"
    echo   renamed  %~1.%%E  to  %~3.%%E
    set "done=1"
  ) else if exist "%~2.%%E" (
    ren "%~2.%%E" "%~3.%%E"
    echo   renamed  %~2.%%E  to  %~3.%%E
    set "done=1"
  )
)
if not defined done echo   MISSING  %~1 / %~2  -  no .mov or .mp4 found
exit /b
