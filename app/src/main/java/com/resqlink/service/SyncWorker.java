package com.resqlink.service;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.dao.SOSDao;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.data.remote.HubClient;
import com.resqlink.model.TransmissionStatus;
import com.resqlink.network.HubConnectionManager;
import com.resqlink.util.AppLogger;

import java.util.List;

public class SyncWorker extends Worker {
    private static final String TAG = "SyncWorker";

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        AppLogger.d(TAG, "SyncWorker started");
        
        AppDatabase db = AppDatabase.getDatabase(getApplicationContext());
        SOSDao sosDao = db.sosDao();
        
        List<SOSMessageEntity> pendingMessages = sosDao.getPendingSOSMessages();
        if (pendingMessages == null || pendingMessages.isEmpty()) {
            AppLogger.d(TAG, "No pending messages to sync");
            return Result.success();
        }
        
        HubClient hubClient = HubConnectionManager.getInstance(getApplicationContext()).getClient();
        
        boolean allSuccess = true;
        
        for (SOSMessageEntity sos : pendingMessages) {
            boolean success = hubClient.sendSOS(sos);
            if (success) {
                sos.status = TransmissionStatus.DELIVERED_TO_HUB.name();
                sosDao.update(sos);
                AppLogger.d(TAG, "Synced message: " + sos.messageId);
            } else {
                sos.retryCount++;
                sos.lastAttempt = System.currentTimeMillis();
                sos.status = TransmissionStatus.QUEUED.name();
                sosDao.update(sos);
                allSuccess = false;
                AppLogger.e(TAG, "Failed to sync message: " + sos.messageId);
            }
        }
        
        if (allSuccess) {
            return Result.success();
        } else {
            return Result.retry();
        }
    }
}
