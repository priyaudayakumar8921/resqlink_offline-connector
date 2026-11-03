package com.resqlink.ui.citizen;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.provider.Settings;
import android.net.Uri;
import android.graphics.Color;
import android.widget.EditText;
import android.widget.LinearLayout;
import androidx.appcompat.app.AlertDialog;
import java.util.ArrayList;
import java.util.List;
import android.os.Build;
import java.util.concurrent.Executors;

import com.resqlink.databinding.ActivityCitizenHomeBinding;
import com.resqlink.network.HubConnectionManager;

public class CitizenHomeActivity extends AppCompatActivity {
    private ActivityCitizenHomeBinding binding;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean isSosTriggered = false;
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;
    private static final int MESH_PERMISSION_REQUEST_CODE = 1002;
    private long lastSosTime = 0;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityCitizenHomeBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        com.resqlink.network.HubDiscoverer.startDiscovery(this);
        com.resqlink.network.HubConnectionManager.getInstance(this).probeAndConnect(this, null);
        
        setupSOSButton();
        setupHubStatusMonitoring();
        updateStatuses();
        
        // Start the persistent Foreground Service for Alerts
        Intent serviceIntent = new Intent(this, com.resqlink.service.EmergencyPollingService.class);
        androidx.core.content.ContextCompat.startForegroundService(this, serviceIntent);
        
        // Check if opened from notification
        if (getIntent() != null && getIntent().hasExtra("BROADCAST_MESSAGE")) {
            String msg = getIntent().getStringExtra("BROADCAST_MESSAGE");
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("EMERGENCY BROADCAST")
                .setMessage(msg)
                .setIcon(android.R.drawable.ic_dialog_alert)
                .setPositiveButton("ACKNOWLEDGE", null)
                .show();
        }
        
        requestMeshPermissions();
        checkOverlayPermission();
        
