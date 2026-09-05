package ai.secure.space;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class WatchdogAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "WatchdogAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i(TAG, "[Watchdog] Pulse received. Ensuring AutonomousSecurityService is active...");
        Intent serviceIntent = new Intent(context, AutonomousSecurityService.class);
        serviceIntent.setAction(AutonomousSecurityService.ACTION_WATCHDOG_PULSE);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e(TAG, "[Watchdog] Failed to pulse service: " + e.getMessage(), e);
        }
    }
}
