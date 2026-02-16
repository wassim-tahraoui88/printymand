@echo off

echo Starting frontend...
cd ..\frontend
call npm install
if errorlevel 1 exit /b 1
call npm run build
if errorlevel 1 exit /b 1
call npm run start
if errorlevel 1 exit /b 1