import { routing } from '@/i18n/routing';

export type SupportedLocale = 'en' | 'fr' | 'zh' | 'yo' | 'ig' | 'ha' | 'sw';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rateToNaira: number;
}

export interface PlatformConfig {
  commissionRate: number;
  refundPolicy: {
    hoursBefore: number;
    refundPercent: number;
  }[];
  supportedCurrencies: string[];
  defaultCurrency: string;
}
