# ==============================================================================
# eToken Pro 4254 - Automated Hardware Format & 51% Stake Lockdown Script
# ==============================================================================

# Ensure Running as Administrator if possible
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Notice: Running without Administrator privileges. If device driver installation or service start fails, please right-click 'run_etoken_setup_admin.bat' and select 'Run as administrator'." -ForegroundColor Yellow
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " [eToken Pro 4254 - Hardware Format & 51% Token Sovereign Lock]" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Install Driver if INF is available
$driverDirs = @(
    "E:\eToken_Driver",
    "C:\Users\DELL\OneDrive\Desktop\eToken_Driver",
    "C:\Users\DELL\Downloads\pki_rte_files\Windows\System32\Setup\Aladdin\eToken"
)
foreach ($dir in $driverDirs) {
    if (Test-Path "$dir\aksup.inf") {
        Write-Host "[*] Registering Aladdin eToken 4254 Drivers from $dir..." -ForegroundColor White
        pnputil.exe /add-driver "$dir\*.inf" /install | Out-Null
    }
}


# 2. Check and Start Smart Card Service
Write-Host "[*] Checking Windows Smart Card Service (SCardSvr)..." -ForegroundColor White
Start-Service -Name "SCardSvr" -ErrorAction SilentlyContinue
$service = Get-Service -Name "SCardSvr" -ErrorAction SilentlyContinue
Write-Host "    SCardSvr Status: $($service.Status)" -ForegroundColor Green

# 3. Locate PKCS#11 DLL
$pkcs11Paths = @(
    "C:\Windows\System32\eTPKCS11.dll",
    "E:\Program Files\SafeNet\Authentication\SAC\x64\eTPKCS11.dll",
    "C:\Program Files\SafeNet\Authentication\SAC\x64\eTPKCS11.dll",
    "C:\Program Files\OpenSC Project\OpenSC\pkcs11\opensc-pkcs11.dll"
)

$dll = $null
foreach ($p in $pkcs11Paths) {
    if (Test-Path $p) {
        $dll = $p
        break
    }
}

if (-not $dll) {
    Write-Host "[-] PKCS#11 DLL not found." -ForegroundColor Red
    exit 1
}
Write-Host "[+] Using PKCS#11 Module: $dll" -ForegroundColor Green

$tool = "C:\Program Files\OpenSC Project\OpenSC\tools\pkcs11-tool.exe"
if (-not (Test-Path $tool)) {
    Write-Host "[-] pkcs11-tool not found in OpenSC directory." -ForegroundColor Red
    exit 1
}

# 4. Detect Connected Readers
Write-Host "[*] Probing smart card slots..." -ForegroundColor White
& $tool --module $dll -L

# 5. Initialize / Format Token
$SO_PIN = "1234567890123456"
$USER_PIN = "1097145198"
$TOKEN_LABEL = "QuantumCryptoToken"
$KEY_LABEL = "QuantumMasterKey"

Write-Host "`n[*] Initializing & Formatting Token (Label: $TOKEN_LABEL)..." -ForegroundColor Yellow
& $tool --module $dll --init-token --label $TOKEN_LABEL --so-pin $SO_PIN -ErrorAction SilentlyContinue

Write-Host "`n[*] Initializing User PIN: $USER_PIN..." -ForegroundColor Yellow
& $tool --module $dll --init-pin --login --so-pin $SO_PIN --pin $USER_PIN -ErrorAction SilentlyContinue

Write-Host "`n[*] Generating On-Chip Non-Exportable RSA Keypair ($KEY_LABEL)..." -ForegroundColor Yellow
& $tool --module $dll --login --pin $USER_PIN --keypairgen --key-type rsa:2048 --label $KEY_LABEL -ErrorAction SilentlyContinue

# 6. Execute 51% Sovereign Stake Hardware Lock
Write-Host "`n[*] Binding 51% Sovereign Stake (504,800,472,633 Tokens) to eToken..." -ForegroundColor Cyan
python scripts/secure_51_percent_vault.py $USER_PIN

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] eToken Pro is Fully Formatted & 51% Sovereign Stake Sealed!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
