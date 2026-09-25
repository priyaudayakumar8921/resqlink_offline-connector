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
        
        setupSOSButton();
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
        
        binding.btnManage2G.setOnClickListener(v -> {
            startActivity(new Intent(this, EmergencyContactsActivity.class));
        });
    }
    
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

    private void updateStatuses() {
        binding.tvGpsStatus.setText("GPS: ● READY");
        binding.tvHubStatus.setText("EMERGENCY HUB: ● NOT CONNECTED");
        binding.tvNetworkStatus.setText("NETWORK: ● OFFLINE MODE");
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
