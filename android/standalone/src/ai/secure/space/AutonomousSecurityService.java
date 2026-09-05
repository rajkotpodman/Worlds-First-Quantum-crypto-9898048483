package ai.secure.space;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.SystemClock;
import android.util.Log;

public class AutonomousSecurityService extends Service {
    private static final String TAG = "AutonomousSecuritySvc";
    public static final String ACTION_AUTO_START = "ai.secure.space.ACTION_AUTO_START";
    public static final String ACTION_WATCHDOG_PULSE = "ai.secure.space.ACTION_WATCHDOG_PULSE";
    private static final String CHANNEL_ID = "ai_secure_space_daemon_channel";
    private static final int NOTIFICATION_ID = 9898;

    private PowerManager.WakeLock mWakeLock;
    private MainActivity.LocalMicroServer mMicroServer;
    private volatile boolean mRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.i(TAG, "[AutoStart Service] Service onCreate triggered.");

        createNotificationChannel();
        Notification notification = buildForegroundNotification();
        startForeground(NOTIFICATION_ID, notification);

        acquireWakeLock();
        startMicroServer();
        scheduleWatchdogAlarm();
        startBackgroundMonitoring();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "AI Secure Space Autonomous Daemon",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains offline autonomous mesh node, local microserver, and PQC cryptographic state.");
            channel.setShowBadge(false);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        builder.setContentTitle("AI Secure Space Active")
                .setContentText("Autonomous Offline Node • 127.0.0.1:8080 Active")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true);

        return builder.build();
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && mWakeLock == null) {
                mWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AISecureSpace:AutonomousDaemonLock");
                mWakeLock.setReferenceCounted(false);
                mWakeLock.acquire(10 * 60 * 1000L);
                Log.i(TAG, "[AutoStart Service] Partial WakeLock acquired.");
            }
        } catch (Exception e) {
            Log.w(TAG, "[AutoStart Service] WakeLock error: " + e.getMessage());
        }
    }

    private void startMicroServer() {
        try {
            if (mMicroServer == null) {
                mMicroServer = new MainActivity.LocalMicroServer(getApplicationContext(), 8080);
                mMicroServer.start();
                Log.i(TAG, "[AutoStart Service] Embedded LocalMicroServer listening on port " + mMicroServer.getPort());
            }
        } catch (Exception e) {
            Log.e(TAG, "[AutoStart Service] Failed to start micro-server: " + e.getMessage());
        }
    }

    private void scheduleWatchdogAlarm() {
        try {
            AlarmManager alarmMgr = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(this, WatchdogAlarmReceiver.class);
            PendingIntent alarmIntent = PendingIntent.getBroadcast(
                    this,
                    101,
                    intent,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            if (alarmMgr != null) {
                long intervalMs = 15 * 60 * 1000L;
                long triggerAtMillis = SystemClock.elapsedRealtime() + intervalMs;
                alarmMgr.setInexactRepeating(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        intervalMs,
                        alarmIntent
                );
                Log.i(TAG, "[AutoStart Service] Watchdog repeating alarm registered.");
            }
        } catch (Exception e) {
            Log.w(TAG, "[AutoStart Service] Watchdog alarm registration error: " + e.getMessage());
        }
    }

    private void startBackgroundMonitoring() {
        mRunning = true;
        new Thread(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "[AutoStart Service] Background telemetry & mesh loop started.");
                while (mRunning) {
                    try {
                        Thread.sleep(30000);
                        if (mWakeLock != null && !mWakeLock.isHeld()) {
                            mWakeLock.acquire(10 * 60 * 1000L);
                        }
                    } catch (InterruptedException e) {
                        break;
                    } catch (Exception ignored) {}
                }
            }
        }, "AutonomousDaemonTelemetry").start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : "DEFAULT";
        Log.i(TAG, "[AutoStart Service] onStartCommand: " + action);
        acquireWakeLock();
        startMicroServer();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        mRunning = false;
        if (mWakeLock != null && mWakeLock.isHeld()) {
            try { mWakeLock.release(); } catch (Exception ignored) {}
        }
        if (mMicroServer != null) {
            try { mMicroServer.stop(); } catch (Exception ignored) {}
        }
        super.onDestroy();
        Log.i(TAG, "[AutoStart Service] Service destroyed.");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
