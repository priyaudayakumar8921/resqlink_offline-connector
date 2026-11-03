package com.resqlink.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.dao.CitizenDao;
import com.resqlink.data.local.entity.CitizenProfileEntity;

public class CitizenRepository {
    private CitizenDao citizenDao;
    private LiveData<CitizenProfileEntity> profile;

    public CitizenRepository(Application application) {
        AppDatabase db = AppDatabase.getDatabase(application);
        citizenDao = db.citizenDao();
        profile = citizenDao.getProfile();
    }

    public LiveData<CitizenProfileEntity> getProfile() {
        return profile;
    }

    public void insertOrUpdate(CitizenProfileEntity profileEntity) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            citizenDao.insert(profileEntity);
        });
    }
}
