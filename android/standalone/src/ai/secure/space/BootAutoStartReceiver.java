package ai.secure.space;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootAutoStartReceiver extends BroadcastReceiver {
    private static final String TAG = "BootAutoStartReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : "";
        Log.i(TAG, "[AutoStart] Received broadcast: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {

            Log.i(TAG, "[AutoStart] Starting AutonomousSecurityService on system boot / package update...");
            Intent serviceIntent = new Intent(context, AutonomousSecurityService.class);
            serviceIntent.setAction(AutonomousSecurityService.ACTION_AUTO_START);

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "[AutoStart] Failed to start service: " + e.getMessage(), e);
            }
        }
    }
}
