import type { MemorizationStatus, MurojaahProgress } from './types';
import { supabase } from './supabase';

/**
 * SM-2 inspired spaced repetition update.
 *
 * @param quality  0-5 rating of the recall (5=perfect, 3=correct w/ difficulty, 0=complete blackout)
 * @param progress existing progress row (or undefined for first review)
 * @returns updated progress fields ready to upsert
 */
export function applySpacedRepetition(
  surah: number,
  ayah: number,
  quality: number,
  progress?: Partial<MurojaahProgress>,
): MurojaahProgress {
  const ease = progress?.ease_factor ?? 2.5;
  const interval = progress?.interval_days ?? 1;
  const reps = progress?.review_count ?? 0;

  let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  let newInterval: number;
  let newStatus: MemorizationStatus;

  if (quality < 3) {
    newInterval = 1;
    newStatus = 'needs_review';
  } else {
    newStatus = reps + 1 >= 2 ? 'memorized' : 'needs_review';
    if (reps === 0) {
      newInterval = 1;
    } else if (reps === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEase);
    }
  }

  const now = new Date();
  const next = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    surah_number: surah,
    ayah_number: ayah,
    status: newStatus,
    review_count: reps + 1,
    mistake_count: quality < 3 ? (progress?.mistake_count ?? 0) + 1 : progress?.mistake_count ?? 0,
    last_reviewed_at: now.toISOString(),
    next_review_at: next.toISOString(),
    interval_days: newInterval,
    ease_factor: newEase,
  };
}

export async function fetchAllProgress(): Promise<MurojaahProgress[]> {
  const { data, error } = await supabase
    .from('murojaah_progress')
    .select('*')
    .order('next_review_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProgressForSurah(surah: number): Promise<MurojaahProgress[]> {
  const { data, error } = await supabase
    .from('murojaah_progress')
    .select('*')
    .eq('surah_number', surah)
    .order('ayah_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertProgress(progress: MurojaahProgress): Promise<void> {
  const { error } = await supabase
    .from('murojaah_progress')
    .upsert(
      {
        surah_number: progress.surah_number,
        ayah_number: progress.ayah_number,
        status: progress.status,
        review_count: progress.review_count,
        mistake_count: progress.mistake_count,
        last_reviewed_at: progress.last_reviewed_at,
        next_review_at: progress.next_review_at,
        interval_days: progress.interval_days,
        ease_factor: progress.ease_factor,
      },
      { onConflict: 'surah_number,ayah_number' },
    );
  if (error) throw error;
}

export async function fetchDueReviews(): Promise<MurojaahProgress[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('murojaah_progress')
    .select('*')
    .eq('status', 'needs_review')
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
