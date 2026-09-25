package com.resqlink.ui.common;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.databinding.ActivityRoleSelectionBinding;
import com.resqlink.ui.admin.AdminLoginActivity;
import com.resqlink.ui.citizen.CitizenSetupActivity;

public class RoleSelectionActivity extends AppCompatActivity {
    private ActivityRoleSelectionBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRoleSelectionBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.btnCitizen.setOnClickListener(v -> {
            startActivity(new Intent(this, CitizenSetupActivity.class));
        });

    }
}
