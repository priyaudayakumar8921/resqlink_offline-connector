package com.resqlink.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.resqlink.data.local.entity.CitizenProfileEntity;
import com.resqlink.data.repository.CitizenRepository;

public class CitizenViewModel extends AndroidViewModel {
    private CitizenRepository repository;
    private LiveData<CitizenProfileEntity> profile;

    public CitizenViewModel(@NonNull Application application) {
        super(application);
        repository = new CitizenRepository(application);
        profile = repository.getProfile();
    }

    public LiveData<CitizenProfileEntity> getProfile() {
        return profile;
    }

    public void saveProfile(String citizenId, String name, String phone) {
        CitizenProfileEntity profileEntity = new CitizenProfileEntity();
        profileEntity.citizenId = citizenId;
        profileEntity.name = name;
        profileEntity.phone = phone;
        repository.insertOrUpdate(profileEntity);
    }
}
