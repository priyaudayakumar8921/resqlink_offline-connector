package com.resqlink.integration.sms;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.telephony.SmsManager;
import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.entity.EmergencyContactEntity;
import com.resqlink.integration.EmergencyInputGateway;
import com.resqlink.util.AppLogger;

import java.util.concurrent.Executors;

public class SmsGatewayReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsGatewayReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();
                        if (messageBody != null) {
                            processSmsCommand(context, sender, messageBody.trim().toUpperCase());
                        }
                    }
                }
            }
        }
    }

    private void processSmsCommand(Context context, String sender, String command) {
        AppLogger.d(TAG, "Received SMS from " + sender + ": " + command);
        
        Executors.newSingleThreadExecutor().execute(() -> {
            AppDatabase db = AppDatabase.getDatabase(context);
            EmergencyContactEntity contact = db.emergencyContactDao().getContactSync(sender);
            
            if (contact == null) {
                AppLogger.d(TAG, "Unauthorized sender: " + sender);
                return;
            }

            if ("HELP".equals(command)) {
                // Since it's from an SMS, we don't have direct location, 
                // in a real scenario we'd use last known location or prompt them.
                EmergencyInputGateway.triggerSOS(context, "2G/SMS", null, null, null);
                sendSms(sender, "MESHSOS: SOS ACTIVE. Broadcasting via Mesh.");
            } else if ("STATUS".equals(command)) {
                sendSms(sender, "MESHSOS: System Active. Waiting for updates.");
            } else if ("CANCEL".equals(command)) {
                // Not implementing full cancel flow for simplicity, just a stub
                sendSms(sender, "MESHSOS: Cancel request received.");
            }
        });
    }

    private void sendSms(String phone, String message) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(phone, null, message, null, null);
        } catch (Exception e) {
            AppLogger.e(TAG, "Failed to send SMS reply", e);
        }
    }
}
