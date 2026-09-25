package com.resqlink.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.resqlink.data.local.entity.AlertEntity;

import java.util.List;

@Dao
public interface AlertDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(AlertEntity alert);

    @Query("SELECT * FROM alerts ORDER BY timestamp DESC")
    LiveData<List<AlertEntity>> getAllAlerts();

    @Query("SELECT * FROM alerts WHERE alertId = :id LIMIT 1")
    LiveData<AlertEntity> getAlertById(String id);
}
