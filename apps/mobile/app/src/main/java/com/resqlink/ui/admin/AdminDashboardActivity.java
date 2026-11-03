package com.resqlink.ui.admin;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.annotation.NonNull;
import java.util.ArrayList;
import java.util.List;

import com.resqlink.adapter.SOSAdapter;
import com.resqlink.databinding.ActivityAdminDashboardBinding;
import com.resqlink.model.P2PPayload;
import com.resqlink.network.P2PMeshManager;
import com.resqlink.viewmodel.SOSViewModel;
import com.resqlink.data.local.entity.SOSMessageEntity;

public class AdminDashboardActivity extends AppCompatActivity {
    private ActivityAdminDashboardBinding binding;
    private SOSViewModel viewModel;
    private SOSAdapter adapter;
    private static final int MESH_PERMISSION_REQUEST_CODE = 1002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAdminDashboardBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        setSupportActionBar(binding.toolbar);

        viewModel = new ViewModelProvider(this).get(SOSViewModel.class);
        
        binding.rvRecentSOS.setLayoutManager(new LinearLayoutManager(this));
        
        // Setup adapter and observe data
        adapter = new SOSAdapter();
        binding.rvRecentSOS.setAdapter(adapter);
        
        viewModel.getAllSOSMessages().observe(this, sosMessages -> {
            if (sosMessages != null) {
                adapter.setSosList(sosMessages);
                binding.tvActiveSOSCount.setText(String.valueOf(sosMessages.size()));
            }
        });

        requestMeshPermissions();

        // Initialize P2P Mesh for Admin to receive SOS and send Alerts
        P2PMeshManager.getInstance(this).setPayloadListener(payload -> {
            if (P2PPayload.TYPE_SOS.equals(payload.type)) {
                try {
                    // Try to save to viewmodel/repository so it shows up in RV
                    com.google.gson.JsonObject jsonObject = com.google.gson.JsonParser.parseString(payload.data).getAsJsonObject();
                    String citizenId = jsonObject.has("citizenId") ? jsonObject.get("citizenId").getAsString() : "Unknown";
                    Double lat = jsonObject.has("latitude") && !jsonObject.get("latitude").isJsonNull() ? jsonObject.get("latitude").getAsDouble() : null;
                    Double lng = jsonObject.has("longitude") && !jsonObject.get("longitude").isJsonNull() ? jsonObject.get("longitude").getAsDouble() : null;
                    Float acc = jsonObject.has("accuracy") && !jsonObject.get("accuracy").isJsonNull() ? jsonObject.get("accuracy").getAsFloat() : null;
                    
                    SOSMessageEntity entity = new SOSMessageEntity();
                    entity.messageId = jsonObject.has("messageId") ? jsonObject.get("messageId").getAsString() : "SOS-" + System.currentTimeMillis();
                    entity.citizenId = citizenId;
                    entity.latitude = lat;
                    entity.longitude = lng;
                    entity.accuracy = acc;
                    entity.timestamp = jsonObject.has("timestamp") ? jsonObject.get("timestamp").getAsString() : "Now";
                    entity.emergencyType = jsonObject.has("emergencyType") ? jsonObject.get("emergencyType").getAsString() : "Unknown";
                    entity.status = "RECEIVED";
                    new com.resqlink.data.repository.SOSRepository(getApplication()).saveSOSMessage(entity);
                    
                    runOnUiThread(() -> {
                        Toast.makeText(AdminDashboardActivity.this, "New SOS Received from Mesh!", Toast.LENGTH_LONG).show();
                    });
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
        
        binding.btnBroadcastAlert.setOnClickListener(v -> {
            showBroadcastDialog();
        });
    }

    private void showBroadcastDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Broadcast Alert");
        final EditText input = new EditText(this);
        input.setHint("Enter alert message...");
        builder.setView(input);

        builder.setPositiveButton("Send", (dialog, which) -> {
            String message = input.getText().toString();
            if (!message.isEmpty()) {
                P2PPayload p2pPayload = new P2PPayload(P2PPayload.TYPE_ALERT, message, System.currentTimeMillis());
                P2PMeshManager.getInstance(getApplicationContext()).broadcastPayload(p2pPayload);
                Toast.makeText(this, "Alert Broadcasted via Wi-Fi Direct Mesh", Toast.LENGTH_SHORT).show();
            }
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        P2PMeshManager.getInstance(this).startMesh();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        P2PMeshManager.getInstance(this).stopMesh();
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

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MESH_PERMISSION_REQUEST_CODE) {
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
