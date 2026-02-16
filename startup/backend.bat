@echo off

echo Starting backend...
cd ..\backend
call npm install
if errorlevel 1 exit /b 1
call npm run dev
if errorlevel 1 exit /b 1