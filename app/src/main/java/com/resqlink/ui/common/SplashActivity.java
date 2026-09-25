package com.resqlink.ui.common;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.R;

import android.content.SharedPreferences;

public class SplashActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        SharedPreferences prefs = getSharedPreferences("ResQLinkPrefs", MODE_PRIVATE);
        boolean isCitizenSetup = prefs.getBoolean("is_citizen_setup", false);
        
        if (isCitizenSetup) {
            // Direct launch to CitizenHomeActivity, skip splash completely
            startActivity(new Intent(this, com.resqlink.ui.citizen.CitizenHomeActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            startActivity(new Intent(SplashActivity.this, RoleSelectionActivity.class));
            finish();
        }, 1500);
    }
}
