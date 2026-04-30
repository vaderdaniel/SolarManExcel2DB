package com.loots.solarmanui.model;

import java.time.LocalDateTime;

public class TshwaneUsageStat {
    private LocalDateTime readingDate;
    private Double usageKwh;

    public TshwaneUsageStat() {
    }

    public TshwaneUsageStat(LocalDateTime readingDate, Double usageKwh) {
        this.readingDate = readingDate;
        this.usageKwh = usageKwh;
    }

    public LocalDateTime getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDateTime readingDate) {
        this.readingDate = readingDate;
    }

    public Double getUsageKwh() {
        return usageKwh;
    }

    public void setUsageKwh(Double usageKwh) {
        this.usageKwh = usageKwh;
    }
}
