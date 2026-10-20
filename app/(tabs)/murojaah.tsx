import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Brain, CheckCircle2, AlertCircle, Circle, RotateCw } from 'lucide-react-native';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { useSettings } from '@/lib/settingsContext';
import { fetchAllProgress, fetchDueReviews } from '@/lib/murojaah';
import { fetchSurahList } from '@/lib/quranApi';
import type { MurojaahProgress, Surah } from '@/lib/types';

type Tab = 'due' | 'all';

export default function MurojaahTab() {
  const { theme } = useSettings();
  const [tab, setTab] = useState<Tab>('due');
  const [due, setDue] = useState<MurojaahProgress[]>([]);
  const [all, setAll] = useState<MurojaahProgress[]>([]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dueList, allList, surahList] = await Promise.all([
        fetchDueReviews(),
        fetchAllProgress(),
        fetchSurahList(),
      ]);
      setDue(dueList);
      setAll(allList);
      setSurahs(surahList);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [dueList, allList] = await Promise.all([fetchDueReviews(), fetchAllProgress()]);
      setDue(dueList);
      setAll(allList);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  const surahName = (n: number) =>
    surahs.find((s) => s.number === n)?.englishName ?? `Surah ${n}`;

  const memorized = all.filter((p) => p.status === 'memorized').length;
  const needsReview = all.filter((p) => p.status === 'needs_review').length;
  const totalMistakes = all.reduce((sum, p) => sum + p.mistake_count, 0);

  const list = tab === 'due' ? due : all;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title="Murojaah" subtitle="Memorization tracker and review" />

      <View style={styles.statsRow}>
        <StatCard
          label="Memorized"
          value={memorized}
          color={theme.success}
          icon={<CheckCircle2 size={18} color={theme.success} strokeWidth={2} />}
          bg={theme.bgElevated}
          text={theme.text}
          textSecondary={theme.textSecondary}
        />
        <StatCard
          label="Due review"
          value={due.length}
          color={theme.warning}
          icon={<AlertCircle size={18} color={theme.warning} strokeWidth={2} />}
          bg={theme.bgElevated}
          text={theme.text}
          textSecondary={theme.textSecondary}
        />
        <StatCard
          label="Mistakes"
          value={totalMistakes}
          color={theme.error}
          icon={<Circle size={18} color={theme.error} strokeWidth={2} />}
          bg={theme.bgElevated}
          text={theme.text}
          textSecondary={theme.textSecondary}
        />
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.bgCard }]}>
        <TabButton
          active={tab === 'due'}
          label={`Due (${due.length})`}
          onPress={() => setTab('due')}
          theme={theme}
        />
        <TabButton
          active={tab === 'all'}
          label={`All (${all.length})`}
          onPress={() => setTab('all')}
          theme={theme}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.center}>
          <Brain size={48} color={theme.textSecondary} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {tab === 'due' ? 'No reviews due' : 'No memorization tracked yet'}
          </Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
            {tab === 'due'
              ? 'Mark ayahs as "Needs review" while reading to build your queue.'
              : 'Open a surah and tap the status pill under any ayah to start tracking.'}
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.ctaText, { color: theme.textOnPrimary }]}>Open Quran</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item, i) => `${item.surah_number}:${item.ayah_number}:${i}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/surah/[number]',
                  params: { number: item.surah_number },
                })
              }
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.bgElevated, borderBottomColor: theme.divider },
                pressed && { backgroundColor: theme.bgCard },
              ]}
            >
              <View
                style={[
                  styles.statusBar,
                  {
                    backgroundColor:
                      item.status === 'memorized'
                        ? theme.success
                        : item.status === 'needs_review'
                        ? theme.warning
                        : theme.border,
                  },
                ]}
              />
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                  {surahName(item.surah_number)} · Ayah {item.ayah_number}
                </Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                  {item.status === 'memorized'
                    ? 'Memorized'
                    : item.status === 'needs_review'
                    ? 'Needs review'
                    : 'Not memorized'}{' '}
                  · {item.review_count} reviews · {item.mistake_count} mistakes
                </Text>
                {item.next_review_at ? (
                  <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>
                    Next review: {new Date(item.next_review_at).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
              <RotateCw size={18} color={theme.textSecondary} strokeWidth={2} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
  bg,
  text,
  textSecondary,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  textSecondary: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={styles.statIconRow}>
        {icon}
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
    </View>
  );
}

function TabButton({
  active,
  label,
  onPress,
  theme,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof useSettings>['theme'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabBtn,
        active && { backgroundColor: theme.primary },
      ]}
    >
      <Text
        style={[
          styles.tabBtnText,
          { color: active ? theme.textOnPrimary : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontFamily: 'Inter-Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 11, marginTop: 6 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 140 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 44 },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  rowSub: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 3 },
  rowMeta: { fontFamily: 'Inter-Regular', fontSize: 11, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, marginTop: 14 },
  emptySub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  ctaBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },
  ctaText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
  errorText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
});
