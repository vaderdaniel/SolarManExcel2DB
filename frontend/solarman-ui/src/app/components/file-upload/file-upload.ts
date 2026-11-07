import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { FileUploadService } from '../../services/file-upload.service';

export type ImportFileType = 'solarman' | 'tshwane';

export interface FileUploadedEvent {
  data: any[];
  fileType: ImportFileType;
  fileId?: string;
  totalRecords?: number;
}

interface SourceOption {
  id: ImportFileType;
  title: string;
  description: string;
  hint: string;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  private readonly fileUploadService = inject(FileUploadService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly fileUploaded = output<FileUploadedEvent>();

  readonly sources: readonly SourceOption[] = [
    {
      id: 'solarman',
      title: 'SolarMan inverter export',
      description: '12 columns — production, consumption, grid, battery and SoC every 5 minutes.',
      hint: '12 columns in fixed order'
    },
    {
      id: 'tshwane',
      title: 'Tshwane electricity readings',
      description: 'Sheet “Elektrisiteit Lesings” — reading date, cumulative kWh and notes.',
      hint: 'sheet “Elektrisiteit Lesings”'
    }
  ];

  readonly fileType = signal<ImportFileType>('solarman');
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly isDragging = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sourceHint = computed(() => this.sources.find(s => s.id === this.fileType())!.hint);
  readonly fileSize = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    return file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  });

  selectFileType(type: ImportFileType): void {
    this.fileType.set(type);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  clearFileSelection(): void {
    this.selectedFile.set(null);
    this.errorMessage.set(null);
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file) {
      this.errorMessage.set('Please choose a file first');
      return;
    }

    const fileType = this.fileType();
    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.fileUploadService.uploadFile(file, fileType).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.fileUploaded.emit({
          data: response.data,
          fileType,
          fileId: response.fileId,
          totalRecords: response.totalRecords
        });
      },
      error: (error: Error) => {
        this.isUploading.set(false);
        this.errorMessage.set(error.message || 'Failed to upload file');
      }
    });
  }

  private setFile(file: File | null): void {
    this.errorMessage.set(null);
    if (!file) {
      this.selectedFile.set(null);
      return;
    }
    const validationError = this.fileUploadService.getFileValidationError(file);
    if (validationError) {
      this.clearFileSelection();
      this.errorMessage.set(validationError);
      return;
    }
    this.selectedFile.set(file);
  }
}
