export interface DatabaseStatus {
  connected: boolean;
  message: string;
  apiStatus: 'ready' | 'unavailable';
  lastChecked?: Date;
}

export interface LatestRecords {
  solarman: Date | null;
  tshwane: Date | null;
}

export interface DatabaseCredentials {
  username: string;
  password: string;
}