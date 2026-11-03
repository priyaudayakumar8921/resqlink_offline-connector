package com.resqlink.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "hubs")
public class HubEntity {
    @PrimaryKey
    @NonNull
    public String hubId;
    public String ipAddress;
    public String ssid;
    public String lastSeen;
    public boolean isConnected;

    public HubEntity() {
        this.hubId = "";
    }
}
