package com.resqlink.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;

import androidx.core.app.NotificationCompat;

import com.resqlink.R;
import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.entity.CitizenProfileEntity;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.data.repository.SOSRepository;
import com.resqlink.model.TransmissionStatus;
import com.resqlink.model.P2PPayload;
import com.resqlink.network.HubConnectionManager;
import com.resqlink.network.P2PMeshManager;
import com.resqlink.ui.citizen.CitizenHomeActivity;
import com.resqlink.util.AppLogger;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class EmergencyPollingService extends Service implements SensorEventListener {
    private static final String TAG = "EmergencyPollingService";
    private static final String CHANNEL_ID = "ResQLinkServiceChannel";
    private static final String ALERT_CHANNEL_ID = "ResQLinkAlertChannel";
    private static final int NOTIFICATION_ID = 101;
    private static final int ALERT_NOTIFICATION_ID = 102;
    
    private ScheduledExecutorService scheduler;
    private String lastBroadcastMessage = null;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private final java.util.Set<String> processedSosIds = new java.util.HashSet<>();

    // Shake Detection Variables
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private static final float SHAKE_THRESHOLD_GRAVITY = 2.7F;
    private static final int SHAKE_SLOP_TIME_MS = 500;
    private static final int SHAKE_COUNT_RESET_TIME_MS = 3000;
    private long mShakeTimestamp;
    private int mShakeCount;
    private long lastSosTriggerTime = 0;
    private static final long SOS_COOLDOWN_MS = 30000; // 30 seconds cooldown

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        
        // Acquire WakeLock to keep CPU and motion sensors running when screen is off
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ResQLink::EmergencySensorWakeLock");
            wakeLock.acquire(); // Held continuously while service is running
            AppLogger.d(TAG, "Partial WakeLock acquired for 24/7 Shake Detection");
        }
        
        // Acquire WifiLock to prevent Wi-Fi from turning off in Doze mode
        WifiManager wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifiManager != null) {
            wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "ResQLink::EmergencyWifiLock");
            wifiLock.acquire();
            AppLogger.d(TAG, "High-Perf WifiLock acquired to maintain mesh network");
        }
        
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            if (accelerometer != null) {
                sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
                AppLogger.d(TAG, "Accelerometer registered for Shake-to-SOS");
            }
        }
        
        // Setup P2P Mesh Manager
        P2PMeshManager.getInstance(this).setPayloadListener(payload -> {
            if (P2PPayload.TYPE_ALERT.equals(payload.type)) {
                // Ignore if we already showed this exact alert recently
                if (!payload.data.equals(lastBroadcastMessage)) {
                    lastBroadcastMessage = payload.data;
                    triggerAlert(payload.data);
                    
                    // Fan out alert to optional modules (SMS, Wear OS)
                    com.resqlink.integration.EmergencyOutputGateway.notifyAlertReceived(this, payload.data);
                }
            } else if (P2PPayload.TYPE_SOS.equals(payload.type)) {
                try {
                    com.google.gson.JsonObject jsonObject = com.google.gson.JsonParser.parseString(payload.data).getAsJsonObject();
                    if (jsonObject.has("messageId")) {
                        String messageId = jsonObject.get("messageId").getAsString();
                        
                        if (!processedSosIds.contains(messageId)) {
                            processedSosIds.add(messageId);
                            AppLogger.d(TAG, "New SOS received via Mesh, rebroadcasting: " + messageId);
                            
                            // Rebroadcast to ensure multi-hop (A -> B -> C)
                            P2PMeshManager.getInstance(this).broadcastPayload(payload);
                            
                            // Trigger local alert
                            String citizenId = jsonObject.has("citizenId") ? jsonObject.get("citizenId").getAsString() : "Unknown";
                            String type = jsonObject.has("emergencyType") ? jsonObject.get("emergencyType").getAsString() : "Emergency";
                            triggerAlert("SOS Relay: " + citizenId + " reported " + type);
                        }
                    }
                } catch (Exception e) {
                    AppLogger.e(TAG, "Failed to parse and relay incoming SOS", e);
                }
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Build the persistent foreground notification
        Intent notificationIntent = new Intent(this, CitizenHomeActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("ResQLink Background Sync")
                .setContentText("Monitoring for emergency broadcasts...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        // Start polling
        if (scheduler == null || scheduler.isShutdown()) {
            scheduler = Executors.newSingleThreadScheduledExecutor();
            scheduler.scheduleAtFixedRate(() -> {
                String latest = HubConnectionManager.getInstance(getApplicationContext()).getClient().fetchLatestBroadcast();
                if (latest != null && !latest.equals(lastBroadcastMessage)) {
                    lastBroadcastMessage = latest;
                    triggerAlert(latest);
                    
                    // Broadcast the alert to mesh
                    P2PPayload payload = new P2PPayload(P2PPayload.TYPE_ALERT, latest, System.currentTimeMillis());
                    P2PMeshManager.getInstance(this).broadcastPayload(payload);
                }
            }, 0, 5, TimeUnit.SECONDS);
        }

        // Start P2P Mesh
        P2PMeshManager.getInstance(this).startMesh();

        return START_STICKY;
    }

    private void triggerAlert(String message) {
        // Force the screen to turn on instantly
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            PowerManager.WakeLock screenWakeLock = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, 
                "ResQLink::AlertScreenWakeLock"
            );
            screenWakeLock.acquire(10000); // Hold for 10 seconds to ensure user sees it
        }

        // Vibrate fiercely
        Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000}; // Wait, Vibrate, Wait, Vibrate, Wait, Vibrate
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
            } else {
                vibrator.vibrate(pattern, -1);
            }
        }

        // Play 3 loud beeps bypassing silent mode using ALARM stream
        new Thread(() -> {
            try {
                ToneGenerator toneGen = new ToneGenerator(AudioManager.STREAM_ALARM, 100); // 100 = Max volume
                for (int i = 0; i < 3; i++) {
                    toneGen.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 600); // 600ms duration
                    Thread.sleep(1000); // Wait 1 second between beeps
                }
                toneGen.release();
            } catch (Exception e) {
                AppLogger.e(TAG, "Failed to play emergency tone", e);
            }
        }).start();

        // Flash camera LED 3 times
        new Thread(() -> {
            try {
                CameraManager camManager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
                if (camManager != null) {
                    String cameraId = camManager.getCameraIdList()[0]; // Usually 0 is back camera with flash
                    for (int i = 0; i < 3; i++) {
                        camManager.setTorchMode(cameraId, true);
                        Thread.sleep(500);
                        camManager.setTorchMode(cameraId, false);
                        Thread.sleep(500);
                    }
                }
            } catch (Exception e) {
                AppLogger.e(TAG, "Failed to flash camera LED", e);
            }
        }).start();

        // 1. Show High Priority Notification
        Intent notifIntent = new Intent(this, com.resqlink.ui.citizen.BroadcastAlertActivity.class);
        notifIntent.putExtra("BROADCAST_MESSAGE", message);
        notifIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK 
                | Intent.FLAG_ACTIVITY_CLEAR_TOP 
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                
        int uniqueId = (int) System.currentTimeMillis();
        PendingIntent pendingIntent = PendingIntent.getActivity(this, uniqueId, notifIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle("EMERGENCY BROADCAST")
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(pendingIntent, true) // Wakes up screen if possible
                .setAutoCancel(true);

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(uniqueId, builder.build());
            AppLogger.d(TAG, "Fired FullScreenIntent Notification with ID: " + uniqueId);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;
            
            // Service Channel (Silent)
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Background Sync Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            manager.createNotificationChannel(serviceChannel);

            // Alert Channel (Loud & Disruptive)
            NotificationChannel alertChannel = new NotificationChannel(
                    ALERT_CHANNEL_ID,
                    "Emergency Alerts",
                    NotificationManager.IMPORTANCE_HIGH
            );
            alertChannel.enableVibration(true);
            alertChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            manager.createNotificationChannel(alertChannel);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (scheduler != null) {
            scheduler.shutdownNow();
        }
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            AppLogger.d(TAG, "Accelerometer unregistered");
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            AppLogger.d(TAG, "Partial WakeLock released");
        }
        if (wifiLock != null && wifiLock.isHeld()) {
            wifiLock.release();
            AppLogger.d(TAG, "WifiLock released");
        }
        P2PMeshManager.getInstance(this).stopMesh();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            float gX = x / SensorManager.GRAVITY_EARTH;
            float gY = y / SensorManager.GRAVITY_EARTH;
            float gZ = z / SensorManager.GRAVITY_EARTH;

            // gForce will be close to 1 when there is no movement.
            float gForce = (float) Math.sqrt(gX * gX + gY * gY + gZ * gZ);

            if (gForce > SHAKE_THRESHOLD_GRAVITY) {
                final long now = System.currentTimeMillis();
                // ignore shake events too close to each other (500ms)
                if (mShakeTimestamp + SHAKE_SLOP_TIME_MS > now) {
                    return;
                }
                
                // reset the shake count after 3 seconds of no shakes
                if (mShakeTimestamp + SHAKE_COUNT_RESET_TIME_MS < now) {
                    mShakeCount = 0;
                }

                mShakeTimestamp = now;
                mShakeCount++;

                // Trigger after 2 consecutive strong shakes
                if (mShakeCount >= 2) {
                    triggerShakeSos();
                    mShakeCount = 0;
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not used
    }
    
    private void triggerShakeSos() {
        long now = System.currentTimeMillis();
        if (now - lastSosTriggerTime < SOS_COOLDOWN_MS) {
            AppLogger.d(TAG, "Shake ignored due to cooldown");
            return;
        }
        
        lastSosTriggerTime = now;
        AppLogger.d(TAG, "VIOLENT SHAKE DETECTED! Triggering Auto-SOS!");
        
        // Vibrate to confirm shake registered
        Vibrator vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(1000, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(1000);
            }
        }
        
        // Fetch location and then send SOS in background
        com.resqlink.location.LocationHelper.getCurrentLocation(this, location -> {
            Double lat = null;
            Double lng = null;
            Float acc = null;
            if (location != null) {
                lat = location.getLatitude();
                lng = location.getLongitude();
                acc = location.getAccuracy();
            }
            
            final Double finalLat = lat;
            final Double finalLng = lng;
            final Float finalAcc = acc;
            
            Executors.newSingleThreadExecutor().execute(() -> {
                try {
                    AppDatabase db = AppDatabase.getDatabase(getApplicationContext());
                    CitizenProfileEntity profile = db.citizenDao().getProfileSync();
                    
                    String cid = (profile != null) ? profile.citizenId : "UNKNOWN_CITIZEN";
                    
                    SOSMessageEntity sos = new SOSMessageEntity();
                    sos.messageId = "SOS-" + new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    sos.citizenId = cid;
                    sos.emergencyType = "IMPACT/SHAKE";
                    sos.latitude = finalLat;
                    sos.longitude = finalLng;
                    sos.accuracy = finalAcc;
                    sos.timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(new Date());
                    sos.status = TransmissionStatus.PENDING.name();
                    sos.retryCount = 0;
                    sos.lastAttempt = System.currentTimeMillis();
                    sos.priority = "CRITICAL";

                    SOSRepository repo = new SOSRepository(getApplication());
                    repo.saveSOSMessage(sos);
                    
                    boolean success = HubConnectionManager.getInstance(getApplicationContext()).getClient().sendSOS(sos);
                    if (success) {
                        sos.status = TransmissionStatus.DELIVERED_TO_HUB.name();
                        repo.saveSOSMessage(sos);
                        AppLogger.d(TAG, "Successfully dispatched Shake-SOS to network with Location");
                    } else {
                        AppLogger.e(TAG, "Failed to dispatch Shake-SOS to network");
                    }
                    
                    // Also broadcast SOS to P2P Mesh
                    P2PPayload p2pPayload = new P2PPayload(P2PPayload.TYPE_SOS, new com.google.gson.Gson().toJson(sos), System.currentTimeMillis());
                    P2PMeshManager.getInstance(getApplicationContext()).broadcastPayload(p2pPayload);
                    
                } catch (Exception e) {
                    AppLogger.e(TAG, "Error generating Shake SOS", e);
                }
            });
        });
    }
}
