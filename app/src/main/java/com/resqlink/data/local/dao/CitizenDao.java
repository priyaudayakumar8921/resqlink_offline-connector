package com.resqlink.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.resqlink.data.local.entity.CitizenProfileEntity;

@Dao
public interface CitizenDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(CitizenProfileEntity profile);

    @Update
    void update(CitizenProfileEntity profile);

    @Query("SELECT * FROM citizen_profiles LIMIT 1")
    LiveData<CitizenProfileEntity> getProfile();

    @Query("SELECT * FROM citizen_profiles LIMIT 1")
    CitizenProfileEntity getProfileSync();
}
