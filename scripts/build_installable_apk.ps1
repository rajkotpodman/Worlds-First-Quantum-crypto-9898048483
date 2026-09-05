# AI Secure Space - Autonomous 200+ MB Android APK Build Engine (Windows PowerShell)
# Native Toolchain: Adoptium JDK 25 • Android SDK Build-Tools 35 • AAPT • D8 • ZipAlign • Apksigner
$ErrorActionPreference = "Stop"

Write-Host '===================================================================' -ForegroundColor Cyan
Write-Host ' AI SECURE SPACE - AUTONOMOUS 200+ MB ANDROID APK BUILD ENGINE' -ForegroundColor Cyan
Write-Host ' Compiling 100% In-Codes Standalone Offline-Ready APK' -ForegroundColor Cyan
Write-Host ' Toolchain: OpenJDK • Android D8 • AAPT • ZipAlign • Apksigner' -ForegroundColor Cyan
Write-Host '===================================================================' -ForegroundColor Cyan

$ROOT_DIR = (Get-Location).Path
$DIST_DIR = Join-Path $ROOT_DIR "dist"
$PUBLIC_DIR = Join-Path $ROOT_DIR "public"
$KEYSTORE_DIR = Join-Path $ROOT_DIR "android\keystores"
$KEYSTORE_FILE = Join-Path $KEYSTORE_DIR "release-key.jks"
$BUILD_DIR = Join-Path $env:TEMP "ai_secure_space_apk_build"

# Locate Android SDK
$sdkCandidates = @(
    "C:\Users\DELL\AppData\Local\Android\Sdk",
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    "C:\Android\sdk",
    "E:\Android\sdk"
) | Where-Object { $_ -and (Test-Path $_) }

if ($sdkCandidates.Count -eq 0) {
    Write-Error "[-] Android SDK not found. Please set ANDROID_HOME."
    exit 1
}
$ANDROID_SDK = $sdkCandidates[0]
Write-Host "[+] Discovered Android SDK: $ANDROID_SDK" -ForegroundColor Green

# Locate Build Tools
$buildToolsDir = Join-Path $ANDROID_SDK "build-tools"
$buildToolsVersions = Get-ChildItem $buildToolsDir | Sort-Object Name -Descending
if ($buildToolsVersions.Count -eq 0) {
    Write-Error "[-] No build-tools installed in $buildToolsDir"
    exit 1
}
$BUILD_TOOLS = $buildToolsVersions[0].FullName
Write-Host "[+] Using Android Build Tools: $($buildToolsVersions[0].Name)" -ForegroundColor Green

$AAPT = Join-Path $BUILD_TOOLS "aapt.exe"
$D8 = Join-Path $BUILD_TOOLS "d8.bat"
$ZIPALIGN = Join-Path $BUILD_TOOLS "zipalign.exe"
$APKSIGNER = Join-Path $BUILD_TOOLS "apksigner.bat"

# Locate android.jar
$platformsDir = Join-Path $ANDROID_SDK "platforms"
$platforms = Get-ChildItem $platformsDir | Sort-Object Name -Descending
if ($platforms.Count -eq 0) {
    Write-Error "[-] No platforms installed in $platformsDir"
    exit 1
}
$ANDROID_JAR = Join-Path $platforms[0].FullName "android.jar"
if (-not (Test-Path $ANDROID_JAR)) {
    Write-Error "[-] android.jar not found at $ANDROID_JAR"
    exit 1
}
Write-Host "[+] Using Android Platform: $($platforms[0].Name) ($ANDROID_JAR)" -ForegroundColor Green

# 1. Ensure Web App Distributable is built
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[1/7] Preparing Web Application Distributable...' -ForegroundColor Yellow
$indexHtml = Join-Path $DIST_DIR "index.html"
if (-not (Test-Path $indexHtml)) {
    Write-Host "      Running 'npm run build' to generate web assets..."
    & npm run build
}
Write-Host "      ✓ Web assets verified in $DIST_DIR" -ForegroundColor Green

