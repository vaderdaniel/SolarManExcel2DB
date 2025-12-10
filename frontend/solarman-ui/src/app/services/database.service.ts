import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { DatabaseStatus, LatestRecords, DatabaseCredentials } from '../models/database-status.model';
import { ProductionStat } from '../models/production-stat.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly baseUrl = '/api';
  private statusSubject = new BehaviorSubject<DatabaseStatus>({
    connected: false,
    message: 'Checking connection...',
    apiStatus: 'unavailable'
  });

  public status$ = this.statusSubject.asObservable();

  constructor(private http: HttpClient) { }

  checkStatus(): Observable<DatabaseStatus> {
    return this.http.get<DatabaseStatus>(`${this.baseUrl}/database/status`)
      .pipe(
        tap(status => {
          status.lastChecked = new Date();
          this.statusSubject.next(status);
        }),
        catchError(error => {
          console.error('Database status check error:', error);
          const errorStatus: DatabaseStatus = {
            connected: false,
            message: 'API unavailable',
            apiStatus: 'unavailable',
            lastChecked: new Date()
          };
          this.statusSubject.next(errorStatus);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  getLatestRecords(): Observable<LatestRecords> {
    return this.http.get<LatestRecords>(`${this.baseUrl}/database/latest-records`)
      .pipe(
        catchError(error => {
          console.error('Latest records fetch error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  configureDatabaseCredentials(credentials: DatabaseCredentials): Observable<DatabaseStatus> {
    return this.http.post<DatabaseStatus>(`${this.baseUrl}/database/configure`, credentials)
      .pipe(
        tap(status => {
          status.lastChecked = new Date();
          this.statusSubject.next(status);
        }),
        catchError(error => {
          console.error('Database configuration error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  getCurrentStatus(): DatabaseStatus {
    return this.statusSubject.value;
  }

  getProductionStats(days: number): Observable<ProductionStat[]> {
    return this.http.get<ProductionStat[]>(`${this.baseUrl}/database/production-stats?days=${days}`)
      .pipe(
        catchError(error => {
          console.error('Production stats fetch error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An error occurred while communicating with the database';
  }
}
