package com.resqlink.data.local;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.resqlink.data.local.dao.AlertDao;
import com.resqlink.data.local.dao.CitizenDao;
import com.resqlink.data.local.dao.HubDao;
import com.resqlink.data.local.dao.SOSDao;
import com.resqlink.data.local.entity.AlertEntity;
import com.resqlink.data.local.entity.CitizenProfileEntity;
import com.resqlink.data.local.entity.HubEntity;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.data.local.entity.EmergencyContactEntity;
import com.resqlink.data.local.dao.EmergencyContactDao;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Database(entities = {
        SOSMessageEntity.class, 
        CitizenProfileEntity.class, 
        AlertEntity.class, 
        HubEntity.class,
        EmergencyContactEntity.class
}, version = 2, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {

    public abstract SOSDao sosDao();
    public abstract CitizenDao citizenDao();
    public abstract AlertDao alertDao();
    public abstract HubDao hubDao();
    public abstract EmergencyContactDao emergencyContactDao();

    private static volatile AppDatabase INSTANCE;
    private static final int NUMBER_OF_THREADS = 4;
    public static final ExecutorService databaseWriteExecutor =
            Executors.newFixedThreadPool(NUMBER_OF_THREADS);

    public static AppDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                            AppDatabase.class, "resqlink_database")
                            .fallbackToDestructiveMigration()
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
