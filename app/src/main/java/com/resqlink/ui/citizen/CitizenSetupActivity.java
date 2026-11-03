package com.resqlink.ui.citizen;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.resqlink.databinding.ActivityCitizenSetupBinding;
import com.resqlink.viewmodel.CitizenViewModel;

import java.util.UUID;

public class CitizenSetupActivity extends AppCompatActivity {
    private ActivityCitizenSetupBinding binding;
    private CitizenViewModel viewModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityCitizenSetupBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        viewModel = new ViewModelProvider(this).get(CitizenViewModel.class);

        viewModel.getProfile().observe(this, profile -> {
            if (profile != null && profile.citizenId != null && !profile.citizenId.isEmpty()) {
                // Profile exists, set pref just in case and go to home
                getSharedPreferences("ResQLinkPrefs", MODE_PRIVATE).edit().putBoolean("is_citizen_setup", true).apply();
                startActivity(new Intent(this, CitizenHomeActivity.class));
                finish();
            }
        });

        binding.btnSave.setOnClickListener(v -> saveProfile());
    }

    private void saveProfile() {
        String name = binding.etName.getText() != null ? binding.etName.getText().toString().trim() : "";
        String phone = binding.etPhone.getText() != null ? binding.etPhone.getText().toString().trim() : "";
        
        String currentHubUrl = com.resqlink.network.HubConnectionManager.getInstance(this).getCurrentUrl();
        
        String newCitizenId = "CIT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        viewModel.saveProfile(newCitizenId, name, phone);
        
        SharedPreferences prefs = getSharedPreferences("ResQLinkPrefs", MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean("is_citizen_setup", true);
        if (!prefs.contains("hub_base_url")) {
            editor.putString("hub_base_url", currentHubUrl);
        }
        editor.apply();
        
        Toast.makeText(this, "Profile Saved", Toast.LENGTH_SHORT).show();
        
        startActivity(new Intent(this, CitizenHomeActivity.class));
        finish();
    }
}
