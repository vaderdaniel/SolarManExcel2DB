import { Component, OnInit, OnDestroy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { ProductionStat } from '../../models/production-stat.model';

interface ChartBar {
  date: string;
  displayDate: string;
  value: number;
  heightPercent: number;
  displayValue: string;
}

@Component({
  selector: 'app-production-chart',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './production-chart.html',
  styleUrl: './production-chart.scss'
})
export class ProductionChartComponent implements OnInit, OnDestroy {
  chartData: ChartBar[] = [];
  yAxisMax: number = 0;
  yAxisLabels: number[] = [];
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  private refreshSubscription?: Subscription;

  constructor(
    private databaseService: DatabaseService,
    private chartRefreshService: ChartRefreshService
  ) { }

  ngOnInit(): void {
    this.loadChartData();
    
    // Subscribe to refresh events
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
    
    this.databaseService.getProductionStats(7).subscribe({
      next: (stats) => {
        this.processChartData(stats);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading production stats:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load production data';
        this.isLoading = false;
        this.chartData = [];
      }
    });
  }

  private processChartData(stats: ProductionStat[]): void {
    if (!stats || stats.length === 0) {
      this.chartData = [];
      this.yAxisMax = 0;
      this.yAxisLabels = [];
      return;
    }

    // Sort by date ascending (oldest to newest)
    const sortedStats = [...stats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Find max value and calculate nice y-axis max
    const maxValue = Math.max(...sortedStats.map(s => s.productionUnits));
    this.yAxisMax = this.calculateNiceMax(maxValue);

    // Generate y-axis labels (5 labels from 0 to max)
    this.yAxisLabels = this.generateYAxisLabels(this.yAxisMax, 5);

    // Create chart bars
    this.chartData = sortedStats.map(stat => {
      const date = new Date(stat.date);
      const heightPercent = this.yAxisMax > 0 ? (stat.productionUnits / this.yAxisMax) * 100 : 0;
      
      return {
        date: stat.date,
        displayDate: this.formatDate(date),
        value: stat.productionUnits,
        heightPercent: heightPercent,
        displayValue: this.formatValue(stat.productionUnits)
      };
    });
  }

  private calculateNiceMax(maxValue: number): number {
    if (maxValue === 0) return 10;
    
    // Round up to nearest "nice" number
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
      labels.push(Math.round(step * i));
    }
    
    return labels.reverse(); // Highest to lowest
  }

  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  }

  private formatValue(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + ' kWh';
    }
    return value.toFixed(0) + ' Wh';
  }

  formatYAxisLabel(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toString();
  }
}
