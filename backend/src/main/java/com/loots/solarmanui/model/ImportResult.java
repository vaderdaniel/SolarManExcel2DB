package com.loots.solarmanui.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

public class ImportResult {
    private int recordsInserted;
    private int recordsUpdated;
    private LocalDateTime firstRecordDate;
    private LocalDateTime lastRecordDate;
    private int errorCount;
    private List<String> errors;

    public ImportResult() {
        this.errors = new ArrayList<>();
    }

    public ImportResult(int recordsInserted, int recordsUpdated, LocalDateTime firstRecordDate,
                       LocalDateTime lastRecordDate, int errorCount, List<String> errors) {
        this.recordsInserted = recordsInserted;
        this.recordsUpdated = recordsUpdated;
        this.firstRecordDate = firstRecordDate;
        this.lastRecordDate = lastRecordDate;
        this.errorCount = errorCount;
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public int getRecordsInserted() {
        return recordsInserted;
    }

    public void setRecordsInserted(int recordsInserted) {
        this.recordsInserted = recordsInserted;
    }

    public int getRecordsUpdated() {
        return recordsUpdated;
    }

    public void setRecordsUpdated(int recordsUpdated) {
        this.recordsUpdated = recordsUpdated;
    }

    public LocalDateTime getFirstRecordDate() {
        return firstRecordDate;
    }

    public void setFirstRecordDate(LocalDateTime firstRecordDate) {
        this.firstRecordDate = firstRecordDate;
    }

    public LocalDateTime getLastRecordDate() {
        return lastRecordDate;
    }

    public void setLastRecordDate(LocalDateTime lastRecordDate) {
        this.lastRecordDate = lastRecordDate;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(int errorCount) {
        this.errorCount = errorCount;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors != null ? errors : new ArrayList<>();
    }

    public void addError(String error) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(error);
        this.errorCount = this.errors.size();
    }
}