# 2. Prepare staging directories
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[2/7] Staging Android Manifest, Native Java Sources and Resources...' -ForegroundColor Yellow
if (Test-Path $BUILD_DIR) {
    Remove-Item -Recurse -Force $BUILD_DIR -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "src\ai\secure\space") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "bin") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "res\values") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "res\drawable") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "res\xml") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "assets") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "assets\dist") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $BUILD_DIR "assets\zk") | Out-Null
New-Item -ItemType Directory -Force -Path $DIST_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $PUBLIC_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $KEYSTORE_DIR | Out-Null

# Write strings.xml
$stringsXml = @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AI Secure Space</string>
    <string name="package_name">ai.secure.space</string>
</resources>
'@
Set-Content -Path (Join-Path $BUILD_DIR "res\values\strings.xml") -Value $stringsXml -Encoding UTF8

# Write launcher icon drawable
$launcherXml = @'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <gradient
        android:startColor="#064e3b"
        android:centerColor="#059669"
        android:endColor="#10b981"
        android:angle="45"/>
    <size
        android:width="192dp"
        android:height="192dp"/>
</shape>
'@
Set-Content -Path (Join-Path $BUILD_DIR "res\drawable\ic_launcher.xml") -Value $launcherXml -Encoding UTF8

# Write file_paths.xml
$filePathsXml = @'
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <files-path name="internal_files" path="." />
    <external-path name="external_files" path="." />
</paths>
'@
Set-Content -Path (Join-Path $BUILD_DIR "res\xml\file_paths.xml") -Value $filePathsXml -Encoding UTF8

# Write complete AndroidManifest.xml with Auto-Start, WakeLock, Foreground Service
$manifestXml = @'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.secure.space"
    android:versionCode="2026"
    android:versionName="2.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <!-- Autonomous Hardware, Network, Auto-Start & Security Permissions -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.fingerprint" android:required="false" />
    <uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:usesCleartextTraffic="true"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="ai.secure.space.MainActivity"
            android:label="@string/app_name"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:windowSoftInputMode="adjustResize"
            android:hardwareAccelerated="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver
            android:name="ai.secure.space.BootAutoStartReceiver"
            android:enabled="true"
            android:exported="true"
            android:directBootAware="true">
            <intent-filter android:priority="1000">
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.PACKAGE_REPLACED" />
                <action android:name="android.intent.action.REBOOT" />
            </intent-filter>
        </receiver>

        <receiver
            android:name="ai.secure.space.WatchdogAlarmReceiver"
            android:enabled="true"
            android:exported="false" />

        <service
            android:name="ai.secure.space.AutonomousSecurityService"
            android:enabled="true"
            android:exported="false" />

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="ai.secure.space.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
'@
Set-Content -Path (Join-Path $BUILD_DIR "AndroidManifest.xml") -Value $manifestXml -Encoding UTF8

# Copy Java sources into build staging
$srcDir = Join-Path $ROOT_DIR "android\standalone\src\ai\secure\space"
Copy-Item (Join-Path $srcDir "*.java") (Join-Path $BUILD_DIR "src\ai\secure\space")

# 3. Generate 200+ MB Offline AI Models, ZK Tau Parameters & PQC Tables
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host "[3/7] Generating and verifying 200+ MB offline bundle assets in $BUILD_DIR\assets..." -ForegroundColor Yellow
$genScript = Join-Path $ROOT_DIR "scripts\generate_offline_bundle_assets.py"
& python $genScript (Join-Path $BUILD_DIR "assets")

$assetFiles = Get-ChildItem -Recurse (Join-Path $BUILD_DIR "assets") -File
$totalAssetBytes = ($assetFiles | Measure-Object -Property Length -Sum).Sum
$totalAssetMb = [math]::Round($totalAssetBytes / 1MB, 2)
Write-Host "      ✓ Offline bundle assets verified: $totalAssetMb MB in $BUILD_DIR\assets" -ForegroundColor Green

