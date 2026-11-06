@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Run npm install in this folder first.
  pause
  exit /b 1
)
call npm start
if errorlevel 1 pause
