import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EnergySummaryComponent } from './energy-summary';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { ProductionStat } from '../../models/production-stat.model';
import { TshwaneUsageStat } from '../../models/tshwane-usage-stat.model';

describe('EnergySummaryComponent', () => {
  let fixture: ComponentFixture<EnergySummaryComponent>;
  let component: EnergySummaryComponent;
  let mockDatabaseService: {
    getProductionStats: ReturnType<typeof vi.fn>;
    getTshwaneUsageStats: ReturnType<typeof vi.fn>;
  };
  let refreshSubject: Subject<void>;

  const production: ProductionStat[] = [
    { date: '2026-11-06', productionUnits: 19047.42 },
    { date: '2026-11-05', productionUnits: 18572.83 },
    { date: '2026-11-04', productionUnits: 20296.0 }
  ];
  const usage: TshwaneUsageStat[] = [
    { readingDate: '2026-11-05T06:28:00', previousReadingDate: '2026-11-02T06:06:00', usageKwh: 11.87, usageKwhPerDay: 3.94 },
    { readingDate: '2026-11-02T06:06:00', previousReadingDate: '2026-10-30T06:28:00', usageKwh: 9.61, usageKwhPerDay: 3.22 },
    { readingDate: '2026-10-22T06:10:00', previousReadingDate: '2026-10-21T06:29:00', usageKwh: 0.88, usageKwhPerDay: 0.89 }
  ];

  beforeEach(async () => {
    refreshSubject = new Subject<void>();
    mockDatabaseService = {
      getProductionStats: vi.fn().mockReturnValue(of(production)),
      getTshwaneUsageStats: vi.fn().mockReturnValue(of(usage))
    };

    await TestBed.configureTestingModule({
      imports: [EnergySummaryComponent],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ChartRefreshService, useValue: { refresh$: refreshSubject.asObservable() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnergySummaryComponent);
    component = fixture.componentInstance;
  });

  it('should show the latest day, 3-day total, best day and Tshwane kWh/day', () => {
    fixture.detectChanges();
    const [latest, total, best, tshwane] = component.kpis();

    expect(latest).toEqual(expect.objectContaining({ value: '19.0', note: 'Fri 6 Nov' }));
    expect(total).toEqual(expect.objectContaining({ label: 'Produced, last 3 days', value: '57.9', note: 'Average 19.3 kWh a day' }));
    expect(best).toEqual(expect.objectContaining({ value: '20.3', note: 'Wed 4 Nov' }));
    // 22.36 kWh from the reading before the oldest (21 Oct 06:29) to 5 Nov 06:28 ≈ 15 days
    expect(tshwane).toEqual(expect.objectContaining({
      value: '1.5', unit: 'kWh/day', note: '22.4 kWh over 15 days · 21 Oct – 5 Nov', tone: 'grid'
    }));
    expect(latest.unit).toBe('kWh');
  });

  it('should fall back to the total when the previous reading date is unknown', () => {
    mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of([
      { readingDate: '2026-11-05T06:28:00', usageKwh: 11.87 },
      { readingDate: '2026-11-02T06:06:00', usageKwh: 9.61 }
    ]));
    fixture.detectChanges();

    expect(component.kpis()[3]).toEqual(expect.objectContaining({
      value: '—', unit: 'kWh/day', note: '21.5 kWh in total'
    }));
  });

  it('should render four KPI cards', () => {
    fixture.detectChanges();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.kpi');
    expect(cards.length).toBe(4);
    expect(cards[0].textContent).toContain('19.0');
    expect(cards[0].textContent).toContain('kWh');
  });

  it('should show placeholders when there is no data yet', () => {
    mockDatabaseService.getProductionStats.mockReturnValue(of([]));
    mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of([]));
    fixture.detectChanges();

    expect(component.kpis().every(k => k.value === '—')).toBe(true);
    expect(component.kpis()[0].note).toBe('No data yet');
    expect(component.kpis()[3].note).toBe('No readings yet');
  });

  it('should fall back to placeholders when the API fails', () => {
    mockDatabaseService.getProductionStats.mockReturnValue(throwError(() => new Error('down')));
    mockDatabaseService.getTshwaneUsageStats.mockReturnValue(throwError(() => new Error('down')));
    fixture.detectChanges();

    expect(component.kpis().every(k => k.value === '—')).toBe(true);
  });

  it('should reload when ChartRefreshService triggers a refresh', () => {
    fixture.detectChanges();
    expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(1);

    mockDatabaseService.getProductionStats.mockReturnValue(of([{ date: '2026-11-07', productionUnits: 21000 }]));
    refreshSubject.next();

    expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(2);
    expect(mockDatabaseService.getTshwaneUsageStats).toHaveBeenCalledTimes(2);
    expect(component.kpis()[0].value).toBe('21.0');
  });
});
