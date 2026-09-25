package com.resqlink.data.remote;

import com.resqlink.data.local.entity.SOSMessageEntity;

public interface HubClient {
    boolean checkHealth();
    boolean sendSOS(SOSMessageEntity sos);
    String fetchLatestBroadcast();
}
