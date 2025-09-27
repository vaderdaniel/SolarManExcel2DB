package com.loots.solarmanui.model;

import java.time.LocalDateTime;

public class LatestRecords {
    private LocalDateTime solarman;
    private LocalDateTime tshwane;

    public LatestRecords() {}

    public LatestRecords(LocalDateTime solarman, LocalDateTime tshwane) {
        this.solarman = solarman;
        this.tshwane = tshwane;
    }

    public LocalDateTime getSolarman() {
        return solarman;
    }

    public void setSolarman(LocalDateTime solarman) {
        this.solarman = solarman;
    }

    public LocalDateTime getTshwane() {
        return tshwane;
    }

    public void setTshwane(LocalDateTime tshwane) {
        this.tshwane = tshwane;
    }
}