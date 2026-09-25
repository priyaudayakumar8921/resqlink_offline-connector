package com.resqlink.network;

import com.resqlink.data.remote.HubClient;
import com.resqlink.data.remote.LocalHttpHubClient;
import com.resqlink.data.remote.MockHubClient;

import android.content.Context;
import android.content.SharedPreferences;

public class HubConnectionManager {
    // True to use MockHubClient for testing without real ESP32
    private static final boolean USE_MOCK_HUB = false; 
    
    private HubClient currentClient;

    private static HubConnectionManager instance;

    private HubConnectionManager(Context context) {
        if (USE_MOCK_HUB) {
            currentClient = new MockHubClient();
        } else {
            SharedPreferences prefs = context.getSharedPreferences("ResQLinkPrefs", Context.MODE_PRIVATE);
            String url = prefs.getString("hub_base_url", "http://192.168.1.5:3000/api/v1");
            currentClient = new LocalHttpHubClient(url);
        }
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
    
    public void setUseMock(boolean useMock, Context context) {
        if (useMock) {
            currentClient = new MockHubClient();
        } else {
            SharedPreferences prefs = context.getSharedPreferences("ResQLinkPrefs", Context.MODE_PRIVATE);
            String url = prefs.getString("hub_base_url", "http://192.168.1.5:3000/api/v1");
            currentClient = new LocalHttpHubClient(url);
        }
    }
}
