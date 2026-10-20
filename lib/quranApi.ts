import type { Ayah, Qari, Surah, SurahDetail } from './types';

// Alquran.cloud provides Quran text, translations, and recitations.
// Endpoint base. We cache responses in-memory to avoid refetching.
const BASE = 'https://api.alquran.cloud/v1';

// Edition identifiers for Arabic + English translation + transliteration.
const ARABIC_EDITION = 'quran-uthmani';
const TRANSLATION_EDITION = 'en.sahih';
const TRANSLITERATION_EDITION = 'en.transliteration';

const memoryCache = new Map<string, unknown>();

async function fetchJson<T>(url: string): Promise<T> {
  if (memoryCache.has(url)) {
    return memoryCache.get(url) as T;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Quran API error ${res.status}: ${url}`);
  }
  const json = await res.json();
  if (json.code !== 200 && json.status !== 'OK' && json.data === undefined) {
    throw new Error(`Quran API returned non-OK: ${JSON.stringify(json).slice(0, 120)}`);
  }
  memoryCache.set(url, json);
  return json as T;
}

interface SurahListResponse {
  data: Surah[];
}

interface SurahDetailResponse {
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: 'Meccan' | 'Medinan';
    ayahs: Array<{
      number: number;
      numberInSurah: number;
      text: string;
      juz: number;
      page: number;
      audio?: string;
    }>;
  };
}

interface JuzResponse {
  data: {
    ayahs: Array<{
      number: number;
      surah: { number: number; name: string; englishName: string };
      numberInSurah: number;
      page: number;
      juz: number;
      text: string;
    }>;
  };
}

interface EditionListResponse {
  data: Qari[];
}

let surahListCache: Surah[] | null = null;

export async function fetchSurahList(): Promise<Surah[]> {
  if (surahListCache) return surahListCache;
  const json = await fetchJson<SurahListResponse>(`${BASE}/surah`);
  surahListCache = json.data;
  return surahListCache;
}

/**
 * Fetch a full surah with Arabic, translation, transliteration, and audio URL.
 * Audio URLs come from the editions'ayah audio field; fallback to the
 * alquran.cloud audio CDN per ayah number.
 */
export async function fetchSurahDetail(
  surahNumber: number,
  qariId: string,
): Promise<SurahDetail> {
  const [arabicRes, transRes, translitRes, audioRes] = await Promise.all([
    fetchJson<SurahDetailResponse>(`${BASE}/surah/${surahNumber}/${ARABIC_EDITION}`),
    fetchJson<SurahDetailResponse>(`${BASE}/surah/${surahNumber}/${TRANSLATION_EDITION}`),
    fetchJson<SurahDetailResponse>(`${BASE}/surah/${surahNumber}/${TRANSLITERATION_EDITION}`),
    fetchJson<SurahDetailResponse>(`${BASE}/surah/${surahNumber}/${qariId}`),
  ]);

  const base = arabicRes.data;
  const translations = transRes.data.ayahs;
  const transliterations = translitRes.data.ayahs;
  const audios = audioRes.data.ayahs;

  const ayahs: Ayah[] = base.ayahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    textArabic: a.text,
    translation: translations[i]?.text,
    transliteration: transliterations[i]?.text,
    audio: audios[i]?.audio,
    juz: a.juz,
    page: a.page,
  }));

  return {
    number: base.number,
    name: base.name,
    englishName: base.englishName,
    englishNameTranslation: base.englishNameTranslation,
    numberOfAyahs: base.numberOfAyahs,
    revelationType: base.revelationType,
    ayahs,
  };
}

/**
 * Fetch all ayahs belonging to a Juz (1-30), grouped for a page view.
 */
export async function fetchJuz(juzNumber: number, qariId: string): Promise<Ayah[]> {
  const json = await fetchJson<JuzResponse>(`${BASE}/juz/${juzNumber}/${qariId}`);
  return json.data.ayahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    juz: a.juz,
    page: a.page,
  }));
}

/**
 * Search the Quran by keyword (translation text or surah name).
 */
export async function searchQuran(query: string): Promise<Ayah[]> {
  const q = encodeURIComponent(query);
  const res = await fetch(`${BASE}/search/${q}/all/${TRANSLATION_EDITION}`);
  if (!res.ok) return [];
  const json = await res.json();
  const matches = json?.data?.matches ?? [];
  return matches.map(
    (m: {
      number: number;
      numberInSurah: number;
      text: string;
      surah?: { number: number; englishName: string; name: string };
    }) => ({
      number: m.number,
      numberInSurah: m.numberInSurah,
      text: m.text,
      translation: m.text,
    }),
  );
}

/**
 * Fetch the list of available reciters (qaris) from the audio editions.
 */
export async function fetchQariList(): Promise<Qari[]> {
  const json = await fetchJson<EditionListResponse>(`${BASE}/edition?format=audio&language=ar`);
  return json.data
    .filter((q) => q.identifier && q.identifier.startsWith('ar.'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build an audio URL for a specific ayah number if the per-ayah audio field
 * wasn't included in the surah response.
 */
export function buildAyahAudioUrl(qariId: string, ayahNumber: number): string {
  // alquran.cloud audio CDN: https://cdn.islamic.network/quran/audio/128/{edition}/{ayahNumber}.mp3
  return `https://cdn.islamic.network/quran/audio/128/${qariId}/${ayahNumber}.mp3`;
}
