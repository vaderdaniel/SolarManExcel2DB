import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { TshwaneUsageStat } from '../../models/tshwane-usage-stat.model';

interface ChartBar {
  readingDate: string;
  weekday: string;
  dayMonth: string;
  displayDate: string;
  value: number;
  heightPercent: number;
  label: string;
  displayValue: string;
  isLatest: boolean;
}

@Component({
  selector: 'app-tshwane-chart',
  templateUrl: './tshwane-chart.html',
  styleUrl: './tshwane-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TshwaneChartComponent implements OnInit, OnDestroy {
  private readonly databaseService = inject(DatabaseService);
  private readonly chartRefreshService = inject(ChartRefreshService);
  private readonly cdr = inject(ChangeDetectorRef);

  chartData: ChartBar[] = [];
  ariaLabel = '';
  isLoading = false;
  hasError = false;
  errorMessage = '';

  private refreshSubscription?: Subscription;

  ngOnInit(): void {
    this.loadChartData();
    this.refreshSubscription = this.chartRefreshService.refresh$.subscribe(() => {
      this.loadChartData();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
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
      this.ariaLabel = '';
      return;
    }

    // Sort ascending so oldest is on the left
    const sortedStats = [...stats].sort((a, b) =>
      new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime()
    );

    const maxValue = Math.max(...sortedStats.map(s => s.usageKwh));
    const latest = sortedStats[sortedStats.length - 1];

    this.chartData = sortedStats.map(stat => ({
      readingDate: stat.readingDate,
      weekday: formatDate(stat.readingDate, 'EEE', 'en-US'),
      dayMonth: formatDate(stat.readingDate, 'd MMM', 'en-US'),
      displayDate: formatDate(stat.readingDate, 'd MMM HH:mm', 'en-US'),
      value: stat.usageKwh,
      heightPercent: maxValue > 0 ? (stat.usageKwh / maxValue) * 100 : 0,
      label: stat.usageKwh.toFixed(1),
      displayValue: `${stat.usageKwh.toFixed(2)} kWh`,
      isLatest: stat === latest
    }));

    this.ariaLabel = 'Tshwane electricity used since the previous reading: ' +
      this.chartData.map(b => `${b.displayDate} ${b.label} kWh`).join(', ');
  }
}