        // Pre-load Vosk AI Voice Model in the background for MAXIMUM SPEED later
        new Thread(() -> {
            try {
                org.vosk.android.StorageService.unpack(this, "model-en", "model", (m) -> {}, (e) -> {});
            } catch (Exception ignored) {}
        }).start();    }
    
    private void checkOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                new AlertDialog.Builder(this)
                    .setTitle("Permission Required")
                    .setMessage("To receive full-screen alerts when the app is closed, you must allow 'Display over other apps'.")
                    .setPositiveButton("Grant", (dialog, which) -> {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    })
                    .setNegativeButton("Skip", null)
                    .show();
            }
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    private void setupSOSButton() {
        binding.tvHoldInstruction.setText("TAP TO SEND EMERGENCY SOS");
        
        binding.btnSOS.setOnClickListener(v -> {
            if (isSosTriggered) return;
            
            // Rate Limiting Check (30 seconds)
            if (System.currentTimeMillis() - lastSosTime < 30000) {
                Toast.makeText(CitizenHomeActivity.this, "Please wait 30s before sending another SOS.", Toast.LENGTH_LONG).show();
                return;
            }
            
            isSosTriggered = true;
            binding.progressSOS.setVisibility(View.VISIBLE);
            triggerSOS();
        });

        binding.btnVoiceEmergency.setOnClickListener(v -> {
            startActivity(new Intent(this, com.resqlink.ui.voice.VoiceEmergencyActivity.class));
        });
    }

    private void resetSOSButton() {
        isSosTriggered = false;
        binding.btnSOS.setText("SOS");
        binding.progressSOS.setVisibility(View.GONE);
        binding.tvHoldInstruction.setText("TAP TO SEND EMERGENCY SOS");
    }

    private void requestMeshPermissions() {
        List<String> requiredPermissions = new ArrayList<>();
        requiredPermissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        requiredPermissions.add(Manifest.permission.ACCESS_COARSE_LOCATION);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requiredPermissions.add(Manifest.permission.BLUETOOTH_SCAN);
            requiredPermissions.add(Manifest.permission.BLUETOOTH_ADVERTISE);
            requiredPermissions.add(Manifest.permission.BLUETOOTH_CONNECT);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requiredPermissions.add(Manifest.permission.NEARBY_WIFI_DEVICES);
        }

        List<String> missingPermissions = new ArrayList<>();
        for (String permission : requiredPermissions) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                missingPermissions.add(permission);
            }
        }

        if (!missingPermissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, 
                    missingPermissions.toArray(new String[0]), MESH_PERMISSION_REQUEST_CODE);
        }
    }

    private void triggerSOS() {
        binding.btnSOS.setText("SENDING");
        binding.tvHoldInstruction.setText("SOS INITIATED");
        
        // 1. Check Location Permission
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, LOCATION_PERMISSION_REQUEST_CODE);
            return;
        }

        // Location permission granted, proceed to send SOS
        lastSosTime = System.currentTimeMillis();
        processSOSWithLocation();
    }
    
    private void processSOSWithLocation() {
        binding.tvHoldInstruction.setText("OBTAINING LOCATION...");
        
        com.resqlink.location.LocationHelper.getCurrentLocation(this, location -> {
            Double lat = null;
            Double lng = null;
            Float acc = null;
            
            if (location != null) {
                lat = location.getLatitude();
                lng = location.getLongitude();
                acc = location.getAccuracy();
                binding.tvGpsStatus.setText("GPS: ● Location Captured (" + Math.round(acc) + "m)");
            } else {
                binding.tvGpsStatus.setText("GPS: ● Location Unavailable");
            }
            
            binding.tvHoldInstruction.setText("SAVING SOS...");
            
            // Get Citizen ID
            com.resqlink.viewmodel.CitizenViewModel citizenVM = new androidx.lifecycle.ViewModelProvider(this).get(com.resqlink.viewmodel.CitizenViewModel.class);
            com.resqlink.viewmodel.SOSViewModel sosVM = new androidx.lifecycle.ViewModelProvider(this).get(com.resqlink.viewmodel.SOSViewModel.class);
            
            final Double finalLat = lat;
            final Double finalLng = lng;
            final Float finalAcc = acc;
            
            citizenVM.getProfile().observe(this, profile -> {
                if (profile != null) {
                    citizenVM.getProfile().removeObservers(this);
                    String sosId = sosVM.createAndSaveSOS(profile.citizenId, finalLat, finalLng, finalAcc);
                    
                    // Navigate to SOSStatusActivity
                    binding.tvHoldInstruction.setText("SOS INITIATED");
                    binding.btnSOS.setText("SOS SENT");
                    binding.progressSOS.setVisibility(View.GONE);
                    
                    Toast.makeText(this, "SOS Dispatched. Help is on the way.", Toast.LENGTH_LONG).show();
                    
                    // In a real flow, we'd start SOSStatusActivity here
                    Intent intent = new Intent(this, SOSStatusActivity.class);
                    intent.putExtra("SOS_ID", sosId);
                    startActivity(intent);
                    
                    // Reset UI for next time if they come back
                    resetSOSButton();
                }
            });
        });
    }

    private void setupHubStatusMonitoring() {
        HubConnectionManager hubManager = HubConnectionManager.getInstance(this);

        hubManager.getHubStatus().observe(this, status -> {
            String currentUrl = hubManager.getCurrentUrl();
            if (status == HubConnectionManager.HubStatus.CONNECTED) {
                binding.tvHubStatus.setText("EMERGENCY HUB: ● CONNECTED (" + currentUrl + ")");
                binding.tvHubStatus.setTextColor(Color.parseColor("#2E7D32")); // Green
                binding.tvNetworkStatus.setText("NETWORK: ● LOCAL MESH / HUB ACTIVE");
                binding.tvNetworkStatus.setTextColor(Color.parseColor("#2E7D32"));
            } else if (status == HubConnectionManager.HubStatus.CONNECTING) {
                binding.tvHubStatus.setText("EMERGENCY HUB: ● SCANNING (Wi-Fi Direct / Local)...");
                binding.tvHubStatus.setTextColor(Color.parseColor("#E65100")); // Orange
                binding.tvNetworkStatus.setText("NETWORK: ● SEARCHING FOR LOCAL HUB");
                binding.tvNetworkStatus.setTextColor(Color.parseColor("#E65100"));
            } else {
                binding.tvHubStatus.setText("EMERGENCY HUB: ● NOT CONNECTED (Tap to configure)");
                binding.tvHubStatus.setTextColor(Color.parseColor("#C62828")); // Red
                binding.tvNetworkStatus.setText("NETWORK: ● OFFLINE MODE");
                binding.tvNetworkStatus.setTextColor(Color.parseColor("#757575"));
            }
        });

        // Tap on hub status or status box to configure/test connection
        View.OnClickListener configListener = v -> showHubConfigDialog();
        binding.tvHubStatus.setOnClickListener(configListener);
        binding.llStatus.setOnClickListener(configListener);
    }

    private void showHubConfigDialog() {
        HubConnectionManager hubManager = HubConnectionManager.getInstance(this);
        String currentUrl = hubManager.getCurrentUrl();

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Emergency Hub Connection");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(48, 24, 48, 12);

        android.widget.TextView tvHint = new android.widget.TextView(this);
        tvHint.setText("Enter the Mock Hub or ESP32 Node API URL:\n• Wi-Fi Direct: http://192.168.49.1:3000/api/v1\n• Local Wi-Fi / Hotspot: http://<PC_IP>:3000/api/v1\n• Android Emulator: http://10.0.2.2:3000/api/v1");
        tvHint.setTextSize(13);
        tvHint.setTextColor(Color.parseColor("#616161"));
        tvHint.setPadding(0, 0, 0, 16);
        layout.addView(tvHint);

        EditText etUrl = new EditText(this);
        etUrl.setText(currentUrl);
        etUrl.setHint("http://192.168.49.1:3000/api/v1");
        etUrl.setSingleLine(true);
        layout.addView(etUrl);

        builder.setView(layout);

        builder.setPositiveButton("Save & Connect", (dialog, which) -> {
            String entered = etUrl.getText().toString().trim();
            if (!entered.isEmpty()) {
                hubManager.setHubUrl(entered, this);
                Toast.makeText(this, "Connecting to " + entered + "...", Toast.LENGTH_SHORT).show();
            }
        });

        builder.setNeutralButton("Auto-Detect / Scan", (dialog, which) -> {
            Toast.makeText(this, "Scanning Wi-Fi Direct, Gateway & UDP broadcasts...", Toast.LENGTH_SHORT).show();
            com.resqlink.network.HubDiscoverer.startDiscovery(this);
            hubManager.probeAndConnect(this, (success, url) -> {
                if (success) {
                    Toast.makeText(this, "Connected to Hub: " + url, Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(this, "No local hub responded. Check Wi-Fi / PC firewall.", Toast.LENGTH_LONG).show();
                }
            });
        });

        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    private void updateStatuses() {
        binding.tvGpsStatus.setText("GPS: ● READY");
        // Status monitoring handles tvHubStatus and tvNetworkStatus
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                processSOSWithLocation();
            } else {
                Toast.makeText(this, "Location permission denied. Sending without coordinates.", Toast.LENGTH_LONG).show();
                processSOSWithLocation(); // Still send without coords
            }
        } else if (requestCode == MESH_PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int res : grantResults) {
                if (res != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, "Mesh Network permissions denied. Offline P2P will not work.", Toast.LENGTH_LONG).show();
            }
        }
    }
}
