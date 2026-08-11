@echo off
rem ================================================================
rem  Wettermark Keith - new creative to ISCI rename (August 2026)
rem
rem  Free Consultation_05  ->  {MKT}WK2605003T
rem  General PI_05         ->  {MKT}WK2605004T
rem  General PI_10         ->  {MKT}WK2610003T
rem  It's About You_10     ->  {MKT}WK2610004T
rem
rem  Same title = same sequence number in every market; only the
rem  market prefix changes:
rem    BHAM=BRM  HUNT=HSV  KNOX=KNX  CHAT=CHA  MONT=MTG  DOTH=DHN  NASH=NSH
rem
rem  Put this .bat in the folder with the delivered .mov files and
rem  double-click it. Missing or already-renamed files are reported.
rem ================================================================
setlocal
echo.
echo --- Free Consultation_05 ---
call :r "Free Consultation_BHAM_5" BRMWK2605003T
call :r "Free Consultation_CHAT_5" CHAWK2605003T
call :r "Free Consultation_DOTH_5" DHNWK2605003T
call :r "Free Consultation_HUNT_5" HSVWK2605003T
call :r "Free Consultation_KNOX_5" KNXWK2605003T
call :r "Free Consultation_MONT_5" MTGWK2605003T
call :r "Free Consultation_NASH_5" NSHWK2605003T
echo.
echo --- General PI_05 ---
call :r "General PI_BHAM_5" BRMWK2605004T
call :r "General PI_CHAT_5" CHAWK2605004T
call :r "General PI_DOTH_5" DHNWK2605004T
call :r "General PI_HUNT_5" HSVWK2605004T
call :r "General PI_KNOX_5" KNXWK2605004T
call :r "General PI_MONT_5" MTGWK2605004T
call :r "General PI_NASH_5" NSHWK2605004T
echo.
echo --- General PI_10 ---
call :r "General PI_BHAM_10" BRMWK2610003T
call :r "General PI_CHAT_10" CHAWK2610003T
call :r "General PI_DOTH_10" DHNWK2610003T
call :r "General PI_HUNT_10" HSVWK2610003T
call :r "General PI_KNOX_10" KNXWK2610003T
call :r "General PI_MONT_10" MTGWK2610003T
call :r "General PI_NASH_10" NSHWK2610003T
echo.
echo --- It's About You_10 ---
call :r "It_s About You_BHAM_10" BRMWK2610004T
call :r "It_s About You_CHAT_10" CHAWK2610004T
call :r "It_s About You_DOTH_10" DHNWK2610004T
call :r "It_s About You_HUNT_10" HSVWK2610004T
call :r "It_s About You_KNOX_10" KNXWK2610004T
call :r "It_s About You_MONT_10" MTGWK2610004T
call :r "It_s About You_NASH_10" NSHWK2610004T
echo.
echo Done.
pause
exit /b

:r
set "done="
for %%E in (mov mp4) do (
  if exist "%~1.%%E" (
    ren "%~1.%%E" "%~2.%%E"
    echo   renamed  %~1.%%E  to  %~2.%%E
    set "done=1"
  )
)
if not defined done echo   MISSING  %~1  -  no .mov or .mp4 found
exit /b
