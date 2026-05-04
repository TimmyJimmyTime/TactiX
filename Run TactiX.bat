@echo off
title TactiX Dev Server
cd /d "%~dp0"
echo Starting TactiX dev server...
start "TactiX Server" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
start "" http://localhost:5175
