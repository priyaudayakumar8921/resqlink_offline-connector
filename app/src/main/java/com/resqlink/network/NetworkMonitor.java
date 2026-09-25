package com.resqlink.network;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

public class NetworkMonitor {
    private final ConnectivityManager connectivityManager;
    private final WifiManager wifiManager;
    private final MutableLiveData<NetworkState> networkStateLiveData = new MutableLiveData<>(NetworkState.UNKNOWN);
    private static final String HUB_SSID = "Disaster-Alert";

    public NetworkMonitor(Context context) {
        connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        wifiManager = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    public LiveData<NetworkState> getNetworkState() {
        return networkStateLiveData;
    }

    public void startMonitoring() {
        NetworkRequest request = new NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
                .build();

        connectivityManager.registerNetworkCallback(request, new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                checkNetworkState(network);
            }

            @Override
            public void onLost(@NonNull Network network) {
                networkStateLiveData.postValue(NetworkState.OFFLINE);
            }
        });
        
        // Initial check
        checkCurrentState();
    }

    private void checkCurrentState() {
        Network activeNetwork = connectivityManager.getActiveNetwork();
        if (activeNetwork != null) {
            checkNetworkState(activeNetwork);
        } else {
            networkStateLiveData.postValue(NetworkState.OFFLINE);
        }
    }

    private void checkNetworkState(Network network) {
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        if (capabilities != null) {
            if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                // Check if it's the Hub's WiFi
                WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                if (wifiInfo != null && wifiInfo.getSSID() != null) {
                    String ssid = wifiInfo.getSSID().replace("\"", "");
                    if (HUB_SSID.equals(ssid) || ssid.contains(HUB_SSID)) {
                        networkStateLiveData.postValue(NetworkState.LOCAL_HUB_AVAILABLE);
                        return;
                    }
                }
                
                // If it doesn't match the specific SSID but doesn't have internet, it might still be a local hub
                if (!capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                    networkStateLiveData.postValue(NetworkState.LOCAL_HUB_AVAILABLE);
                    return;
                }
                
                networkStateLiveData.postValue(NetworkState.INTERNET_AVAILABLE);
            } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                networkStateLiveData.postValue(NetworkState.INTERNET_AVAILABLE);
            }
        }
    }
}
