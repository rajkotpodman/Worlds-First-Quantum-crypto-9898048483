@echo off
:: ==============================================================================
:: Aladdin eToken Pro 4254 - Administrator Driver & Hardware Format Runner
:: ==============================================================================

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
pnputil.exe /add-driver "E:\eToken_Driver\*.inf" /install
pnputil.exe /add-driver "C:\Users\DELL\OneDrive\Desktop\eToken_Driver\*.inf" /install

echo [*] Deploying Aladdin Smart Card Reader Driver (AKSIFDH)...
copy /Y "E:\eToken_Driver\aksifdh.sys" "%windir%\System32\drivers\aksifdh.sys" >nul 2>&1
copy /Y "C:\Users\DELL\OneDrive\Desktop\eToken_Driver\aksifdh.sys" "%windir%\System32\drivers\aksifdh.sys" >nul 2>&1
sc create AKSIFDH binPath= "%windir%\System32\drivers\aksifdh.sys" type= kernel start= demand DisplayName= "Aladdin IFD Handler" >nul 2>&1
sc start AKSIFDH >nul 2>&1
rundll32.exe setupapi.dll,InstallHinfSection DefaultInstall 132 E:\eToken_Driver\aksifdh.inf >nul 2>&1

echo [*] Scanning for hardware device updates...
pnputil.exe /scan-devices

echo [*] Starting Smart Card Service (SCardSvr)...
sc config SCardSvr start= auto
net start SCardSvr
sc config ScDeviceEnum start= auto
net start ScDeviceEnum >nul 2>&1

echo [*] Executing Token Formatting and 51%% Sovereign Stake Lock...
cd /d "e:\ai-secure-space-&-android-ci_cd-pipeline-dashboard (3)"
powershell.exe -ExecutionPolicy Bypass -File "scripts\format_and_secure_token.ps1"

echo.
echo ==============================================================================
echo  Hardware and 51%% Stake Setup Process Finished!
echo ==============================================================================
pause
