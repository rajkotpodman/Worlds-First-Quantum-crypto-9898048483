[app]
# (str) Title of your application
title = AI Secure Space

# (str) Package name
package.name = securespace

# (str) Package domain (needed for android/ios packaging)
package.domain = ai.securespace

# (str) Source code where the main.py lives
source.dir = .

# (list) Source files to include (let empty to include all the files)
source.include_exts = py,png,jpg,kv,atlas,so,db,tflite

# (list) Source patterns to include
source.include_patterns = assets/*, tor/*, certs/*, android/jni/*

# (str) Application versioning
version = 1.0.0

# (list) Application requirements
# comma separated e.g. requirements = sqlite3,kivy
requirements = python3,kivy,plyer,jnius,cryptography,requests

# (str) Presplash of the application
#presplash.filename = %(source.dir)s/data/presplash.png

# (str) Icon of the application
#icon.filename = %(source.dir)s/data/icon.png

# (list) Permissions
android.permissions = INTERNET, CAMERA, USE_BIOMETRIC, ACCESS_FINE_LOCATION, ACCESS_NETWORK_STATE, FOREGROUND_SERVICE

# (int) Target Android API, should be as high as possible.
android.api = 34

# (int) Minimum API your APK / AAB will support.
android.minapi = 28

# (int) Android NDK version to use
android.ndk_api = 28

# (bool) Use --private data storage (True) or --dir public storage (False)
android.private_storage = True

# (list) Gradle dependencies
android.gradle_dependencies = com.google.mlkit:face-detection:16.1.6, androidx.biometric:biometric:1.2.0-alpha05, com.google.android.play:integrity:1.2.0

# (list) Add java/kotlin source folders
android.add_src = android/src/main/java

# (list) ProGuard rules file
android.proguard_rules = proguard-rules.pro

# (bool) Enable AndroidX support
android.enable_androidx = True

# (list) Architectures to package for
android.archs = arm64-v8a
