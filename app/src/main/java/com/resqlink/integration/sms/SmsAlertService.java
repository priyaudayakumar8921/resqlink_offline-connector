package com.resqlink.integration.sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.entity.EmergencyContactEntity;
import com.resqlink.integration.EmergencyOutputGateway;
import com.resqlink.util.AppLogger;

import java.util.List;
import java.util.concurrent.Executors;

public class SmsAlertService extends BroadcastReceiver {
    private static final String TAG = "SmsAlertService";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (EmergencyOutputGateway.ACTION_ALERT_RECEIVED.equals(intent.getAction())) {
            String message = intent.getStringExtra(EmergencyOutputGateway.EXTRA_ALERT_MESSAGE);
            if (message != null) {
                notify2GContacts(context, message);
            }
        }
    }

    private void notify2GContacts(Context context, String message) {
        Executors.newSingleThreadExecutor().execute(() -> {
            AppDatabase db = AppDatabase.getDatabase(context);
            List<EmergencyContactEntity> contacts = db.emergencyContactDao().getAllContactsSync();
            
            if (contacts.isEmpty()) return;

            SmsManager smsManager = SmsManager.getDefault();
            // Prefix to identify the source and keep it short
            String smsBody = "🚨 MESHSOS ALERT\n" + message;

            for (EmergencyContactEntity contact : contacts) {
                try {
                    smsManager.sendTextMessage(contact.phoneNumber, null, smsBody, null, null);
                    AppLogger.d(TAG, "Sent Alert SMS to " + contact.phoneNumber);
                } catch (Exception e) {
                    AppLogger.e(TAG, "Failed to send Alert SMS to " + contact.phoneNumber, e);
                }
            }
        });
    }
}
