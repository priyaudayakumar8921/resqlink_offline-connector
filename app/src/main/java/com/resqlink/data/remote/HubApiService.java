package com.resqlink.data.remote;

import com.google.gson.Gson;
import com.resqlink.data.local.entity.SOSMessageEntity;
import com.resqlink.util.AppLogger;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;

public class HubApiService {
    private static final String TAG = "HubApiService";
    private final OkHttpClient client;
    private final Gson gson;
    public static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    // Default base URL for the emergency hub
    private String baseUrl = "http://10.203.184.223:3000/api/v1";

    public HubApiService() {
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor(message -> AppLogger.d("OkHttp", message));
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        client = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(5, TimeUnit.SECONDS)
                .writeTimeout(5, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build();
                
        gson = new Gson();
    }
    
    public void setBaseUrl(String url) {
        this.baseUrl = url;
    }

    public boolean checkHealth() {
        Request request = new Request.Builder()
                .url(baseUrl + "/health")
                .build();

        try (Response response = client.newCall(request).execute()) {
            return response.isSuccessful();
        } catch (IOException e) {
            AppLogger.e(TAG, "Health check failed", e);
            return false;
        }
    }

    public boolean sendSOS(SOSMessageEntity sos) {
        String json = gson.toJson(sos);
        RequestBody body = RequestBody.create(json, JSON);
        Request request = new Request.Builder()
                .url(baseUrl + "/sos")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                AppLogger.d(TAG, "SOS sent successfully");
                return true;
            } else {
                AppLogger.e(TAG, "Failed to send SOS. Code: " + response.code());
                return false;
            }
        } catch (IOException e) {
            AppLogger.e(TAG, "Error sending SOS", e);
            return false;
        }
    }

    public String fetchLatestBroadcast() {
        Request request = new Request.Builder()
                .url(baseUrl + "/broadcast")
                .get()
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String jsonStr = response.body().string();
                com.google.gson.JsonArray array = com.google.gson.JsonParser.parseString(jsonStr).getAsJsonArray();
                if (array.size() > 0) {
                    return array.get(0).getAsJsonObject().get("message").getAsString();
                }
            }
        } catch (Exception e) {
            AppLogger.e(TAG, "Error fetching broadcasts", e);
        }
        return null;
    }
}
