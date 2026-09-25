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
        String hubIp = binding.etHubIp.getText() != null ? binding.etHubIp.getText().toString().trim() : "http://192.168.1.5:3000/api/v1";
        
        String newCitizenId = "CIT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        viewModel.saveProfile(newCitizenId, name, phone);
        
        SharedPreferences.Editor editor = getSharedPreferences("ResQLinkPrefs", MODE_PRIVATE).edit();
        editor.putBoolean("is_citizen_setup", true);
        editor.putString("hub_base_url", hubIp);
        editor.apply();
        
        Toast.makeText(this, "Profile Saved", Toast.LENGTH_SHORT).show();
        
        startActivity(new Intent(this, CitizenHomeActivity.class));
        finish();
    }
}
