import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { StatusPanelComponent } from './components/status-panel/status-panel';
import { FileUploadComponent } from './components/file-upload/file-upload';
import { DataPreviewComponent } from './components/data-preview/data-preview';
import { ImportService } from './services/import.service';
import { ImportResult } from './models/import-result.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    StatusPanelComponent,
    FileUploadComponent,
    DataPreviewComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'SolarMan Excel Import';
  
  currentView: 'upload' | 'preview' | 'result' = 'upload';
  previewData: any[] = [];
  fileType: 'solarman' | 'tshwane' | null = null;
  fileId: string | null = null;
  totalRecords: number = 0;
  importResult: ImportResult | null = null;
  isImporting = false;

  constructor(
    private importService: ImportService,
    private snackBar: MatSnackBar
  ) {}

  onFileUploaded(event: {data: any[], fileType: 'solarman' | 'tshwane', fileId?: string, totalRecords?: number}): void {
    this.previewData = event.data;
    this.fileType = event.fileType;
    this.fileId = event.fileId || null;
    this.totalRecords = event.totalRecords || event.data.length;
    this.currentView = 'preview';
  }

  onImportConfirmed(event: {data: any[], fileType: 'solarman' | 'tshwane'}): void {
    this.isImporting = true;
    
    // Use fileId if available, otherwise fallback to data array
    if (this.fileId) {
      this.importService.importDataByFileId(event.fileType, this.fileId)
        .subscribe({
          next: (result) => {
            this.isImporting = false;
            this.importResult = result;
            this.currentView = 'result';
            this.showSuccess(`Successfully imported ${result.recordsInserted + result.recordsUpdated} records!`);
          },
          error: (error) => {
            this.isImporting = false;
            this.showError(error.message || 'Import failed');
          }
        });
    } else {
      // Fallback to old method
      this.importService.importData(event.fileType, event.data)
        .subscribe({
          next: (result) => {
            this.isImporting = false;
            this.importResult = result;
            this.currentView = 'result';
            this.showSuccess('Data imported successfully!');
          },
          error: (error) => {
            this.isImporting = false;
            this.showError(error.message || 'Import failed');
          }
        });
    }
  }

  onImportCanceled(): void {
    this.resetToUpload();
  }

  resetToUpload(): void {
    this.currentView = 'upload';
    this.previewData = [];
    this.fileType = null;
    this.fileId = null;
    this.totalRecords = 0;
    this.importResult = null;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
