package com.resqlink.network;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.DhcpInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.resqlink.data.remote.HubClient;
import com.resqlink.data.remote.LocalHttpHubClient;
import com.resqlink.data.remote.MockHubClient;
import com.resqlink.util.AppLogger;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HubConnectionManager {
    private static final String TAG = "HubConnectionManager";
    private static final String PREFS_NAME = "ResQLinkPrefs";
    private static final String KEY_HUB_URL = "hub_base_url";

    public enum HubStatus {
        DISCONNECTED,
        CONNECTING,
        CONNECTED
    }

    private static HubConnectionManager instance;
    private final Context appContext;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private final MutableLiveData<HubStatus> hubStatusLiveData = new MutableLiveData<>(HubStatus.DISCONNECTED);
    private final MutableLiveData<String> hubUrlLiveData = new MutableLiveData<>("");

    private LocalHttpHubClient currentClient;
    private String currentUrl;
    private boolean isProbing = false;

    public interface OnConnectionResultListener {
        void onResult(boolean success, String url);
    }

    private HubConnectionManager(Context context) {
        this.appContext = context.getApplicationContext();
        
        SharedPreferences prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String savedUrl = prefs.getString(KEY_HUB_URL, null);

        if (savedUrl != null && !savedUrl.trim().isEmpty()) {
            this.currentUrl = normalizeUrl(savedUrl);
        } else {
            // Intelligent initial default
            if (isEmulator()) {
                this.currentUrl = "http://10.0.2.2:3000/api/v1";
            } else {
                // Default to Wi-Fi Direct group owner / local hub IP
                this.currentUrl = "http://192.168.49.1:3000/api/v1";
            }
        }

        this.currentClient = new LocalHttpHubClient(this.currentUrl);
        this.hubUrlLiveData.setValue(this.currentUrl);
    }

    public static synchronized HubConnectionManager getInstance(Context context) {
        if (instance == null) {
            instance = new HubConnectionManager(context.getApplicationContext());
        }
        return instance;
    }

    public HubClient getClient() {
        return currentClient;
    }

    public LiveData<HubStatus> getHubStatus() {
        return hubStatusLiveData;
    }

    public LiveData<String> getHubUrlLiveData() {
        return hubUrlLiveData;
    }

    public String getCurrentUrl() {
        return currentUrl;
    }

    public void setUseMock(boolean useMock, Context context) {
        // Kept for backward compatibility
        if (!useMock) {
            probeAndConnect(context, null);
        }
    }

    public synchronized void setHubUrl(String url, Context context) {
        String cleanUrl = normalizeUrl(url);
        this.currentUrl = cleanUrl;
        
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_HUB_URL, cleanUrl).apply();

        if (this.currentClient != null) {
            this.currentClient.setBaseUrl(cleanUrl);
        } else {
            this.currentClient = new LocalHttpHubClient(cleanUrl);
        }

        mainHandler.post(() -> hubUrlLiveData.setValue(cleanUrl));
        AppLogger.d(TAG, "Hub URL set to: " + cleanUrl);

        // Verify health of new URL
        executor.execute(() -> {
            boolean ok = currentClient.checkHealth();
            mainHandler.post(() -> {
                if (ok) {
                    hubStatusLiveData.setValue(HubStatus.CONNECTED);
                } else {
                    hubStatusLiveData.setValue(HubStatus.DISCONNECTED);
                }
            });
        });
    }

    public void reportHealth(boolean isHealthy) {
        mainHandler.post(() -> {
            if (isHealthy) {
                if (hubStatusLiveData.getValue() != HubStatus.CONNECTED) {
                    hubStatusLiveData.setValue(HubStatus.CONNECTED);
                }
            } else {
                if (hubStatusLiveData.getValue() == HubStatus.CONNECTED) {
                    hubStatusLiveData.setValue(HubStatus.DISCONNECTED);
                }
            }
        });
    }

    /**
     * Probes candidate Hub endpoints across Wi-Fi Direct, Gateway, Hotspot, and Emulator.
     */
    public void probeAndConnect(Context context, OnConnectionResultListener listener) {
        if (isProbing) return;
        isProbing = true;

        mainHandler.post(() -> hubStatusLiveData.setValue(HubStatus.CONNECTING));

        executor.execute(() -> {
            List<String> candidates = getCandidateUrls(context);
            AppLogger.d(TAG, "Probing candidate hub URLs: " + candidates);

            String foundUrl = null;
            for (String candidate : candidates) {
                LocalHttpHubClient testClient = new LocalHttpHubClient(candidate);
                if (testClient.checkHealth()) {
                    foundUrl = candidate;
                    AppLogger.d(TAG, "Found responsive Hub at: " + candidate);
                    break;
                }
            }

            final String finalFoundUrl = foundUrl;
            mainHandler.post(() -> {
                isProbing = false;
                if (finalFoundUrl != null) {
                    setHubUrl(finalFoundUrl, context);
                    hubStatusLiveData.setValue(HubStatus.CONNECTED);
                    if (listener != null) listener.onResult(true, finalFoundUrl);
                } else {
                    hubStatusLiveData.setValue(HubStatus.DISCONNECTED);
                    if (listener != null) listener.onResult(false, currentUrl);
                }
            });
        });
    }

    private List<String> getCandidateUrls(Context context) {
        Set<String> set = new LinkedHashSet<>();

        // 1. Currently configured / saved URL
        if (currentUrl != null && !currentUrl.isEmpty()) {
            set.add(currentUrl);
        }

        // 2. Wi-Fi DHCP Gateway (if phone is connected to PC Hotspot or Router)
        String gatewayIp = getWifiGatewayIp(context);
        if (gatewayIp != null && !gatewayIp.equals("0.0.0.0")) {
            set.add("http://" + gatewayIp + ":3000/api/v1");
        }

        // 3. Wi-Fi Direct standard Group Owner IP
        set.add("http://192.168.49.1:3000/api/v1");

        // 4. Windows Mobile Hotspot default Gateway
        set.add("http://192.168.137.1:3000/api/v1");

        // 5. Android Emulator loopback alias
        if (isEmulator()) {
            set.add("http://10.0.2.2:3000/api/v1");
        }

        // 6. Generic loopback
        set.add("http://127.0.0.1:3000/api/v1");

        return new ArrayList<>(set);
    }

    private String getWifiGatewayIp(Context context) {
        try {
            WifiManager wifi = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifi != null) {
                DhcpInfo dhcp = wifi.getDhcpInfo();
                if (dhcp != null && dhcp.gateway != 0) {
                    int ip = dhcp.gateway;
                    return (ip & 0xFF) + "." + ((ip >> 8) & 0xFF) + "." + ((ip >> 16) & 0xFF) + "." + ((ip >> 24) & 0xFF);
                }
            }
        } catch (Exception e) {
            AppLogger.e(TAG, "Error getting Wi-Fi gateway", e);
        }
        return null;
    }

    private static boolean isEmulator() {
        return Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk".equals(Build.PRODUCT);
    }

    private static String normalizeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return "http://192.168.49.1:3000/api/v1";
        }
        String clean = url.trim();
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = "http://" + clean;
        }
        if (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        if (!clean.endsWith("/api/v1")) {
            clean = clean + "/api/v1";
        }
        return clean;
    }
}
