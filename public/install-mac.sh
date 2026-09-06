#!/bin/bash
# AI Secure Space - Automated macOS One-Click Installer
# Universal for Apple Silicon (M1/M2/M3/M4) and Intel (x86_64)

set -e
echo "================================================================"
echo "  AI SECURE SPACE - macOS Autonomous Security Node Installer"
echo "================================================================"

TARGET_APP="/Applications/AI Secure Space.app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_APP="$SCRIPT_DIR/AI Secure Space.app"

if [ ! -d "$SOURCE_APP" ]; then
    if [ -d "/Volumes/AI_SECURE_SPACE/AI Secure Space.app" ]; then
        SOURCE_APP="/Volumes/AI_SECURE_SPACE/AI Secure Space.app"
    else
        echo "[-] Could not find 'AI Secure Space.app' in current directory."
        exit 1
    fi
fi

echo "[1/3] Copying 'AI Secure Space.app' to /Applications..."
if [ -d "$TARGET_APP" ]; then
    echo "      Removing existing installation..."
    rm -rf "$TARGET_APP"
fi
cp -R "$SOURCE_APP" "/Applications/"

echo "[2/3] Approving macOS Gatekeeper security attributes..."
xattr -cr "$TARGET_APP" 2>/dev/null || true
chmod +x "$TARGET_APP/Contents/MacOS/AI Secure Space"

echo "[3/3] Launching AI Secure Space..."
open "$TARGET_APP"

echo "================================================================"
echo "  ✓ Installation Successful! Application is running."
echo "================================================================"
