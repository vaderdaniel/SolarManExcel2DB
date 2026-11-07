import { ChangeDetectionStrategy, Component, computed, effect, input, output, viewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ImportFileType } from '../file-upload/file-upload';

type PreviewRow = Record<string, unknown>;

interface PreviewColumn {
  key: string;
  label: string;
  numeric: boolean;
}

const SOLARMAN_COLUMNS: PreviewColumn[] = [
  { key: 'Updated', label: 'Updated', numeric: false },
  { key: 'Production Power', label: 'Production W', numeric: true },
  { key: 'Consumption Power', label: 'Consumption W', numeric: true },
  { key: 'Grid Power', label: 'Grid W', numeric: true },
  { key: 'Purchasing Power', label: 'Purchase W', numeric: true },
  { key: 'Feed-in', label: 'Feed-in W', numeric: true },
  { key: 'Battery Power', label: 'Battery W', numeric: true },
  { key: 'Charging Power', label: 'Charging W', numeric: true },
  { key: 'Discharging Power', label: 'Discharging W', numeric: true },
  { key: 'SoC', label: 'SoC %', numeric: true }
];

const TSHWANE_COLUMNS: PreviewColumn[] = [
  { key: 'Reading Date', label: 'Reading date', numeric: false },
  { key: 'Cumulative Electricity Used', label: 'Cumulative kWh', numeric: true },
  { key: 'Reading Notes', label: 'Notes', numeric: false }
];

@Component({
  selector: 'app-data-preview',
  imports: [MatTableModule, MatPaginatorModule],
  templateUrl: './data-preview.html',
  styleUrl: './data-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataPreviewComponent {
  readonly previewData = input<PreviewRow[]>([]);
  readonly fileType = input<ImportFileType | null>(null);
  readonly totalRecords = input(0);
  readonly isImporting = input(false);

  readonly confirmImport = output<{ data: PreviewRow[]; fileType: ImportFileType }>();
  readonly cancelImport = output<void>();

  private readonly paginator = viewChild(MatPaginator);

  readonly dataSource = new MatTableDataSource<PreviewRow>([]);
  readonly pageSizeOptions = [10, 25, 50];

  readonly columns = computed<PreviewColumn[]>(() => {
    const rows = this.previewData();
    if (rows.length === 0) return [];
    if (this.fileType() === 'solarman') return SOLARMAN_COLUMNS;
    if (this.fileType() === 'tshwane') return TSHWANE_COLUMNS;
    return Object.keys(rows[0]).map(key => ({ key, label: key, numeric: typeof rows[0][key] === 'number' }));
  });
  readonly displayedColumns = computed(() => this.columns().map(c => c.key));
  readonly recordCount = computed(() => this.totalRecords() > 0 ? this.totalRecords() : this.previewData().length);
  readonly sourceLabel = computed(() => this.fileType() === 'tshwane' ? 'Tshwane' : 'SolarMan');
  readonly summary = computed(() => this.fileType() === 'tshwane'
    ? 'Rows without a cumulative value were skipped.'
    : 'Readings dated before 2020 were skipped.');

  constructor() {
    effect(() => {
      this.dataSource.data = this.previewData();
      this.paginator()?.firstPage();
    });
    effect(() => {
      const paginator = this.paginator();
      if (paginator) this.dataSource.paginator = paginator;
    });
  }

  onConfirmImport(): void {
    const fileType = this.fileType();
    if (fileType) {
      this.confirmImport.emit({ data: this.dataSource.data, fileType });
    }
  }

  onCancelImport(): void {
    this.cancelImport.emit();
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    if (value instanceof Date || (typeof value === 'string' && this.isDateString(value))) {
      return this.formatDate(new Date(value as string | Date));
    }
    return String(value);
  }

  private isDateString(value: string): boolean {
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
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}
