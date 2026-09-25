package com.resqlink.ui.citizen;

import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import com.resqlink.R;
import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.entity.EmergencyContactEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;

public class EmergencyContactsActivity extends AppCompatActivity {
    private EditText etName;
    private EditText etPhone;
    private Button btnAdd;
    private ListView lvContacts;
    private AppDatabase db;
    private ArrayAdapter<String> adapter;
    private List<String> displayList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_emergency_contacts);

        etName = findViewById(R.id.etName);
        etPhone = findViewById(R.id.etPhone);
        btnAdd = findViewById(R.id.btnAdd);
        lvContacts = findViewById(R.id.lvContacts);
        db = AppDatabase.getDatabase(this);

        adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, displayList);
        lvContacts.setAdapter(adapter);

        btnAdd.setOnClickListener(v -> {
            String name = etName.getText().toString().trim();
            String phone = etPhone.getText().toString().trim();
            if (!phone.isEmpty()) {
                addContact(name, phone);
            } else {
                Toast.makeText(this, "Phone required", Toast.LENGTH_SHORT).show();
            }
        });

        loadContacts();
    }

    private void addContact(String name, String phone) {
        Executors.newSingleThreadExecutor().execute(() -> {
            EmergencyContactEntity contact = new EmergencyContactEntity(phone, name, "2G");
            db.emergencyContactDao().insertContact(contact);
            runOnUiThread(() -> {
                etName.setText("");
                etPhone.setText("");
                Toast.makeText(EmergencyContactsActivity.this, "Contact Added", Toast.LENGTH_SHORT).show();
                loadContacts();
            });
        });
    }

    private void loadContacts() {
        db.emergencyContactDao().getAllContacts().observe(this, contacts -> {
            displayList.clear();
            for (EmergencyContactEntity contact : contacts) {
                displayList.add(contact.name + " (" + contact.phoneNumber + ")");
            }
            adapter.notifyDataSetChanged();
        });
    }
}
