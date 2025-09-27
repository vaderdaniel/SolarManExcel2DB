package com.loots.solarmanui.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import java.time.LocalDateTime;

@Entity
@Table(name = "loots_inverter")
public class SolarManRecord {

    @Id
    @Column(name = "updated")
    private LocalDateTime updated;

    @Column(name = "production_power")
    private Double productionPower;

    @Column(name = "consume_power")
    private Double consumePower;

    @Column(name = "grid_power")
    private Double gridPower;

    @Column(name = "purchase_power")
    private Double purchasePower;

    @Column(name = "feed_in")
    private Double feedIn;

    @Column(name = "battery_power")
    private Double batteryPower;

    @Column(name = "charge_power")
    private Double chargePower;

    @Column(name = "discharge_power")
    private Double dischargePower;

    @Column(name = "soc")
    private Double soc;

    public SolarManRecord() {}

    public SolarManRecord(LocalDateTime updated, Double productionPower, Double consumePower,
                         Double gridPower, Double purchasePower, Double feedIn, Double batteryPower,
                         Double chargePower, Double dischargePower, Double soc) {
        this.updated = updated;
        this.productionPower = productionPower;
        this.consumePower = consumePower;
        this.gridPower = gridPower;
        this.purchasePower = purchasePower;
        this.feedIn = feedIn;
        this.batteryPower = batteryPower;
        this.chargePower = chargePower;
        this.dischargePower = dischargePower;
        this.soc = soc;
    }

    public LocalDateTime getUpdated() {
        return updated;
    }

    public void setUpdated(LocalDateTime updated) {
        this.updated = updated;
    }

    public Double getProductionPower() {
        return productionPower;
    }

    public void setProductionPower(Double productionPower) {
        this.productionPower = productionPower;
    }

    public Double getConsumePower() {
        return consumePower;
    }

    public void setConsumePower(Double consumePower) {
        this.consumePower = consumePower;
    }

    public Double getGridPower() {
        return gridPower;
    }

    public void setGridPower(Double gridPower) {
        this.gridPower = gridPower;
    }

    public Double getPurchasePower() {
        return purchasePower;
    }

    public void setPurchasePower(Double purchasePower) {
        this.purchasePower = purchasePower;
    }

    public Double getFeedIn() {
        return feedIn;
    }

    public void setFeedIn(Double feedIn) {
        this.feedIn = feedIn;
    }

    public Double getBatteryPower() {
        return batteryPower;
    }

    public void setBatteryPower(Double batteryPower) {
        this.batteryPower = batteryPower;
    }

    public Double getChargePower() {
        return chargePower;
    }

    public void setChargePower(Double chargePower) {
        this.chargePower = chargePower;
    }

    public Double getDischargePower() {
        return dischargePower;
    }

    public void setDischargePower(Double dischargePower) {
        this.dischargePower = dischargePower;
    }

    public Double getSoc() {
        return soc;
    }

    public void setSoc(Double soc) {
        this.soc = soc;
    }
}