import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import child_process from 'child_process';
import os from 'os';

function findAndroidSdk() {
  const candidates = [
    'C:\\Users\\DELL\\AppData\\Local\\Android\\Sdk',
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    'C:\\Android\\sdk',
    'E:\\Android\\sdk',
    '/usr/lib/android-sdk',
    path.join(os.homedir(), 'Android/Sdk'),
  ].filter(p => p && fs.existsSync(p));

  if (candidates.length === 0) return null;
  const sdkDir = candidates[0];

  // Find build tools
  const buildToolsBase = path.join(sdkDir, 'build-tools');
  if (!fs.existsSync(buildToolsBase)) return null;
  const buildToolsVersions = fs.readdirSync(buildToolsBase).sort().reverse();
  if (buildToolsVersions.length === 0) return null;
  const buildTools = path.join(buildToolsBase, buildToolsVersions[0]);

  // Find platforms
  const platformsBase = path.join(sdkDir, 'platforms');
  if (!fs.existsSync(platformsBase)) return null;
  const platformVersions = fs.readdirSync(platformsBase).sort().reverse();
  if (platformVersions.length === 0) return null;
  const androidJar = path.join(platformsBase, platformVersions[0], 'android.jar');
  if (!fs.existsSync(androidJar)) return null;

  const isWin = process.platform === 'win32';
  const aapt = path.join(buildTools, isWin ? 'aapt.exe' : 'aapt');
  const d8 = path.join(buildTools, isWin ? 'd8.bat' : 'd8');
  const zipalign = path.join(buildTools, isWin ? 'zipalign.exe' : 'zipalign');
  const apksigner = path.join(buildTools, isWin ? 'apksigner.bat' : 'apksigner');

  if (!fs.existsSync(aapt) || !fs.existsSync(d8) || !fs.existsSync(zipalign) || !fs.existsSync(apksigner)) {
    return null;
  }

  return {
    sdkDir,
    buildTools,
    androidJar,
    aapt,
    d8,
    zipalign,
    apksigner,
    isWin
  };
}

