package com.resqlink.util;

import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;

public class AlertSoundManager {
    private static final String TAG = "AlertSoundManager";
    private static MediaPlayer mediaPlayer;
    private static Vibrator vibrator;
    private static final Handler handler = new Handler(Looper.getMainLooper());
    private static Runnable autoStopRunnable;
    private static boolean isPlaying = false;
    private static StopListener stopListener;

    public interface StopListener {
        void onAlertStopped();
    }

    public static synchronized void setStopListener(StopListener listener) {
        stopListener = listener;
    }

    public static synchronized void removeStopListener() {
        stopListener = null;
    }

    public static synchronized void startAlert(Context context, long maxDurationMs) {
        // Stop any previous alert instance
        stopAlert(context);

        isPlaying = true;
        Context appContext = context.getApplicationContext();

        // 1. Start continuous vibration pattern
        try {
            vibrator = (Vibrator) appContext.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 600, 400};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            AppLogger.e(TAG, "Error starting vibration", e);
        }

        // 2. Start looping alarm sound via MediaPlayer
        try {
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alertUri == null) {
                alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(appContext, alertUri);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            AppLogger.e(TAG, "Error playing alarm sound", e);
        }

        // 3. Safety auto-timeout (stops automatically after maxDurationMs, default 30s)
        autoStopRunnable = () -> stopAlert(appContext);
        handler.postDelayed(autoStopRunnable, maxDurationMs > 0 ? maxDurationMs : 30000);
    }

    public static synchronized void stopAlert(Context context) {
        isPlaying = false;

        // Cancel the auto-stop timer
        if (autoStopRunnable != null) {
            handler.removeCallbacks(autoStopRunnable);
            autoStopRunnable = null;
        }

        // Stop and release MediaPlayer
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }

        // Cancel Vibration
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
        }

        // Dismiss the emergency alert notification
        if (context != null) {
            try {
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.cancel(102); // ALERT_NOTIFICATION_ID
                }
            } catch (Exception ignored) {}
        }

        // Notify active activity (BroadcastAlertActivity) to close
        if (stopListener != null) {
            try {
                stopListener.onAlertStopped();
            } catch (Exception ignored) {}
        }
    }

    public static synchronized boolean isPlaying() {
        return isPlaying;
    }
}

