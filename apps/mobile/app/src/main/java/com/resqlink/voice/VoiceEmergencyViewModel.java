package com.resqlink.voice;

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

public class VoiceEmergencyViewModel extends AndroidViewModel {
    private SOSRepository repository;
    private static final String TAG = "VoiceEmergencyViewModel";

    public VoiceEmergencyViewModel(@NonNull Application application) {
        super(application);
        repository = new SOSRepository(application);
    }

    public String createAndSaveVoiceEmergency(String citizenId, Double lat, Double lng, Float accuracy, String transcribedText, String emergencyType, String priority) {
        SOSMessageEntity sos = new SOSMessageEntity();
        sos.messageId = "VOICE-" + new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        sos.citizenId = citizenId;
        sos.emergencyType = emergencyType;
        sos.latitude = lat;
        sos.longitude = lng;
        sos.accuracy = accuracy;
        sos.timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(new Date());
        sos.status = TransmissionStatus.PENDING.name();
        sos.retryCount = 0;
        sos.lastAttempt = System.currentTimeMillis();
        sos.priority = priority;
        if (lat != null && lng != null) {
            String mapLink = "Location: https://maps.google.com/?q=" + lat + "," + lng;
            sos.description = "[VOICE_EMERGENCY] " + transcribedText + " | " + mapLink;
        } else {
            sos.description = "[VOICE_EMERGENCY] " + transcribedText;
        }

        repository.saveSOSMessage(sos);
        AppLogger.d(TAG, "Saved new Voice Emergency locally with ID: " + sos.messageId);
        
        java.util.concurrent.Executors.newSingleThreadExecutor().execute(() -> {
            boolean success = com.resqlink.network.HubConnectionManager.getInstance(getApplication()).getClient().sendSOS(sos);
            if (success) {
                sos.status = TransmissionStatus.DELIVERED_TO_HUB.name();
                repository.saveSOSMessage(sos);
                AppLogger.d(TAG, "Successfully dispatched Voice Emergency to network");
            } else {
                AppLogger.e(TAG, "Failed to dispatch Voice Emergency to network");
            }
            
            // Broadcast to P2P Mesh
            try {
                com.resqlink.model.P2PPayload p2pPayload = new com.resqlink.model.P2PPayload(
                    com.resqlink.model.P2PPayload.TYPE_SOS, 
                    new com.google.gson.Gson().toJson(sos), 
                    System.currentTimeMillis()
                );
                com.resqlink.network.P2PMeshManager.getInstance(getApplication()).broadcastPayload(p2pPayload);
                AppLogger.d(TAG, "Broadcasted Voice Emergency over P2P Mesh");
            } catch (Exception e) {
                AppLogger.e(TAG, "Failed to broadcast Voice Emergency over Mesh", e);
            }
        });
        
        return sos.messageId;
    }
}
