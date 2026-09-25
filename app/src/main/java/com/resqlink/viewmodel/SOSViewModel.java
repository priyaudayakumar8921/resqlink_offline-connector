package com.resqlink.viewmodel;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;

import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.data.repository.SOSRepository;
import com.resqlink.model.TransmissionStatus;
import com.resqlink.util.AppLogger;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;

public class SOSViewModel extends AndroidViewModel {
    private SOSRepository repository;
    private static final String TAG = "SOSViewModel";

    public SOSViewModel(@NonNull Application application) {
        super(application);
        repository = new SOSRepository(application);
    }

    public String createAndSaveSOS(String citizenId, Double lat, Double lng, Float accuracy) {
        SOSMessageEntity sos = new SOSMessageEntity();
        sos.messageId = "SOS-" + new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        sos.citizenId = citizenId;
        sos.emergencyType = "GENERAL";
        sos.latitude = lat;
        sos.longitude = lng;
        sos.accuracy = accuracy;
        sos.timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(new Date());
        sos.status = TransmissionStatus.PENDING.name();
        sos.retryCount = 0;
        sos.lastAttempt = System.currentTimeMillis();
        sos.priority = "CRITICAL";

        repository.saveSOSMessage(sos);
        AppLogger.d(TAG, "Saved new SOS locally with ID: " + sos.messageId);
        
        java.util.concurrent.Executors.newSingleThreadExecutor().execute(() -> {
            boolean success = com.resqlink.network.HubConnectionManager.getInstance(getApplication()).getClient().sendSOS(sos);
            if (success) {
                sos.status = TransmissionStatus.DELIVERED_TO_HUB.name();
                repository.saveSOSMessage(sos);
                AppLogger.d(TAG, "Successfully dispatched SOS to network");
            } else {
                AppLogger.e(TAG, "Failed to dispatch SOS to network");
            }
        });
        
        return sos.messageId;
    }
}
