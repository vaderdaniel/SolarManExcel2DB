import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UploadComponent } from './upload';
import { ImportService } from '../../services/import.service';
import { ChartRefreshService } from '../../services/chart-refresh.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ImportResult } from '../../models/import-result.model';
import { vi } from 'vitest';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let mockImportService: { importData: ReturnType<typeof vi.fn>; importDataByFileId: ReturnType<typeof vi.fn> };
  let mockChartRefreshService: { triggerRefresh: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Create mock services
    mockImportService = {
      importData: vi.fn(),
      importDataByFileId: vi.fn()
    };
    mockChartRefreshService = { triggerRefresh: vi.fn() };
    mockRouter = { navigate: vi.fn() };
    mockSnackBar = { open: vi.fn().mockReturnValue({} as any) };

    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ImportService, useValue: mockImportService },
        { provide: ChartRefreshService, useValue: mockChartRefreshService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==================== Chart Refresh Trigger Tests ====================

  describe('Chart Refresh after Import', () => {
    it('should trigger chart refresh after successful import using fileId', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 10,
        recordsUpdated: 5,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      // Setup component state
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      // Verify chart refresh was triggered
      expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(1);
      expect(component.currentView).toBe('result');
      expect(component.importResult).toEqual(mockImportResult);
    });

    it('should trigger chart refresh after successful import using data array', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 8,
        recordsUpdated: 2,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importData.mockReturnValue(of(mockImportResult));

      // Setup component state without fileId (fallback path)
      component.fileId = null;
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      // Verify chart refresh was triggered
      expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(1);
      expect(component.currentView).toBe('result');
    });

    it('should NOT trigger chart refresh when import fails', () => {
      mockImportService.importDataByFileId.mockReturnValue(
        throwError(() => new Error('Import failed'))
      );

      // Setup component state
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      // Verify chart refresh was NOT triggered
      expect(mockChartRefreshService.triggerRefresh).not.toHaveBeenCalled();
      expect(component.currentView).not.toBe('result');
    });

    it('should trigger chart refresh for Tshwane file type', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 5,
        recordsUpdated: 3,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      // Setup component state with Tshwane file type
      component.fileId = 'test-file-id';
      component.fileType = 'tshwane';
      component.previewData = [{ readingDate: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'tshwane'
      });

      // Wait for async operations

      // Verify chart refresh was triggered
      expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(1);
    });

    it('should trigger chart refresh exactly once per successful import', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 10,
        recordsUpdated: 5,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      // Setup and trigger first import
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(1);

      // Reset to upload view
      component.resetToUpload();

      // Setup and trigger second import
      component.fileId = 'test-file-id-2';
      component.previewData = [{ updated: '2024-12-09' }];

      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });


      // Should have been called twice total
      expect(mockChartRefreshService.triggerRefresh).toHaveBeenCalledTimes(2);
    });



    it('should clear isImporting flag after successful import', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 10,
        recordsUpdated: 5,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      // Setup component state
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      expect(component.isImporting).toBe(false);
    });

    it('should clear isImporting flag after failed import', () => {
      mockImportService.importDataByFileId.mockReturnValue(
        throwError(() => new Error('Import failed'))
      );

      // Setup component state
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      expect(component.isImporting).toBe(false);
    });
  });

  // ==================== Import Service Call Tests ====================

  describe('Import Service Interaction', () => {
    it('should call importDataByFileId when fileId is available', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 10,
        recordsUpdated: 5,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      // Setup component state with fileId
      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      expect(mockImportService.importDataByFileId).toHaveBeenCalledWith(
        'solarman',
        'test-file-id'
      );
      expect(mockImportService.importData).not.toHaveBeenCalled();
    });

    it('should call importData when fileId is null', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 8,
        recordsUpdated: 2,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importData.mockReturnValue(of(mockImportResult));

      // Setup component state without fileId
      component.fileId = null;
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];

      // Trigger import
      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });

      // Wait for async operations

      expect(mockImportService.importData).toHaveBeenCalledWith(
        'solarman',
        component.previewData
      );
      expect(mockImportService.importDataByFileId).not.toHaveBeenCalled();
    });
  });

  // ==================== Navigation and State Tests ====================

  describe('Component State Management', () => {
    it('should update component view to result after successful import', () => {
      const mockImportResult: ImportResult = {
        recordsInserted: 10,
        recordsUpdated: 5,
        firstRecordDate: new Date('2024-12-01T00:00:00'),
        lastRecordDate: new Date('2024-12-08T00:00:00'),
        errorCount: 0,
        errors: [],
        success: true
      };

      mockImportService.importDataByFileId.mockReturnValue(of(mockImportResult));

      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];
      component.currentView = 'preview';

      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });


      expect(component.currentView).toBe('result');
      expect(component.importResult).toEqual(mockImportResult);
    });

    it('should NOT change view when import fails', () => {
      mockImportService.importDataByFileId.mockReturnValue(
        throwError(() => new Error('Import failed'))
      );

      component.fileId = 'test-file-id';
      component.fileType = 'solarman';
      component.previewData = [{ updated: '2024-12-08' }];
      component.currentView = 'preview';

      component.onImportConfirmed({
        data: component.previewData,
        fileType: 'solarman'
      });


      expect(component.currentView).toBe('preview');
      expect(component.importResult).toBeNull();
    });
  });
});
