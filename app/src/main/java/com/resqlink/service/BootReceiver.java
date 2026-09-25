package com.resqlink.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction() != null) {
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
                Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) || 
                "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
                
                // Start the polling service
                Intent serviceIntent = new Intent(context, EmergencyPollingService.class);
                ContextCompat.startForegroundService(context, serviceIntent);
            }
        }
    }
}
