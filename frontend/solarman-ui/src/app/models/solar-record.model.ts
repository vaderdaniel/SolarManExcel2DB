export interface SolarManRecord {
  updated: Date;
  productionPower: number;
  consumePower: number;
  gridPower: number;
  purchasePower: number;
  feedIn: number;
  batteryPower: number;
  chargePower: number;
  dischargePower: number;
  soc: number;
}

export interface SolarManPreviewData {
  [key: string]: any;
  Plant?: string;
  Updated: string;
  Time?: string;
  'Production Power': number;
  'Consumption Power': number;
  'Grid Power': number;
  'Purchasing Power': number;
  'Feed-in': number;
  'Battery Power': number;
  'Charging Power': number;
  'Discharging Power': number;
  'SoC': number;
}