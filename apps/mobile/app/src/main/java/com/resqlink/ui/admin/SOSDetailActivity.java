package com.resqlink.ui.admin;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.databinding.ActivitySosDetailBinding;

public class SOSDetailActivity extends AppCompatActivity {
    private ActivitySosDetailBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySosDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        String sosId = getIntent().getStringExtra("SOS_ID");
        if (sosId != null) {
            binding.tvSosId.setText("SOS ID: " + sosId);
        }

        binding.btnAcknowledge.setOnClickListener(v -> {
            Toast.makeText(this, "SOS Acknowledged", Toast.LENGTH_SHORT).show();
            // Implement status update logic here
        });

        binding.btnResolve.setOnClickListener(v -> {
            Toast.makeText(this, "SOS Resolved", Toast.LENGTH_SHORT).show();
            // Implement status update logic here
            finish();
        });
    }
}
