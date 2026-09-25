package com.resqlink.data.local.entity;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "citizen_profiles")
public class CitizenProfileEntity {
    @PrimaryKey
    @NonNull
    public String citizenId;
    public String name;
    public String phone;

    public CitizenProfileEntity() {
        this.citizenId = "";
    }
}
