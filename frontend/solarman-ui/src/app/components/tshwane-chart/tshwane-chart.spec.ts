import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TshwaneChartComponent } from './tshwane-chart';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { of, throwError, Subject } from 'rxjs';
import { TshwaneUsageStat } from '../../models/tshwane-usage-stat.model';
import { vi } from 'vitest';

describe('TshwaneChartComponent', () => {
  let component: TshwaneChartComponent;
  let fixture: ComponentFixture<TshwaneChartComponent>;
  let mockDatabaseService: { getTshwaneUsageStats: ReturnType<typeof vi.fn> };
  let mockChartRefreshService: { triggerRefresh: ReturnType<typeof vi.fn> };
  let refreshSubject: Subject<void>;

  beforeEach(async () => {
    refreshSubject = new Subject<void>();

    mockDatabaseService = { getTshwaneUsageStats: vi.fn() };
    mockChartRefreshService = { triggerRefresh: vi.fn() };

    Object.defineProperty(mockChartRefreshService, 'refresh$', {
      get: () => refreshSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [TshwaneChartComponent],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ChartRefreshService, useValue: mockChartRefreshService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TshwaneChartComponent);
    component = fixture.componentInstance;
  });

  // ==================== processChartData Tests ====================

  describe('processChartData', () => {
    it('should scale bars to the highest kWh/day and highlight the latest', () => {
      const stats: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71, usageKwhPerDay: 9.93 },
        { readingDate: '2026-04-28T07:00:00', usageKwh: 13.14, usageKwhPerDay: 13.6 },
        { readingDate: '2026-04-27T09:14:00', usageKwh: 0.41, usageKwhPerDay: 0.38 }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData.length).toBe(3);
      expect(component.chartData[1].heightPercent).toBe(100); // 13.6 kWh/day on 28 Apr
      expect(component.chartData[1].value).toBe(13.6);
      expect(component.chartData[2].isLatest).toBe(true);
      expect(component.chartData.filter(b => b.isLatest).length).toBe(1);
    });

    it('should sort data ascending by date (oldest left)', () => {
      const stats: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71 },
        { readingDate: '2026-04-27T09:14:00', usageKwh: 0.41 },
        { readingDate: '2026-04-28T07:00:00', usageKwh: 13.14 }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].readingDate).toBe('2026-04-27T09:14:00');
      expect(component.chartData[2].readingDate).toBe('2026-04-29T08:53:00');
    });

    it('should calculate heightPercent correctly', () => {
      const stats: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 300, usageKwhPerDay: 100 },
        { readingDate: '2026-04-28T07:00:00', usageKwh: 50, usageKwhPerDay: 50 }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      const sorted = component.chartData;
      const maxBar = sorted.find(b => b.value === 100)!;
      const halfBar = sorted.find(b => b.value === 50)!;
      expect(maxBar.heightPercent).toBe(100);
      expect(halfBar.heightPercent).toBe(50);
    });

    it('should show kWh/day, total kWh and the gap in the tooltip', () => {
      const stats: TshwaneUsageStat[] = [
        {
          readingDate: '2026-11-05T06:28:00',
          previousReadingDate: '2026-11-02T06:06:00',
          usageKwh: 11.87,
          usageKwhPerDay: 3.94
        }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].label).toBe('3.9');
      expect(component.chartData[0].displayValue).toBe('3.94 kWh/day · 11.87 kWh over 3.0 days since 2 Nov');
    });

    it('should show an empty bar when kWh/day is unknown', () => {
      const stats: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71, usageKwhPerDay: 5 },
        { readingDate: '2026-04-28T07:00:00', usageKwh: 0, usageKwhPerDay: null }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      const unknown = component.chartData[0];
      expect(unknown.label).toBe('—');
      expect(unknown.heightPercent).toBe(0);
      expect(unknown.displayValue).toBe('0.00 kWh');
      expect(component.chartData[1].heightPercent).toBe(100);
    });

    it('should format reading dates as d MMM HH:mm with weekday labels', () => {
      const stats: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71, usageKwhPerDay: 10.71 }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].displayDate).toBe('29 Apr 08:53');
      expect(component.chartData[0].weekday).toBe('Wed');
      expect(component.chartData[0].dayMonth).toBe('29 Apr');
      expect(component.chartData[0].label).toBe('10.7');
    });

    it('should handle empty data array', () => {
      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
      expect(component.ariaLabel).toBe('');
    });

    it('should handle null stats', () => {
      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(null as any));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
    });
  });

  // ==================== Chart Refresh Tests ====================

  describe('Chart Refresh', () => {
    it('should reload data when ChartRefreshService triggers refresh', () => {
      const initial: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71 }
      ];
      const updated: TshwaneUsageStat[] = [
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71 },
        { readingDate: '2026-04-30T09:00:00', usageKwh: 12.00 }
      ];

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(initial));
      fixture.detectChanges();
      expect(component.chartData.length).toBe(1);

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of(updated));
      refreshSubject.next();
      fixture.detectChanges();

      expect(component.chartData.length).toBe(2);
      expect(mockDatabaseService.getTshwaneUsageStats).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe on destroy', () => {
      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of([]));
      fixture.detectChanges();

      const unsubscribeSpy = vi.spyOn((component as any).refreshSubscription, 'unsubscribe');
      fixture.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  // ==================== Error and Loading States ====================

  describe('Error and Loading States', () => {
    it('should set error state when fetch fails', () => {
      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Failed to load Tshwane usage data');
      expect(component.chartData).toEqual([]);
    });

    it('should clear error on successful refresh', () => {
      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(
        throwError(() => new Error('Network error'))
      );
      fixture.detectChanges();
      expect(component.hasError).toBe(true);

      mockDatabaseService.getTshwaneUsageStats.mockReturnValue(of([
        { readingDate: '2026-04-29T08:53:00', usageKwh: 10.71 }
      ]));
      refreshSubject.next();
      fixture.detectChanges();

      expect(component.hasError).toBe(false);
      expect(component.chartData.length).toBe(1);
    });
  });
});
