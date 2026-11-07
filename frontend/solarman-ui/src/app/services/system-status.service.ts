import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { DatabaseService } from './database.service';
import { ChartRefreshService } from './chart-refresh.service';
import { DatabaseStatus, LatestRecords } from '../models/database-status.model';

/**
 * Polls API/database health and the latest record timestamps for the whole app,
 * so the header status pill and the Home status section share one poll.
 */
@Injectable({ providedIn: 'root' })
export class SystemStatusService {
  static readonly POLLING_INTERVAL_MS = 10_000;

  private readonly databaseService = inject(DatabaseService);
  private readonly chartRefreshService = inject(ChartRefreshService);
  private readonly destroyRef = inject(DestroyRef);
  private subscriptions?: Subscription;

  readonly status = signal<DatabaseStatus>({
    connected: false,
    message: 'Checking connection...',
    apiStatus: 'unavailable'
  });
  readonly latestRecords = signal<LatestRecords>({ solarman: null, tshwane: null });

  readonly isChecking = computed(() => !this.status().lastChecked);
  readonly apiReady = computed(() => this.status().apiStatus === 'ready');
  readonly dbConnected = computed(() => this.status().connected);
  readonly isHealthy = computed(() => this.apiReady() && this.dbConnected());
  readonly summary = computed(() => {
    if (this.isChecking()) return 'Checking connection…';
    if (!this.apiReady()) return 'API unavailable';
    if (!this.dbConnected()) return 'Database disconnected';
    return 'All systems normal';
  });

  /** Starts polling (idempotent). Also re-checks after every successful import. */
  start(): void {
    if (this.subscriptions) return;
    this.subscriptions = timer(0, SystemStatusService.POLLING_INTERVAL_MS).subscribe(() => this.refresh());
    this.subscriptions.add(this.chartRefreshService.refresh$.subscribe(() => this.refresh()));
    this.destroyRef.onDestroy(() => this.subscriptions?.unsubscribe());
  }

  refresh(): void {
    this.databaseService.checkStatus().subscribe({
      next: (status) => this.status.set(status),
      error: () => this.status.set({
        connected: false,
        message: 'API unavailable',
        apiStatus: 'unavailable',
        lastChecked: new Date()
      })
    });

    this.databaseService.getLatestRecords().subscribe({
      next: (records) => this.latestRecords.set(records),
      error: () => this.latestRecords.set({ solarman: null, tshwane: null })
    });
  }
}
