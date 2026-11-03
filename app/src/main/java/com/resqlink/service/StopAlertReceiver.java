package com.resqlink.service;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import com.resqlink.util.AlertSoundManager;

public class StopAlertReceiver extends BroadcastReceiver {
    public static final String ACTION_STOP_ALERT = "com.resqlink.ACTION_STOP_ALERT";

    @Override
    public void onReceive(Context context, Intent intent) {
        AlertSoundManager.stopAlert(context);
        Toast.makeText(context, "Emergency Alarm Silenced", Toast.LENGTH_SHORT).show();
    }
}

