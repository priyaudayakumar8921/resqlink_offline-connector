package com.resqlink.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.resqlink.data.local.entity.SOSMessageEntity;

import java.util.List;

@Dao
public interface SOSDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(SOSMessageEntity sos);

    @Update
    void update(SOSMessageEntity sos);

    @Query("SELECT * FROM sos_messages WHERE messageId = :id LIMIT 1")
    SOSMessageEntity getSOSById(String id);

    @Query("SELECT * FROM sos_messages ORDER BY timestamp DESC")
    LiveData<List<SOSMessageEntity>> getAllSOSMessages();

    @Query("SELECT * FROM sos_messages WHERE status = 'QUEUED' OR status = 'PENDING'")
    List<SOSMessageEntity> getPendingSOSMessages();
}
