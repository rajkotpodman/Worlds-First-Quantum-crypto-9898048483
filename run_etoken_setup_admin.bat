@echo off
:: ==============================================================================
:: Aladdin eToken Pro 4254 - Administrator Driver & Hardware Format Runner
:: ==============================================================================

:: Check for Administrator permissions
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Requesting administrative privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ==============================================================================
echo  [Aladdin eToken Pro 4254 - Automated Driver & 51%% Hardware Setup]
echo ==============================================================================

echo [*] Installing Aladdin eToken USB Drivers into Windows Driver Store...
pnputil.exe /add-driver "C:\Users\DELL\Downloads\pki_rte_files\Windows\System32\Setup\Aladdin\eToken\*.inf" /install

echo [*] Starting Smart Card Service (SCardSvr)...
sc config SCardSvr start= auto
net start SCardSvr

echo [*] Executing Token Formatting and 51%% Sovereign Stake Lock...
cd /d "e:\ai-secure-space-&-android-ci_cd-pipeline-dashboard (3)"
powershell.exe -ExecutionPolicy Bypass -File "scripts\format_and_secure_token.ps1"

echo.
echo ==============================================================================
echo  Hardware and 51%% Stake Setup Process Finished!
echo ==============================================================================
pause