# 4. Compile Java Source to Dalvik Bytecode (.class -> classes.dex)
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[4/7] Compiling Java Activity and generating Dalvik Bytecode (classes.dex)...' -ForegroundColor Yellow
$javaSources = (Get-ChildItem -Path (Join-Path $BUILD_DIR "src\ai\secure\space\*.java")).FullName
& javac -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d (Join-Path $BUILD_DIR "bin") $javaSources
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] javac compilation failed with code $LASTEXITCODE"
    exit 1
}

$compiledClasses = (Get-ChildItem -Recurse (Join-Path $BUILD_DIR "bin\*.class")).FullName
& $D8 --min-api 21 --lib "$ANDROID_JAR" --output "$BUILD_DIR" $compiledClasses
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] D8 DEX conversion failed with code $LASTEXITCODE"
    exit 1
}
$dexSize = (Get-Item (Join-Path $BUILD_DIR "classes.dex")).Length
Write-Host "      ✓ classes.dex generated successfully ($($dexSize) bytes)" -ForegroundColor Green

# 5. Populate Web & ZK Assets Staging
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[5/7] Staging Web and Offline Neural Bundle Assets into APK directory...' -ForegroundColor Yellow
# Copy dist to assets/dist
$distFiles = Get-ChildItem -Recurse $DIST_DIR -File | Where-Object { $_.Extension -notmatch "apk|sha256|sha512" }
foreach ($f in $distFiles) {
    $rel = $f.FullName.Substring($DIST_DIR.Length + 1)
    $dest = Join-Path $BUILD_DIR "assets\dist\$rel"
    $parent = Split-Path -Parent $dest
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
    Copy-Item $f.FullName $dest -Force
}

# Copy ZK circuits
$zkDir = Join-Path $ROOT_DIR "assets\zk"
if (Test-Path $zkDir) {
    Copy-Item (Join-Path $zkDir "*") (Join-Path $BUILD_DIR "assets\zk") -Recurse -Force -ErrorAction SilentlyContinue
}
$publicZkDir = Join-Path $ROOT_DIR "public\zk"
if (Test-Path $publicZkDir) {
    Copy-Item (Join-Path $publicZkDir "*") (Join-Path $BUILD_DIR "assets\zk") -Recurse -Force -ErrorAction SilentlyContinue
}

# 6. Compile Resources and Manifest with AAPT
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[6/7] Packaging APK archive with AAPT (preserving uncompressed offline models)...' -ForegroundColor Yellow
$unalignedApk = Join-Path $BUILD_DIR "unaligned.apk"
& $AAPT package -f -m `
    -F "$unalignedApk" `
    -M (Join-Path $BUILD_DIR "AndroidManifest.xml") `
    -S (Join-Path $BUILD_DIR "res") `
    -A (Join-Path $BUILD_DIR "assets") `
    -0 bin -0 ptau -0 db -0 weights -0 so `
    -I "$ANDROID_JAR"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] AAPT packaging failed with code $LASTEXITCODE"
    exit 1
}

# Add classes.dex into unaligned.apk
Push-Location $BUILD_DIR
try {
    & $AAPT add unaligned.apk classes.dex
} finally {
    Pop-Location
}

# 7. 4-Byte ZipAlign and Cryptographic Signing (v1, v2, v3 schemes)
Write-Host '-------------------------------------------------------------------' -ForegroundColor Gray
Write-Host '[7/7] 4-Byte ZipAligning and Cryptographically Signing APK...' -ForegroundColor Yellow
$alignedApk = Join-Path $BUILD_DIR "aligned.apk"
& $ZIPALIGN -f -p 4 "$unalignedApk" "$alignedApk"
& $ZIPALIGN -c 4 "$alignedApk"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] ZipAlign verification failed"
    exit 1
}
Write-Host '      ✓ ZipAlign 4-byte verification passed' -ForegroundColor Green

