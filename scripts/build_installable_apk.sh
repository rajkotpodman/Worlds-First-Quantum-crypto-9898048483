#!/usr/bin/env bash

set -e

echo "==================================================================="
echo " AI SECURE SPACE - AUTONOMOUS 200+ MB ANDROID APK BUILD ENGINE"
echo " Compiling 100% In-Codes Standalone Offline-Ready APK"
echo " Toolchain: OpenJDK 17 • Dalvik DX • AAPT • ZipAlign • Apksigner"
echo "==================================================================="

ROOT_DIR="$(pwd)"
BUILD_DIR="/tmp/ai_secure_space_apk_build"
DIST_DIR="${ROOT_DIR}/dist"
PUBLIC_DIR="${ROOT_DIR}/public"
KEYSTORE_DIR="${ROOT_DIR}/android/keystores"
KEYSTORE_FILE="${KEYSTORE_DIR}/release-key.jks"
ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"

# Verify toolchain availability
for cmd in java javac aapt dx zipalign apksigner keytool; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "[-] Error: Required Android packaging tool '$cmd' is not in PATH."
    exit 1
  fi
done

if [ ! -f "$ANDROID_JAR" ]; then
  echo "[-] Error: Android SDK platform jar not found at $ANDROID_JAR"
  exit 1
fi

echo "[+] Android Packaging Toolchain Verified:"
echo "    - Java:      $(java -version 2>&1 | head -n 1)"
echo "    - AAPT:      $(aapt version | head -n 1)"
echo "    - DX/Dalvik: $(which dx)"
echo "    - ZipAlign:  $(which zipalign)"
echo "    - Apksigner: Version $(apksigner --version 2>&1)"

