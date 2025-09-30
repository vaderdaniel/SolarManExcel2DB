import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { DatabaseStatus, LatestRecords } from '../../models/database-status.model';

@Component({
  selector: 'app-status-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './status-panel.html',
  styleUrl: './status-panel.scss'
})
export class StatusPanelComponent implements OnInit, OnDestroy {
  databaseStatus: DatabaseStatus = {
    connected: false,
    message: 'Checking connection...',
    apiStatus: 'unavailable'
  };
  
  latestRecords: LatestRecords = {
    solarman: null,
    tshwane: null
  };
  
  private statusInterval!: Subscription;
  private readonly POLLING_INTERVAL = 10000; // 10 seconds

  constructor(private databaseService: DatabaseService) { }

  ngOnInit(): void {
    this.checkStatus();
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.statusInterval) {
      this.statusInterval.unsubscribe();
    }
  }

  private startPolling(): void {
    this.statusInterval = interval(this.POLLING_INTERVAL)
      .subscribe(() => {
        this.checkStatus();
      });
  }

  private checkStatus(): void {
    this.databaseService.checkStatus().subscribe({
      next: (status) => {
        this.databaseStatus = status;
      },
      error: (error) => {
        console.error('Status check failed:', error);
      }
    });

    this.databaseService.getLatestRecords().subscribe({
      next: (records) => {
        this.latestRecords = records;
      },
      error: (error) => {
        console.error('Latest records fetch failed:', error);
        this.latestRecords = { solarman: null, tshwane: null };
      }
    });
  }

  getStatusColor(): string {
    if (this.databaseStatus.apiStatus === 'unavailable') {
      return 'red';
    }
    return this.databaseStatus.connected ? 'green' : 'red';
  }

  getApiStatusText(): string {
    return this.databaseStatus.apiStatus === 'ready' ? 'API Ready' : 'API Unavailable';
  }

  getDatabaseStatusText(): string {
    return this.databaseStatus.connected ? 'Database Connected' : 'Database Disconnected';
  }

  formatDate(date: Date | null): string {
    if (!date) {
      return 'No records found';
    }
    return new Date(date).toLocaleString();
  }
}
