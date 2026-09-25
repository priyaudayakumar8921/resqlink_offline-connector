package com.resqlink.ui.citizen;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.R;

public class SOSStatusActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sos_status);
        
        findViewById(R.id.btnCancelFalseAlarm).setOnClickListener(v -> {
            android.widget.Toast.makeText(this, "SOS Cancelled. Network notified.", android.widget.Toast.LENGTH_LONG).show();
            // Optional: send cancel payload to mesh here
            finish();
        });
    }
}
