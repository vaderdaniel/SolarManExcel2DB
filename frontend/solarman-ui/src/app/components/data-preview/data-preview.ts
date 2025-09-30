import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-data-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule],
  templateUrl: './data-preview.html',
  styleUrl: './data-preview.scss'
})
export class DataPreviewComponent {
  @Input() previewData: any[] = [];
  @Input() fileType: 'solarman' | 'tshwane' | null = null;
  @Output() confirmImport = new EventEmitter<{data: any[], fileType: 'solarman' | 'tshwane'}>();
  @Output() cancelImport = new EventEmitter<void>();

  displayedColumns: string[] = [];
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  ngOnInit(): void {
    this.setDisplayedColumns();
  }

  ngOnChanges(): void {
    this.setDisplayedColumns();
  }

  private setDisplayedColumns(): void {
    if (this.previewData.length === 0) {
      this.displayedColumns = [];
      return;
    }

    if (this.fileType === 'solarman') {
      this.displayedColumns = [
        'Plant', 'Updated', 'Time', 'Production Power', 'Consumption Power',
        'Grid Power', 'Purchasing Power', 'Feed-in', 'Battery Power',
        'Charging Power', 'Discharging Power', 'SoC'
      ];
    } else if (this.fileType === 'tshwane') {
      this.displayedColumns = [
        'Reading Date', 'Reading Value', 'Reading Amount', 'Reading Notes'
      ];
    } else {
      // Auto-detect columns from data
      this.displayedColumns = Object.keys(this.previewData[0] || {});
    }
  }

  onConfirmImport(): void {
    if (this.fileType) {
      this.confirmImport.emit({ data: this.previewData, fileType: this.fileType });
    }
  }

  onCancelImport(): void {
    this.cancelImport.emit();
  }

  getFileTypeTitle(): string {
    return this.fileType === 'solarman' ? 'SolarMan Data' : 'Tshwane Electricity Data';
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  }
}
