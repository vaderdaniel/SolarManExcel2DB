package com.loots.solarmanui.model;

import java.time.LocalDateTime;

public class DatabaseStatus {
    private boolean connected;
    private String message;
    private String apiStatus;
    private LocalDateTime lastChecked;

    public DatabaseStatus() {}

    public DatabaseStatus(boolean connected, String message, String apiStatus, LocalDateTime lastChecked) {
        this.connected = connected;
        this.message = message;
        this.apiStatus = apiStatus;
        this.lastChecked = lastChecked;
    }

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getApiStatus() {
        return apiStatus;
    }

    public void setApiStatus(String apiStatus) {
        this.apiStatus = apiStatus;
    }

    public LocalDateTime getLastChecked() {
        return lastChecked;
    }

    public void setLastChecked(LocalDateTime lastChecked) {
        this.lastChecked = lastChecked;
    }
}