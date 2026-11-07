import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionChartComponent } from './production-chart';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { of, throwError, Subject } from 'rxjs';
import { ProductionStat } from '../../models/production-stat.model';
import { vi } from 'vitest';

describe('ProductionChartComponent', () => {
  let component: ProductionChartComponent;
  let fixture: ComponentFixture<ProductionChartComponent>;
  let mockDatabaseService: { getProductionStats: ReturnType<typeof vi.fn> };
  let mockChartRefreshService: { triggerRefresh: ReturnType<typeof vi.fn> };
  let refreshSubject: Subject<void>;

  beforeEach(async () => {
    refreshSubject = new Subject<void>();

    // Create mock services
    mockDatabaseService = { getProductionStats: vi.fn() };
    mockChartRefreshService = { triggerRefresh: vi.fn() };

    // Setup refresh$ observable
    Object.defineProperty(mockChartRefreshService, 'refresh$', {
      get: () => refreshSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ProductionChartComponent],
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ChartRefreshService, useValue: mockChartRefreshService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductionChartComponent);
    component = fixture.componentInstance;
  });

  // ==================== processChartData Tests ====================

  describe('processChartData', () => {
    it('should scale bars so the best day is 100%', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 },
        { date: '2024-12-07', productionUnits: 43200.0 },
        { date: '2024-12-06', productionUnits: 41000.25 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData.length).toBe(3);
      expect(component.chartData[2].heightPercent).toBe(100);
      expect(component.chartData[0].heightPercent).toBeCloseTo(41000.25 / 45600.5 * 100, 5);
    });

    it('should correctly calculate heightPercent for each bar', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 50000 }, // Should be 100%
        { date: '2024-12-07', productionUnits: 25000 }, // Should be 50%
        { date: '2024-12-06', productionUnits: 0 }      // Should be 0%
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      // Sorted oldest to newest, so index 0 is 2024-12-06
      expect(component.chartData[0].heightPercent).toBe(0);
      expect(component.chartData[1].heightPercent).toBe(50);
      expect(component.chartData[2].heightPercent).toBe(100);
    });

    it('should handle empty data array', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of([]));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
      expect(component.ariaLabel).toBe('');
    });

    it('should handle null or undefined stats', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of(null as any));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
      expect(component.ariaLabel).toBe('');
    });

    it('should not mark a best day when every value is 0', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 0 },
        { date: '2024-12-07', productionUnits: 0 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData.every(bar => bar.heightPercent === 0)).toBe(true);
      expect(component.chartData.some(bar => bar.isBest)).toBe(false);
    });

    it('should sort data by date ascending (oldest to newest)', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 },
        { date: '2024-12-06', productionUnits: 41000.25 },
        { date: '2024-12-07', productionUnits: 43200.0 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].date).toBe('2024-12-06');
      expect(component.chartData[1].date).toBe('2024-12-07');
      expect(component.chartData[2].date).toBe('2024-12-08');
    });

    it('should mark only the highest day as best', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 19047.42 },
        { date: '2024-12-07', productionUnits: 20296.0 },
        { date: '2024-12-06', productionUnits: 18457.33 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      const best = component.chartData.filter(bar => bar.isBest);
      expect(best.length).toBe(1);
      expect(best[0].date).toBe('2024-12-07');
    });

    it('should format bar labels in kWh with one decimal', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].label).toBe('45.6');
      expect(component.chartData[0].displayValue).toBe('45.60 kWh');
    });

    it('should show values under 1 kWh in Wh in the tooltip', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 870 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].displayValue).toBe('870 Wh');
      expect(component.chartData[0].label).toBe('0.9');
    });

    it('should label each bar with weekday and day-month', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 50000 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData[0].weekday).toBe('Sun');
      expect(component.chartData[0].dayMonth).toBe('8 Dec');
      expect(component.ariaLabel).toContain('8 Dec 50.0 kWh');
    });
  });

  // ==================== Chart Refresh Tests ====================

  describe('Chart Refresh on ChartRefreshService trigger', () => {
    it('should reload chart data when ChartRefreshService triggers refresh', () => {
      const initialStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 }
      ];

      const updatedStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 },
        { date: '2024-12-09', productionUnits: 50000.0 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(initialStats));
      fixture.detectChanges();

      // Verify initial data
      expect(component.chartData.length).toBe(1);
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(1);

      // Update mock to return new data
      mockDatabaseService.getProductionStats.mockReturnValue(of(updatedStats));

      // Trigger refresh
      refreshSubject.next();
      fixture.detectChanges();

      // Verify data was reloaded
      expect(component.chartData.length).toBe(2);
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(2);
    });

    it('should subscribe to refresh$ on component init', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of([]));
      
      // Component is created in beforeEach, so subscription should exist
      fixture.detectChanges();

      // Trigger refresh to verify subscription works
      refreshSubject.next();

      // Should have called getProductionStats twice (once on init, once on refresh)
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe from refresh$ on component destroy', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of([]));
      fixture.detectChanges();

      // Spy on subscription unsubscribe
      const unsubscribeSpy = vi.spyOn((component as any).refreshSubscription, 'unsubscribe');

      // Destroy component
      fixture.destroy();

      // Verify unsubscribe was called
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle multiple refresh triggers', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of([]));
      fixture.detectChanges();

      // Initial call
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(1);

      // Trigger refresh multiple times
      refreshSubject.next();
      refreshSubject.next();
      refreshSubject.next();

      // Should have called getProductionStats 4 times total (1 init + 3 refreshes)
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(4);
    });

    it('should rescale bars when refresh provides different data', () => {
      const initialStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 1000 },
        { date: '2024-12-07', productionUnits: 500 }
      ];

      const updatedStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 1000 },
        { date: '2024-12-07', productionUnits: 4000 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(initialStats));
      fixture.detectChanges();
      expect(component.chartData[1].heightPercent).toBe(100);

      // Update mock and trigger refresh
      mockDatabaseService.getProductionStats.mockReturnValue(of(updatedStats));
      refreshSubject.next();
      fixture.detectChanges();

      // 2024-12-08 is no longer the best day, so it shrinks to 25%
      expect(component.chartData[1].heightPercent).toBe(25);
      expect(component.chartData[0].heightPercent).toBe(100);
    });

    it('should handle errors during refresh gracefully', () => {
      const initialStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 }
      ];

      mockDatabaseService.getProductionStats.mockReturnValue(of(initialStats));
      fixture.detectChanges();

      expect(component.chartData.length).toBe(1);
      expect(component.hasError).toBe(false);

      // Mock error on next call
      mockDatabaseService.getProductionStats.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      // Trigger refresh
      refreshSubject.next();
      fixture.detectChanges();

      // Should handle error gracefully
      expect(component.hasError).toBe(true);
      expect(component.chartData).toEqual([]);
    });
  });

  // ==================== Loading and Error States ====================

  describe('Loading and Error States', () => {
    it('should set loading state during data fetch', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(of([]));
      
      expect(component.isLoading).toBe(false);
      
      fixture.detectChanges();
      
      // After data loads, loading should be false
      expect(component.isLoading).toBe(false);
    });

    it('should handle error state when data fetch fails', () => {
      mockDatabaseService.getProductionStats.mockReturnValue(
        throwError(() => new Error('Database error'))
      );

      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Failed to load production data');
      expect(component.chartData).toEqual([]);
    });

    it('should clear error state on successful refresh', () => {
      // First call fails
      mockDatabaseService.getProductionStats.mockReturnValue(
        throwError(() => new Error('Database error'))
      );
      fixture.detectChanges();

      expect(component.hasError).toBe(true);

      // Next call succeeds
      mockDatabaseService.getProductionStats.mockReturnValue(of([
        { date: '2024-12-08', productionUnits: 45600.5 }
      ]));

      refreshSubject.next();
      fixture.detectChanges();

      expect(component.hasError).toBe(false);
      expect(component.chartData.length).toBe(1);
    });
  });
});
