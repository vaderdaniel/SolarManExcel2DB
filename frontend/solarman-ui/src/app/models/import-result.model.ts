export interface ImportResult {
  recordsInserted: number;
  recordsUpdated: number;
  firstRecordDate: Date;
  lastRecordDate: Date;
  errorCount: number;
  errors: string[];
  success: boolean;
  message?: string;
}