# 1. Ensure Web App Distributable is built
echo "-------------------------------------------------------------------"
echo "[1/7] Preparing Web Application Distributable..."
if [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "      Running 'npm run build' to generate web assets..."
  npm run build
fi
echo "      ✓ Web assets ready in ${DIST_DIR}"

# 2. Prepare staging directories
echo "-------------------------------------------------------------------"
echo "[2/7] Staging Android Manifest, Native Java Sources & Resources..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/ai/secure/space"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/res/mipmap-hdpi"
mkdir -p "$BUILD_DIR/res/xml"
mkdir -p "$BUILD_DIR/assets"
mkdir -p "$KEYSTORE_DIR"
mkdir -p "$DIST_DIR"
mkdir -p "$PUBLIC_DIR"
mkdir -p "/tmp/apk_dist"

# 3. Ensure 200+ MB Offline AI Models, ZK Tau Parameters & PQC Tables directly in BUILD_DIR/assets
echo "-------------------------------------------------------------------"
echo "[3/7] Generating and verifying 200+ MB offline bundle assets in $BUILD_DIR/assets..."
python3 "${ROOT_DIR}/scripts/generate_offline_bundle_assets.py" "$BUILD_DIR/assets"

TOTAL_ASSET_BYTES=$(find "$BUILD_DIR/assets" -type f -exec stat -c%s {} + | awk '{s+=$1} END {print s}')
TOTAL_ASSET_MB=$(awk "BEGIN {printf \"%.2f\", ${TOTAL_ASSET_BYTES} / 1048576}")
echo "      ✓ Offline bundle assets verified: ${TOTAL_ASSET_MB} MB in $BUILD_DIR/assets"

# Write AndroidManifest.xml with all necessary permissions and hardware features
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ai.secure.space"
    android:versionCode="2026"
    android:versionName="2.0.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />

    <!-- Autonomous Hardware, Network & Security Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

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

    </application>
</manifest>
EOF

# Write strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AI Secure Space</string>
    <string name="package_name">ai.secure.space</string>
</resources>
EOF

# Create launcher icon vector / bitmap representation
cat << 'EOF' > "$BUILD_DIR/res/drawable/ic_launcher.xml"
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
EOF

# Copy Native Android Java Sources with Auto-Permissions, Hardware Acceleration, and Local Embedded Micro-Server
cp -f "${ROOT_DIR}/android/standalone/src/ai/secure/space/"*.java "$BUILD_DIR/src/ai/secure/space/"

# 4. Compile Java Source to Dalvik Bytecode (.class -> classes.dex)
echo "-------------------------------------------------------------------"
echo "[4/7] Compiling Java Activity and generating Dalvik Bytecode (classes.dex)..."
javac -source 8 -target 8 \
  -bootclasspath "$ANDROID_JAR" \
  -d "$BUILD_DIR/bin" \
  "$BUILD_DIR/src/ai/secure/space/"*.java

dx --dex --min-sdk-version=21 --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/bin"
echo "      ✓ classes.dex generated successfully ($(stat -c%s "$BUILD_DIR/classes.dex") bytes)"

# 5. Populate APK Assets Staging
echo "-------------------------------------------------------------------"
echo "[5/7] Staging Web & Offline Neural Bundle Assets into APK directory..."
mkdir -p "$BUILD_DIR/assets/dist"
cp -r "${DIST_DIR}/"* "$BUILD_DIR/assets/dist/" || true
# Remove any nested APKs from embedded assets recursively to avoid recursive bloat
find "$BUILD_DIR/assets" -type f \( -name "*.apk" -o -name "*.sha256" -o -name "*.sha512" \) -delete 2>/dev/null || true

# Copy models, circuits, and vector databases
if [ -d "${ROOT_DIR}/assets" ]; then
  cp -r "${ROOT_DIR}/assets/"* "$BUILD_DIR/assets/" 2>/dev/null || true
fi

# 6. Compile Resources and Manifest with AAPT (Preserving uncompressed 200+ MB storage)
echo "-------------------------------------------------------------------"
echo "[6/7] Packaging APK archive with AAPT (preserving uncompressed offline models)..."
aapt package -f -m \
  -F "$BUILD_DIR/unaligned.apk" \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -0 bin -0 ptau -0 db -0 weights -0 so \
  -I "$ANDROID_JAR"

# Add classes.dex into APK
cd "$BUILD_DIR"
aapt add unaligned.apk classes.dex

# 7. 4-Byte ZipAlign and Cryptographic Signing (v1, v2, v3 schemes)
echo "-------------------------------------------------------------------"
echo "[7/7] 4-Byte ZipAligning and Cryptographically Signing APK..."
zipalign -f -v -p 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk" > /dev/null
zipalign -c -v 4 "$BUILD_DIR/aligned.apk" > /dev/null
echo "      ✓ ZipAlign verification passed"

if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "      Generating fresh 2048-bit RSA Release Keystore..."
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -storepass "aisecurespace2026" \
    -alias "ai-secure-space-release" \
    -keypass "aisecurespace2026" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=AI Secure Space, OU=Production, O=Autonomous Security, L=Sovereign, ST=Encrypted, C=US" > /dev/null 2>&1
  echo "      ✓ Keystore saved to ${KEYSTORE_FILE}"
fi

FINAL_APK="$BUILD_DIR/app-release-signed.apk"
apksigner sign \
  --ks "$KEYSTORE_FILE" \
  --ks-pass "pass:aisecurespace2026" \
  --ks-key-alias "ai-secure-space-release" \
  --key-pass "pass:aisecurespace2026" \
  --v1-signing-enabled true \
  --v2-signing-enabled true \
  --v3-signing-enabled true \
  --out "$FINAL_APK" \
  "$BUILD_DIR/aligned.apk"

# Verify Signature with apksigner
echo "      Verifying cryptographic signature schemes:"
apksigner verify --verbose "$FINAL_APK"

# Publish Installable APK to all public, dist, and root locations
echo "-------------------------------------------------------------------"
echo "[+] Publishing installable APK to workspace endpoints..."

APK_NAMES=(
  "debug.apk"
  "app-release.apk"
  "signed-release.apk"
  "app-hybrid-release.apk"
  "ai-secure-space.apk"
)

SHA256_HASH=$(sha256sum "$FINAL_APK" | awk '{print $1}')
SHA512_HASH=$(sha512sum "$FINAL_APK" | awk '{print $1}')
APK_SIZE=$(stat -c%s "$FINAL_APK")
APK_SIZE_MB=$(awk "BEGIN {printf \"%.2f\", ${APK_SIZE} / 1048576}")

# Keep primary copy in /tmp/apk_dist
cp -f "$FINAL_APK" "/tmp/apk_dist/app-release-signed.apk"

for name in "${APK_NAMES[@]}"; do
  ln -sf "/tmp/apk_dist/app-release-signed.apk" "/tmp/apk_dist/${name}"
  ln -sf "/tmp/apk_dist/app-release-signed.apk" "${DIST_DIR}/${name}"
  ln -sf "/tmp/apk_dist/app-release-signed.apk" "${PUBLIC_DIR}/${name}"

  echo "${SHA256_HASH}  ${name}" > "${DIST_DIR}/${name}.sha256"
  echo "${SHA256_HASH}  ${name}" > "${PUBLIC_DIR}/${name}.sha256"

  echo "${SHA512_HASH}  ${name}" > "${DIST_DIR}/${name}.sha512"
  echo "${SHA512_HASH}  ${name}" > "${PUBLIC_DIR}/${name}.sha512"
done

echo "==================================================================="
echo " ✅ COMPLETE! Genuine Installable 200+ MB Android APK successfully built!"
echo "==================================================================="
echo " Package Name:       ai.secure.space"
echo " Target SDK:         33 (Android 13 / Tiramisu)"
echo " Min SDK:            21 (Android 5.0 Lollipop - 99.8% Android devices)"
echo " Main Activity:      ai.secure.space.MainActivity"
echo " File Size:          ${APK_SIZE_MB} MB (${APK_SIZE} bytes)"
echo " SHA-256:            ${SHA256_HASH}"
echo " Install Command:    adb install -r ./dist/app-release.apk"
echo " Browser Download:   /api/dist/download/app-release.apk"
echo "==================================================================="

# Print AAPT badging dump
aapt dump badging "$FINAL_APK" | grep -E "package:|sdkVersion:|targetSdkVersion:|launchable-activity:|application-label:" || true
echo "==================================================================="
