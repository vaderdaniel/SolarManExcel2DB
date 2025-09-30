export interface TshwaneRecord {
  readingDate: Date;
  readingValue: number;
  readingAmount: number;
  readingNotes: string;
}

export interface TshwanePreviewData {
  [key: string]: any;
  'Reading Date': string;
  'Reading Value': number;
  'Reading Amount': number;
  'Reading Notes': string;
}