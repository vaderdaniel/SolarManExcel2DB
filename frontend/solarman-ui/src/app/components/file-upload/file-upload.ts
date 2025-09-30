import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FileUploadService } from '../../services/file-upload.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUploadComponent {
  @Output() fileUploaded = new EventEmitter<{data: any[], fileType: 'solarman' | 'tshwane'}>();
  
  selectedFile: File | null = null;
  selectedFileType: 'solarman' | 'tshwane' | null = null;
  isUploading = false;

  constructor(
    private fileUploadService: FileUploadService,
    private snackBar: MatSnackBar
  ) { }

  onFileSelected(event: any, fileType: 'solarman' | 'tshwane'): void {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      this.selectedFileType = null;
      return;
    }

    const validationError = this.fileUploadService.getFileValidationError(file);
    if (validationError) {
      this.showError(validationError);
      this.clearFileSelection();
      return;
    }

    this.selectedFile = file;
    this.selectedFileType = fileType;
  }

  uploadFile(): void {
    if (!this.selectedFile || !this.selectedFileType) {
      this.showError('Please select a file first');
      return;
    }

    this.isUploading = true;
    this.fileUploadService.uploadFile(this.selectedFile, this.selectedFileType)
      .subscribe({
        next: (data) => {
          this.isUploading = false;
          this.fileUploaded.emit({ data, fileType: this.selectedFileType! });
          this.showSuccess('File uploaded successfully');
        },
        error: (error) => {
          this.isUploading = false;
          this.showError(error.message || 'Failed to upload file');
        }
      });
  }

  clearFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileType = null;
    // Reset file input elements
    const solarmanInput = document.getElementById('solarman-file') as HTMLInputElement;
    const tshwaneInput = document.getElementById('tshwane-file') as HTMLInputElement;
    if (solarmanInput) solarmanInput.value = '';
    if (tshwaneInput) tshwaneInput.value = '';
  }

  getSelectedFileName(): string {
    return this.selectedFile ? this.selectedFile.name : 'No file selected';
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const sizeInMB = (this.selectedFile.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
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
