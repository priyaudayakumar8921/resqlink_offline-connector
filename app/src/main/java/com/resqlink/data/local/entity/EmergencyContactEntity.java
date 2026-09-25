package com.resqlink.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "emergency_contacts")
public class EmergencyContactEntity {
    @PrimaryKey
    @NonNull
    public String phoneNumber;
    public String name;
    public String type; // e.g., "2G"
    
    public EmergencyContactEntity(@NonNull String phoneNumber, String name, String type) {
        this.phoneNumber = phoneNumber;
        this.name = name;
        this.type = type;
    }
}
