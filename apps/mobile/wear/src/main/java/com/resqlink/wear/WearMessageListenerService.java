package com.resqlink.wear;

import android.content.Intent;
import android.util.Log;

import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

public class WearMessageListenerService extends WearableListenerService {
    private static final String TAG = "WearMsgListener";
    private static final String ALERT_PATH = "/meshsos/alert";

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent.getPath().equals(ALERT_PATH)) {
            String message = new String(messageEvent.getData());
            Log.d(TAG, "Alert received on watch: " + message);
            
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("ALERT_MESSAGE", message);
            startActivity(intent);
        } else {
            super.onMessageReceived(messageEvent);
        }
    }
}
