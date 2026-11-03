package com.resqlink.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.resqlink.data.local.entity.HubEntity;

import java.util.List;

@Dao
public interface HubDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(HubEntity hub);

    @Query("SELECT * FROM hubs")
    LiveData<List<HubEntity>> getAllHubs();
    
    @Query("SELECT * FROM hubs WHERE isConnected = 1 LIMIT 1")
    HubEntity getConnectedHubSync();
}
