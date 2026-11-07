package com.loots.solarmanui.model;

import java.time.LocalDateTime;

public class TshwaneUsageStat {
    private LocalDateTime readingDate;
    private LocalDateTime previousReadingDate;
    private Double usageKwh;
    private Double usageKwhPerDay;

    public TshwaneUsageStat() {
    }

    public TshwaneUsageStat(LocalDateTime readingDate, Double usageKwh) {
        this.readingDate = readingDate;
        this.usageKwh = usageKwh;
    }

    public TshwaneUsageStat(LocalDateTime readingDate, LocalDateTime previousReadingDate,
                            Double usageKwh, Double usageKwhPerDay) {
        this.readingDate = readingDate;
        this.previousReadingDate = previousReadingDate;
        this.usageKwh = usageKwh;
        this.usageKwhPerDay = usageKwhPerDay;
    }

    public LocalDateTime getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDateTime readingDate) {
        this.readingDate = readingDate;
    }

    public LocalDateTime getPreviousReadingDate() {
        return previousReadingDate;
    }

    public void setPreviousReadingDate(LocalDateTime previousReadingDate) {
        this.previousReadingDate = previousReadingDate;
    }

    public Double getUsageKwh() {
        return usageKwh;
    }

    public void setUsageKwh(Double usageKwh) {
        this.usageKwh = usageKwh;
    }

    public Double getUsageKwhPerDay() {
        return usageKwhPerDay;
    }

    public void setUsageKwhPerDay(Double usageKwhPerDay) {
        this.usageKwhPerDay = usageKwhPerDay;
    }
}
