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
  /** kWh per day since the previous reading (0 when unknown). */
  value: number;
  heightPercent: number;
  label: string;
  displayValue: string;
  isLatest: boolean;
}

const MS_PER_DAY = 86_400_000;

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

    // Readings are irregular (1 to several days apart), so bars show the average
    // kWh per day since the previous reading rather than the raw kWh per reading.
    const perDay = (s: TshwaneUsageStat) => s.usageKwhPerDay ?? null;
    const maxValue = Math.max(0, ...sortedStats.map(s => perDay(s) ?? 0));
    const latest = sortedStats[sortedStats.length - 1];

    this.chartData = sortedStats.map(stat => {
      const rate = perDay(stat);
      return {
        readingDate: stat.readingDate,
        weekday: formatDate(stat.readingDate, 'EEE', 'en-US'),
        dayMonth: formatDate(stat.readingDate, 'd MMM', 'en-US'),
        displayDate: formatDate(stat.readingDate, 'd MMM HH:mm', 'en-US'),
        value: rate ?? 0,
        heightPercent: rate !== null && maxValue > 0 ? (rate / maxValue) * 100 : 0,
        label: rate !== null ? rate.toFixed(1) : '—',
        displayValue: this.describe(stat, rate),
        isLatest: stat === latest
      };
    });

    this.ariaLabel = 'Tshwane electricity, average kWh per day since the previous reading: ' +
      this.chartData.map(b => `${b.displayDate} ${b.label} kWh per day`).join(', ');
  }

  private describe(stat: TshwaneUsageStat, rate: number | null): string {
    const total = `${stat.usageKwh.toFixed(2)} kWh`;
    if (rate === null || !stat.previousReadingDate) {
      return total;
    }
    const days = (new Date(stat.readingDate).getTime() - new Date(stat.previousReadingDate).getTime()) / MS_PER_DAY;
    const since = formatDate(stat.previousReadingDate, 'd MMM', 'en-US');
    return `${rate.toFixed(2)} kWh/day · ${total} over ${days.toFixed(1)} days since ${since}`;
  }
}
