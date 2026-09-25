package com.resqlink.ui.citizen;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.app.KeyguardManager;
import android.widget.Button;
import android.widget.TextView;
import com.resqlink.R;

public class BroadcastAlertActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Remove title bar and make it act like a dialog
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        
        // Key flags to wake screen and show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }

        setContentView(R.layout.activity_broadcast_alert);
        
        // Ensure this doesn't get dismissed when touching outside
        setFinishOnTouchOutside(false);

        String message = getIntent().getStringExtra("BROADCAST_MESSAGE");
        if (message == null || message.isEmpty()) {
            message = "EMERGENCY BROADCAST RECEIVED";
        }

        TextView tvAlertMessage = findViewById(R.id.tvAlertMessage);
        tvAlertMessage.setText(message);

        Button btnAcknowledge = findViewById(R.id.btnAcknowledge);
        btnAcknowledge.setOnClickListener(v -> finish());
    }
}
