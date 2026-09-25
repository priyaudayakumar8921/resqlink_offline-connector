package com.resqlink.integration.wear;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.util.Log;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.WearableListenerService;
import com.resqlink.integration.EmergencyInputGateway;
import com.resqlink.integration.EmergencyOutputGateway;
import com.resqlink.util.AppLogger;

import java.util.List;
import java.util.concurrent.Executors;

public class WearIntegrationService extends WearableListenerService {
    private static final String TAG = "WearIntegrationService";
    private static final String SOS_TRIGGER_PATH = "/meshsos/trigger";
    private static final String ALERT_PATH = "/meshsos/alert";

    private final BroadcastReceiver alertReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (EmergencyOutputGateway.ACTION_ALERT_RECEIVED.equals(intent.getAction())) {
                String message = intent.getStringExtra(EmergencyOutputGateway.EXTRA_ALERT_MESSAGE);
                if (message != null) {
                    sendAlertToWatch(message);
                }
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        LocalBroadcastManager.getInstance(this).registerReceiver(alertReceiver, new IntentFilter(EmergencyOutputGateway.ACTION_ALERT_RECEIVED));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(alertReceiver);
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent.getPath().equals(SOS_TRIGGER_PATH)) {
            AppLogger.d(TAG, "SOS Triggered from Wear OS Watch!");
            EmergencyInputGateway.triggerSOS(this, "WEAR_OS_WATCH", null, null, null);
        } else {
            super.onMessageReceived(messageEvent);
        }
    }

    private void sendAlertToWatch(String message) {
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                Task<List<Node>> nodeListTask = Wearable.getNodeClient(this).getConnectedNodes();
                List<Node> nodes = Tasks.await(nodeListTask);
                
                byte[] payload = message.getBytes();
                for (Node node : nodes) {
                    Wearable.getMessageClient(this).sendMessage(node.getId(), ALERT_PATH, payload);
                }
            } catch (Exception e) {
                AppLogger.e(TAG, "Failed to send alert to watch", e);
            }
        });
    }
}
