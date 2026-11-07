import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { ProductionStat } from '../../models/production-stat.model';

interface ChartBar {
  date: string;
  weekday: string;
  dayMonth: string;
  value: number;
  heightPercent: number;
  label: string;
  displayValue: string;
  isBest: boolean;
}

@Component({
  selector: 'app-production-chart',
  templateUrl: './production-chart.html',
  styleUrl: './production-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionChartComponent implements OnInit, OnDestroy {
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

    this.databaseService.getProductionStats(7).subscribe({
      next: (stats) => {
        this.processChartData(stats);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading production stats:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load production data';
        this.isLoading = false;
        this.chartData = [];
        this.cdr.markForCheck();
      }
    });
  }

  private processChartData(stats: ProductionStat[]): void {
    if (!stats || stats.length === 0) {
      this.chartData = [];
      this.ariaLabel = '';
      return;
    }

    // Oldest on the left, newest on the right
    const sortedStats = [...stats].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Bars are scaled to the week's best day; each bar carries its own value label,
    // so no y-axis is needed.
    const maxValue = Math.max(...sortedStats.map(s => s.productionUnits));

    this.chartData = sortedStats.map(stat => ({
      date: stat.date,
      weekday: formatDate(stat.date, 'EEE', 'en-US'),
      dayMonth: formatDate(stat.date, 'd MMM', 'en-US'),
      value: stat.productionUnits,
      heightPercent: maxValue > 0 ? (stat.productionUnits / maxValue) * 100 : 0,
      label: (stat.productionUnits / 1000).toFixed(1),
      displayValue: this.formatValue(stat.productionUnits),
      isBest: maxValue > 0 && stat.productionUnits === maxValue
    }));

    const first = this.chartData[0];
    const last = this.chartData[this.chartData.length - 1];
    this.ariaLabel = `Daily solar production from ${first.dayMonth} to ${last.dayMonth}: ` +
      this.chartData.map(b => `${b.dayMonth} ${b.label} kWh`).join(', ');
  }

  private formatValue(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + ' kWh';
    }
    return value.toFixed(0) + ' Wh';
  }
}
