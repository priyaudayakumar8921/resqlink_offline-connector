package com.resqlink.integration;

import android.content.Context;
import android.content.Intent;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

public class EmergencyOutputGateway {
    public static final String ACTION_ALERT_RECEIVED = "com.resqlink.integration.ACTION_ALERT_RECEIVED";
    public static final String EXTRA_ALERT_MESSAGE = "extra_alert_message";

    public static void notifyAlertReceived(Context context, String message) {
        // Fan out the alert to any isolated modules (Wear, SMS) using LocalBroadcastManager
        // This prevents tightly coupling the core mesh with the new optional modules.
        Intent intent = new Intent(ACTION_ALERT_RECEIVED);
        intent.putExtra(EXTRA_ALERT_MESSAGE, message);
        LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
    }
}
