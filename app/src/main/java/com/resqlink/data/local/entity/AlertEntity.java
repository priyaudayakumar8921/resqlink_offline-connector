package com.resqlink.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "alerts")
public class AlertEntity {
    @PrimaryKey
    @NonNull
    public String alertId;
    public String title;
    public String message;
    public String type;
    public String priority;
    public String targetArea;
    public String timestamp;

    public AlertEntity() {
        this.alertId = "";
    }
}
