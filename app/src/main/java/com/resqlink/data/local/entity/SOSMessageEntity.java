package com.resqlink.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "sos_messages")
public class SOSMessageEntity {
    @PrimaryKey
    @NonNull
    public String messageId;
    public String citizenId;
    public String emergencyType;
    public Double latitude;
    public Double longitude;
    public Float accuracy;
    public String timestamp;
    public String status; // Stores TransmissionStatus string
    public int retryCount;
    public long lastAttempt;
    public String hubId;
    public String description;
    public String priority;

    public SOSMessageEntity() {
        this.messageId = "";
    }
}
