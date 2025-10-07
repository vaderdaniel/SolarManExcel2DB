import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ImportResult } from '../models/import-result.model';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  importData(fileType: 'solarman' | 'tshwane', data: any[]): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.baseUrl}/import/${fileType}`, { data })
      .pipe(
        catchError(error => {
          console.error('Data import error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  importDataByFileId(fileType: 'solarman' | 'tshwane', fileId: string): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.baseUrl}/import/${fileType}`, { fileId })
      .pipe(
        catchError(error => {
          console.error('Data import error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  getErrorLogs(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/import/error-logs`)
      .pipe(
        catchError(error => {
          console.error('Error logs fetch error:', error);
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
    return 'An error occurred during import operation';
  }
}