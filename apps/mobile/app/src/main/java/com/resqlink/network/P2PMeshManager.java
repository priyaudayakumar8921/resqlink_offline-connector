package com.resqlink.network;

import android.content.Context;
import androidx.annotation.NonNull;
import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;
import com.resqlink.model.P2PPayload;
import com.resqlink.util.AppLogger;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

public class P2PMeshManager {
    private static final String TAG = "P2PMeshManager";
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;
    private static final String SERVICE_ID = "com.resqlink.p2p";
    
    private static P2PMeshManager instance;
    private ConnectionsClient connectionsClient;
    private String localEndpointName;
    private Context context;
    
    private final Set<String> connectedEndpoints = new HashSet<>();
    private PayloadListener payloadListener;

    public interface PayloadListener {
        void onPayloadReceived(P2PPayload payload);
    }

    private P2PMeshManager(Context context) {
        this.context = context.getApplicationContext();
        this.connectionsClient = Nearby.getConnectionsClient(this.context);
        this.localEndpointName = "Citizen-" + (int)(Math.random() * 10000);
    }

    public static synchronized P2PMeshManager getInstance(Context context) {
        if (instance == null) {
            instance = new P2PMeshManager(context);
        }
        return instance;
    }

    public void setPayloadListener(PayloadListener listener) {
        this.payloadListener = listener;
    }

    public void startMesh() {
        startAdvertising();
        startDiscovery();
    }
    
    public void stopMesh() {
        connectionsClient.stopAdvertising();
        connectionsClient.stopDiscovery();
        connectionsClient.stopAllEndpoints();
        connectedEndpoints.clear();
        AppLogger.d(TAG, "Mesh stopped.");
    }

    private void startAdvertising() {
        AdvertisingOptions advertisingOptions =
                new AdvertisingOptions.Builder().setStrategy(STRATEGY).build();
        connectionsClient
                .startAdvertising(
                        localEndpointName, SERVICE_ID, connectionLifecycleCallback, advertisingOptions)
                .addOnSuccessListener(
                        (Void unused) -> AppLogger.d(TAG, "Advertising started as " + localEndpointName))
                .addOnFailureListener(
                        (Exception e) -> AppLogger.e(TAG, "Failed to start advertising", e));
    }

    private void startDiscovery() {
        DiscoveryOptions discoveryOptions =
                new DiscoveryOptions.Builder().setStrategy(STRATEGY).build();
        connectionsClient
                .startDiscovery(SERVICE_ID, endpointDiscoveryCallback, discoveryOptions)
                .addOnSuccessListener(
                        (Void unused) -> AppLogger.d(TAG, "Discovery started"))
                .addOnFailureListener(
                        (Exception e) -> AppLogger.e(TAG, "Failed to start discovery", e));
    }

    public void broadcastPayload(P2PPayload p2pPayload) {
        if (connectedEndpoints.isEmpty()) return;
        
        String json = p2pPayload.toJson();
        Payload payload = Payload.fromBytes(json.getBytes(StandardCharsets.UTF_8));
        
        for (String endpointId : connectedEndpoints) {
            connectionsClient.sendPayload(endpointId, payload);
        }
        AppLogger.d(TAG, "Broadcasted payload to " + connectedEndpoints.size() + " endpoints");
    }

    private final ConnectionLifecycleCallback connectionLifecycleCallback =
            new ConnectionLifecycleCallback() {
                @Override
                public void onConnectionInitiated(
                        @NonNull String endpointId, @NonNull ConnectionInfo connectionInfo) {
                    AppLogger.d(TAG, "Connection initiated with " + connectionInfo.getEndpointName());
                    // Automatically accept the connection
                    connectionsClient.acceptConnection(endpointId, payloadCallback);
                }

                @Override
                public void onConnectionResult(@NonNull String endpointId, ConnectionResolution result) {
                    switch (result.getStatus().getStatusCode()) {
                        case ConnectionsStatusCodes.STATUS_OK:
                            AppLogger.d(TAG, "Connected to endpoint: " + endpointId);
                            connectedEndpoints.add(endpointId);
                            break;
                        case ConnectionsStatusCodes.STATUS_CONNECTION_REJECTED:
                            AppLogger.d(TAG, "Connection rejected by: " + endpointId);
                            break;
                        case ConnectionsStatusCodes.STATUS_ERROR:
                            AppLogger.e(TAG, "Connection error with: " + endpointId);
                            break;
                        default:
                            break;
                    }
                }

                @Override
                public void onDisconnected(@NonNull String endpointId) {
                    AppLogger.d(TAG, "Disconnected from endpoint: " + endpointId);
                    connectedEndpoints.remove(endpointId);
                }
            };

    private final EndpointDiscoveryCallback endpointDiscoveryCallback =
            new EndpointDiscoveryCallback() {
                @Override
                public void onEndpointFound(@NonNull String endpointId, @NonNull DiscoveredEndpointInfo info) {
                    AppLogger.d(TAG, "Endpoint found: " + info.getEndpointName());
                    // Request connection to the found endpoint
                    connectionsClient.requestConnection(localEndpointName, endpointId, connectionLifecycleCallback)
                            .addOnFailureListener(e -> AppLogger.e(TAG, "Failed to request connection", e));
                }

                @Override
                public void onEndpointLost(@NonNull String endpointId) {
                    AppLogger.d(TAG, "Endpoint lost: " + endpointId);
                }
            };

    private final PayloadCallback payloadCallback =
            new PayloadCallback() {
                @Override
                public void onPayloadReceived(@NonNull String endpointId, @NonNull Payload payload) {
                    if (payload.getType() == Payload.Type.BYTES) {
                        byte[] bytes = payload.asBytes();
                        if (bytes != null) {
                            String json = new String(bytes, StandardCharsets.UTF_8);
                            AppLogger.d(TAG, "Payload received: " + json);
                            P2PPayload p2pPayload = P2PPayload.fromJson(json);
                            if (p2pPayload != null && payloadListener != null) {
                                payloadListener.onPayloadReceived(p2pPayload);
                            }
                        }
                    }
                }

                @Override
                public void onPayloadTransferUpdate(@NonNull String endpointId, @NonNull PayloadTransferUpdate update) {
                    // Not needed for small payloads
                }
            };
}
