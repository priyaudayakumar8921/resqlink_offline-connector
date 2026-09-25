package com.resqlink.model;

import com.google.gson.Gson;

public class P2PPayload {
    public static final String TYPE_ALERT = "ALERT";
    public static final String TYPE_SOS = "SOS";

    public String type;
    public String data;
    public long timestamp;

    public P2PPayload() {
    }

    public P2PPayload(String type, String data, long timestamp) {
        this.type = type;
        this.data = data;
        this.timestamp = timestamp;
    }

    public String toJson() {
        return new Gson().toJson(this);
    }

    public static P2PPayload fromJson(String json) {
        try {
            return new Gson().fromJson(json, P2PPayload.class);
        } catch (Exception e) {
            return null;
        }
    }
}
