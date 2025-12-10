import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionChartComponent } from './production-chart';
import { DatabaseService } from '../../services/database.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { of, throwError, Subject } from 'rxjs';
import { ProductionStat } from '../../models/production-stat.model';

describe('ProductionChartComponent', () => {
  let component: ProductionChartComponent;
  let fixture: ComponentFixture<ProductionChartComponent>;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;
  let mockChartRefreshService: jasmine.SpyObj<ChartRefreshService>;
  let refreshSubject: Subject<void>;

  beforeEach(async () => {
    refreshSubject = new Subject<void>();

    // Create mock services
    mockDatabaseService = jasmine.createSpyObj('DatabaseService', ['getProductionStats']);
    mockChartRefreshService = jasmine.createSpyObj('ChartRefreshService', ['triggerRefresh']);

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
    it('should correctly calculate yAxisMax for typical production data', () => {
      // Test data with max value of 45600.5
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 },
        { date: '2024-12-07', productionUnits: 43200.0 },
        { date: '2024-12-06', productionUnits: 41000.25 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));

      // Trigger data load
      fixture.detectChanges();

      // yAxisMax should be rounded up to 50000 (nice round number)
      expect(component.yAxisMax).toBe(50000);
      expect(component.chartData.length).toBe(3);
    });

    it('should correctly calculate heightPercent for each bar', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 50000 }, // Should be 100%
        { date: '2024-12-07', productionUnits: 25000 }, // Should be 50%
        { date: '2024-12-06', productionUnits: 0 }      // Should be 0%
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      // yAxisMax should be 50000 (already at nice number)
      expect(component.yAxisMax).toBe(50000);

      // Verify height percentages (sorted oldest to newest, so index 0 is 2024-12-06)
      expect(component.chartData[0].heightPercent).toBe(0);   // 2024-12-06
      expect(component.chartData[1].heightPercent).toBe(50);  // 2024-12-07
      expect(component.chartData[2].heightPercent).toBe(100); // 2024-12-08
    });

    it('should handle empty data array', () => {
      const stats: ProductionStat[] = [];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
      expect(component.yAxisMax).toBe(0);
      expect(component.yAxisLabels).toEqual([]);
    });

    it('should handle null or undefined stats', () => {
      mockDatabaseService.getProductionStats.and.returnValue(of(null as any));
      fixture.detectChanges();

      expect(component.chartData).toEqual([]);
      expect(component.yAxisMax).toBe(0);
      expect(component.yAxisLabels).toEqual([]);
    });

    it('should calculate yAxisMax as 10 when max value is 0', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 0 },
        { date: '2024-12-07', productionUnits: 0 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      expect(component.yAxisMax).toBe(10);
    });

    it('should sort data by date ascending (oldest to newest)', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 },
        { date: '2024-12-06', productionUnits: 41000.25 },
        { date: '2024-12-07', productionUnits: 43200.0 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      // Should be sorted oldest to newest
      expect(component.chartData[0].date).toBe('2024-12-06');
      expect(component.chartData[1].date).toBe('2024-12-07');
      expect(component.chartData[2].date).toBe('2024-12-08');
    });

    it('should calculate heightPercent as 0 when yAxisMax is 0', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 0 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      // When yAxisMax is calculated as 10 and production is 0
      expect(component.yAxisMax).toBe(10);
      expect(component.chartData[0].heightPercent).toBe(0);
    });

    it('should correctly calculate yAxisMax for various magnitudes', () => {
      // Test with small values
      const smallStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 15 }
      ];
      mockDatabaseService.getProductionStats.and.returnValue(of(smallStats));
      fixture.detectChanges();
      expect(component.yAxisMax).toBe(20); // Should round to 20

      // Test with medium values
      const mediumStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 3500 }
      ];
      mockDatabaseService.getProductionStats.and.returnValue(of(mediumStats));
      (component as any).loadChartData();
      fixture.detectChanges();
      expect(component.yAxisMax).toBe(5000); // Should round to 5000

      // Test with large values
      const largeStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 87000 }
      ];
      mockDatabaseService.getProductionStats.and.returnValue(of(largeStats));
      (component as any).loadChartData();
      fixture.detectChanges();
      expect(component.yAxisMax).toBe(100000); // Should round to 100000
    });

    it('should generate correct y-axis labels', () => {
      const stats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 50000 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(stats));
      fixture.detectChanges();

      expect(component.yAxisMax).toBe(50000);
      expect(component.yAxisLabels.length).toBe(5);
      // Labels should be in descending order (highest to lowest)
      expect(component.yAxisLabels[0]).toBe(50000);
      expect(component.yAxisLabels[4]).toBe(0);
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

      mockDatabaseService.getProductionStats.and.returnValue(of(initialStats));
      fixture.detectChanges();

      // Verify initial data
      expect(component.chartData.length).toBe(1);
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(1);

      // Update mock to return new data
      mockDatabaseService.getProductionStats.and.returnValue(of(updatedStats));

      // Trigger refresh
      refreshSubject.next();
      fixture.detectChanges();

      // Verify data was reloaded
      expect(component.chartData.length).toBe(2);
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(2);
    });

    it('should subscribe to refresh$ on component init', () => {
      mockDatabaseService.getProductionStats.and.returnValue(of([]));
      
      // Component is created in beforeEach, so subscription should exist
      fixture.detectChanges();

      // Trigger refresh to verify subscription works
      refreshSubject.next();

      // Should have called getProductionStats twice (once on init, once on refresh)
      expect(mockDatabaseService.getProductionStats).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe from refresh$ on component destroy', () => {
      mockDatabaseService.getProductionStats.and.returnValue(of([]));
      fixture.detectChanges();

      // Spy on subscription unsubscribe
      const unsubscribeSpy = spyOn((component as any).refreshSubscription, 'unsubscribe');

      // Destroy component
      fixture.destroy();

      // Verify unsubscribe was called
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should handle multiple refresh triggers', () => {
      mockDatabaseService.getProductionStats.and.returnValue(of([]));
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

    it('should update yAxisMax when refresh provides different data', () => {
      const initialStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 1000 }
      ];

      const updatedStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 50000 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(initialStats));
      fixture.detectChanges();

      const initialYAxisMax = component.yAxisMax;
      expect(initialYAxisMax).toBe(1000);

      // Update mock and trigger refresh
      mockDatabaseService.getProductionStats.and.returnValue(of(updatedStats));
      refreshSubject.next();
      fixture.detectChanges();

      // yAxisMax should be updated
      expect(component.yAxisMax).toBe(50000);
      expect(component.yAxisMax).not.toBe(initialYAxisMax);
    });

    it('should handle errors during refresh gracefully', () => {
      const initialStats: ProductionStat[] = [
        { date: '2024-12-08', productionUnits: 45600.5 }
      ];

      mockDatabaseService.getProductionStats.and.returnValue(of(initialStats));
      fixture.detectChanges();

      expect(component.chartData.length).toBe(1);
      expect(component.hasError).toBe(false);

      // Mock error on next call
      mockDatabaseService.getProductionStats.and.returnValue(
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
      mockDatabaseService.getProductionStats.and.returnValue(of([]));
      
      expect(component.isLoading).toBe(false);
      
      fixture.detectChanges();
      
      // After data loads, loading should be false
      expect(component.isLoading).toBe(false);
    });

    it('should handle error state when data fetch fails', () => {
      mockDatabaseService.getProductionStats.and.returnValue(
        throwError(() => new Error('Database error'))
      );

      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Failed to load production data');
      expect(component.chartData).toEqual([]);
    });

    it('should clear error state on successful refresh', () => {
      // First call fails
      mockDatabaseService.getProductionStats.and.returnValue(
        throwError(() => new Error('Database error'))
      );
      fixture.detectChanges();

      expect(component.hasError).toBe(true);

      // Next call succeeds
      mockDatabaseService.getProductionStats.and.returnValue(of([
        { date: '2024-12-08', productionUnits: 45600.5 }
      ]));

      refreshSubject.next();
      fixture.detectChanges();

      expect(component.hasError).toBe(false);
      expect(component.chartData.length).toBe(1);
    });
  });
});
