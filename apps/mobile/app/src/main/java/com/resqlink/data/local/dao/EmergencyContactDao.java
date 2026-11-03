package com.resqlink.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;

import com.resqlink.data.local.entity.EmergencyContactEntity;

import java.util.List;

@Dao
public interface EmergencyContactDao {
    @Query("SELECT * FROM emergency_contacts")
    LiveData<List<EmergencyContactEntity>> getAllContacts();

    @Query("SELECT * FROM emergency_contacts")
    List<EmergencyContactEntity> getAllContactsSync();

    @Query("SELECT * FROM emergency_contacts WHERE phoneNumber = :phone LIMIT 1")
    EmergencyContactEntity getContactSync(String phone);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertContact(EmergencyContactEntity contact);

    @Delete
    void deleteContact(EmergencyContactEntity contact);
}
