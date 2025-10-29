import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly baseUrl = '/api';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(private http: HttpClient) { }

  uploadFile(file: File, fileType: 'solarman' | 'tshwane'): Observable<{data: any[], fileId?: string, totalRecords?: number}> {
    if (!this.validateFile(file)) {
      return throwError(() => new Error('Invalid file format or size'));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{previewData: any[], totalRecords: number, fileType: string, fileId?: string}>(`${this.baseUrl}/upload/${fileType}`, formData)
      .pipe(
        map(response => {
          console.log('Backend response:', response);
          // Return the structured response with fileId
          return {
            data: response.previewData || [],
            fileId: response.fileId,
            totalRecords: response.totalRecords
          };
        }),
        catchError(error => {
          console.error('File upload error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  validateFile(file: File): boolean {
    if (!file) {
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return false;
    }

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    return allowedTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.xlsx') || 
           file.name.toLowerCase().endsWith('.xls');
  }

  getFileValidationError(file: File): string | null {
    if (!file) {
      return 'No file selected';
    }

    if (file.size > this.maxFileSize) {
      return `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    if (!this.validateFile(file)) {
      return 'Invalid file format. Please select an Excel file (.xlsx or .xls)';
    }

    return null;
  }

  private getErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An error occurred during file upload';
  }
}