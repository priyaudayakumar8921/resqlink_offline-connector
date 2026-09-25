package com.resqlink.integration;

import android.content.Context;

import com.google.gson.Gson;
import com.resqlink.data.local.AppDatabase;
import com.resqlink.data.local.entity.CitizenProfileEntity;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.data.repository.SOSRepository;
import com.resqlink.model.P2PPayload;
import com.resqlink.model.TransmissionStatus;
import com.resqlink.network.HubConnectionManager;
import com.resqlink.network.P2PMeshManager;
import com.resqlink.util.AppLogger;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.Executors;

public class EmergencyInputGateway {
    private static final String TAG = "EmergencyInputGateway";

    public static void triggerSOS(Context context, String emergencyType, Double lat, Double lng, Float acc) {
        AppLogger.d(TAG, "Triggering SOS via Integration Gateway. Type: " + emergencyType);

        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                Context appContext = context.getApplicationContext();
                AppDatabase db = AppDatabase.getDatabase(appContext);
                CitizenProfileEntity profile = db.citizenDao().getProfileSync();
                
                String cid = (profile != null) ? profile.citizenId : "UNKNOWN_CITIZEN";
                
                SOSMessageEntity sos = new SOSMessageEntity();
                sos.messageId = "SOS-" + new SimpleDateFormat("yyyyMMdd", Locale.US).format(new Date()) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                sos.citizenId = cid;
                sos.emergencyType = emergencyType;
                sos.latitude = lat;
                sos.longitude = lng;
                sos.accuracy = acc;
                sos.timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).format(new Date());
                sos.status = TransmissionStatus.PENDING.name();
                sos.retryCount = 0;
                sos.lastAttempt = System.currentTimeMillis();
                sos.priority = "CRITICAL";

                SOSRepository repo = new SOSRepository((android.app.Application) appContext);
                repo.saveSOSMessage(sos);
                
                boolean success = HubConnectionManager.getInstance(appContext).getClient().sendSOS(sos);
                if (success) {
                    sos.status = TransmissionStatus.DELIVERED_TO_HUB.name();
                    repo.saveSOSMessage(sos);
                    AppLogger.d(TAG, "Successfully dispatched Gateway SOS to network");
                } else {
                    AppLogger.e(TAG, "Failed to dispatch Gateway SOS to network");
                }
                
                // Broadcast SOS to P2P Mesh
                P2PPayload p2pPayload = new P2PPayload(P2PPayload.TYPE_SOS, new Gson().toJson(sos), System.currentTimeMillis());
                P2PMeshManager.getInstance(appContext).broadcastPayload(p2pPayload);
                
            } catch (Exception e) {
                AppLogger.e(TAG, "Error generating Gateway SOS", e);
            }
        });
    }
}