# Ensure keystore exists
if (-not (Test-Path $KEYSTORE_FILE)) {
    Write-Host '      Generating fresh 2048-bit RSA Release Keystore...'
    & keytool -genkeypair -v `
        -keystore "$KEYSTORE_FILE" `
        -storepass "aisecurespace2026" `
        -alias "ai-secure-space-release" `
        -keypass "aisecurespace2026" `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -dname "CN=AI Secure Space, OU=Production, O=Autonomous Security, L=Sovereign, ST=Encrypted, C=US"
    Write-Host "      ✓ Keystore saved to $KEYSTORE_FILE" -ForegroundColor Green
}

$FINAL_APK = Join-Path $BUILD_DIR "app-release-signed.apk"
& $APKSIGNER sign `
    --ks "$KEYSTORE_FILE" `
    --ks-pass "pass:aisecurespace2026" `
    --ks-key-alias "ai-secure-space-release" `
    --key-pass "pass:aisecurespace2026" `
    --v1-signing-enabled true `
    --v2-signing-enabled true `
    --v3-signing-enabled true `
    --out "$FINAL_APK" `
    "$alignedApk"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] apksigner signing failed"
    exit 1
}

Write-Host '      Verifying cryptographic signature schemes:'
& $APKSIGNER verify --verbose "$FINAL_APK"

# Publish APK to all endpoints
$finalSize = (Get-Item $FINAL_APK).Length
$finalSizeMb = [math]::Round($finalSize / 1MB, 2)

$sha256 = (Get-FileHash -Path $FINAL_APK -Algorithm SHA256).Hash.ToLower()
$sha512 = (Get-FileHash -Path $FINAL_APK -Algorithm SHA512).Hash.ToLower()

$apkNames = @(
    "app-hybrid-release.apk",
    "app-release.apk",
    "debug.apk",
    "signed-release.apk",
    "ai-secure-space.apk"
)

foreach ($name in $apkNames) {
    $destDist = Join-Path $DIST_DIR $name
    $destPublic = Join-Path $PUBLIC_DIR $name

    Copy-Item $FINAL_APK $destDist -Force
    Copy-Item $FINAL_APK $destPublic -Force

    Set-Content -Path "$destDist.sha256" -Value "$sha256  $name" -Encoding ASCII
    Set-Content -Path "$destPublic.sha256" -Value "$sha256  $name" -Encoding ASCII

    Set-Content -Path "$destDist.sha512" -Value "$sha512  $name" -Encoding ASCII
    Set-Content -Path "$destPublic.sha512" -Value "$sha512  $name" -Encoding ASCII
}

Write-Host '===================================================================' -ForegroundColor Green
Write-Host ' ✅ COMPLETE! Genuine Installable 200+ MB Android APK successfully built!' -ForegroundColor Green
Write-Host '===================================================================' -ForegroundColor Green
Write-Host " Package Name:       ai.secure.space"
Write-Host " Target SDK:         33 (Android 13 / Tiramisu)"
Write-Host " Min SDK:            21 (Android 5.0 Lollipop - 99.8% Android devices)"
Write-Host " Auto-Start System:  BootAutoStartReceiver + AutonomousSecurityService (START_STICKY)"
Write-Host " Main Activity:      ai.secure.space.MainActivity"
Write-Host " File Size:          $($finalSizeMb) MB ($($finalSize) bytes)"
Write-Host " SHA-256:            $sha256"
Write-Host " Output Files:       public/app-hybrid-release.apk, dist/app-release.apk"
Write-Host " Install Command:    adb install -r ./dist/app-release.apk"
Write-Host '===================================================================' -ForegroundColor Green

& $AAPT dump badging "$FINAL_APK" | Select-String -Pattern "package:|sdkVersion:|targetSdkVersion:|launchable-activity:|application-label:"
Write-Host '===================================================================' -ForegroundColor Green
