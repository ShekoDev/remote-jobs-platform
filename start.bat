@echo off
setlocal
title Remote Jobs Platform
cd /d "%~dp0"

echo ==========================================
echo   Remote Jobs Platform - setup and start
echo ==========================================
echo.

:: 1) Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed. Download it from https://nodejs.org ^(LTS^) and run this file again.
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

:: 2) .env
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo [OK] Created .env from .env.example
) else (
  echo [OK] .env already exists
)

:: 3) Dependencies
if not exist "node_modules\" (
  echo [..] Installing dependencies ^(first run, takes a few minutes^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
) else (
  echo [OK] Dependencies already installed
)

:: 4) Database: Docker if available, otherwise the built-in local PostgreSQL (no install needed)
set DB_MODE=none
where docker >nul 2>nul
if not errorlevel 1 (
  docker compose up -d >nul 2>nul
  if not errorlevel 1 set DB_MODE=docker
)
if "%DB_MODE%"=="docker" (
  echo [OK] PostgreSQL running in Docker
  timeout /t 4 /nobreak >nul
) else (
  echo [..] Docker not available - starting built-in local PostgreSQL in a new window...
  start "Remote Jobs - Database (keep open)" cmd /k "cd /d ""%~dp0"" && npm run db:local"
  set DB_MODE=local
  echo [..] Waiting for the database to accept connections...
  timeout /t 12 /nobreak >nul
)

:: 5) Database schema
echo [..] Creating database tables...
call npx prisma generate >nul
call npx prisma db push --accept-data-loss
if errorlevel 1 (
  echo.
  echo [..] Database not ready yet, waiting a bit longer and retrying...
  timeout /t 10 /nobreak >nul
  call npx prisma db push --accept-data-loss
  if errorlevel 1 (
    echo [ERROR] Could not connect to the database.
    echo         Look at the "Remote Jobs - Database" window for errors, then run start.bat again.
    pause
    exit /b 1
  )
)
echo [OK] Database ready

:: 6) First ingest (pull real jobs from all sources)
echo [..] Pulling live jobs from all sources ^(this can take a minute^)...
call npm run ingest
echo.

:: 7) Worker in a second window, web app here
echo [..] Starting background worker in a new window...
start "Remote Jobs - Worker" cmd /k "cd /d ""%~dp0"" && npm run worker"

echo [..] Starting the web app at http://localhost:3000
echo      ^(close this window to stop the site; keep the Database window open^)
echo.
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
call npm run dev

pause
