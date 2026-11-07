import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { ProductionStat } from '../../models/production-stat.model';
import { TshwaneUsageStat } from '../../models/tshwane-usage-stat.model';

export interface Kpi {
  label: string;
  value: string;
  note: string;
  tone: 'solar' | 'grid' | 'muted';
}

const NO_VALUE = '—';

/** The four headline figures on the Home page. */
@Component({
  selector: 'app-energy-summary',
  templateUrl: './energy-summary.html',
  styleUrl: './energy-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergySummaryComponent implements OnInit {
  private readonly databaseService = inject(DatabaseService);
  private readonly refresh$ = inject(ChartRefreshService).refresh$.pipe(takeUntilDestroyed());

  readonly production = signal<ProductionStat[] | null>(null);
  readonly usage = signal<TshwaneUsageStat[] | null>(null);

  readonly kpis = computed<Kpi[]>(() => [
    ...this.productionKpis(this.production()),
    this.usageKpi(this.usage())
  ]);

  ngOnInit(): void {
    this.load();
    this.refresh$.subscribe(() => this.load());
  }

  private load(): void {
    this.databaseService.getProductionStats(7).subscribe({
      next: (stats) => this.production.set(stats ?? []),
      error: () => this.production.set([])
    });
    this.databaseService.getTshwaneUsageStats().subscribe({
      next: (stats) => this.usage.set(stats ?? []),
      error: () => this.usage.set([])
    });
  }

  private productionKpis(stats: ProductionStat[] | null): Kpi[] {
    if (!stats || stats.length === 0) {
      const note = stats ? 'No data yet' : 'Loading…';
      return [
        { label: 'Latest day', value: NO_VALUE, note, tone: 'muted' },
        { label: 'Produced, last 7 days', value: NO_VALUE, note, tone: 'muted' },
        { label: 'Best day this week', value: NO_VALUE, note, tone: 'muted' }
      ];
    }

    const newestFirst = [...stats].sort((a, b) => b.date.localeCompare(a.date));
    const latest = newestFirst[0];
    const best = newestFirst.reduce((top, s) => (s.productionUnits > top.productionUnits ? s : top));
    const total = stats.reduce((sum, s) => sum + s.productionUnits, 0);
    const days = stats.length;

    return [
      { label: 'Latest day', value: this.kwh(latest.productionUnits), note: this.day(latest.date), tone: 'solar' },
      {
        label: `Produced, last ${days} days`,
        value: this.kwh(total),
        note: `Average ${this.kwh(total / days)} kWh a day`,
        tone: 'muted'
      },
      { label: 'Best day this week', value: this.kwh(best.productionUnits), note: this.day(best.date), tone: 'solar' }
    ];
  }

  private usageKpi(stats: TshwaneUsageStat[] | null): Kpi {
    const label = 'Tshwane meter, last 7 readings';
    if (!stats || stats.length === 0) {
      return { label, value: NO_VALUE, note: stats ? 'No readings yet' : 'Loading…', tone: 'muted' };
    }
    const oldestFirst = [...stats].sort((a, b) => a.readingDate.localeCompare(b.readingDate));
    const total = stats.reduce((sum, s) => sum + s.usageKwh, 0);
    const from = formatDate(oldestFirst[0].readingDate, 'd MMM', 'en-US');
    const to = formatDate(oldestFirst[oldestFirst.length - 1].readingDate, 'd MMM', 'en-US');
    return { label, value: total.toFixed(1), note: from === to ? from : `${from} – ${to}`, tone: 'grid' };
  }

  private kwh(wattHours: number): string {
    return (wattHours / 1000).toFixed(1);
  }

  private day(date: string): string {
    return formatDate(date, 'EEE d MMM', 'en-US');
  }
}
