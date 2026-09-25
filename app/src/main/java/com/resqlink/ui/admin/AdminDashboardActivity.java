package com.resqlink.ui.admin;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.resqlink.databinding.ActivityAdminDashboardBinding;
import com.resqlink.viewmodel.SOSViewModel;

public class AdminDashboardActivity extends AppCompatActivity {
    private ActivityAdminDashboardBinding binding;
    private SOSViewModel viewModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAdminDashboardBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        setSupportActionBar(binding.toolbar);

        viewModel = new ViewModelProvider(this).get(SOSViewModel.class);
        
        binding.rvRecentSOS.setLayoutManager(new LinearLayoutManager(this));
        
        // Setup adapter and observe data
        // SOSAdapter adapter = new SOSAdapter();
        // binding.rvRecentSOS.setAdapter(adapter);
    }
}
