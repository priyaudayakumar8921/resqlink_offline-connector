package com.resqlink.ui.admin;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.databinding.ActivityAdminLoginBinding;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AdminLoginActivity extends AppCompatActivity {
    private ActivityAdminLoginBinding binding;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Map<String, String> stationMap = new HashMap<>(); // Name -> ID

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAdminLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        loadStations();

        binding.btnLogin.setOnClickListener(v -> {
            String selectedName = binding.etStationId.getText().toString();
            String stationId = stationMap.get(selectedName);
            String pass = binding.etPassword.getText() != null ? binding.etPassword.getText().toString() : "";
            
            if (stationId != null && !stationId.isEmpty() && !pass.isEmpty()) {
                performLogin(stationId, pass);
            } else {
                Toast.makeText(this, "Select a Station and enter Password", Toast.LENGTH_SHORT).show();
            }
        });

        binding.btnDemoLogin.setOnClickListener(v -> {
            // For Demo, just bypass since we might not be online
            startActivity(new Intent(this, AdminDashboardActivity.class));
            finish();
        });
    }

    private void loadStations() {
        // We add hardcoded fallbacks in case the server is offline during demo
        stationMap.put("Alappuzha South Police Station", "POL-ALP-SOUTH");
        stationMap.put("Alappuzha North Police Station", "POL-ALP-NORTH");
        stationMap.put("Punnapra Police Station", "POL-PUNNAPRA");
        stationMap.put("Ambalapuzha Police Station", "POL-AMBALAPUZHA");
        stationMap.put("Nedumudy Police Station", "POL-NEDUMUDY");
        stationMap.put("Mararikkulam Police Station", "POL-MARARIKKULAM");
        stationMap.put("Mannanchery Police Station", "POL-MANNANCHERY");
        stationMap.put("Cherthala Police Station", "POL-CHERTHALA");
        stationMap.put("Aroor Police Station", "POL-AROOR");
        stationMap.put("Kuthiathode Police Station", "POL-KUTHIATHODE");
        stationMap.put("Pattanakkad Police Station", "POL-PATTANAKKAD");
        stationMap.put("Muhamma Police Station", "POL-MUHAMMA");
        stationMap.put("Arthunkal Police Station", "POL-ARTHUNKAL");
        stationMap.put("Pulincunnu Police Station", "POL-PULINCUNNU");
        stationMap.put("Edathua Police Station", "POL-EDATHUA");
        stationMap.put("Ramankari Police Station", "POL-RAMANKARI");
        stationMap.put("Kainady Police Station", "POL-KAINADY");
        stationMap.put("Kayamkulam Police Station", "POL-KAYAMKULAM");
        stationMap.put("Harippad Police Station", "POL-HARIPPAD");
        stationMap.put("Kareelakulangara Police Station", "POL-KAREELAKULANGARA");
        stationMap.put("Trikkunnapuzha Police Station", "POL-TRIKKUNNAPUZHA");
        stationMap.put("Kanakakunnu Police Station", "POL-KANAKAKUNNU");
        stationMap.put("Vallikunnam Police Station", "POL-VALLIKUNNAM");
        stationMap.put("Chengannur Police Station", "POL-CHENGANNUR");
        stationMap.put("Mannar Police Station", "POL-MANNAR");
        stationMap.put("Venmony Police Station", "POL-VENMONY");
        stationMap.put("Mavelikara Police Station", "POL-MAVELIKARA");
        stationMap.put("Nooranad Police Station", "POL-NOORANAD");
        stationMap.put("Kurathikad Police Station", "POL-KURATHIKAD");
        stationMap.put("Veeyapuram Police Station", "POL-VEEYAPURAM");
        stationMap.put("Cyber Police Station", "POL-CYBER");
        stationMap.put("Alappuzha Vanitha Police Station", "POL-VANITHA");
        stationMap.put("Thottappally Coastal Police Station", "POL-COASTAL");
        stationMap.put("Alappuzha Traffic Police Station", "POL-TRAFFIC");
        stationMap.put("Fire and Rescue Station, Alappuzha", "FRS-ALAPPUZHA");
        stationMap.put("Fire and Rescue Station, Aroor", "FRS-AROOR");
        stationMap.put("Fire and Rescue Station, Cherthala", "FRS-CHERTHALA");
        stationMap.put("Fire and Rescue Station, Thakazhy", "FRS-THAKAZHY");
        stationMap.put("Fire and Rescue Station, Haripad", "FRS-HARIPAD");
        stationMap.put("Fire and Rescue Station, Kayamkulam", "FRS-KAYAMKULAM");
        stationMap.put("Fire and Rescue Station, Mavelikkara", "FRS-MAVELIKKARA");
        stationMap.put("Fire and Rescue Station, Chengannur", "FRS-CHENGANNUR");
        
        setupDropdown();

        executor.execute(() -> {
            try {
                URL url = new URL("http://10.0.2.2:3000/api/v1/stations");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                
                if (conn.getResponseCode() == 200) {
                    InputStreamReader reader = new InputStreamReader(conn.getInputStream());
                    StringBuilder sb = new StringBuilder();
                    int c;
                    while ((c = reader.read()) != -1) {
                        sb.append((char) c);
                    }
                    reader.close();
                    
                    JSONArray arr = new JSONArray(sb.toString());
                    stationMap.clear();
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        stationMap.put(obj.getString("stationName"), obj.getString("stationId"));
                    }
                    mainHandler.post(this::setupDropdown);
                }
            } catch (Exception e) {
                // Ignore, use fallback
            }
        });
    }

    private void setupDropdown() {
        List<String> names = new ArrayList<>(stationMap.keySet());
        java.util.Collections.sort(names);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, names);
        binding.etStationId.setAdapter(adapter);
    }

    private void performLogin(String stationId, String password) {
        binding.btnLogin.setEnabled(false);
        binding.btnLogin.setText("Logging in...");
        
        executor.execute(() -> {
            try {
                URL url = new URL("http://10.0.2.2:3000/api/v1/login");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                JSONObject req = new JSONObject();
                req.put("stationId", stationId);
                req.put("password", password);
                
                try(OutputStream os = conn.getOutputStream()) {
                    byte[] input = req.toString().getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
                
                if (conn.getResponseCode() == 200) {
                    mainHandler.post(() -> {
                        startActivity(new Intent(AdminLoginActivity.this, AdminDashboardActivity.class));
                        finish();
                    });
                } else {
                    mainHandler.post(() -> {
                        binding.btnLogin.setEnabled(true);
                        binding.btnLogin.setText("Login");
                        Toast.makeText(AdminLoginActivity.this, "Invalid credentials", Toast.LENGTH_SHORT).show();
                    });
                }
            } catch (Exception e) {
                mainHandler.post(() -> {
                    // Fallback for offline demo
                    if (password.equals("admin123")) {
                        startActivity(new Intent(AdminLoginActivity.this, AdminDashboardActivity.class));
                        finish();
                    } else {
                        binding.btnLogin.setEnabled(true);
                        binding.btnLogin.setText("Login");
                        Toast.makeText(AdminLoginActivity.this, "Server offline. Use admin123 for local demo.", Toast.LENGTH_LONG).show();
                    }
                });
            }
        });
    }
}
