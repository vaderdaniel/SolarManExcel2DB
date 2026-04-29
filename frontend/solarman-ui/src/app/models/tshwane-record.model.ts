export interface TshwaneRecord {
  readingDate: Date;
  cumulativeElectricityUsed: number;
  readingNotes: string;
}

export interface TshwanePreviewData {
  [key: string]: any;
  'Reading Date': string;
  'Cumulative Electricity Used': number;
  'Reading Notes': string;
}