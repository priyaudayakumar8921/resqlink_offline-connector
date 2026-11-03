package com.resqlink.model;

public enum TransmissionStatus {
    PENDING,
    QUEUED,
    TRANSMITTING,
    DELIVERED_TO_HUB,
    RECEIVED_BY_STATION,
    ACKNOWLEDGED,
    RESCUE_DISPATCHED,
    FAILED,
    RESOLVED
}
