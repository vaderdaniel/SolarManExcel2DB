package com.loots.solarmanui.model;

import java.time.LocalDateTime;

public class TshwaneRecord {

    private LocalDateTime readingDate;
    private Double cumulativeElectricityUsed;
    private String readingNotes;

    public TshwaneRecord() {}

    public TshwaneRecord(LocalDateTime readingDate, Double cumulativeElectricityUsed, String readingNotes) {
        this.readingDate = readingDate;
        this.cumulativeElectricityUsed = cumulativeElectricityUsed;
        this.readingNotes = readingNotes;
    }

    public LocalDateTime getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDateTime readingDate) {
        this.readingDate = readingDate;
    }

    public Double getCumulativeElectricityUsed() {
        return cumulativeElectricityUsed;
    }

    public void setCumulativeElectricityUsed(Double cumulativeElectricityUsed) {
        this.cumulativeElectricityUsed = cumulativeElectricityUsed;
    }

    public String getReadingNotes() {
        return readingNotes;
    }

    public void setReadingNotes(String readingNotes) {
        this.readingNotes = readingNotes;
    }
}