export interface TshwaneUsageStat {
  readingDate: string;
  /** The reading before this one; null only if the backend could not find one. */
  previousReadingDate?: string | null;
  /** kWh used since the previous reading. */
  usageKwh: number;
  /** usageKwh spread over the days since the previous reading. */
  usageKwhPerDay?: number | null;
}
