import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-data-preview',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule],
  templateUrl: './data-preview.html',
  styleUrl: './data-preview.scss'
})
export class DataPreviewComponent implements AfterViewInit {
  @Input() set previewData(data: any[]) {
    this.dataSource.data = data;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }
  @Input() fileType: 'solarman' | 'tshwane' | null = null;
  @Input() totalRecords: number = 0;
  @Output() confirmImport = new EventEmitter<{data: any[], fileType: 'solarman' | 'tshwane'}>();
  @Output() cancelImport = new EventEmitter<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  pageSizeOptions = [5, 10, 25, 50];

  ngOnInit(): void {
    this.setDisplayedColumns();
  }

  ngOnChanges(): void {
    this.setDisplayedColumns();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private setDisplayedColumns(): void {
    if (this.dataSource.data.length === 0) {
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
      this.displayedColumns = Object.keys(this.dataSource.data[0] || {});
    }
  }

  onConfirmImport(): void {
    if (this.fileType) {
      this.confirmImport.emit({ data: this.dataSource.data, fileType: this.fileType });
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
    
    // Check if the value is a date or a date-like string
    if (value instanceof Date || (typeof value === 'string' && this.isDateString(value))) {
      return this.formatDate(new Date(value));
    }
    
    return String(value);
  }
  
  private isDateString(value: string): boolean {
    // Check if string looks like a date (basic check for common date patterns)
    const dateRegex = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
    return dateRegex.test(value) && !isNaN(Date.parse(value));
  }
  
  private formatDate(date: Date): string {
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
