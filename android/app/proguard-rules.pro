# ============================================================================
# Advanced ProGuard & R8 Hardening Rules for AI Secure Space & Quantum Crypto
# ============================================================================

# Anti-Reverse Engineering & Obfuscation Directives
-repackageclasses ''
-allowaccessmodification
-dontusemixedcaseclassnames false
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
-optimizationpasses 5

# Strip Debug Information & Source File metadata in release
-renamesourcefileattribute SourceFile
-keepattributes !SourceFile,!LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod

# Strip all Log.v, Log.d, Log.i in release builds for zero information leakage
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
}

# Preserve Capacitor & WebView JS Bridge Interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }

# Preserve App Native Components
-keep class ai.secure.space.** { *; }
-keepclassmembers class ai.secure.space.** { *; }

# Preserve Android Support & Core Architecture
-keep class androidx.core.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }
-dontwarn androidx.**
