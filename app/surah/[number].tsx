import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Play, Pause, Bookmark } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSettings } from '@/lib/settingsContext';
import { useAudioPlayer } from '@/lib/audioPlayer';
import { fetchSurahDetail } from '@/lib/quranApi';
import type { Ayah, MemorizationStatus, MurojaahProgress, SurahDetail } from '@/lib/types';
import { fetchProgressForSurah, upsertProgress, applySpacedRepetition } from '@/lib/murojaah';
import { supabase } from '@/lib/supabase';

interface ProgressMap {
  [key: string]: MurojaahProgress;
}

const key = (surah: number, ayah: number) => `${surah}:${ayah}`;

export default function SurahReadingScreen() {
  const { theme, settings } = useSettings();
  const { number } = useLocalSearchParams<{ number: string }>();
  const surahNumber = Number(number);
  const { play, togglePlay, isPlaying, currentAyah, currentSurahNumber, stop } = useAudioPlayer();

  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<FlatList<Ayah>>(null);
  const ayahRefs = useRef<Record<number, View | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, prog] = await Promise.all([
        fetchSurahDetail(surahNumber, settings.qariId),
        fetchProgressForSurah(surahNumber),
      ]);
      setSurah(detail);
      const map: ProgressMap = {};
      for (const p of prog) map[key(p.surah_number, p.ayah_number)] = p;
      setProgress(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load surah');
    } finally {
      setLoading(false);
    }
  }, [surahNumber, settings.qariId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-scroll to the currently playing ayah.
  useEffect(() => {
    if (!currentAyah || !surah) return;
    if (currentSurahNumber !== surah.number) return;
    const index = surah.ayahs.findIndex((a) => a.number === currentAyah.number);
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.4 });
    }
  }, [currentAyah, currentSurahNumber, surah]);

  const isCurrentAyah = (ayah: Ayah) =>
    currentAyah?.number === ayah.number && currentSurahNumber === surahNumber;

  const handlePlayAyah = (index: number) => {
    if (!surah) return;
    if (isCurrentAyah(surah.ayahs[index])) {
      togglePlay();
    } else {
      play(surah.ayahs, index, surah.number, settings.qariId);
    }
  };

  const handlePlayAll = () => {
    if (!surah) return;
    if (currentSurahNumber === surah.number && currentAyah) {
      togglePlay();
    } else {
      play(surah.ayahs, 0, surah.number, settings.qariId);
    }
  };

  const cycleStatus = async (ayah: Ayah) => {
    if (!surah) return;
    const existing = progress[key(surah.number, ayah.numberInSurah)];
    const order: MemorizationStatus[] = ['not_memorized', 'needs_review', 'memorized'];
    const nextStatus =
      existing?.status === 'not_memorized' || !existing
        ? 'needs_review'
        : existing.status === 'needs_review'
        ? 'memorized'
        : 'not_memorized';
    // Map cycle to a quality score for spaced repetition.
    const quality = nextStatus === 'memorized' ? 5 : nextStatus === 'needs_review' ? 2 : 0;
    const updated = applySpacedRepetition(surah.number, ayah.numberInSurah, quality, existing);
    setProgress((prev) => ({ ...prev, [key(surah.number, ayah.numberInSurah)]: updated }));
    try {
      await upsertProgress(updated);
    } catch {
      // swallow; UI already updated optimistically
    }
  };

  const toggleBookmark = async (ayah: Ayah) => {
    if (!surah) return;
    const k = `b:${surah.number}:${ayah.numberInSurah}`;
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('surah_number', surah.number)
      .eq('ayah_number', ayah.numberInSurah)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
    } else {
      await supabase.from('bookmarks').insert({
        surah_number: surah.number,
        ayah_number: ayah.numberInSurah,
      });
    }
    // mark a flag via state set for instant feedback
    setBookmarks((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  // Load bookmark flags
  useEffect(() => {
    if (!surah) return;
    supabase
      .from('bookmarks')
      .select('surah_number, ayah_number')
      .eq('surah_number', surah.number)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        for (const b of data ?? []) map[`b:${b.surah_number}:${b.ayah_number}`] = true;
        setBookmarks(map);
      });
  }, [surah]);

  const statusColor = (status?: MemorizationStatus) =>
    status === 'memorized' ? theme.success : status === 'needs_review' ? theme.warning : undefined;

  const renderItem = ({ item, index }: { item: Ayah; index: number }) => {
    const current = isCurrentAyah(item);
    const prog = progress[key(surah?.number ?? 0, item.numberInSurah)];
    const isBookmarked = bookmarks[`b:${surah?.number}:${item.numberInSurah}`];
    return (
      <View
        ref={(r) => {
          ayahRefs.current[index] = r;
        }}
        style={[
          styles.ayahCard,
          {
            backgroundColor: current ? theme.highlight : theme.bgElevated,
            borderColor: current ? theme.highlightBorder : theme.border,
          },
        ]}
      >
        <View style={styles.ayahHeader}>
          <View style={[styles.ayahNumber, { backgroundColor: theme.primary }]}>
            <Text style={[styles.ayahNumberText, { color: theme.textOnPrimary }]}>
              {item.numberInSurah}
            </Text>
          </View>
          <View style={styles.ayahActions}>
            <Pressable
              onPress={() => handlePlayAyah(index)}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: current ? theme.primaryLight : theme.bgCard },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel={current && isPlaying ? 'Pause ayah' : 'Play ayah'}
            >
              {current && isPlaying ? (
                <Pause size={16} color={theme.textOnPrimary} strokeWidth={2.2} />
              ) : (
                <Play size={16} color={theme.text} strokeWidth={2.2} />
              )}
            </Pressable>
            <Pressable
              onPress={() => toggleBookmark(item)}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: isBookmarked ? theme.accent : theme.bgCard,
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Toggle bookmark"
            >
              <Bookmark
                size={16}
                color={isBookmarked ? theme.textOnPrimary : theme.text}
                strokeWidth={2}
                fill={isBookmarked ? theme.textOnPrimary : 'none'}
              />
            </Pressable>
          </View>
        </View>

        <Text
          style={[
            styles.arabic,
            { color: theme.text, fontSize: settings.arabicFontSize },
          ]}
        >
          {item.textArabic ?? item.text}
        </Text>

        {settings.showTransliteration && item.transliteration ? (
          <Text
            style={[
              styles.translit,
              { color: theme.textSecondary, fontSize: settings.translationFontSize - 1 },
            ]}
          >
            {item.transliteration}
          </Text>
        ) : null}

        {settings.showTranslation && item.translation ? (
          <Text
            style={[
              styles.translation,
              { color: theme.textSecondary, fontSize: settings.translationFontSize },
            ]}
          >
            {item.translation}
          </Text>
        ) : null}

        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <Pressable
            onPress={() => cycleStatus(item)}
            style={({ pressed }) => [styles.statusPill, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Cycle memorization status"
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor(prog?.status) ?? theme.border },
              ]}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {prog?.status === 'memorized'
                ? 'Memorized'
                : prog?.status === 'needs_review'
                ? 'Needs review'
                : 'Not memorized'}
            </Text>
          </Pressable>
          {prog ? (
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {prog.review_count} reviews · {prog.mistake_count} mistakes
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.bgElevated, borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => {
            stop();
            router.back();
          }}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={theme.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerSurah, { color: theme.text }]}>{surah?.englishName ?? ''}</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {surah?.englishNameTranslation ?? ''}
            {surah ? ` · ${surah.numberOfAyahs} ayahs` : ''}
          </Text>
        </View>
        {surah ? (
          <Pressable
            onPress={handlePlayAll}
            style={({ pressed }) => [
              styles.playAllBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="Play whole surah"
          >
            {isPlaying && currentSurahNumber === surah.number ? (
              <Pause size={18} color={theme.textOnPrimary} strokeWidth={2.2} />
            ) : (
              <Play size={18} color={theme.textOnPrimary} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : surah ? (
        <>
          <View style={[styles.surahBanner, { backgroundColor: theme.primary }]}>
            <Text style={[styles.bannerArabic, { color: theme.textOnPrimary }]}>{surah.name}</Text>
            <Text style={[styles.bannerInfo, { color: theme.textOnPrimary }]}>
              {surah.revelationType} · Juz info per ayah
            </Text>
          </View>
          <FlatList
            ref={listRef}
            data={surah.ayahs}
            keyExtractor={(item) => String(item.number)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onScrollToIndexFailed={(info) => {
              const offset = info.index * 200;
              listRef.current?.scrollToOffset({ offset, animated: true });
            }}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { padding: 8, minHeight: 44, minWidth: 44, justifyContent: 'center' },
  headerTitle: { flex: 1 },
  headerSurah: { fontFamily: 'Inter-Bold', fontSize: 20 },
  headerSub: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 2 },
  playAllBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  bannerArabic: { fontFamily: 'Amiri-Bold', fontSize: 30 },
  bannerInfo: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 6, opacity: 0.9 },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 140 },
  ayahCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahNumberText: { fontFamily: 'Inter-Bold', fontSize: 13 },
  ayahActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabic: {
    fontFamily: 'Amiri-Regular',
    lineHeight: 52,
    textAlign: 'right',
    marginBottom: 10,
  },
  translit: {
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  translation: {
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: 'Inter-Medium', fontSize: 12 },
  metaText: { fontFamily: 'Inter-Regular', fontSize: 11 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
});
