@echo off
setlocal enabledelayedexpansion

title LuminaLens Studio - Server Runner
chcp 65001 > nul

:: Ensure script runs from project root directory
cd /d "%~dp0"

echo ===================================================
echo           LUMINALENS STUDIO - RUNNER
echo ===================================================
echo.

:: 1. Check for Java 21+ compiler and runtime
where javac >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'javac' compiler was not found on PATH.
    echo Please install JDK 21+ and verify PATH configuration.
    pause
    exit /b 1
)

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 'java' runtime was not found on PATH.
    echo Please install JRE/JDK 21+ and verify PATH configuration.
    pause
    exit /b 1
)

:: 2. Ensure output directory exists
if not exist "bin" mkdir "bin"

:: 3. Find and compile all Java source files
echo [*] Compiling Java source files...
set "JAVA_SOURCES="
for /r "src" %%F in (*.java) do (
    set "JAVA_SOURCES=!JAVA_SOURCES! "%%F""
)

if "!JAVA_SOURCES!"=="" (
    echo [!] No Java source files found in src\.
    echo [*] Please ensure src\server\LuminaServer.java is present.
    pause
    exit /b 1
)

javac -encoding UTF-8 -d "bin" !JAVA_SOURCES!
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. Please check compiler errors above.
    pause
    exit /b %errorlevel%
)
echo [OK] Compilation successful!
echo.

:: 4. Start HTTP Server
echo [*] Launching LuminaLens Studio Server on http://localhost:8080 ...
echo [*] Press Ctrl+C in this console to stop the server.
echo.

if exist "bin\server\LuminaServer.class" (
    java -Dfile.encoding=UTF-8 -cp "bin" server.LuminaServer
) else if exist "bin\LuminaServer.class" (
    java -Dfile.encoding=UTF-8 -cp "bin" LuminaServer
) else (
    echo [ERROR] LuminaServer class file not found in bin\.
    pause
    exit /b 1
)

pause
