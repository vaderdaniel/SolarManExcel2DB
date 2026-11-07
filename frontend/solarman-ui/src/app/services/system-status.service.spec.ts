import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { SystemStatusService } from './system-status.service';
import { DatabaseService } from './database.service';
import { ChartRefreshService } from './chart-refresh.service';

describe('SystemStatusService', () => {
  let service: SystemStatusService;
  let mockDatabaseService: {
    checkStatus: ReturnType<typeof vi.fn>;
    getLatestRecords: ReturnType<typeof vi.fn>;
  };
  let refreshSubject: Subject<void>;

  beforeEach(() => {
    refreshSubject = new Subject<void>();
    mockDatabaseService = {
      checkStatus: vi.fn().mockReturnValue(of({
        connected: true, message: 'Database Connected', apiStatus: 'ready', lastChecked: new Date()
      })),
      getLatestRecords: vi.fn().mockReturnValue(of({ solarman: '2026-11-06T23:55:00', tshwane: null }))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ChartRefreshService, useValue: { refresh$: refreshSubject.asObservable() } }
      ]
    });
    service = TestBed.inject(SystemStatusService);
  });

  it('should report "Checking connection…" before the first check', () => {
    expect(service.isChecking()).toBe(true);
    expect(service.summary()).toBe('Checking connection…');
  });

  it('should report healthy status and latest records after a refresh', () => {
    service.refresh();

    expect(service.isHealthy()).toBe(true);
    expect(service.summary()).toBe('All systems normal');
    expect(service.latestRecords().solarman).toBe('2026-11-06T23:55:00');
  });

  it('should report the API as unavailable when the status check fails', () => {
    mockDatabaseService.checkStatus.mockReturnValue(throwError(() => new Error('down')));
    service.refresh();

    expect(service.isHealthy()).toBe(false);
    expect(service.summary()).toBe('API unavailable');
  });

  it('should report a disconnected database separately from the API', () => {
    mockDatabaseService.checkStatus.mockReturnValue(of({
      connected: false, message: 'Connection refused', apiStatus: 'ready', lastChecked: new Date()
    }));
    service.refresh();

    expect(service.summary()).toBe('Database disconnected');
  });

  it('should re-check immediately after an import triggers a chart refresh', () => {
    vi.useFakeTimers();
    try {
      service.start();
      vi.advanceTimersByTime(0);
      expect(mockDatabaseService.checkStatus).toHaveBeenCalledTimes(1);

      refreshSubject.next();
      expect(mockDatabaseService.checkStatus).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(SystemStatusService.POLLING_INTERVAL_MS);
      expect(mockDatabaseService.checkStatus).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});
