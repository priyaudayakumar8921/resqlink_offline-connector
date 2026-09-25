package com.resqlink.data.repository;

import android.app.Application;

import androidx.lifecycle.LiveData;

import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.dao.SOSDao;
import com.resqlink.data.local.entity.SOSMessageEntity;

import java.util.List;

public class SOSRepository {
    private SOSDao sosDao;

    public SOSRepository(Application application) {
        AppDatabase db = AppDatabase.getDatabase(application);
        sosDao = db.sosDao();
    }

    public LiveData<List<SOSMessageEntity>> getAllSOSMessages() {
        return sosDao.getAllSOSMessages();
    }

    public void saveSOSMessage(SOSMessageEntity sosMessage) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            sosDao.insert(sosMessage);
        });
    }
    
    public void updateSOSMessage(SOSMessageEntity sosMessage) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            sosDao.update(sosMessage);
        });
    }
}
