#!/usr/bin/env bash
set -e

# Change directory to script's directory
cd "$(dirname "$0")"

echo "==================================================="
echo "          LUMINALENS STUDIO - RUNNER"
echo "==================================================="
echo ""

# 1. Check for Java 21+ compiler and runtime
if ! command -v javac &> /dev/null; then
    echo "[ERROR] 'javac' compiler not found. Please install JDK 21+."
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo "[ERROR] 'java' runtime not found. Please install JRE/JDK 21+."
    exit 1
fi

# 2. Ensure output directory exists
mkdir -p bin

# 3. Find and compile all Java source files
echo "[*] Compiling Java source files..."
JAVA_FILES=$(find src -name "*.java" 2>/dev/null)

if [ -z "$JAVA_FILES" ]; then
    echo "[!] No Java source files found in src/."
    exit 1
fi

javac -encoding UTF-8 -d bin $JAVA_FILES
echo "[OK] Compilation successful!"
echo ""

# 4. Start HTTP Server
echo "[*] Launching LuminaLens Studio Server on http://localhost:8080 ..."
echo "[*] Press Ctrl+C to terminate."
echo ""

if [ -f "bin/server/LuminaServer.class" ]; then
    java -Dfile.encoding=UTF-8 -cp bin server.LuminaServer
elif [ -f "bin/LuminaServer.class" ]; then
    java -Dfile.encoding=UTF-8 -cp bin LuminaServer
else
    echo "[ERROR] LuminaServer class not found in bin/."
    exit 1
fi
