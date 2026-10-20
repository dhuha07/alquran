import type { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { supabase } from './supabase';

let cached: AppSettings | null = null;

export async function loadSettings(): Promise<AppSettings> {
  if (cached) return cached;
  const { data, error } = await supabase.from('app_settings').select('key, value');
  if (error) {
    cached = { ...DEFAULT_SETTINGS };
    return cached;
  }
  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  cached = { ...DEFAULT_SETTINGS, ...(map as Partial<AppSettings>) };
  return cached;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  cached = settings;
  const entries: Array<{ key: string; value: unknown }> = [
    { key: 'theme', value: settings.theme },
    { key: 'arabicFontSize', value: settings.arabicFontSize },
    { key: 'translationFontSize', value: settings.translationFontSize },
    { key: 'qariId', value: settings.qariId },
    { key: 'showTranslation', value: settings.showTranslation },
    { key: 'showTransliteration', value: settings.showTransliteration },
    { key: 'dailyTarget', value: settings.dailyTarget },
  ];
  const { error } = await supabase
    .from('app_settings')
    .upsert(entries, { onConflict: 'key' });
  if (error) throw error;
}
