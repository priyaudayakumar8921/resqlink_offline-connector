package com.resqlink.data.remote;

import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.util.AppLogger;

public class LocalHttpHubClient implements HubClient {
    private final HubApiService apiService;

    public LocalHttpHubClient() {
        this.apiService = new HubApiService();
    }

    public LocalHttpHubClient(String customUrl) {
        this.apiService = new HubApiService();
        this.apiService.setBaseUrl(customUrl);
    }

    public void setBaseUrl(String customUrl) {
        this.apiService.setBaseUrl(customUrl);
    }

    public String getBaseUrl() {
        return this.apiService.getBaseUrl();
    }

    @Override
    public boolean checkHealth() {
        return apiService.checkHealth();
    }

    @Override
    public boolean sendSOS(SOSMessageEntity sos) {
        return apiService.sendSOS(sos);
    }

    @Override
    public String fetchLatestBroadcast() {
        return apiService.fetchLatestBroadcast();
    }
}