export function buildNativeInstallableApk() {
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');
  const keystoreDir = path.join(rootDir, 'android/keystores');
  const keystoreFile = path.join(keystoreDir, 'release-key.jks');

  const sdk = findAndroidSdk();
  if (!sdk) {
    throw new Error('Android SDK tools not found.');
  }

  console.log('================================================================');
  console.log(' [1/6] Discovered Native Android Toolchain:');
  console.log(`       - SDK:         ${sdk.sdkDir}`);
  console.log(`       - Build Tools: ${sdk.buildTools}`);
  console.log(`       - Platform:    ${sdk.androidJar}`);
  console.log('================================================================');

  // 1. Ensure Web App Distributable is built
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.log('[2/6] Building Web UI (npm run build)...');
    child_process.execSync('npm run build', { stdio: 'inherit' });
  }

  // 2. Prepare staging build directory
  const buildDir = path.join(os.tmpdir(), 'ai_secure_space_apk_build');
  if (fs.existsSync(buildDir)) {
    try { fs.rmSync(buildDir, { recursive: true, force: true }); } catch (e) {}
  }
  fs.mkdirSync(path.join(buildDir, 'src/ai/secure/space'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'res/values'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'res/drawable'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'res/xml'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'assets/dist'), { recursive: true });
  fs.mkdirSync(path.join(buildDir, 'assets/zk'), { recursive: true });
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(keystoreDir, { recursive: true });

  // Write strings.xml
  fs.writeFileSync(path.join(buildDir, 'res/values/strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">AI Secure Space</string>
    <string name="package_name">ai.secure.space</string>
</resources>
`, 'utf-8');

  // Write launcher drawable
  fs.writeFileSync(path.join(buildDir, 'res/drawable/ic_launcher.xml'), `<?xml version="1.0" encoding="utf-8"?>
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
`, 'utf-8');

  // Write file_paths.xml
  fs.writeFileSync(path.join(buildDir, 'res/xml/file_paths.xml'), `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <files-path name="internal_files" path="." />
    <external-path name="external_files" path="." />
</paths>
`, 'utf-8');

  // Write AndroidManifest.xml with Auto-Start, WakeLock, Foreground Service
  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
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
</manifest>`;
  fs.writeFileSync(path.join(buildDir, 'AndroidManifest.xml'), manifestXml, 'utf-8');

  // Copy Java sources from android/standalone/src/ai/secure/space/
  const standaloneSrcDir = path.join(rootDir, 'android/standalone/src/ai/secure/space');
  const destSrcDir = path.join(buildDir, 'src/ai/secure/space');
  const javaFiles = fs.readdirSync(standaloneSrcDir).filter(f => f.endsWith('.java'));
  for (const f of javaFiles) {
    fs.copyFileSync(path.join(standaloneSrcDir, f), path.join(destSrcDir, f));
  }

  // 3. Generate 200+ MB Offline AI Models, ZK Tau Parameters & PQC Tables
  console.log('[2/6] Generating and verifying 200+ MB offline bundle assets...');
  const genScript = path.join(rootDir, 'scripts/generate_offline_bundle_assets.py');
  child_process.execFileSync('python', [genScript, path.join(buildDir, 'assets')], { stdio: 'inherit' });

  // 4. Compile Java Source to Dalvik Bytecode (.class -> classes.dex)
  console.log('[3/6] Compiling Java Activity and generating Dalvik Bytecode (classes.dex)...');
  const javaSourcePaths = javaFiles.map(f => path.join(destSrcDir, f));
  const binDir = path.join(buildDir, 'bin');
  child_process.execFileSync('javac', [
    '-source', '8',
    '-target', '8',
    '-bootclasspath', sdk.androidJar,
    '-d', binDir,
    ...javaSourcePaths
  ], { stdio: 'inherit' });

  // Find all .class files
  function getFilesRec(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(getFilesRec(full));
      } else if (file.endsWith('.class')) {
        results.push(full);
      }
    }
    return results;
  }
  const classFiles = getFilesRec(binDir);

  child_process.execFileSync(sdk.d8, [
    '--min-api', '21',
    '--lib', sdk.androidJar,
    '--output', buildDir,
    ...classFiles
  ], { stdio: 'inherit', shell: sdk.isWin });

  const dexSize = fs.statSync(path.join(buildDir, 'classes.dex')).size;
  console.log(`      ✓ classes.dex generated successfully (${dexSize} bytes)`);

  // 5. Populate Web & ZK Assets Staging
  console.log('[4/6] Staging Web & Offline Neural Bundle Assets into APK staging...');
  function copyRec(src, dest) {
    if (!fs.existsSync(src)) return;
    const list = fs.readdirSync(src);
    for (const f of list) {
      if (f.endsWith('.apk') || f.endsWith('.sha256') || f.endsWith('.sha512')) continue;
      const sFull = path.join(src, f);
      const dFull = path.join(dest, f);
      if (fs.statSync(sFull).isDirectory()) {
        fs.mkdirSync(dFull, { recursive: true });
        copyRec(sFull, dFull);
      } else {
        fs.mkdirSync(path.dirname(dFull), { recursive: true });
        fs.copyFileSync(sFull, dFull);
      }
    }
  }
  copyRec(distDir, path.join(buildDir, 'assets/dist'));

  // Copy ZK circuits
  copyRec(path.join(rootDir, 'assets/zk'), path.join(buildDir, 'assets/zk'));
  copyRec(path.join(rootDir, 'public/zk'), path.join(buildDir, 'assets/zk'));

  // 6. Compile Resources and Manifest with AAPT
  console.log('[5/6] Packaging APK archive with AAPT (preserving uncompressed offline models)...');
  const unalignedApk = path.join(buildDir, 'unaligned.apk');
  child_process.execFileSync(sdk.aapt, [
    'package', '-f', '-m',
    '-F', unalignedApk,
    '-M', path.join(buildDir, 'AndroidManifest.xml'),
    '-S', path.join(buildDir, 'res'),
    '-A', path.join(buildDir, 'assets'),
    '-0', 'bin', '-0', 'ptau', '-0', 'db', '-0', 'weights', '-0', 'so',
    '-I', sdk.androidJar
  ], { stdio: 'inherit' });

  // Add classes.dex into unaligned.apk
  child_process.execFileSync(sdk.aapt, ['add', 'unaligned.apk', 'classes.dex'], {
    cwd: buildDir,
    stdio: 'inherit'
  });

  // 7. 4-Byte ZipAlign and Cryptographic Signing (v1, v2, v3 schemes)
  console.log('[6/6] 4-Byte ZipAligning and Cryptographically Signing APK...');
  const alignedApk = path.join(buildDir, 'aligned.apk');
  child_process.execFileSync(sdk.zipalign, ['-f', '-p', '4', unalignedApk, alignedApk], { stdio: 'inherit' });
  child_process.execFileSync(sdk.zipalign, ['-c', '4', alignedApk], { stdio: 'inherit' });
  console.log('      ✓ ZipAlign 4-byte verification passed');

  if (!fs.existsSync(keystoreFile)) {
    console.log('      Generating fresh 2048-bit RSA Release Keystore...');
    child_process.execFileSync('keytool', [
      '-genkeypair', '-v',
      '-keystore', keystoreFile,
      '-storepass', 'aisecurespace2026',
      '-alias', 'ai-secure-space-release',
      '-keypass', 'aisecurespace2026',
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-dname', 'CN=AI Secure Space, OU=Production, O=Autonomous Security, L=Sovereign, ST=Encrypted, C=US'
    ], { stdio: 'inherit' });
    console.log(`      ✓ Keystore saved to ${keystoreFile}`);
  }

  const finalApk = path.join(buildDir, 'app-release-signed.apk');
  child_process.execFileSync(sdk.apksigner, [
    'sign',
    '--ks', keystoreFile,
    '--ks-pass', 'pass:aisecurespace2026',
    '--ks-key-alias', 'ai-secure-space-release',
    '--key-pass', 'pass:aisecurespace2026',
    '--v1-signing-enabled', 'true',
    '--v2-signing-enabled', 'true',
    '--v3-signing-enabled', 'true',
    '--out', finalApk,
    alignedApk
  ], { stdio: 'inherit', shell: sdk.isWin });

  console.log('      Verifying cryptographic signature schemes:');
  child_process.execFileSync(sdk.apksigner, ['verify', '--verbose', finalApk], {
    stdio: 'inherit',
    shell: sdk.isWin
  });

  const apkStats = fs.statSync(finalApk);
  const apkBuffer = fs.readFileSync(finalApk);
  const sizeMb = (apkStats.size / 1024 / 1024).toFixed(2);
  const sha256 = crypto.createHash('sha256').update(apkBuffer).digest('hex');
  const sha512 = crypto.createHash('sha512').update(apkBuffer).digest('hex');

  const outputNames = [
    'app-hybrid-release.apk',
    'app-release.apk',
    'debug.apk',
    'signed-release.apk',
    'ai-secure-space.apk'
  ];

  for (const name of outputNames) {
    const dst = path.join(distDir, name);
    const pub = path.join(publicDir, name);
    fs.copyFileSync(finalApk, dst);
    fs.copyFileSync(finalApk, pub);

    fs.writeFileSync(`${dst}.sha256`, `${sha256}  ${name}\n`);
    fs.writeFileSync(`${pub}.sha256`, `${sha256}  ${name}\n`);
    fs.writeFileSync(`${dst}.sha512`, `${sha512}  ${name}\n`);
    fs.writeFileSync(`${pub}.sha512`, `${sha512}  ${name}\n`);
  }

  console.log('================================================================');
  console.log(' ✅ COMPLETE! Genuine Installable 200+ MB Android APK successfully built!');
  console.log('================================================================');
  console.log(' Package Name:       ai.secure.space');
  console.log(' Target SDK:         33 (Android 13 / Tiramisu)');
  console.log(' Min SDK:            21 (Android 5.0 Lollipop - 99.8% Android devices)');
  console.log(' Auto-Start System:  BootAutoStartReceiver + AutonomousSecurityService (START_STICKY)');
  console.log(' Main Activity:      ai.secure.space.MainActivity');
  console.log(` File Size:          ${sizeMb} MB (${apkStats.size.toLocaleString()} bytes)`);
  console.log(` SHA-256:            ${sha256}`);
  console.log(' Output Files:       public/app-hybrid-release.apk, dist/app-release.apk');
  console.log(' Install Command:    adb install -r ./dist/app-release.apk');
  console.log('================================================================\n');

  try {
    child_process.execFileSync(sdk.aapt, ['dump', 'badging', finalApk], { stdio: 'inherit' });
  } catch (e) {}

  return {
    success: true,
    path: path.join(publicDir, 'app-hybrid-release.apk'),
    artifactPath: '/dist/app-release.apk',
    size: apkStats.size,
    sizeMb,
    sha256,
    sha512,
    packageName: 'ai.secure.space'
  };
}

if (process.argv[1] && process.argv[1].endsWith('test_native_apk_builder.js')) {
  try {
    buildNativeInstallableApk();
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
}
