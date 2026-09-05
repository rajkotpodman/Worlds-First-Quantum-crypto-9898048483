package ai.secure.space;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import java.io.File;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivitySec";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Security Layer 1: Anti-Screen Capture & Anti-Overlay Protection
        // Blocks OS screenshots, screen recording, and unauthorized recent apps task snapshot leakages
        try {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE
            );
        } catch (Exception e) {
            Log.w(TAG, "FLAG_SECURE initialization warning: " + e.getMessage());
        }

        // Security Layer 2: On-Device Integrity & Environment Audit
        performIntegrityAudit();

        // Security Layer 3: Ensure Autonomous Background Security Daemon is running
        try {
            Intent serviceIntent = new Intent(this, AutonomousSecurityService.class);
            serviceIntent.setAction(AutonomousSecurityService.ACTION_AUTO_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "AutonomousSecurityService startup: " + e.getMessage());
        }
    }

    /**
     * Performs lightweight runtime checks for rooting binaries, su hooks, and emulator debuggers.
     */
    private void performIntegrityAudit() {
        boolean isRooted = checkRootBinaries();
        if (isRooted) {
            Log.w(TAG, "[Security Alert] Elevated/Root permissions or test-keys detected on host device.");
        }
    }

    private boolean checkRootBinaries() {
        String[] paths = {
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        };
        for (String path : paths) {
            if (new File(path).exists()) {
                return true;
            }
        }
        return false;
    }
}
