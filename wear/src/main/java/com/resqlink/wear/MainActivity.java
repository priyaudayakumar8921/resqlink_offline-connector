package com.resqlink.wear;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.Tasks;

import java.util.List;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String TAG = "WearMainActivity";
    private static final String SOS_PATH = "/meshsos/trigger";
    
    private Button btnSos;
    private TextView tvStatus;
    
    private boolean isHolding = false;
    private Handler holdHandler = new Handler(Looper.getMainLooper());
    private Runnable triggerSosRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        btnSos = findViewById(R.id.btnSos);
        tvStatus = findViewById(R.id.tvStatus);

        triggerSosRunnable = () -> {
            if (isHolding) {
                sendSosToPhone();
            }
        };

        btnSos.setOnTouchListener((v, event) -> {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    isHolding = true;
                    tvStatus.setText("Status: Holding...");
                    holdHandler.postDelayed(triggerSosRunnable, 2000); // 2 second hold
                    return true;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    if (isHolding) {
                        isHolding = false;
                        holdHandler.removeCallbacks(triggerSosRunnable);
                        if (!tvStatus.getText().toString().startsWith("Status: SOS")) {
                            tvStatus.setText("Status: Cancelled hold");
                        }
                    }
                    return true;
            }
            return false;
        });

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(android.content.Intent intent) {
        if (intent != null && intent.hasExtra("ALERT_MESSAGE")) {
            String msg = intent.getStringExtra("ALERT_MESSAGE");
            tvStatus.setText("🚨 MESHSOS ALERT\n\n" + msg);
        }
    }

    private void sendSosToPhone() {
        tvStatus.setText("Status: Sending SOS...");
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                Task<List<Node>> nodeListTask = Wearable.getNodeClient(this).getConnectedNodes();
                List<Node> nodes = Tasks.await(nodeListTask);
                
                if (nodes.isEmpty()) {
                    runOnUiThread(() -> tvStatus.setText("Status: Phone unavailable"));
                    return;
                }

                String payload = "WEAR_OS_SOS";
                byte[] payloadBytes = payload.getBytes();
                
                boolean sent = false;
                for (Node node : nodes) {
                    Task<Integer> sendMessageTask = Wearable.getMessageClient(this).sendMessage(node.getId(), SOS_PATH, payloadBytes);
                    Integer result = Tasks.await(sendMessageTask);
                    if (result != -1) sent = true;
                }
                
                final boolean finalSent = sent;
                runOnUiThread(() -> {
                    if (finalSent) {
                        tvStatus.setText("Status: SOS Sent");
                    } else {
                        tvStatus.setText("Status: Phone unavailable");
                    }
                });
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to send SOS", e);
                runOnUiThread(() -> tvStatus.setText("Status: Error sending SOS"));
            }
        });
    }
}
