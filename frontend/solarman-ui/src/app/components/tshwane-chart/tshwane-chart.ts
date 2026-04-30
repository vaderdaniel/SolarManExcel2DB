import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { TshwaneUsageStat } from '../../models/tshwane-usage-stat.model';

interface ChartBar {
  readingDate: string;
  displayDate: string;
  value: number;
  heightPercent: number;
  displayValue: string;
}

@Component({
  selector: 'app-tshwane-chart',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './tshwane-chart.html',
  styleUrl: './tshwane-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TshwaneChartComponent implements OnInit, OnDestroy {
  chartData: ChartBar[] = [];
  yAxisMax: number = 0;
  yAxisLabels: number[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private refreshSubscription?: Subscription;

  constructor(
    private databaseService: DatabaseService,
    private chartRefreshService: ChartRefreshService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadChartData();

    this.refreshSubscription = this.chartRefreshService.refresh$.subscribe(() => {
      this.loadChartData();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadChartData(): void {
    this.isLoading = true;
    this.hasError = false;

    this.databaseService.getTshwaneUsageStats().subscribe({
      next: (stats) => {
        this.processChartData(stats);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading Tshwane usage stats:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load Tshwane usage data';
        this.isLoading = false;
        this.chartData = [];
        this.cdr.markForCheck();
      }
    });
  }

  private processChartData(stats: TshwaneUsageStat[]): void {
    if (!stats || stats.length === 0) {
      this.chartData = [];
      this.yAxisMax = 0;
      this.yAxisLabels = [];
      return;
    }

    // Sort ascending so oldest is on the left
    const sortedStats = [...stats].sort((a, b) =>
      new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime()
    );

    const maxValue = Math.max(...sortedStats.map(s => s.usageKwh));
    this.yAxisMax = this.calculateNiceMax(maxValue);
    this.yAxisLabels = this.generateYAxisLabels(this.yAxisMax, 5);

    this.chartData = sortedStats.map(stat => {
      const date = new Date(stat.readingDate);
      const heightPercent = this.yAxisMax > 0 ? (stat.usageKwh / this.yAxisMax) * 100 : 0;

      return {
        readingDate: stat.readingDate,
        displayDate: this.formatDate(date),
        value: stat.usageKwh,
        heightPercent,
        displayValue: `${stat.usageKwh.toFixed(2)} kWh`
      };
    });
  }

  private calculateNiceMax(maxValue: number): number {
    if (maxValue === 0) return 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;
    let niceMax: number;
    if (normalized <= 1) niceMax = 1;
    else if (normalized <= 2) niceMax = 2;
    else if (normalized <= 5) niceMax = 5;
    else niceMax = 10;
    return niceMax * magnitude;
  }

  private generateYAxisLabels(max: number, count: number): number[] {
    const labels: number[] = [];
    const step = max / (count - 1);
    for (let i = 0; i < count; i++) {
      labels.push(parseFloat((step * i).toFixed(1)));
    }
    return labels.reverse();
  }

  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  }

  formatYAxisLabel(value: number): string {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
}
