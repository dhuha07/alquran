// Core domain types for the Quran app

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  textArabic?: string;
  translation?: string;
  transliteration?: string;
  audio?: string;
  juz?: number;
  page?: number;
}

export interface SurahDetail extends Surah {
  ayahs: Ayah[];
}

export interface Qari {
  identifier: string;
  name: string;
  arabicName: string;
  format: string;
}

export type MemorizationStatus = 'not_memorized' | 'needs_review' | 'memorized';

export interface MurojaahProgress {
  id?: string;
  surah_number: number;
  ayah_number: number;
  status: MemorizationStatus;
  review_count: number;
  mistake_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  interval_days: number;
  ease_factor: number;
  created_at?: string;
  updated_at?: string;
}

export interface Mistake {
  id?: string;
  surah_number: number;
  ayah_number: number;
  note?: string;
  created_at?: string;
}

export interface Bookmark {
  id?: string;
  surah_number: number;
  ayah_number: number;
  note?: string;
  folder?: string;
  created_at?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  arabicFontSize: number;
  translationFontSize: number;
  qariId: string;
  showTranslation: boolean;
  showTransliteration: boolean;
  dailyTarget: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  arabicFontSize: 28,
  translationFontSize: 16,
  qariId: 'ar.alafasy',
  showTranslation: true,
  showTransliteration: true,
  dailyTarget: 5,
};
