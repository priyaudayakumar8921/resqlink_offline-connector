package com.resqlink.data.remote;

import android.os.SystemClock;

import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.util.AppLogger;

public class MockHubClient implements HubClient {
    private static final String TAG = "MockHubClient";
    
    // Simulate network delay
    private void simulateDelay() {
        SystemClock.sleep(1000);
    }

    @Override
    public boolean checkHealth() {
        simulateDelay();
        AppLogger.d(TAG, "Mock health check OK");
        return true;
    }

    @Override
    public boolean sendSOS(SOSMessageEntity sos) {
        simulateDelay();
        AppLogger.d(TAG, "Mock SOS successfully 'received' by mock hub: " + sos.messageId);
        return true;
    }

    @Override
    public String fetchLatestBroadcast() {
        simulateDelay();
        return null;
    }
}
