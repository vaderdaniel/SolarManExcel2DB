package com.loots.solarmanui.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "tshwane_electricity")
public class TshwaneRecord {

    @Id
    @Column(name = "reading_date")
    private LocalDateTime readingDate;

    @Column(name = "reading_value")
    private Double readingValue;

    @Column(name = "reading_amount")
    private Double readingAmount;

    @Column(name = "reading_notes")
    private String readingNotes;

    public TshwaneRecord() {}

    public TshwaneRecord(LocalDateTime readingDate, Double readingValue, Double readingAmount, String readingNotes) {
        this.readingDate = readingDate;
        this.readingValue = readingValue;
        this.readingAmount = readingAmount;
        this.readingNotes = readingNotes;
    }

    public LocalDateTime getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDateTime readingDate) {
        this.readingDate = readingDate;
    }

    public Double getReadingValue() {
        return readingValue;
    }

    public void setReadingValue(Double readingValue) {
        this.readingValue = readingValue;
    }

    public Double getReadingAmount() {
        return readingAmount;
    }

    public void setReadingAmount(Double readingAmount) {
        this.readingAmount = readingAmount;
    }

    public String getReadingNotes() {
        return readingNotes;
    }

    public void setReadingNotes(String readingNotes) {
        this.readingNotes = readingNotes;
    }
}