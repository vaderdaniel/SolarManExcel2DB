package com.loots.solarmanui.model;

import java.time.LocalDate;

public class ProductionStat {
    private LocalDate date;
    private Double productionUnits;

    public ProductionStat() {
    }

    public ProductionStat(LocalDate date, Double productionUnits) {
        this.date = date;
        this.productionUnits = productionUnits;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Double getProductionUnits() {
        return productionUnits;
    }

    public void setProductionUnits(Double productionUnits) {
        this.productionUnits = productionUnits;
    }
}
