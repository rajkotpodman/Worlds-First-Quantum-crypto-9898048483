@echo off
:: ==============================================================================
:: Start Smart Card Services for SafeNet eToken Client
:: ==============================================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Administrator privileges required. Requesting UAC elevation...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ==============================================================================
echo  Enabling and Starting Windows Smart Card Services...
echo ==============================================================================

sc config SCardSvr start= auto
net start SCardSvr

sc config ScDeviceEnum start= auto
net start ScDeviceEnum

sc config CertPropSvr start= auto
net start CertPropSvr

echo [*] Scanning PnP devices...
pnputil /scan-devices

echo.
echo ==============================================================================
echo  [SUCCESS] Smart Card services are now RUNNING!
echo  Please refresh or reopen SafeNet Authentication Client Tools now.
echo ==============================================================================
timeout /t 5
